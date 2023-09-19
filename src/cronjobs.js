const cron = require('node-cron');
const { Budget, CampaignGroup, Channel, Pacing } = require('./models');
const { channelController } = require('./controllers');
const { getBigquerySpending, getMetrics } = require('./utils/bq_spend');
const cloneDeep = require('lodash/cloneDeep');

const formattedTime = time => {
    return (
        time.getHours().toString().padStart(2, '0') +
        ':' +
        time.getMinutes().toString().padStart(2, '0') +
        ':' +
        time.getSeconds().toString().padStart(2, '0')
    );
};

const logMessage = message => {
    console.log(`[${formattedTime(new Date())}] ${message}`);
};

const start = () => {
    // ignore cron job run on tests
    if (process.env.NODE_ENV !== 'test') {
        console.log('Starting cron jobs');

        // every day at 0 hours 0 minutes check if there are new channels to be inserted in the database
        cron.schedule('0 0 * * *', async () => {
            logMessage('Starting daily check for new channels');
            const bqChannels =
                await channelController.getProtectedBigqueryChannels();
            const channels = await Channel.findAll();

            // iterate over all channels from bigquery and check if they are already in the database
            for (const bqChannel of bqChannels) {
                const channel = channels.find(
                    channel => channel.name === bqChannel.channel
                );

                // if channel is not in the database, insert it
                if (!channel) {
                    logMessage(
                        `Channel ${bqChannel.channel} not found in the database. Inserting it now.`
                    );
                    await Channel.create({
                        name: bqChannel.channel,
                    });
                }
            }

            logMessage('Finished daily check for new channels');
        });

        // update all budget metrics every day at 2 hours 0 minutes
        cron.schedule('2 0 * * *', async () => {
            logMessage('Starting daily budget metrics update');

            try {
                const campaigns = await CampaignGroup.findAll(
                    {
                        where: {
                            deleted: false,
                            // implement a way to filter campaigns by deactivated status in case we dont delete them
                        },
                        include: [
                            {
                                model: Budget,
                                as: 'budgets',
                                limit: 1,
                                order: [['updatedAt', 'DESC']],
                                attributes: ['periods', 'allocations'],
                            },
                        ],
                    },
                    { raw: true }
                );

                for (const campaign of campaigns) {
                    const budget = campaign.budgets[0];
                    const { periods, allocations } = budget || {
                        periods: [],
                        allocations: {},
                    };

                    // copy of allocations object
                    let allocationsCopy = cloneDeep(allocations);
                    let previousPeriodId = null;

                    logMessage(
                        'Calculating metrics for campaign: ' + campaign.id
                    );

                    // iterating periods, for each period we have allocations
                    for (const [index, period] of periods.entries()) {
                        // using the copy of allocations object
                        const periodAllocations = allocationsCopy[period.id];
                        const { budget: periodBudget } = periodAllocations;

                        const isFirstPeriod = index === 0;

                        // channels
                        for (const channel of periodAllocations.allocations) {
                            const { budget: channelBudget } = channel;

                            if (Array.isArray(channel.allocations)) {
                                // campaign types
                                for (const campaignType of channel.allocations) {
                                    const { budget: typeBudget } = campaignType;

                                    if (
                                        Array.isArray(campaignType.allocations)
                                    ) {
                                        // fiter campaigns only with bigquery id
                                        campaignType.allocations =
                                            campaignType.allocations.filter(
                                                campaign =>
                                                    campaign.bigquery_campaign_id
                                            );

                                        // campaigns
                                        for (const campaign of campaignType.allocations) {
                                            const {
                                                budget: campaignBudget,
                                                bigquery_campaign_id,
                                            } = campaign;

                                            if (
                                                Array.isArray(
                                                    campaign.allocations
                                                )
                                            ) {
                                                if (bigquery_campaign_id) {
                                                    // fiter adsets only with bigquery id
                                                    campaign.allocations =
                                                        campaign.allocations.filter(
                                                            adset =>
                                                                adset.bigquery_adset_id
                                                        );

                                                    // adsets
                                                    for (const adset of campaign.allocations) {
                                                        const {
                                                            // budget: adsetBudget,
                                                            bigquery_adset_id,
                                                        } = adset;

                                                        if (bigquery_adset_id) {
                                                            // get spending by period
                                                            const spending = (
                                                                await getBigquerySpending(
                                                                    {
                                                                        campaignId:
                                                                            bigquery_campaign_id,
                                                                        adsetId:
                                                                            bigquery_adset_id,
                                                                        period: period.label,
                                                                    }
                                                                )
                                                            )[0];

                                                            const adsetMetrics =
                                                                getMetrics({
                                                                    period: period.label,
                                                                    periodBudget:
                                                                        campaignBudget,
                                                                    spending,
                                                                });

                                                            setSpending(
                                                                adset,
                                                                adsetMetrics
                                                            );
                                                        }
                                                    }
                                                }

                                                const campaignSpendings =
                                                    campaign.allocations.reduce(
                                                        (acc, adset) => {
                                                            if (
                                                                adset.mtd_spent
                                                            ) {
                                                                acc +=
                                                                    adset.mtd_spent;
                                                            }
                                                            return acc;
                                                        },
                                                        0
                                                    );

                                                const campaignMetrics =
                                                    getMetrics({
                                                        period: period.label,
                                                        periodBudget:
                                                            typeBudget,
                                                        spending: [
                                                            {
                                                                spend: campaignSpendings,
                                                            },
                                                        ],
                                                    });

                                                setSpending(
                                                    campaign,
                                                    campaignMetrics
                                                );
                                            }
                                        }

                                        const typeSpendings =
                                            campaignType.allocations.reduce(
                                                (acc, campaign) => {
                                                    if (campaign.mtd_spent) {
                                                        acc +=
                                                            campaign.mtd_spent;
                                                    }
                                                    return acc;
                                                },
                                                0
                                            );

                                        const typeMetrics = getMetrics({
                                            period: period.label,
                                            periodBudget: channelBudget,
                                            spending: [
                                                { spend: typeSpendings },
                                            ],
                                        });

                                        setSpending(campaignType, typeMetrics);
                                    }
                                }

                                const channelSpendings =
                                    channel.allocations.reduce(
                                        (acc, campaignType) => {
                                            if (campaignType.mtd_spent) {
                                                acc += campaignType.mtd_spent;
                                            }
                                            return acc;
                                        },
                                        0
                                    );

                                const channelMetrics = getMetrics({
                                    period: period.label,
                                    periodBudget,
                                    spending: [{ spend: channelSpendings }],
                                });

                                // carry over is 0 for the first period
                                if (isFirstPeriod) {
                                    channel.carry_over = 0;
                                } else {
                                    // carry over is the difference between previous period budget and previous period spent
                                    const previousPeriodBudget =
                                        allocationsCopy[previousPeriodId]
                                            .budget;
                                    const previousPeriodSpent =
                                        allocationsCopy[previousPeriodId]
                                            .mtd_spent;
                                    channel.carry_over =
                                        previousPeriodBudget -
                                        previousPeriodSpent;
                                }
                                setSpending(channel, channelMetrics);
                            }
                        }

                        const periodSpendings =
                            periodAllocations.allocations.reduce(
                                (acc, channel) => {
                                    if (channel.mtd_spent) {
                                        acc += channel.mtd_spent;
                                    }
                                    return acc;
                                },
                                0
                            );

                        allocationsCopy[period.id].mtd_spent = periodSpendings;
                        // set previous period id to current period id
                        previousPeriodId = period.id;
                    }

                    logMessage("Updating campaign's metrics in the database");

                    // update budget metrics
                    const campaignPacing = await Pacing.findOne({
                        where: {
                            campaign_group_id: campaign.id,
                        },
                    });

                    if (campaignPacing) {
                        await Pacing.update(
                            {
                                periods: periods,
                                allocations: allocationsCopy,
                            },
                            {
                                where: {
                                    campaign_group_id: campaign.id,
                                },
                            }
                        );
                    } else {
                        await Pacing.create({
                            campaign_group_id: campaign.id,
                            periods: periods,
                            allocations: allocationsCopy,
                        });
                    }
                }
            } catch (error) {
                logMessage('Error while updating budget metrics: ' + error);
            }

            logMessage('Finished daily budget metrics update');
        });
    }
};

module.exports = { start };

function setSpending(allocation, metric) {
    allocation.mtd_spent = metric.mtd_spent;
    allocation.budget_remaining = metric.budget_remaining;
    allocation.budget_spent = metric.budget_spent;
    allocation.month_elapsed = metric.month_elapsed;
    allocation.adb = metric.adb;
    allocation.adb_current = metric.adb_current;
    allocation.avg_daily_spent = metric.avg_daily_spent;
}
