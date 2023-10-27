function groupCampaignAllocationsByType({
    channelsWithApiEnabled,
    allocations,
    flight_time_start,
    flight_time_end,
}) {
    const campaignData = new Map();
    const channelNames = channelsWithApiEnabled.map(channel => channel.name);
    if (!allocations) {
        return {};
    }
    for (const [index, key] of Object.keys(allocations).entries()) {
        const periodAllocations = allocations[key].allocations;
        for (const channel of periodAllocations) {
            if (channelNames.includes(channel.name)) {
                if (Array.isArray(channel.allocations)) {
                    for (const campaignType of channel.allocations) {
                        if (Array.isArray(campaignType.allocations)) {
                            for (const campaign of campaignType.allocations) {
                                campaignData.set(campaign.id, {
                                    name: campaign.name,
                                    type: campaignType.name,
                                    budget:
                                        (
                                            campaignData.get(campaign.id) || {
                                                budget: 0,
                                            }
                                        ).budget + parseFloat(campaign.budget),
                                });
                            }
                        }
                    }
                }
            }
        }
    }

    const parsedStartDate = new Date(flight_time_start)
        .toISOString()
        .substring(0, 10);
    const parsedEndDate = new Date(flight_time_end)
        .toISOString()
        .substring(0, 10);

    const campaignArray = Array.from(campaignData, ([key, value]) => ({
        id: key,
        ...value,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
    }));

    const campaignDataByType = campaignArray.reduce((acc, campaign) => {
        const { type, ...rest } = campaign;
        if (!acc[type]) {
            acc[type] = [];
        }
        acc[type].push(rest);
        return acc;
    }, {});
    return campaignDataByType;
}

const createAmazonCampaign = async ({
    campaigns,
    state,
    profileId,
    access,
}) => {
    try {
        // Validate credentials
        validateCredentials(access);

        const campaignErrors = [];
        const campaignSuccesses = [];

        for (const type in campaigns) {
            if (campaigns.hasOwnProperty(type)) {
                const campaignsArray = campaigns[type];

                // Validate campaigns array
                validateCampaignsArray(campaignsArray);

                const config = getConfig(type, access, profileId);

                // Create campaigns and handle responses
                const { errors, successes } = await createCampaigns(
                    type,
                    campaignsArray,
                    config
                );

                campaignErrors.push(...errors);
                campaignSuccesses.push(...successes);
            }
        }

        return {
            message: 'Amazon campaign creation complete',
            success: campaignSuccesses,
            error: campaignErrors,
        };
    } catch (error) {
        console.log(error);
        return {
            message: 'Amazon campaign creation failed',
            error: {
                code: 500,
                message: error.message,
            },
            success: [],
        };
    }
};

// Validation function for credentials
const validateCredentials = access => {
    if (!access?.CLIENT_ID || !access?.ACCESS_TOKEN) {
        console.error('Access token or client ID is missing');
        throw new Error('Access token or client ID is missing');
    }
};

// Validation function for campaigns array
const validateCampaignsArray = campaignsArray => {
    if (!Array.isArray(campaignsArray)) {
        console.error('Campaigns must be an array');
        throw new Error('Campaigns must be an array');
    }
};

const HEADER_CONFIG = {
    'Sponsored Products': {
        Prefer: 'return=representation',
        Accept: 'application/vnd.spCampaign.v3+json',
        'Content-Type': 'application/vnd.spCampaign.v3+json',
    },
    'Sponsored Brands': {
        Accept: 'application/vnd.sbcampaignresource.v4+json',
    },
    'Sponsored Display': {
        'Content-Type': 'application/json',
    },
};

const getAxiosHeaders = ({ clientId, accessToken, profileId, type }) => {
    if (!clientId || !accessToken || !profileId) {
        // Handle missing required parameters
        throw new Error('Missing required parameters for headers');
    }
    if (!HEADER_CONFIG[type]) {
        throw new Error('Unknown type parameters for headers');
    }

    const extraHeaders = HEADER_CONFIG[type];

    return {
        'Amazon-Advertising-API-ClientId': clientId,
        Authorization: 'Bearer ' + accessToken,
        'Amazon-Advertising-API-Scope': profileId,
        ...extraHeaders,
    };
};

// Get configuration for API request
const getConfig = (type, access, profileId) => {
    const config = {
        method: 'post',
        maxBodyLength: Infinity,
    };

    config.headers = getAxiosHeaders({
        clientId: access.CLIENT_ID,
        accessToken: access.ACCESS_TOKEN,
        profileId,
        type,
    });

    return config;
};

// Create campaigns and handle responses
const createCampaigns = async (type, campaignsArray, config) => {
    const errors = [];
    const successes = [];

    switch (type) {
        case 'Sponsored Products':
            config.url = 'https://advertising-api.amazon.com/sp/campaigns';
            config.data = getSponsoredProductsCreateData({
                campaigns: campaignsArray,
                state,
            });

            const newSPCampaign = await axios.request(config);
            const newSPCampaignData = newSPCampaign?.data?.campaigns;

            if (newSPCampaignData) {
                errors.push(...newSPCampaignData.error);
                successes.push(...newSPCampaignData.success);
            }

            break;
        case 'Sponsored Brands':
            config.url = 'https://advertising-api.amazon.com/sb/v4/campaigns';
            config.data = getSponsoredBrandsCreateData({
                campaigns: campaignsArray,
                state,
            });

            const newSBCampaign = await axios.request(config);
            const newSBCampaignData = newSBCampaign?.data?.campaigns;

            if (newSBCampaignData) {
                errors.push(...newSBCampaignData.error);
                successes.push(...newSBCampaignData.success);
            }

            break;
        case 'Sponsored Display':
            config.url = 'https://advertising-api.amazon.com/sd/campaigns';
            config.data = getSponsoredDisplayCreateData({
                campaigns: campaignsArray,
                state,
            });

            const newSDCampaign = await axios.request(config);
            const newSDCampaignData = newSDCampaign?.data;

            if (Array.isArray(newSDCampaignData)) {
                newSDCampaignData.forEach(campaign => {
                    if (campaign.code === 'SUCCESS') {
                        successes.push(campaign);
                    } else {
                        errors.push(campaign);
                    }
                });
            }

            break;
        default:
            break;
    }

    return { errors, successes };
};

const getSponsoredProductsCreateData = ({ campaigns, state }) => {
    let data = JSON.stringify({
        campaigns: campaigns.map(campaign => ({
            endDate: campaign.endDate,
            name: campaign.name,
            targetingType: 'MANUAL',
            state,
            dynamicBidding: {
                strategy: campaign.strategy || 'LEGACY_FOR_SALES',
            },
            startDate: campaign.startDate,
            budget: {
                budgetType: 'DAILY',
                budget: campaign.budget,
            },
        })),
    });

    return data;
};

module.exports = {
    groupCampaignAllocationsByType,
    validateCredentials,
    validateCampaignsArray,
    getConfig,
    getAxiosHeaders,
    getSponsoredProductsCreateData,
};
