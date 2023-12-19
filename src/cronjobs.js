const cron = require('node-cron');
const { Channel, Client, Notification } = require('./models');
const { channelController, clientController } = require('./controllers');
const { computeAndStoreMetrics } = require('./utils/bq_spend');
const {
    sendNotification,
    fetchCampaignsWithBudgets,
    fetchCampaignsWithPacings,
    fetchApiEnabledChannels,
    updateOrInsertPacingMetrics,
    checkBigQueryIdExists,
    checkPacingOffPace,
    getUsersToNotifyWithCampaigns,
} = require('./utils/cronjobs');
const { checkInFlight } = require('./utils');
const { emailTemplate } = require('./templates/email');
const { send } = require('./utils/email');
const { Op } = require('sequelize');

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
        cron.schedule(
            '0 0 * * *',
            async () => {
                try {
                    await checkAndInsertNewChannels();
                } catch (error) {
                    console.log(error);
                    logMessage(
                        'Error while checking for new channels: ' + error
                    );
                }
            },
            { timezone: 'America/New_York' }
        );

        cron.schedule(
            '0 1 * * *',
            async () => {
                try {
                    await deleteReadNotifications();
                } catch (error) {
                    console.log(error);
                    logMessage(
                        'Error while deleting old read notifications: ' + error
                    );
                }
            },
            { timezone: 'America/New_York' }
        );

        // update all budget metrics every day at 2 hours 0 minutes
        cron.schedule(
            '0 2 * * *',
            async () => {
                try {
                    await updateBudgetMetrics();
                } catch (error) {
                    console.log(error);
                    logMessage('Error while updating budget metrics: ' + error);
                }
            },
            { timezone: 'America/New_York' }
        );

        // check for unlinked campaigns every day at 9 hours 0 minutes
        cron.schedule(
            '0 9 * * *',
            async () => {
                try {
                    await checkAndNotifyUnlinkedOrOffPaceCampaigns();
                } catch (error) {
                    console.log(error);
                    logMessage(
                        'Error while checking for unlinked campaigns: ' + error
                    );
                }
            },
            { timezone: 'America/New_York' }
        );

        // check campaign groups and update its statuses every hour after 10 minutes
        cron.schedule(
            '10 * * * *',
            async () => {
                try {
                    await updateCampaignGroupsStatuses();
                } catch (error) {
                    console.log(error);
                    logMessage(
                        'Error while updating campaign group statuses: ' + error
                    );
                }
            },
            { timezone: 'America/New_York' }
        );
    }
};

/**
 * Checks if there are new channels in bigquery and inserts them in the database
 * Also checks if there are new advertisers for the channels and inserts them in the database
 */
async function deleteReadNotifications() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    await Notification.destroy({
        where: {
            status: 'read',
            createdAt: {
                [Op.lt]: sevenDaysAgo,
            },
        },
    });
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
    const apiEnabledChannels = await fetchApiEnabledChannels();

    const currentDate = new Date();

    const { usersToNotify, usernames } = getUsersToNotifyWithCampaigns({
        campaigngroups,
        currentDate,
        apiEnabledChannels: apiEnabledChannels.map(channel => channel.name),
    });

    // send email to users
    for (const id in usersToNotify) {
        const user = usernames[id];
        const campaigns = usersToNotify[id];

        logMessage('Sending email to user: ' + user.name + ' ' + user.email);
        const html = emailTemplate({
            user: user.name,
            campaigns,
            baseUrl: process.env.WEB_URL,
        });

        // send notification to user in web
        await Promise.all(
            campaigns.map(campaign =>
                sendNotification({
                    campaign,
                    subject: 'You have unlinked or off pace campaigns',
                    message: campaign.name + ' is unlinked or off pace',
                    type: 'email',
                })
            )
        );

        // send email to user
        await send({
            to: user.email,
            subject: 'You have unlinked or off pace campaigns',
            message: 'You have unlinked or off pace campaigns',
            html,
            type: 'email',
        });
        logMessage('Sending email to user: ' + user.name);
    }

    logMessage('Finished daily check for unlinked or off pace campaigns');
}

async function updateCampaignGroupsStatuses() {
    logMessage('Starting hourly campaign group status update');

    const campaigns = await fetchCampaignsWithPacings();

    /*  Planning: Gray (missing links, not in-flight)
        Planned: Blue (not missing links. not in-flight)
        Not tracking: Orange (missing links. in-flight)
        On pace: (not missing links. in-flight) Green
        Under-paced: (not missing links. in-flight) red
        Over-paced: (not missing links. in-flight) red
        under pace < 5%
        over pace > 5%
        on pace -5% <> 5%
    */
    for (const campaign of campaigns) {
        if (Array.isArray(campaign.budgets) && campaign.budgets.length > 0) {
            const { allocations } = campaign.budgets[0];
            let status = null;

            // check if campaign is in flight
            const currentDate = new Date();

            const { hasUnlinkedCampaigns } = checkBigQueryIdExists({
                allocations,
            });

            const { inFlight, hasEnded } = checkInFlight({
                currentDate,
                campaign,
            });

            if (inFlight && !hasEnded) {
                const pacing = campaign.pacings[0];

                // campaign is in flight check if campaign is linked
                if (!hasUnlinkedCampaigns) {
                    const { overPaceCampaigns, underPaceCampaigns } =
                        checkPacingOffPace({
                            pacing,
                            currentDate,
                        });
                    if (
                        Array.isArray(overPaceCampaigns) &&
                        Array.isArray(underPaceCampaigns)
                    ) {
                        if (
                            overPaceCampaigns.length > 0 &&
                            underPaceCampaigns.length > 0
                        ) {
                            status = 'Off pace';
                        } else if (overPaceCampaigns.length > 0) {
                            status = 'Overpaced';
                        } else if (underPaceCampaigns.length > 0) {
                            status = 'Underpaced';
                        } else {
                            status = 'On pace';
                        }
                    } else {
                        status = 'Error';
                    }
                } else {
                    status = 'Not tracking';
                }
            } else if (!inFlight && !hasEnded) {
                // campaign is not in flight and has not ended
                if (!hasUnlinkedCampaigns) {
                    status = 'Planned';
                } else {
                    status = 'Planning';
                }
            } else {
                status = 'Ended';
            }

            campaign.status = status;
            await campaign.save();
        }
    }

    logMessage('Finished hourly campaign group status update');
}

module.exports = { start };
