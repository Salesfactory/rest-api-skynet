const axios = require('axios');
const util = require('util');

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
        next();
    }
};

const getAxiosHeaders = ({ clientId, accessToken, profileId, type }) => {
    let extraHeaders = {};
    switch (type) {
        case 'Sponsored Products':
            extraHeaders = {
                Prefer: 'return=representation',
                Accept: 'application/vnd.spCampaign.v3+json',
                'Content-Type': 'application/vnd.spCampaign.v3+json',
            };
            break;
        case 'Sponsored Brands':
            extraHeaders = {
                Accept: 'application/vnd.sbcampaignresource.v4+json',
            };
            break;
        case 'Sponsored Display':
            extraHeaders = {
                'Content-Type': 'application/json',
            };
            break;
        default:
            break;
    }
    return clientId && accessToken && profileId
        ? {
              'Amazon-Advertising-API-ClientId': clientId,
              Authorization: 'Bearer ' + accessToken,
              'Amazon-Advertising-API-Scope': profileId,
              ...extraHeaders,
          }
        : null;
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

const getSponsoredBrandsCreateData = ({ campaigns, state }) => {
    let data = JSON.stringify({
        campaigns: campaigns.map(campaign => ({
            budgetType: 'DAILY',
            name: campaign.name,
            state,
            productLocation: 'SOLD_ON_AMAZON',
            startDate: campaign.startDate,
            budget: campaign.budget,
            bidding: {
                bidOptimization: 'true',
            },
        })),
    });

    return data;
};

const getSponsoredDisplayCreateData = ({ campaigns, state }) => {
    let data = JSON.stringify(
        campaigns.map(campaign => ({
            name: campaign.name,
            budgetType: 'daily',
            budget: Number(campaign.budget).toFixed(2),
            startDate: campaign.startDate.replace(/-/g, ''),
            endDate: campaign.endDate.replace(/-/g, ''),
            costType: 'cpc',
            state: state.toLowerCase(),
            tactic: campaign.tactic || 'T00020',
        }))
    );

    return data;
};

const createAmazonCampaign = async ({
    campaigns,
    state,
    profileId,
    access,
}) => {
    try {
        if (!access?.CLIENT_ID || !access?.ACCESS_TOKEN) {
            return {
                message: 'Credentials missing',
                error: [
                    {
                        code: 400,
                        message: 'access token or client id is missing',
                    },
                ],
                success: [],
            };
        }

        const campaignErrors = [];
        const campaignSuccesses = [];

        for (const type in campaigns) {
            if (campaigns.hasOwnProperty(type)) {
                const campaignsArray = campaigns[type];

                if (!Array.isArray(campaignsArray)) {
                    return {
                        message: 'Array needed',
                        error: [
                            {
                                code: 400,
                                message: 'Campaigns must be an array',
                            },
                        ],
                        success: [],
                    };
                }

                const validateCampaigns = campaigns => {
                    const requiredFields = [
                        'name',
                        'startDate',
                        'endDate',
                        'budget',
                    ];
                    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                    const currentDate = new Date();
                    const errors = [];

                    campaigns.forEach(campaign => {
                        const missingFields = requiredFields.filter(
                            field => !campaign.hasOwnProperty(field)
                        );
                        if (missingFields.length > 0) {
                            errors.push(
                                `Missing required fields in campaign with ID ${
                                    campaign.id
                                }: ${missingFields.join(', ')}`
                            );
                        }

                        if (
                            !campaign.startDate.match(dateRegex) ||
                            !campaign.endDate.match(dateRegex)
                        ) {
                            errors.push(
                                `Invalid date format in campaign with ID ${campaign.id}. Dates must be in format YYYY-MM-DD`
                            );
                        }

                        const start = new Date(campaign.startDate);
                        const end = new Date(campaign.endDate);

                        if (start > end) {
                            errors.push(
                                `Start date must be before end date in campaign with ID ${campaign.id}`
                            );
                        }

                        if (start < currentDate || end < currentDate) {
                            errors.push(
                                `Start date and end date cannot be in the past in campaign with ID ${campaign.id}`
                            );
                        }
                    });

                    if (errors.length > 0) {
                        return errors;
                    }

                    return 'All campaigns have required fields.';
                };

                const validationResults = validateCampaigns(campaignsArray);

                if (Array.isArray(validationResults)) {
                    return {
                        message: 'Validation error',
                        error: [
                            {
                                code: 400,
                                message: JSON.stringify(validationResults),
                            },
                        ],
                        success: [],
                    };
                }

                let config = {
                    method: 'post',
                    maxBodyLength: Infinity,
                };

                config.headers = getAxiosHeaders({
                    clientId: access.CLIENT_ID,
                    accessToken: access.ACCESS_TOKEN,
                    profileId,
                    type,
                });

                // Actual campaign creation happens here
                switch (type) {
                    case 'Sponsored Products': {
                        config.url =
                            'https://advertising-api.amazon.com/sp/campaigns';
                        config.data = getSponsoredProductsCreateData({
                            campaigns: campaignsArray,
                            state,
                        });

                        const newSPCampaign = await axios.request(config);
                        const newCampaignData = newSPCampaign?.data?.campaigns;

                        if (newCampaignData) {
                            if (newCampaignData?.error?.length > 0) {
                                campaignErrors.push(
                                    newSPCampaign.data.campaigns.error
                                );
                            }
                            if (newCampaignData?.success?.length > 0) {
                                campaignSuccesses.push(
                                    newSPCampaign.data.campaigns.success
                                );
                            }
                        }

                        break;
                    }
                    case 'Sponsored Brands': {
                        config.url =
                            'https://advertising-api.amazon.com/sb/v4/campaigns';
                        config.data = getSponsoredBrandsCreateData({
                            campaigns: campaignsArray,
                            state,
                        });

                        const newSBCampaign = await axios.request(config);
                        const newCampaignData = newSBCampaign?.data?.campaigns;

                        if (newCampaignData) {
                            if (newCampaignData?.error?.length > 0) {
                                campaignErrors.push(
                                    newSBCampaign.data.campaigns.error
                                );
                            }
                            if (newCampaignData?.success?.length > 0) {
                                campaignSuccesses.push(
                                    newSBCampaign.data.campaigns.success
                                );
                            }
                        }

                        break;
                    }
                    case 'Sponsored Display': {
                        config.url =
                            'https://advertising-api.amazon.com/sd/campaigns';

                        config.data = getSponsoredDisplayCreateData({
                            campaigns: campaignsArray,
                            state,
                        });

                        const newSDCampaign = await axios.request(config);

                        newSDCampaign.data.forEach(campaign => {
                            if (campaign.code === 'SUCCESS') {
                                campaignSuccesses.push(campaign);
                            } else {
                                campaignErrors.push(campaign);
                            }
                        });

                        break;
                    }
                    default:
                        break;
                }
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

const getAmazonCampaignsEndpoint = async (req, res) => {
    const { type, status = 'PAUSED' } = req.query;
    const secret = await req.getSecrets();

    const access = {
        CLIENT_ID: secret.CLIENT_ID,
        ACCESS_TOKEN: req.session.amazonAccessToken.token,
    };

    const maxResults = 10;

    // HARDCODED PROFILE ID
    const profileId = '1330860679472894';

    let config = {
        method: 'post',
        maxBodyLength: Infinity,
    };

    config.headers = getAxiosHeaders({
        clientId: access.CLIENT_ID,
        accessToken: access.ACCESS_TOKEN,
        profileId,
        type,
    });

    switch (type) {
        case 'Sponsored Products': {
            const statusUppercase = status.toUpperCase();

            config.url = 'https://advertising-api.amazon.com/sp/campaigns/list';
            config.data = JSON.stringify({
                stateFilter: { include: [statusUppercase] },
                maxResults,
            });

            break;
        }
        case 'Sponsored Brands': {
            const statusUppercase = status.toUpperCase();

            config.url =
                'https://advertising-api.amazon.com/sb/v4/campaigns/list';
            config.data = JSON.stringify({
                stateFilter: { include: [statusUppercase] },
                maxResults,
            });

            break;
        }
        case 'Sponsored Display': {
            const statusLowercase = status.toLowerCase();
            config.method = 'get';
            config.url = `https://advertising-api.amazon.com/sd/campaigns?stateFilter=${statusLowercase}&count=${maxResults}`;

            break;
        }
        default:
            break;
    }

    try {
        const response = await axios.request(config);
        let data = [];

        if (['Sponsored Products', 'Sponsored Brands'].includes(type)) {
            data = response.data.campaigns;
        } else {
            data = response.data;
        }

        res.status(200).json({ message: 'get amazon campaign', data });
    } catch (error) {
        res.status(500).json({ message: error.response.data.message });
    }
};

const createAmazonCampaignEndpoint = async (req, res) => {
    const secret = await req.getSecrets();
    const { campaigns, state } = req.body;

    // HARDCODED PROFILE ID
    const profileId = '1330860679472894';

    const access = {
        CLIENT_ID: secret.CLIENT_ID,
        ACCESS_TOKEN: req.session.amazonAccessToken.token,
    };

    const { message, success, error } = await createAmazonCampaign({
        campaigns,
        state: state || 'PAUSED',
        profileId,
        access,
    });

    if (Array.isArray(error) && error.length > 0) {
        return res.status(500).json({
            message: JSON.stringify(error),
            success: JSON.stringify(success),
        });
    }

    res.status(200).json({ message, success: JSON.stringify(success) });
};

module.exports = {
    validateAmazonToken,
    getAmazonCampaignsEndpoint,
    createAmazonCampaign,
    createAmazonCampaignEndpoint,
};
