const {
    validateCredentials,
    getConfig,
    createDSPCampaign,
    getDSPCampaigns,
} = require('../utils/allocations');

const getAmazonDSPCampaigns = async ({ access, profileId, advertiserId }) => {
    try {
        validateCredentials(access);

        const config = getConfig({
            type: 'Sponsored Ads',
            access,
            profileId,
            method: 'get',
        });

        // Get campaigns and return responses
        const campaigns = await getDSPCampaigns({ config, advertiserId });

        return {
            message: 'Amazon DSP campaign retrieval complete',
            data: campaigns?.data?.response || [],
        };
    } catch (error) {
        return {
            message: 'Amazon DSP campaign retrieval failed',
            error: {
                code: 500,
                message: error.message,
            },
            data: [],
        };
    }
};

const createAmazonDSPCampaigns = async ({
    campaigns,
    profileId,
    access,
    advertiserId,
}) => {
    try {
        // Validate credentials
        validateCredentials(access);

        // validate advertiserId
        if (!advertiserId) {
            throw new Error('Advertiser ID is required');
        }

        const config = getConfig({ type: 'Sponsored Ads', access, profileId });

        // Create campaigns and handle responses
        const campaignsCreated = [];

        for (const campaign of campaigns) {
            campaignsCreated.push(
                await createDSPCampaign({
                    campaign: {
                        ...campaign,
                        advertiserId,
                    },
                    config,
                })
            );
        }

        return {
            message: 'Amazon DSP campaign creation complete',
            data: campaignsCreated || [],
        };
    } catch (error) {
        return {
            message: 'Amazon DSP campaign creation failed',
            error: {
                code: 500,
                message: error.message,
            },
            data: [],
        };
    }
};

module.exports = {
    getAmazonDSPCampaigns,
    createAmazonDSPCampaigns,
};
