const cron = require('node-cron');
const { Budget, CampaignGroup, Channel, Pacing } = require('./models');
const { channelController } = require('./controllers');
const { getBigquerySpending, getMetrics } = require('./utils/bq_spend');
const cloneDeep = require('lodash/cloneDeep');

const util = require('util');

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
            try {
                await checkAndInsertNewChannels();
            } catch (error) {
                logMessage('Error while checking for new channels: ' + error);
            }
        });

        // update all budget metrics every day at 2 hours 0 minutes
        cron.schedule('* * * * *', async () => {
            try {
                await updateBudgetMetrics();
            } catch (error) {
                console.log(error);
                logMessage('Error while updating budget metrics: ' + error);
            }
        });
    }
};

async function checkAndInsertNewChannels() {
    logMessage('Starting daily check for new channels');
    const bqChannels = await channelController.getProtectedBigqueryChannels();

    for (const bqChannel of bqChannels) {
        const channelExists = await Channel.findOne({
            where: { name: bqChannel.channel },
        });

        if (!channelExists) {
            logMessage(
                `Channel ${bqChannel.channel} not found in the database. Inserting it now.`
            );
            await Channel.create({
                name: bqChannel.channel,
            });
        }
    }
    logMessage('Finished daily check for new channels');
}

const setSpending = (allocation, metric) => {
    allocation.mtd_spent = metric.mtd_spent;
    allocation.budget_remaining = metric.budget_remaining;
    allocation.budget_spent = metric.budget_spent;
    allocation.month_elapsed = metric.month_elapsed;
    allocation.adb = metric.adb;
    allocation.adb_current = metric.adb_current;
    allocation.avg_daily_spent = metric.avg_daily_spent;
};

async function updateBudgetMetrics() {
    logMessage('Starting daily budget metrics update');

    const campaigns = await fetchCampaignsWithBudgets();
    const currentDate = new Date();

    for (const campaign of campaigns) {
        logMessage('Calculating metrics for campaign: ' + campaign.id);
        const { periods, allocations } = await computeAndStoreMetrics({
            campaign,
            currentDate,
        });
        logMessage("Updating campaign's metrics in the database");
        await updateOrInsertPacingMetrics({
            campaign,
            periods,
            allocations,
        });
    }

    logMessage('Finished daily budget metrics update');
}

async function fetchCampaignsWithBudgets() {
    return CampaignGroup.findAll(
        {
            where: { deleted: false },
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
        { raw: true, plain: true }
    );
}

/**
 * Compute and store metrics for a campaign
 * @param { campaign, currentDate }
 * @returns { periods, allocations }
 */
async function computeAndStoreMetrics({ campaign, currentDate }) {
    const budget = campaign.budgets[0];
    const { periods, allocations } = budget || { periods: [], allocations: {} };

    let allocationsCopy = cloneDeep(allocations);
    let previousPeriodId = null;

    for (const [index, period] of periods.entries()) {
        // using the copy of allocations object
        const periodAllocations = allocationsCopy[period.id];
        const { budget: periodBudget } = periodAllocations;
        const isFirstPeriod = index === 0;
        let periodSpendings = 0;

        // channels
        for (const channel of periodAllocations.allocations) {
            const { budget: channelBudget } = channel;
            let channelSpendings = 0;

            if (Array.isArray(channel.allocations)) {
                // campaign types
                for (const campaignType of channel.allocations) {
                    const { budget: typeBudget } = campaignType;
                    let typeSpendings = 0;

                    if (Array.isArray(campaignType.allocations)) {
                        // fiter campaigns only with bigquery id
                        // and replace allocations with filtered array
                        // so we don't iterate over the allocations that don't have bigquery id
                        campaignType.allocations =
                            campaignType.allocations.filter(
                                campaign => campaign.bigquery_campaign_id
                            );

                        // campaigns
                        for (const campaign of campaignType.allocations) {
                            const {
                                budget: campaignBudget,
                                bigquery_campaign_id,
                            } = campaign;
                            let campaignSpendings = 0;

                            if (Array.isArray(campaign.allocations)) {
                                if (bigquery_campaign_id) {
                                    // fiter adsets only with bigquery id
                                    // and replace allocations with filtered array
                                    // so we don't iterate over the allocations that don't have bigquery id
                                    campaign.allocations =
                                        campaign.allocations.filter(
                                            adset => adset.bigquery_adset_id
                                        );

                                    // adsets
                                    for (const adset of campaign.allocations) {
                                        const { bigquery_adset_id } = adset;

                                        if (bigquery_adset_id) {
                                            // get spending by period
                                            const spending = (
                                                await getBigquerySpending({
                                                    campaignId:
                                                        bigquery_campaign_id,
                                                    adsetId: bigquery_adset_id,
                                                    period: period.label,
                                                })
                                            )[0];

                                            const adsetMetrics = getMetrics({
                                                period: period.label,
                                                periodBudget: campaignBudget,
                                                spending,
                                                currentDate,
                                            });

                                            campaignSpendings +=
                                                adsetMetrics.mtd_spent;

                                            setSpending(adset, adsetMetrics);
                                        }
                                    }
                                }

                                const campaignMetrics = getMetrics({
                                    period: period.label,
                                    periodBudget: typeBudget,
                                    spending: [{ spend: campaignSpendings }],
                                    currentDate,
                                });

                                typeSpendings += campaignMetrics.mtd_spent;

                                setSpending(campaign, campaignMetrics);
                            }
                        }

                        const typeMetrics = getMetrics({
                            period: period.label,
                            periodBudget: channelBudget,
                            spending: [{ spend: typeSpendings }],
                            currentDate,
                        });

                        channelSpendings += typeMetrics.mtd_spent;

                        setSpending(campaignType, typeMetrics);
                    }
                }

                const channelMetrics = getMetrics({
                    period: period.label,
                    periodBudget,
                    spending: [{ spend: channelSpendings }],
                    currentDate,
                });

                periodSpendings += channelMetrics.mtd_spent;

                // carry over is 0 for the first period
                if (isFirstPeriod) {
                    channel.carry_over = 0;
                } else {
                    // carry over is the difference between previous period budget and previous period spent
                    const previousPeriodBudget =
                        allocationsCopy[previousPeriodId].budget;
                    const previousPeriodSpent =
                        allocationsCopy[previousPeriodId].mtd_spent;
                    channel.carry_over =
                        previousPeriodBudget - previousPeriodSpent;
                }
                setSpending(channel, channelMetrics);
            }
        }

        allocationsCopy[period.id].mtd_spent = periodSpendings;
        // set previous period id to current period id
        previousPeriodId = period.id;
    }

    return {
        periods,
        allocations: allocationsCopy,
    };
}

async function updateOrInsertPacingMetrics({
    campaign,
    periods,
    allocationsCopy,
}) {
    const campaignPacing = await Pacing.findOne({
        where: { campaign_group_id: campaign.id },
    });

    if (campaignPacing) {
        await Pacing.update(
            {
                periods: periods,
                allocations: allocationsCopy,
            },
            {
                where: { campaign_group_id: campaign.id },
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

module.exports = { start, computeAndStoreMetrics };
