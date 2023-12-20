const axios = require('axios');

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
    'Sponsored Ads': {
        'Content-Type': 'application/json',
        Accept: 'application/vnd.dsporders.v2.3+json',
    },
    'Sponsored Ads Line Item': {
        'Content-Type': 'application/json',
        Accept: 'application/vnd.dsplineitems.v3.3+json',
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
const getConfig = ({ type, access, profileId, method }) => {
    const config = {
        method: method || 'post',
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
const createCampaigns = async (type, campaignsArray, config, state) => {
    return new Promise(async (resolve, reject) => {
        const errors = [];
        const successes = [];

        try {
            switch (type) {
                case 'Sponsored Products':
                    config.url =
                        'https://advertising-api.amazon.com/sp/campaigns';
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
                    config.url =
                        'https://advertising-api.amazon.com/sb/v4/campaigns';
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
                    config.url =
                        'https://advertising-api.amazon.com/sd/campaigns';
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
                    throw new Error('Unknown type');
            }

            resolve({ errors, successes });
        } catch (error) {
            reject(error);
        }
    });
};

const getSponsoredProductsCreateData = ({ campaigns, state }) => {
    // Helper function to format a single campaign
    const formatCampaign = campaign => {
        return {
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
        };
    };

    // Map each campaign using the formatCampaign function
    const formattedCampaigns = campaigns.map(formatCampaign);

    // Create the final data object
    const data = JSON.stringify({
        campaigns: formattedCampaigns,
    });

    return data;
};

const getSponsoredBrandsCreateData = ({ campaigns, state }) => {
    const formattedCampaigns = campaigns.map(campaign => ({
        budgetType: 'DAILY',
        name: campaign.name,
        state,
        productLocation: 'SOLD_ON_AMAZON',
        startDate: campaign.startDate,
        budget: campaign.budget,
        bidding: {
            bidOptimization: 'true',
        },
    }));

    const data = JSON.stringify({ campaigns: formattedCampaigns });

    return data;
};
const DEFAULT_CAMPAIGN_TACTIC = 'T00020';
const DEFAULT_BUDGET_TYPE = 'daily';
const DEFAULT_COST_TYPE = 'cpc';

const getSponsoredDisplayCreateData = ({ campaigns, state }) => {
    const formattedCampaigns = campaigns.map(campaign => {
        const {
            name,
            startDate,
            endDate,
            budget,
            tactic = DEFAULT_CAMPAIGN_TACTIC,
        } = campaign;

        const formattedStartDate = startDate.replace(/-/g, '');
        const formattedEndDate = endDate.replace(/-/g, '');

        return {
            name,
            budgetType: DEFAULT_BUDGET_TYPE,
            budget: Number(budget).toFixed(2),
            startDate: formattedStartDate,
            endDate: formattedEndDate,
            costType: DEFAULT_COST_TYPE,
            state: state.toLowerCase(),
            tactic,
        };
    });

    return JSON.stringify(formattedCampaigns);
};

// goals and kpis for sponsored ads

function isValidDate(dateString) {
    const parsedDate = new Date(dateString);
    return !isNaN(parsedDate) && parsedDate instanceof Date;
}

function formatDateString(inputDate) {
    const parsedDate = new Date(inputDate);
    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const day = String(parsedDate.getDate()).padStart(2, '0');
    const hours = String(parsedDate.getHours()).padStart(2, '0');
    const minutes = String(parsedDate.getMinutes()).padStart(2, '0');
    const seconds = String(parsedDate.getSeconds()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds} UTC`;

    return isValidDate(formattedDate) ? formattedDate : null;
}

const getSponsoredAdsCreateData = ({ campaign }) => {
    const {
        advertiserId,
        name,
        startDate,
        endDate,
        budget,
        recurrenceTimePeriod,
        frequencyCapType,
        frequencyCapMaxImpressions,
        frequencyCapTimeUnitCount,
        frequencyCapTimeUnit,
        productLocation,
        orderGoal,
        orderGoalKpi,
        biddingStrategy,
    } = campaign;

    const frequencyCap = {
        type: frequencyCapType || 'UNCAPPED', // "UNCAPPED" "CUSTOM" If UNCAPPED, no other fields are used.
        ...(frequencyCapType === 'CUSTOM'
            ? {
                  maxImpressions: frequencyCapMaxImpressions || 1,
                  timeUnitCount: frequencyCapTimeUnitCount || 1,
                  timeUnit: frequencyCapTimeUnit || 'DAYS', // "DAYS" "HOURS"
              }
            : {}),
    };

    const optimization = {
        productLocation: productLocation || 'SOLD_ON_AMAZON', //"SOLD_ON_AMAZON" "NOT_SOLD_ON_AMAZON"
        goal: orderGoal || 'AWARENESS',
        goalKpi: orderGoalKpi || 'REACH',
        biddingStrategy: biddingStrategy || 'MAXIMIZE_PERFORMANCE', // "SPEND_BUDGET_IN_FULL" "MAXIMIZE_PERFORMANCE"
    };

    const budgetCaps = [
        {
            recurrenceTimePeriod: recurrenceTimePeriod || 'DAILY', // "UNCAPPED" "DAILY" "MONTHLY"  If UNCAPPED, no other fields are used.
            ...(recurrenceTimePeriod === 'UNCAPPED'
                ? {}
                : { amount: budget || 1 }),
        },
    ];

    const order = [
        {
            advertiserId,
            name,
            budget: {
                budgetCaps,
                flights: [
                    {
                        startDateTime: formatDateString(startDate),
                        endDateTime: formatDateString(endDate),
                        amount: budget || 1,
                    },
                ],
            },
            frequencyCap,
            optimization,
        },
    ];

    return JSON.stringify(order);
};

const getSponsoredAdsLineItemCreateData = ({ adset, orderId }) => {
    const {
        lineItemType,
        name,
        startDate,
        endDate,
        frequencyCap,
        maximumImpressions,
        timeUnitCount,
        timeUnit,
        budget,
        totalBudget,
    } = adset;

    const lineItem = [
        {
            lineItemType: lineItemType || 'STANDARD_DISPLAY', // "STANDARD_DISPLAY" "AMAZON_MOBILE_DISPLAY" "AAP_MOBILE_APP" "VIDEO"
            name,
            orderId,
            startDateTime: formatDateString(startDate),
            endDateTime: formatDateString(endDate),
            budget: {
                totalBudgetAmount: totalBudget || 1,
                budgetCaps: [
                    {
                        recurrenceTimePeriod: 'UNCAPPED', // "UNCAPPED" for now
                    },
                ],
                pacing: {
                    deliveryProfile: 'EVENLY', // "FRONT_LOADED" "EVENLY"
                },
            },
            lineItemClassification: {
                productCategories: ['315343899230333385'],
            },
            frequencyCap: {
                type: frequencyCap || 'UNCAPPED', // "UNCAPPED" "CUSTOM" If UNCAPPED, no other fields are used.
                ...(frequencyCap === 'CUSTOM'
                    ? {
                          maxImpressions: maximumImpressions || 5,
                          timeUnitCount: timeUnitCount || 1,
                          timeUnit: timeUnit || 'DAYS', // "DAYS" "HOURS"
                      }
                    : {}),
            },
            bidding: {
                baseSupplyBid: 1.5,
                maxSupplyBid: 5.0,
            },
            optimization: {
                budgetOptimization: false,
            },
        },
    ];
    return JSON.stringify(lineItem);
};

// Get campaigns from Amazon DSP
const getDSPCampaigns = async ({ config, advertiserId }) => {
    return new Promise(async (resolve, reject) => {
        try {
            config.url = `https://advertising-api.amazon.com/dsp/orders?advertiserIdFilter=${advertiserId}`;

            const response = await axios.request(config);

            resolve({ data: response.data });
        } catch (error) {
            reject(error);
        }
    });
};

const findIdInAllocations = async ({ allocations, periods, id }) => {
    let found = false;
    for (const [index, period] of periods.entries()) {
        const periodAllocations = allocations[period.id];

        if (!Array.isArray(periodAllocations.allocations)) continue;

        for (const channel of periodAllocations.allocations) {
            if (!Array.isArray(channel.allocations)) continue;

            for (const campaignType of channel.allocations) {
                if (!Array.isArray(campaignType.allocations)) continue;

                for (const campaign of campaignType.allocations) {
                    if (campaign.id === id) {
                        found = true;
                        break;
                    }

                    if (!Array.isArray(campaign.allocations)) continue;

                    for (const adset of campaign.allocations) {
                        if (adset.id === id) {
                            found = true;
                            break;
                        }
                    }
                }
            }
        }
    }
    return found;
};

module.exports = {
    validateCredentials,
    validateCampaignsArray,
    getConfig,
    getAxiosHeaders,
    getSponsoredProductsCreateData,
    getSponsoredBrandsCreateData,
    getSponsoredDisplayCreateData,
    createCampaigns,
    getDSPCampaigns,

    findIdInAllocations,

    isValidDate,
    formatDateString,
    getSponsoredAdsCreateData,
    getSponsoredAdsLineItemCreateData,
};
