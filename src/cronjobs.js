const cron = require('node-cron');
const {
    Budget,
    CampaignGroup,
    Notification,
    Channel,
    Pacing,
    Client,
    User,
} = require('./models');
const { channelController } = require('./controllers');
const { computeAndStoreMetrics } = require('./utils/bq_spend');
const { send } = require('./utils/email');

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
                console.log(error);
                logMessage('Error while checking for new channels: ' + error);
            }
        });

        // update all budget metrics every day at 2 hours 0 minutes
        cron.schedule('0 2 * * *', async () => {
            try {
                await updateBudgetMetrics();
            } catch (error) {
                console.log(error);
                logMessage('Error while updating budget metrics: ' + error);
            }
        });

        // check for unlinked campaigns every day at 9 hours 0 minutes
        cron.schedule('* * * * *', async () => {
            try {
                await checkForUnlinkedCampaigns();
            } catch (error) {
                console.log(error);
                logMessage(
                    'Error while checking for unlinked campaigns: ' + error
                );
            }
        });
    }
};

async function checkForUnlinkedCampaigns() {
    logMessage('Starting daily check for unlinked campaigns');
    const campaigngroups = await CampaignGroup.findAll({
        where: {
            deleted: false,
        },
        include: [
            {
                model: User,
                as: 'user',
                attributes: ['id', 'email'],
            },
            {
                model: Client,
                as: 'client',
                attributes: ['id', 'name'],
            },
            {
                model: Pacing,
                as: 'pacings',
                limit: 1,
                order: [['updatedAt', 'DESC']],
            },
            {
                model: Budget,
                as: 'budgets',
                limit: 1,
                order: [['updatedAt', 'DESC']],
                attributes: ['id', 'periods', 'allocations'],
            },
        ],
    });
    // check if is in flight
    // in flight campaign means: A campaign with a start date in the past and an end date in the future
    const currentDate = new Date();

    for (campaign of campaigngroups) {
        campaign = campaign.toJSON();

        // check if campaign has a user just in case (it should always have a user)
        if (campaign.user) {
            const { periods, allocations } = campaign.budgets[0];
            const { label: firstPeriodLabel } = periods[0];
            const { label: lastPeriodLabel } = periods[periods.length - 1];

            const startPeriod = new Date(firstPeriodLabel);
            const endPeriod = new Date(lastPeriodLabel);

            let subject = '';
            let message = '';

            let hasUnlinkedCampaigns = false;
            let hasOffPaceCampaigns = false;

            // check if campaign is in flight
            if (startPeriod <= currentDate && endPeriod >= currentDate) {
                // check if campaign is off pace
                const pacing = campaign.pacings[0];

                let offPaceMessage = `The campaign ${campaign.name} from client ${campaign.client.name} is off pace for channel`;
                const offPaceObjects = checkPacingOffPace(pacing);
                const offPaceMessages = offPaceObjects.map(
                    allocation => allocation.name
                );
                if (offPaceMessages.length > 1) {
                    offPaceMessage += 's';
                }
                if (offPaceMessages.length > 0) {
                    offPaceMessage += `: ${offPaceMessages.join(', ')}.`;
                    subject = 'Off pace';
                    message = offPaceMessage;

                    hasOffPaceCampaigns = true;
                }

                // check if campaign is linked
                campaign.linked = checkBigQueryIdExists(allocations);
                CampaignGroup.update(
                    { linked: campaign.linked },
                    { where: { id: campaign.id } }
                );

                if (!campaign.linked) {
                    hasUnlinkedCampaigns = true;

                    if (hasOffPaceCampaigns) {
                        subject += ' and unlinked campaign';
                    } else {
                        subject = 'Unlinked campaign';
                    }

                    if (hasOffPaceCampaigns) {
                        message += ' and campaign is unlinked.';
                    } else {
                        message = `The campaign ${campaign.name} from client ${campaign.client.name} is unlinked.`;
                    }
                }

                if (
                    (hasUnlinkedCampaigns || hasOffPaceCampaigns) &&
                    subject !== '' &&
                    message !== ''
                ) {
                    await send({ to: campaign.user.email, subject, message });
                    await Notification.create({
                        user_id: campaign.user.id,
                        title: subject,
                        message: message,
                        campaign_group_info: {
                            id: campaign.id,
                            name: campaign.name,
                        },
                        client_info: {
                            id: campaign.client.id,
                            name: campaign.client.name,
                        },
                        status: 'unread',
                        type: 'email',
                    });
                }
            }
        }
    }
}

