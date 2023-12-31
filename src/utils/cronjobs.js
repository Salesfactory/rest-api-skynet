const {
    Channel,
    Budget,
    CampaignGroup,
    Notification,
    Pacing,
    Client,
    User,
} = require('../models');
const { Op } = require('sequelize');

const { checkInFlight } = require('./index');

/**
 * Checks if a campaign is off pace
 */
function checkIfCampaignIsOffPace({ campaign, currentDate }) {
    const pacing = campaign.pacings[0];

    const { overPaceCampaigns, underPaceCampaigns } = checkPacingOffPace({
        pacing,
        currentDate,
    });
    const offPaceCampaigns = [
        ...overPaceCampaigns.map(item => ({
            ...item,
            pace: 'Over',
        })),
        ...underPaceCampaigns.map(item => ({
            ...item,
            pace: 'Under',
        })),
    ];

    return {
        hasOffPaceCampaigns: offPaceCampaigns.length > 0 ? true : false,
        offPaceCampaigns,
    };
}

/**
 * get all campaigns flat
 */
function getCampaignsFlat({ allocations }) {
    let campaignsFlat = [];
    for (const channel of allocations) {
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
                        campaign.channel = channel.name;
                        campaignsFlat.push(campaign);
                    }
                }
            }
        }
    }
    return campaignsFlat;
}

/**
 * Checks if a pacing object is off pace
 */
function checkPacingOffPace({ pacing, currentDate }) {
    if (pacing) {
        // this threshold needs to be configurable
        const threshold = 0.05;
        const month = currentDate
            .toLocaleString('en-us', { month: 'long' })
            .toLowerCase();
        const year = currentDate.getFullYear();
        const formattedDate = `${month}_${year}`;
        const { allocations } = pacing;
        const currentPeriod = allocations[formattedDate];
        // If for some reason the current period does not exist in the budget period, return null
        if (!currentPeriod) {
            return { overPaceCampaigns: [], underPaceCampaigns: [] };
        }

        // get all campaigns from the current period in a flat array
        const campaignsFlat = getCampaignsFlat({
            allocations: currentPeriod.allocations,
        });

        // offpace objects are over and under pacing objects
        const overPaceCampaigns = campaignsFlat?.filter(campaign => {
            // an over pace object is an object that has a adb_current value that is more than the adb value by more than 5%
            const { adb, adb_current } = campaign;
            const adb_plus_threshold = parseFloat(adb) * (1 + threshold);
            // check if adb_current more than adb by more than 5%
            if (adb_current > parseFloat(adb_plus_threshold)) {
                return true;
            }
            return false;
        });
        const underPaceCampaigns = campaignsFlat?.filter(campaign => {
            // an under pace object is an object that has a adb_current value that is less than the adb value by more than 5%
            const { adb, adb_current } = campaign;
            const adb_less_threshold = parseFloat(adb) * (1 - threshold);
            // check if adb_current less than adb by more than 5%
            if (adb_current < parseFloat(adb_less_threshold)) {
                return true;
            }
            return false;
        });

        return {
            overPaceCampaigns,
            underPaceCampaigns,
        };
    } else {
        return {
            overPaceCampaigns: [],
            underPaceCampaigns: [],
        };
    }
}

/**
 * count campaigns and adsets inside of allocations
 */
