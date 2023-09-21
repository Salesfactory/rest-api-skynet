const cron = require('node-cron');
const { Budget, CampaignGroup, Channel, Pacing } = require('./models');
const { channelController } = require('./controllers');
const { computeAndStoreMetrics } = require('./utils/bq_spend');

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
        cron.schedule('0 2 * * *', async () => {
            try {
                await updateBudgetMetrics();
            } catch (error) {
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
