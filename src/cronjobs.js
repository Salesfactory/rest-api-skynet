const cron = require('node-cron');
const { Channel, Client } = require('./models');
const { channelController } = require('./controllers');
const { computeAndStoreMetrics } = require('./utils/bq_spend');
const {
    checkIfCampaignIsOffPace,
    checkIfCampaignIsUnlinked,
    sendNotification,
    fetchCampaignsWithBudgets,
    fetchCampaignsWithPacings,
    updateOrInsertPacingMetrics,
} = require('./utils/cronjobs');

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
        cron.schedule('0 9 * * *', async () => {
            try {
                await checkAndNotifyUnlinkedOrOffPaceCampaigns();
            } catch (error) {
                console.log(error);
                logMessage(
                    'Error while checking for unlinked campaigns: ' + error
                );
            }
        });
    }
};

/**
 * Checks if there are new channels in bigquery and inserts them in the database
 * Also checks if there are new advertisers for the channels and inserts them in the database
 */
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

/**
 * Updates all budget metrics for all campaigns in the database
 */
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

/**
 * Checks if there are unlinked or off pace campaigns and notifies the user
 */
async function checkAndNotifyUnlinkedOrOffPaceCampaigns() {
    logMessage('Starting daily check for unlinked or off pace campaigns');
    const campaigngroups = await fetchCampaignsWithPacings();

    // check if is in flight
    // in flight campaign means: A campaign with a start date in the past and an end date in the future
    const currentDate = new Date();

    for (campaign of campaigngroups) {
        campaign = campaign.toJSON();

        // check if campaign has a user just in case (it should always have a user)
        if (campaign.user) {
            const { periods } = campaign.budgets[0];
            const { label: firstPeriodLabel } = periods[0];
            const { label: lastPeriodLabel } = periods[periods.length - 1];

            const startPeriod = new Date(firstPeriodLabel);
            const endPeriod = new Date(lastPeriodLabel);
            const currentDate = new Date();

            let subject = '';
            let message = '';

            // check if campaign is in flight
            if (startPeriod <= currentDate && endPeriod >= currentDate) {
                const {
                    subject: offPaceSubject,
                    message: offPaceMessage,
                    hasOffPaceCampaigns,
                } = checkIfCampaignIsOffPace({ campaign, currentDate });

                const {
                    subject: unlinkedSubject,
                    message: unlinkedMessage,
                    hasUnlinkedCampaigns,
                } = checkIfCampaignIsUnlinked({ campaign });

                if (hasOffPaceCampaigns && hasUnlinkedCampaigns) {
                    subject = `Campaign: ${campaign.name} - ${offPaceSubject} and ${unlinkedSubject}`;
                    message = `${offPaceMessage} and it is unlinked.`;
                } else if (hasOffPaceCampaigns) {
                    subject = `Campaign: ${campaign.name} - ${offPaceSubject}`;
                    message = offPaceMessage;
                } else if (hasUnlinkedCampaigns) {
                    subject = `Campaign: ${campaign.name} - ${unlinkedSubject}`;
                    message = unlinkedMessage;
                }

                if (
                    (hasUnlinkedCampaigns || hasOffPaceCampaigns) &&
                    subject !== '' &&
                    message !== ''
                ) {
                    await sendNotification({
                        campaign,
                        subject,
                        message,
                        type: 'email',
                    });
                }
            }
        }
    }
    logMessage('Finished daily check for unlinked or off pace campaigns');
}

module.exports = { start };
