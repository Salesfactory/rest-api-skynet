const {
    validateCredentials,
    getConfig,
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

module.exports = {
    getAmazonDSPCampaigns,
};
