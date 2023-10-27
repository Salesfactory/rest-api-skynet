const {
    validateCredentials,
    validateCampaignsArray,
    getConfig,
    createCampaigns,
} = require('./allocations');

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

module.exports = { createAmazonCampaign };
