const axios = require('axios');
const {
    validateCredentials,
    validateCampaignsArray,
    getConfig,
    createCampaigns,
} = require('./allocations');

const validateAmazonToken = async (req, res, next) => {
    if (process.env.NODE_ENV !== 'test') {
        const sessionToken = req.session.amazonAccessToken;

        // Access token is still valid, no need to refresh
        if (sessionToken && sessionToken.expiresAt > Date.now()) {
            return next();
        }

        try {
            const secret = await req.getSecrets();

            if (!sessionToken || sessionToken.expiresAt <= Date.now()) {
                // Handle the expiration
                const { data } = await axios.post(
                    'https://api.amazon.com/auth/o2/token',
                    new URLSearchParams({
                        grant_type: 'refresh_token',
                        refresh_token: secret.CLIENT_REFRESH,
                        client_id: secret.CLIENT_ID,
                        client_secret: secret.CLIENT_SECRET,
                    })
                );

                // Save the new token
                req.session.amazonAccessToken = {
                    token: data.access_token,
                    expiresAt: Date.now() + data.expires_in * 1000,
                };

                return next();
            }
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }

        next();
    } else {
        req.session.amazonAccessToken = { token: '123', expiresAt: 0 };
        next();
    }
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

module.exports = {
    validateAmazonToken,
    createAmazonCampaign,
};
