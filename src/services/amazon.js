const axios = require('axios');

const {
    validateCredentials,
    validateCampaignsArray,
    getConfig,
    createCampaigns,
    getSponsoredAdsCreateData,
    getSponsoredAdsLineItemCreateData,
} = require('../utils/allocations');

const util = require('util');

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

                const config = getConfig({ type, access, profileId });

                // Create campaigns and handle responses
                const { errors, successes } = await createCampaigns(
                    type,
                    campaignsArray,
                    config,
                    state
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

// Creates an adset on Amazon DSP
const createDSPAdset = async ({ adset, orderId, type, access, profileId }) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (orderId) {
                const config = getConfig({ type, access, profileId });
                config.url = 'https://advertising-api.amazon.com/dsp/lineItems';

                config.data = getSponsoredAdsLineItemCreateData({
                    adset,
                    orderId,
                });

                console.log(
                    typeof config.data,
                    util.inspect(config, false, null, true /* enable colors */)
                );

                const response = await axios.request(config);

                resolve({ data: response?.data || [] });
            } else {
                reject({ error: 'Invalid orderId' });
            }
        } catch (error) {
            reject({ error: error?.response?.data || error });
        }
    });
};

module.exports = {
    createAmazonCampaign,
    createDSPCampaign,
    createDSPAdset,
};
