const {
    Budget,
    CampaignGroup,
    Notification,
    Pacing,
    Client,
    User,
} = require('../models');
const { send } = require('./email');

/**
 * Checks if a campaign is off pace
 */
function checkIfCampaignIsOffPace({ campaign, currentDate }) {
    const pacing = campaign.pacings[0];
    let hasOffPaceCampaigns = false;
    let subject = '';
    let message = '';

    let offPaceMessage = `The campaign ${campaign.name} from client ${campaign.client.name} is off pace for channel`;
    const offPaceObjects = checkPacingOffPace({ pacing, currentDate });
    const offPaceMessages = offPaceObjects.map(allocation => allocation.name);

    if (offPaceMessages.length > 1) {
        offPaceMessage += 's';
    }

    if (offPaceMessages.length > 0) {
        offPaceMessage += `: ${offPaceMessages.join(', ')}.`;
        subject = 'Off pace';
        message = offPaceMessage;
        hasOffPaceCampaigns = true;
    }

    return {
        subject,
        message,
        hasOffPaceCampaigns,
    };
}

/**
 *  Checks if a campaign is unlinked
 */
function checkIfCampaignIsUnlinked({ campaign }) {
    const { allocations } = campaign.budgets[0];
    // check if campaign does not have a bigquery_campaign_id
    campaign.linked = checkBigQueryIdExists({ allocations });
    // update campaign linked status in the database
    CampaignGroup.update(
        { linked: campaign.linked },
        { where: { id: campaign.id } }
    );

    let hasUnlinkedCampaigns = false;
    let subject = '';
    let message = '';

    if (!campaign.linked) {
        hasUnlinkedCampaigns = true;
        message = `The campaign ${campaign.name} from client ${campaign.client.name} is unlinked for channel`;
        subject = 'Unlinked';
    }

    return {
        subject,
        message,
        hasUnlinkedCampaigns,
    };
}

/**
 * Checks if at least a campaigns from a list of campaigns does not have a bigquery_campaign_id
 */
function checkBigQueryIdExists({ allocations }) {
    for (const key in allocations) {
        const period = allocations[key];
        for (const channel of period.allocations) {
            if (
                channel.type === 'CHANNEL' &&
                Array.isArray(channel.allocations) &&
                channel.allocations.length > 0
            ) {
                for (const campaignType of channel.allocations) {
                    if (
                        campaignType.type === 'CAMPAIGN_TYPE' &&
                        Array.isArray(campaignType.allocations) &&
                        campaignType.allocations.length > 0
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

/**
 * Checks if a pacing object is off pace
 */
function checkPacingOffPace({ pacing, currentDate }) {
    if (pacing) {
        // this threshold needs to be configurable
        const threshold = 0.05;
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
                const adb_plus_threshold = parseFloat(adb) * (1 + threshold);
                const adb_less_threshold = parseFloat(adb) * (1 - threshold);
                // check if adb_current less than adb or more than adb by more or less than 5%
                if (
                    adb_current < parseFloat(adb_less_threshold) ||
                    adb_current > parseFloat(adb_plus_threshold)
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

/**
 * Sends a notification to the user via email and inserts a notification in the database
 */
async function sendNotification({ campaign, subject, message, type }) {
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
        type,
    });
}

/**
 * Fetches all campaigns with their budgets from the database
 */
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
 *  Fetches all campaigns with their pacings from the database
 */
async function fetchCampaignsWithPacings() {
    return CampaignGroup.findAll({
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
}

/**
 * Updates or inserts a new pacing object in the database
 */
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

module.exports = {
    checkIfCampaignIsOffPace,
    checkIfCampaignIsUnlinked,
    checkBigQueryIdExists,
    checkPacingOffPace,
    sendNotification,
    fetchCampaignsWithBudgets,
    fetchCampaignsWithPacings,
    updateOrInsertPacingMetrics,
};
