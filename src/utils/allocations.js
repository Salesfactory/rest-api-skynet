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
const DSP_GOALS = {
    AWARENESS: ['REACH'],
    CONSIDERATIONS_ON_AMAZON: [
        'CLICK_THROUGH_RATE', //CTR
        'COST_PER_CLICK', //CPC
        'COST_PER_VIDEO_COMPLETION', // CPVC
        'VIDEO_COMPLETION_RATE', // VCR
        'COST_PER_DETAIL_PAGE_VIEW', // CPDV
        'DETAIL_PAGE_VIEW_RATE', // DPVR
    ],
    CONVERSIONS_OFF_AMAZON: [
        'RETURN_ON_AD_SPEND', // ROAS
        'TOTAL_RETURN_ON_AD_SPEND', // T-ROAS
        'COST_PER_ACQUISITION', // CPA
        'COMBINED_RETURN_ON_AD_SPEND', // C-ROAS
        'COST_PER_DOWNLOAD', // CPD
        // webpage shows 2 more, CPSU, CPFAO
    ],
};

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
        goal,
        goalKpi,
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
        goal: goal || 'AWARENESS',
        goalKpi: goalKpi || 'REACH',
    };

    const order = [
        {
            advertiserId,
            name,
            budget: {
                budgetCaps: [
                    {
                        recurrenceTimePeriod: recurrenceTimePeriod || 'DAILY', // "UNCAPPED" "DAILY" "MONTHLY"
                        amount: budget || 1,
                    },
                ],
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

// Creates a campaign on Amazon DSP
const createDSPCampaign = async ({ campaign, type, access, profileId }) => {
    return new Promise(async (resolve, reject) => {
        try {
            const config = getConfig({ type, access, profileId });
            config.url = 'https://advertising-api.amazon.com/dsp/orders';

            // validate goals from campaign
            const { goal, goalKpi } = campaign;
            const goals = DSP_GOALS[goal];
            if (goals && !goals.includes(goalKpi)) {
                reject('Invalid goal or goalKpi');
            }

            config.data = getSponsoredAdsCreateData({ campaign });

            const response = await axios.request(config);

            resolve({ data: response?.data || [] });
        } catch (error) {
            reject({ error: error?.response?.data || error });
        }
    });
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
    createDSPCampaign,
    isValidDate,
    formatDateString,
    getSponsoredAdsCreateData,
};