function checkBigQueryIdExists(obj) {
    for (const key in obj) {
        const monthData = obj[key];
        for (const allocation of monthData.allocations) {
            if (
                allocation.type === 'CHANNEL' &&
                Array.isArray(allocation.allocations)
            ) {
                for (const campaignType of allocation.allocations) {
                    if (
                        campaignType.type === 'CAMPAIGN_TYPE' &&
                        Array.isArray(campaignType.allocations)
                    ) {
                        for (const campaign of campaignType.allocations) {
                            if (
                                campaign.type === 'CAMPAIGN' &&
                                !campaign.bigquery_campaign_id
                            ) {
                                return false;
                            }
                        }
                    } else {
                        return false;
                    }
                }
            } else {
                return false;
            }
        }
    }
    return true;
}

function checkPacingOffPace(pacing) {
    if (pacing) {
        const threshold = 0.05;
        const currentDate = new Date();
        const month = currentDate
            .toLocaleString('default', { month: 'long' })
            .toLowerCase();
        const year = currentDate.getFullYear();
        const formattedDate = `${month}_${year}`;
        const { allocations } = pacing;
        const currentPeriod = allocations[formattedDate];
        const offPaceObjects = currentPeriod?.allocations?.filter(
            allocation => {
                // an off pace object is an object that has a adb_current value that is less than the adb value by more than 5%
                const { adb, adb_current } = allocation;
                const adb_current_plus_threshold =
                    parseFloat(adb_current) * (1 + threshold);
                // check if adb_current plus threshold is less than adb or if adb_current plus threshold is more than adb
                if (
                    adb_current_plus_threshold < parseFloat(adb) ||
                    adb_current_plus_threshold > parseFloat(adb)
                ) {
                    return true;
                }
                return false;
            }
        );
        return offPaceObjects;
    } else {
        return [];
    }
}

async function checkAndInsertNewChannels() {
    logMessage('Starting daily check for new channels');
    // get channels and clients from bigquery
    const bqChannels = await channelController.getProtectedBigqueryChannels();
    const bqClients =
        await clientController.getProtectedBigqueryClientsByChannel({
            datasources: bqChannels.map(channel => channel.channel),
        });

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

        // get clients from the database, we do that here in case a new channel was inserted in the previous iteration
        const clients = await Client.findAll();

        const bqClientsForChannel = bqClients.filter(
            client => client.datasource === bqChannel.channel
        );

        for (const bqClient of bqClientsForChannel) {
            // check if client exists in the database and has an alias for the channel
            const filteredClient = clients.find(client =>
                client?.aliases?.includes(bqClient.advertiser_name)
            );
            if (filteredClient) {
                // check if client has the advertiser_id for the channel
                if (
                    Array.isArray(filteredClient.advertiser_ids) &&
                    !filteredClient.advertiser_ids.includes(
                        bqClient.advertiser_id
                    )
                ) {
                    logMessage(
                        `Client ${bqClient.advertiser_name} does not have advertiser_id ${bqClient.advertiser_id} in the database. Inserting it now.`
                    );
                    await Client.update(
                        {
                            advertiser_ids: [
                                ...filteredClient.advertiser_ids,
                                bqClient.advertiser_id,
                            ],
                        },
                        {
                            where: { id: filteredClient.id },
                        }
                    );
                }
            }
        }
    }
    logMessage('Finished daily check for new channels');
}

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

async function updateOrInsertPacingMetrics({ campaign, periods, allocations }) {
    const campaignPacing = await Pacing.findOne({
        where: { campaign_group_id: campaign.id },
    });

    if (campaignPacing) {
        await Pacing.update(
            {
                periods: periods,
                allocations,
            },
            {
                where: { campaign_group_id: campaign.id },
            }
        );
    } else {
        await Pacing.create({
            campaign_group_id: campaign.id,
            periods: periods,
            allocations,
        });
    }
}

module.exports = { start };