function countCampaignsAndAdsetsInAllocations({ campaign, channelName }) {
    let campaignCount = 0;
    let adsetCount = 0;
    if (Array.isArray(campaign.budgets) && campaign.budgets.length > 0) {
        const { allocations, periods } = campaign.budgets[0];
        const first_period = periods[0];

        if (first_period) {
            const allocationsPeriod = allocations[first_period.id];
            if (
                Array.isArray(allocationsPeriod.allocations) &&
                allocationsPeriod.allocations.length > 0
            ) {
                for (const channel of allocationsPeriod.allocations) {
                    if (
                        channel.type === 'CHANNEL' &&
                        Array.isArray(channel.allocations) &&
                        channel.allocations.length > 0 &&
                        channel.name === channelName
                    ) {
                        for (const campaignType of channel.allocations) {
                            if (
                                campaignType.type === 'CAMPAIGN_TYPE' &&
                                Array.isArray(campaignType.allocations) &&
                                campaignType.allocations.length > 0
                            ) {
                                campaignCount +=
                                    campaignType.allocations.length;
                                for (const campaign of campaignType.allocations) {
                                    if (
                                        campaign.type === 'CAMPAIGN' &&
                                        Array.isArray(campaign.allocations) &&
                                        campaign.allocations.length > 0
                                    ) {
                                        adsetCount +=
                                            campaign.allocations.length;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    return {
        campaignCount,
        adsetCount,
    };
}

/**
 * counts campaigns and adsets inside of amazonCampaigns, facebookCampaigns
 */
function countCampaignAndAdsetsAmzFb({ campaigns }) {
    let campaignCount = 0;
    let adsetCount = 0;

    if (Array.isArray(campaigns)) {
        campaignCount = campaigns.length;
        for (const campaign of campaigns) {
            if (Array.isArray(campaign.adsets)) {
                for (const adset of campaign.adsets) {
                    if (!adset.jobId) {
                        // if it has a jobId it means it hasnt been processed yet
                        adsetCount += 1;
                    }
                }
            }
        }
    }

    return {
        campaignCount,
        adsetCount,
    };
}

/**
 *  Checks if a campaign is unlinked
 */
function checkIfCampaignIsUnlinked({ campaign, apiEnabledChannels = [] }) {
    const { allocations } = campaign.budgets[0];
    console.log(campaign.id, apiEnabledChannels);
    // check if campaign does not have a bigquery_campaign_id
    const { hasUnlinkedCampaigns, campaigns } = checkBigQueryIdExists({
        allocations,
        apiEnabledChannels,
    });

    const unlinkedCampaigns = campaigns.map(item => ({
        ...item,
        status: 'Unlinked',
    }));

    return {
        hasUnlinkedCampaigns,
        unlinkedCampaigns,
    };
}

/**
 * Checks if there's the same amount of campaigns in the allocations and in the amazonCampaigns, facebookCampaigns, etc
 * also checks its adsets inside of amazonCampaigns[x].adsets, facebookCampaigns[x].adsets, etc
 * returns true if there's the same amount of campaigns and adsets (it is linked)
 * returns false if there's not the same amount of campaigns and adsets (it is unlinked)
 */
function checkSameAmountOfCampaigns({ campaign }) {
    const { amazonCampaigns, facebookCampaigns } = campaign.budgets[0];

    if (amazonCampaigns?.length > 0 || facebookCampaigns?.length > 0) {
        const { campaignCount: amzCampaignCount, adsetCount: amzAdsetCount } =
            countCampaignsAndAdsetsInAllocations({
                campaign,
                channelName: 'Amazon Advertising DSP',
            });

        const {
            campaignCount: createdAmzCampaignsCount,
            adsetCount: createdAmzAdsetCount,
        } = countCampaignAndAdsetsAmzFb({
            campaigns: amazonCampaigns,
        });

        const { campaignCount: fbCampaignCount, adsetCount: fbAdsetCount } =
            countCampaignsAndAdsetsInAllocations({
                campaign,
                channelName: 'Facebook',
            });

        const {
            campaignCount: createdFbCampaignsCount,
            adsetCount: createdFbAdsetCount,
        } = countCampaignAndAdsetsAmzFb({
            campaigns: facebookCampaigns,
        });

        // it could've been validated as !== but i decided to use > just in case there
        // are more campaigns in the amazonCampaigns or facebookCampaigns than in the allocations
        // but that never should be the case
        return !(
            amzCampaignCount > createdAmzCampaignsCount ||
            amzAdsetCount > createdAmzAdsetCount ||
            fbCampaignCount > createdFbCampaignsCount ||
            fbAdsetCount > createdFbAdsetCount
        );
    }
}

/**
 * Checks if at least a campaigns from a list of campaigns does not have a bigquery_campaign_id
 */
function checkBigQueryIdExists({ allocations, apiEnabledChannels = [] }) {
    let campaignsUnlinked = [];
    for (const [index, key] of Object.keys(allocations).entries()) {
        // since every period has the same structure, we only need to check the first period
        if (index === 0) {
            const period = allocations[key];
            for (const channel of period.allocations) {
                if (
                    channel.type === 'CHANNEL' &&
                    Array.isArray(channel.allocations) &&
                    channel.allocations.length > 0 &&
                    // added this line to avoid checking api enabled channels (since those are not manually linked to bigquery)
                    !apiEnabledChannels.includes(channel.name)
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
                                    campaign.channel = channel.name;
                                    campaignsUnlinked.push(campaign);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    return {
        hasUnlinkedCampaigns: campaignsUnlinked.length > 0,
        campaigns: campaignsUnlinked,
    };
}

/**
 * returns the users to be notified and their usernames
 */
function getUsersToNotifyWithCampaigns({
    campaigngroups,
    currentDate,
    apiEnabledChannels = [],
}) {
    let usersToNotify = {};
    let usernames = new Map();

    // check if is in flight
    // in flight campaign means: A campaign with a start date in the past and an end date in the future
    for (campaign of campaigngroups) {
        // check if campaign has a user just in case (it should always have a user)
        if (
            campaign.user &&
            Array.isArray(campaign.budgets) &&
            campaign.budgets.length > 0
        ) {
            // check if campaign is in flight
            const { inFlight } = checkInFlight({ currentDate, campaign });
            if (inFlight) {
                const { offPaceCampaigns, hasOffPaceCampaigns } =
                    checkIfCampaignIsOffPace({
                        campaign,
                        currentDate,
                    });

                const { unlinkedCampaigns, hasUnlinkedCampaigns } =
                    checkIfCampaignIsUnlinked({
                        campaign,
                        apiEnabledChannels,
                    });

                // if campaign is off pace or unlinked, add it to the list of campaigns to notify the user
                if (hasOffPaceCampaigns || hasUnlinkedCampaigns) {
                    if (!usersToNotify[campaign.user.id]) {
                        usersToNotify[campaign.user.id] = [];
                        usernames[campaign.user.id] = {
                            name: campaign.user.name,
                            email: campaign.user.email,
                            roleId: campaign.user.roleId,
                        };
                    }

                    usersToNotify[campaign.user.id].push({
                        id: campaign.id,
                        name: campaign.name,
                        user: {
                            id: campaign.user.id,
                            name: campaign.user.name,
                            email: campaign.user.email,
                            roleId: campaign.user.roleId,
                        },
                        client: {
                            id: campaign.client.id,
                            name: campaign.client.name,
                        },
                        offpace: offPaceCampaigns,
                        unlinked: unlinkedCampaigns,
                    });
                }
            }
        }
    }
    return { usersToNotify, usernames };
}

/**
 * Sends a notification to the user inserted in the database
 */
async function sendNotification({ campaign, subject, message, type }) {
    await Notification.create({
        user_id: campaign.user.id,
        roleId: campaign.user.roleId,
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
            where: {
                deleted: false,
                status: { [Op.not]: 'Ended' },
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
            status: { [Op.not]: 'Ended' },
        },
        include: [
            {
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'email', 'roleId'],
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
 * Fetches all api enabled channels
 */
async function fetchApiEnabledChannels() {
    return Channel.findAll({
        where: {
            isApiEnabled: true,
        },
    });
}

/**
 *  Fetches all campaigns with their pacings from the database
 */
async function fetchCampaignsWithPacingsByUserId({ userId }) {
    return CampaignGroup.findAll({
        where: {
            deleted: false,
            status: { [Op.not]: 'Ended' },
            user_id: userId,
        },
        include: [
            {
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'email'],
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
    getUsersToNotifyWithCampaigns,
    fetchCampaignsWithBudgets,
    fetchCampaignsWithPacings,
    fetchApiEnabledChannels,
    fetchCampaignsWithPacingsByUserId,
    updateOrInsertPacingMetrics,
    checkSameAmountOfCampaigns,
    countCampaignsAndAdsetsInAllocations,
    countCampaignAndAdsetsAmzFb,
};
