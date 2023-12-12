const { bigqueryClient } = require('../config/bigquery');
const { createSheet, createPacingsSheet } = require('../utils/reports');
const {
    Agency,
    Budget,
    CampaignGroup,
    Client,
    Pacing,
    Channel,
} = require('../models');
const { Op } = require('sequelize');
const sequelize = require('sequelize');
const { validateObjectAllocations } = require('../utils');
const { getUser, checkInFlight } = require('../utils');
const { computeAndStoreMetrics } = require('../utils/bq_spend');
const {
    fetchCampaignsWithBudgets,
    fetchCampaignsWithPacingsByUserId,
    updateOrInsertPacingMetrics,
    checkBigQueryIdExists,
    getUsersToNotifyWithCampaigns,
    sendNotification,
} = require('../utils/cronjobs');
const { emailTemplate } = require('../templates/email');
const { emailCampaignFail } = require('../templates/emailCampaignFail');
const { send } = require('../utils/email');
const {
    groupCampaignAllocationsByType,
    generateCampaignsWithTimePeriodsAndAdsets,
    convertToCents,
    concatMissingCampaigns,
} = require('../utils/parsers');
const { findIdInAllocations } = require('../utils/allocations');
const util = require('util');

//creacion de reporte excel
const createReport = async (req, res) => {
    const { id: clientId, cid: campaignGroupId } = req.params;
    const { type = 'net' } = req.query;

    try {
        const client = await Client.findOne({
            where: { id: clientId },
        });

        if (!client) {
            return res.status(404).json({
                message: `Client not found`,
            });
        }

        const campaignGroup = await CampaignGroup.findOne({
            where: { id: campaignGroupId, client_id: clientId },
            include: [
                {
                    model: Budget,
                    as: 'budgets',
                    limit: 1,
                    order: [['updatedAt', 'DESC']],
                    attributes: ['periods', 'allocations'],
                },
            ],
        });

        if (!campaignGroup) {
            return res.status(404).json({
                message: `Campaign group not found`,
            });
        }

        const campaignGroupBudget = campaignGroup.budgets[0];
        const { periods: timePeriod, allocations } =
            campaignGroupBudget.dataValues;

        await createSheet({
            timePeriod,
            allocations,
            margin: campaignGroup.margin,
            type: type.toLowerCase(),
        })
            .then(file => {
                x = file.write('file.xlsx', res);
                return res;
            })
            .catch(error => {
                return res.status(500).json({ message: error.message });
            });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getCampaignGroupPacing = async (req, res) => {
    const { id: clientId, cid: campaignGroupId } = req.params;

    try {
        const client = await Client.findOne({
            where: { id: clientId },
        });

        if (!client) {
            return res.status(404).json({
                message: `Client not found`,
            });
        }

        const campaignGroup = await CampaignGroup.findOne({
            where: { id: campaignGroupId, client_id: clientId },
            include: [
                {
                    model: Pacing,
                    as: 'pacings',
                    limit: 1,
                    order: [['updatedAt', 'DESC']],
                    attributes: ['periods', 'allocations'],
                },
            ],
        });

        if (!campaignGroup) {
            return res.status(404).json({
                message: `Campaign group not found`,
            });
        }

        const pacing = campaignGroup.pacings[0];

        res.status(200).json({
            message: 'Campaign group pacing retrieved successfully',
            data: pacing,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const generatePacingReport = async (req, res) => {
    const { id: clientId, cid: campaignGroupId } = req.params;

    try {
        const client = await Client.findOne({
            where: { id: clientId },
        });

        if (!client) {
            return res.status(404).json({
                message: `Client not found`,
            });
        }

        const campaignGroup = await CampaignGroup.findOne({
            where: { id: campaignGroupId, client_id: clientId },
            include: [
                {
                    model: Pacing,
                    as: 'pacings',
                    limit: 1,
                    order: [['updatedAt', 'DESC']],
                    attributes: ['periods', 'allocations'],
                },
            ],
        });

        if (!campaignGroup) {
            return res.status(404).json({
                message: `Campaign group not found`,
            });
        }

        const campaignGroupBudget = campaignGroup.pacings[0];
        const { periods: timePeriods, allocations: periodAllocations } =
            campaignGroupBudget.dataValues;

        await createPacingsSheet({ timePeriods, periodAllocations })
            .then(file => {
                x = file.write('file.xlsx', res);
                return res;
            })
            .catch(error => {
                return res.status(500).json({ message: error.message });
            });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Marketing campaign list for client
const getMarketingCampaignsByClient = async (req, res) => {
    const { id: clientId } = req.params;
    const { search, filter } = req.query;
    //TODO: add pagination
    try {
        const searchLower = search ? search.toLowerCase() : null;
        const client = await Client.findOne({
            where: { id: clientId },
        });

        if (!client) {
            return res.status(404).json({
                message: `Client not found`,
            });
        } else {
            req.query.clientName = client.name;
        }
        const campaigns = await CampaignGroup.findAll({
            where: {
                client_id: client.id,
                ...(filter
                    ? {
                          status: filter,
                      }
                    : {}),
                ...(searchLower
                    ? {
                          [Op.or]: [
                              {
                                  '$CampaignGroup.name$': sequelize.where(
                                      sequelize.fn(
                                          'LOWER',
                                          sequelize.col('CampaignGroup.name')
                                      ),
                                      'LIKE',
                                      `%${searchLower}%`
                                  ),
                              },
                              {
                                  company_name: sequelize.where(
                                      sequelize.fn(
                                          'LOWER',
                                          sequelize.col(
                                              'CampaignGroup.company_name'
                                          )
                                      ),
                                      'LIKE',
                                      `%${searchLower}%`
                                  ),
                              },
                              {
                                  createdAt: sequelize.where(
                                      sequelize.fn(
                                          'TO_CHAR',
                                          sequelize.col(
                                              'CampaignGroup.createdAt'
                                          ),
                                          'month'
                                      ),
                                      'LIKE',
                                      sequelize.literal(
                                          `LOWER('%${searchLower}%')`
                                      )
                                  ),
                              },
                          ],
                      }
                    : {}),
            },
            order: [['updatedAt', 'DESC']],
            include: [
                {
                    model: Client,
                    as: 'client',
                    attributes: ['id', 'name'],
                },
                {
                    model: Budget,
                    as: 'budgets',
                    limit: 1,
                    order: [['updatedAt', 'DESC']],
                    attributes: ['periods', 'allocations'],
                },
            ],
        });

        const currentDate = new Date();
        for (const campaign of campaigns) {
            // Check if campaign is in flight
            const { inFlight } = checkInFlight({
                currentDate,
                campaign,
            });

            campaign.dataValues.inFlight = inFlight;

            // Check campaign link status
            campaign.dataValues.linked = !checkBigQueryIdExists({
                allocations: campaign.budgets[0].allocations,
            }).hasUnlinkedCampaigns;
        }

        res.status(200).json({
            message: 'Marketing campaigns retrieved successfully',
            data: campaigns,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Marketing campaign details for client
const getMarketingCampaignsById = async (req, res) => {
    const { id: clientId, cid: campaignId } = req.params;
    try {
        const client = await Client.findOne({
            where: { id: clientId },
        });

        if (!client) {
            return res.status(404).json({
                message: `Client not found`,
            });
        } else {
            req.query.clientName = client.name;
        }

        const campaign = await CampaignGroup.findOne({
            where: { id: campaignId, client_id: clientId },
            include: [
                {
                    model: Client,
                    as: 'client',
                    attributes: ['id', 'name'],
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

        if (!campaign) {
            return res.status(404).json({
                message: `Marketing campaign not found`,
            });
        }

        // Check if campaign is in flight
        const currentDate = new Date();
        const { inFlight } = checkInFlight({
            currentDate,
            campaign,
        });
        campaign.dataValues.inFlight = inFlight;

        // Check campaign link status
        campaign.dataValues.linked = !checkBigQueryIdExists({
            allocations: campaign.budgets[0].allocations,
        }).hasUnlinkedCampaigns;

        res.status(200).json({
            message: 'Marketing campaign retrieved successfully',
            data: campaign,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create marketing campaign for client
const createMarketingCampaign = async (req, res) => {
    try {
        const { id: clientId } = req.params;
        const client = await getClient(clientId);
        if (!client) {
            return res
                .status(404)
                .json({ message: `Client with ID ${clientId} not found` });
        }

        const requestValidation = validateCampaignRequest(req);

        if (!requestValidation.isValid) {
            return res
                .status(400)
                .json({ message: requestValidation.errors.join('; ') });
        }

        const user = await getUser(res);

        const campaignData = await prepareCampaignData(req.body, client, user);
        const campaignGroup = await createCampaignGroup(
            campaignData,
            CampaignGroup
        );

        if (!campaignGroup) {
            throw new Error('Campaign was not created');
        }

        const secret = await req.getSecrets();
        const access = {
            CLIENT_ID: secret.CLIENT_ID,
            ACCESS_TOKEN: req.session.amazonAccessToken.token,
        };
        const PROFILE_ID = secret.DSP_PROFILE_ID;
        const ADVERTISER_ID = secret.CHANNELLOCK_ADVERTISER_ID;

        const {
            flight_time_start,
            flight_time_end,
            periods,
            allocations,
            facebookAdAccountId,
        } = req.body;

        const channelsWithApiEnabled = await Channel.findAll({
            where: { isApiEnabled: true },
        });

        const campaignDataByChannel = await groupCampaignAllocationsByType({
            channelsWithApiEnabled,
            allocations,
            flight_time_start,
            flight_time_end,
        });

        const isAmazonAdvertisingSponsoredAdsNotEmpty =
            campaignDataByChannel['Amazon Advertising DSP'] &&
            campaignDataByChannel['Amazon Advertising DSP'][
                'Responsive eCommerce'
            ] &&
            campaignDataByChannel['Amazon Advertising DSP'][
                'Responsive eCommerce'
            ].length > 0;

        const createdAmazonCampaignsResult = {
            success: [],
            fails: [],
        };
        const createdAmazonAdsetsResult = {
            success: [],
            fails: [],
        };

        const isAccessInvalid = !access?.CLIENT_ID || !access?.ACCESS_TOKEN;

        const createdfacebookCampaignsResult = {
            success: [],
            fails: [],
        };
        const createdFacebookAdsetResult = {
            success: [],
            fails: [],
        };

        // this isgoing to be used to notify the user via email,
        // if there is any error in the creation of the campaigns or adsets
        const campaignCreationFails = [];

        if (campaignGroup) {
            let amazonCampaigns = [];
            let facebookCampaigns = [];

            if (isAmazonAdvertisingSponsoredAdsNotEmpty) {
                if (isAccessInvalid) {
                    createdAmazonCampaignsResult.fails.push({
                        error: 'invalid Amazon DSP Advertising Credentials',
                    });
                } else if (!ADVERTISER_ID) {
                    createdAmazonCampaignsResult.fails.push({
                        error: 'Amazon DSP Advertising ID is required',
                    });
                } else {
                    for (const campaign of campaignDataByChannel[
                        'Amazon Advertising DSP'
                    ]['Responsive eCommerce']) {
                        let amazonAdset = [];
                        try {
                            const response = await req.amazon.createCampaign({
                                campaign: {
                                    ...campaign,
                                    advertiserId: ADVERTISER_ID,
                                    startDate: flight_time_start,
                                    endDate: flight_time_end,
                                },
                                type: 'Sponsored Ads',
                                access,
                                profileId: PROFILE_ID,
                            });

                            if (
                                Array.isArray(response?.data) &&
                                response.data.length > 0
                            ) {
                                if (
                                    response.data.some(
                                        data => data.errorDetails
                                    ) ||
                                    !response.data[0].orderId
                                ) {
                                    createdAmazonCampaignsResult.fails.push({
                                        name: campaign.id,
                                        ...response.data[0],
                                    });

                                    campaignCreationFails.push({
                                        name: campaign.name,
                                        type: 'Campaign',
                                        channel: 'Amazon Advertising DSP',
                                        adsets: campaign.adsets.map(adset => ({
                                            name: adset.name,
                                            reason: 'Campaign id is needed to create adset',
                                        })),
                                        // check if this is the accurate error message
                                        reason: JSON.stringify(
                                            response.data[0].errorDetails
                                        ),
                                    });
                                } else {
                                    createdAmazonCampaignsResult.success.push({
                                        name: campaign.id,
                                        ...response.data[0],
                                    });

                                    const orderId = response.data[0].orderId;

                                    for (const adset of campaign.adsets) {
                                        try {
                                            const jobId =
                                                await req.amzQueue.addJobToQueue(
                                                    {
                                                        jobData: {
                                                            adset,
                                                            orderId,
                                                            type: 'Sponsored Ads Line Item',
                                                            profileId:
                                                                PROFILE_ID,
                                                            campaignId:
                                                                campaign.id,
                                                        },
                                                        batchId:
                                                            campaignGroup.id,
                                                    }
                                                );

                                            amazonAdset.push({
                                                jobId,
                                                adset: null,
                                            });
                                            createdAmazonAdsetsResult.success.push(
                                                {
                                                    name: adset.id,
                                                    jobId,
                                                    status: 'queue',
                                                }
                                            );
                                        } catch (adsetError) {
                                            campaignCreationFails.push({
                                                name: adset.name,
                                                type: 'Adset',
                                                channel:
                                                    'Amazon Advertising DSP',
                                                reason: adsetError.message,
                                            });
                                        }
                                    }

                                    amazonCampaigns.push({
                                        name: campaign.id,
                                        data: response.data[0],
                                        adsets: amazonAdset,
                                    });
                                }
                            } else {
                                createdAmazonCampaignsResult.fails.push({
                                    name: campaign.id,
                                    errorDetails: {
                                        message: 'Invalid campaign response',
                                    },
                                });

                                campaignCreationFails.push({
                                    name: campaign.name,
                                    type: 'Campaign',
                                    channel: 'Amazon Advertising DSP',
                                    adsets: campaign.adsets.map(adset => ({
                                        name: adset.name,
                                        reason: 'No campaign was created',
                                    })),
                                    reason: 'Invalid campaign response',
                                });
                            }
                        } catch (campaignError) {
                            console.error(
                                'Error creating campaign:',
                                campaignError
                            );
                            createdAmazonCampaignsResult.fails.push({
                                name: campaign.name,
                                errorDetails: {
                                    message: campaignError.message,
                                    errors: [campaignError],
                                },
                            });
                            campaignCreationFails.push({
                                name: campaign.name,
                                type: 'Campaign',
                                channel: 'Amazon Advertising DSP',
                                adsets: campaign.adsets.map(adset => ({
                                    name: adset.name,
                                    reason: 'No campaign was created',
                                })),
                                reason: campaignError.message,
                            });
                        }
                    }
                }
            }
            // const allocationsData = transformBudgetData(req.body);
            // amazon campaign creation
            const campaignAdSetAllocation =
                await generateCampaignsWithTimePeriodsAndAdsets({
                    ...req.body,
                });

            if (campaignDataByChannel['Facebook']) {
                if (!facebookAdAccountId) {
                    return res.status(400).json({
                        message: `Invalid Facebook ADAccountId`,
                    });
                }
                const { campaigns } = campaignAdSetAllocation.find(
                    channel => channel.name === 'Facebook'
                );

                for (const campaign of campaigns) {
                    let facebookAdset = [];
                    try {
                        const {
                            name,
                            campaignObjective,
                            specialAdCategories,
                            timePeriods,
                            buyingType,
                            status,
                            country,
                        } = campaign;

                        const facebookCampaign =
                            await req.facebook.createCampaign(
                                secret.FACEBOOK_ACCESS_TOKEN,
                                facebookAdAccountId,
                                {
                                    name,
                                    objective: campaignObjective,
                                    special_ad_categories: specialAdCategories,
                                    special_ad_category_country: country
                                        ? [country]
                                        : null, // verificar si se manda como array o sin array
                                    status: status || 'PAUSED',
                                    buying_type: buyingType,
                                }
                            );

                        createdfacebookCampaignsResult.success.push(
                            facebookCampaign
                        );

                        if (Array.isArray(timePeriods)) {
                            for (const timePeriod of timePeriods) {
                                for (const adset of timePeriod.adsets) {
                                    try {
                                        const {
                                            name: adsetName,
                                            bid_strategy,
                                            bid_amount,
                                            billing_event,
                                            budget,
                                            daily_budget,
                                            startDate: startTime,
                                            endDate: endTime,
                                            optimization_goal,
                                            status,
                                        } = adset;
                                        const adsetPayload = {
                                            campaign_id: facebookCampaign.id,
                                            name: adsetName,
                                            bid_amount,
                                            billing_event,
                                            lifetime_budget:
                                                convertToCents(budget),
                                            bid_strategy,
                                            daily_budget:
                                                convertToCents(daily_budget),
                                            start_time: startTime,
                                            end_time: endTime,
                                            optimization_goal,
                                            targeting: {
                                                geo_locations: {
                                                    countries: ['US'],
                                                },
                                            },
                                            status: status || 'PAUSED',
                                        };
                                        // Check and remove 'bid_amount' based on the FB API allowed conditions
                                        if (
                                            adsetPayload.bid_amount === ' ' ||
                                            adsetPayload.billing_event ===
                                                'LOWEST_COST_WITHOUT_CAP'
                                        ) {
                                            delete adsetPayload.bid_amount;
                                        }
                                        //An ad set with a daily_budget cannot be updated to have lifetime_budget later, and vice versa.
                                        if (adsetPayload.lifetime_budget) {
                                            delete adsetPayload.daily_budget;
                                        }
                                        const adsetResponse =
                                            await req.facebook.createAdset(
                                                secret.FACEBOOK_ACCESS_TOKEN,
                                                facebookAdAccountId,
                                                adsetPayload
                                            );
                                        facebookAdset.push({
                                            name: adset.id,
                                            data: adsetResponse,
                                        });
                                        createdFacebookAdsetResult.success.push(
                                            adsetResponse
                                        );
                                    } catch (adsetError) {
                                        console.error(
                                            'Error creating adset:',
                                            adsetError
                                        );
                                        const {
                                            name: adsetName,
                                            bid_amount,
                                            billing_event,
                                            budget,
                                            start_time,
                                            end_time,
                                            optimization_goal,
                                        } = adset;
                                        createdFacebookAdsetResult.fails.push({
                                            facebookCampaignId:
                                                facebookCampaign.id,
                                            adsetName: adset.name,
                                            ...adsetError,
                                            payload: {
                                                campaign_id:
                                                    facebookCampaign.id,
                                                name: adsetName,
                                                bid_amount,
                                                billing_event,
                                                lifetime_budget: budget,
                                                start_time,
                                                end_time,
                                                optimization_goal,
                                                targeting: {
                                                    geo_locations: {
                                                        countries: ['US'],
                                                    },
                                                },
                                                status: 'PAUSED',
                                            },
                                        });

                                        campaignCreationFails.push({
                                            name: adset.name,
                                            type: 'Adset',
                                            channel: 'Facebook',
                                            reason: adsetError.message,
                                        });
                                    }
                                }
                            }
                        }
                        facebookCampaigns.push({
                            name: campaign.id,
                            data: facebookCampaign,
                            adsets: facebookAdset,
                        });
                    } catch (campaignError) {
                        console.error(
                            'Error creating campaign:',
                            campaignError
                        );
                        createdfacebookCampaignsResult.fails.push({
                            name: campaign.name,
                            ...campaignError,
                        });

                        campaignCreationFails.push({
                            name: campaign.name,
                            type: 'Campaign',
                            channel: 'Facebook',
                            adsets: campaign?.timePeriods[0]?.adsets?.map(
                                adset => ({
                                    name: adset.name,
                                    reason: 'No campaign was created',
                                })
                            ),
                            reason: campaignError.message,
                        });
                    }
                }
            }

            // if either amazon or facebook campaigns were not created
            if (campaignCreationFails.length > 0) {
                const html = emailCampaignFail({
                    user,
                    campaigns: campaignCreationFails,
                });
                await send({
                    to: user.email,
                    subject: 'Campaign Creation Failed',
                    message: 'Campaign Creation Failed',
                    html,
                });
            }

            // insert budget
            const newBudget = await Budget.create({
                campaign_group_id: campaignGroup.id,
                periods,
                allocations,
                amazonCampaigns,
                facebookCampaigns,
            });
            campaignGroup.budgets = newBudget;
        }

        let returnStatus = 201;
        let returnMessage = 'Marketing campaign created successfully';

        if (
            createdfacebookCampaignsResult.fails.length > 0 ||
            createdFacebookAdsetResult.fails.length > 0 ||
            createdAmazonCampaignsResult.fails.length > 0 ||
            createdAmazonAdsetsResult.fails.length > 0
        ) {
            returnStatus = 207;
            returnMessage = 'Marketing campaign created with errors';
        }

        req.amzQueue.startProcessingJobs(async job => {
            const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
            await delay(1000); // Wait for one second
            const {
                data: { campaignId, ...rest },
            } = job;
            const adsetResponse = await req.amazon.createAdset({
                ...rest,
                access,
            });

            console.log(`Processing job data: ${JSON.stringify(job.data)}`);

            // To Do
            // Update campaing with the adset ids
            // handle error creating adset

            return adsetResponse;
        });

        res.status(returnStatus).json({
            message: returnMessage,
            data: {
                ...campaignGroup,
                amazonData: {
                    success: createdAmazonCampaignsResult.success,
                    error: createdAmazonCampaignsResult.fails,
                    adsets: {
                        success: createdAmazonAdsetsResult.success,
                        error: createdAmazonAdsetsResult.fails,
                    },
                },
                facebook: {
                    success: createdfacebookCampaignsResult.success,
                    error: createdfacebookCampaignsResult.fails,
                    adsets: {
                        success: createdFacebookAdsetResult.success,
                        error: createdFacebookAdsetResult.fails,
                    },
                },
            },
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

// Update marketing campaign for client
const updateMarketingCampaign = async (req, res) => {
    const { id: clientId, cid: campaignId } = req.params;
    const {
        name,
        goals,
        total_gross_budget,
        margin,
        flight_time_start,
        flight_time_end,
        net_budget,
        periods,
        channels,
        allocations,
        comments,
        change_reason_log,
        facebookAdAccountId,
    } = req.body;
    try {
        const secret = await req.getSecrets();

        const client = await Client.findOne({
            where: { id: clientId },
        });

        if (!client) {
            return res.status(404).json({
                message: `Client not found`,
            });
        }

        const campaignGroup = await CampaignGroup.findOne({
            where: { id: campaignId, client_id: client.id },
            include: [
                {
                    model: Budget,
                    as: 'budgets',
                    limit: 1,
                    order: [['updatedAt', 'DESC']],
                    attributes: [
                        'id',
                        'periods',
                        'allocations',
                        'amazonCampaigns',
                        'facebookCampaigns',
                    ],
                },
            ],
        });

        if (!campaignGroup) {
            return res.status(404).json({
                message: `Marketing campaign not found`,
            });
        }

        if (periods && !Array.isArray(periods)) {
            return res.status(400).json({
                message: `Invalid periods array`,
            });
        }

        if (channels) {
            if (!Array.isArray(channels)) {
                return res.status(400).json({
                    message: `Invalid channels array`,
                });
            }

            for (const channel of channels) {
                if (typeof channel.name !== 'string') {
                    return res.status(400).json({
                        message: `Invalid channels array, name must be string`,
                    });
                }
            }
        }

        if (allocations && typeof allocations === 'object') {
            if (!periods || !Array.isArray(periods)) {
                return res.status(400).json({
                    message: `Invalid periods array or missing periods array`,
                });
            }

            const periodIds = periods.map(period => period.id);

            const { validation, message } = validateObjectAllocations(
                allocations,
                periodIds
            );
            if (!validation) {
                return res.status(400).json({
                    message,
                });
            }
        }

        if (
            name ||
            goals ||
            total_gross_budget ||
            margin ||
            net_budget ||
            flight_time_start ||
            flight_time_end ||
            comments ||
            channels ||
            change_reason_log
        ) {
            await CampaignGroup.update(
                {
                    client_id: client.id,
                    name,
                    company_name: client.name,
                    goals,
                    total_gross_budget,
                    margin,
                    flight_time_start,
                    flight_time_end,
                    net_budget,
                    channels,
                    comments,
                    change_reason_log,
                },
                {
                    where: { id: campaignId, client_id: client.id },
                }
            );
        }

        const access = {
            CLIENT_ID: secret.CLIENT_ID,
            ACCESS_TOKEN: req.session.amazonAccessToken.token,
        };

        // profile id for amazon DSP
        const profileId = secret.DSP_PROFILE_ID;

        // channellock advertiser id
        const advertiserId = secret.CHANNELLOCK_ADVERTISER_ID;

        const channelsWithApiEnabled = await Channel.findAll({
            where: { isApiEnabled: true },
        });

        const campaignDataByChannel = await groupCampaignAllocationsByType({
            channelsWithApiEnabled,
            allocations,
            flight_time_start,
            flight_time_end,
        });

        const isAmazonAdvertisingSponsoredAdsNotEmpty =
            campaignDataByChannel['Amazon Advertising DSP'] &&
            campaignDataByChannel['Amazon Advertising DSP'][
                'Responsive eCommerce'
            ] &&
            campaignDataByChannel['Amazon Advertising DSP'][
                'Responsive eCommerce'
            ].length > 0;

        const createdAmazonCampaignsResult = {
            success: [],
            fails: [],
        };
        const createdAmazonAdsetsResult = {
            success: [],
            fails: [],
        };

        const isAccessInvalid = !access?.CLIENT_ID || !access?.ACCESS_TOKEN;

        const createdfacebookCampaignsResult = {
            success: [],
            fails: [],
        };
        const createdFacebookAdsetResult = {
            success: [],
            fails: [],
        };

        const { allocations: cgAllocations, periods: cgPeriods } =
            Array.isArray(campaignGroup?.budgets) &&
            campaignGroup.budgets.length > 0
                ? campaignGroup?.budgets[0]
                : {
                      allocations: [],
                      periods: [],
                  };

        if (campaignGroup && allocations) {
            let amazonCampaigns = [];
            let facebookCampaigns = [];
            if (isAmazonAdvertisingSponsoredAdsNotEmpty) {
                if (isAccessInvalid) {
                    createdAmazonCampaignsResult.fails.push({
                        error: 'invalid Amazon DSP Advertising Credentials',
                    });
                } else if (!advertiserId) {
                    createdAmazonCampaignsResult.fails.push({
                        error: 'Amazon DSP Advertising ID is required',
                    });
                } else {
                    for (const campaign of campaignDataByChannel[
                        'Amazon Advertising DSP'
                    ]['Responsive eCommerce']) {
                        let amazonAdset = [];
                        // check for non previously added campaigns
                        const campaingFoundInAllocations =
                            await findIdInAllocations({
                                allocations: cgAllocations,
                                periods: cgPeriods,
                                id: campaign.id,
                            });

                        if (!campaingFoundInAllocations) {
                            try {
                                const response =
                                    await req.amazon.createCampaign({
                                        campaign: {
                                            ...campaign,
                                            advertiserId,
                                            startDate: flight_time_start,
                                            endDate: flight_time_end,
                                        },
                                        type: 'Sponsored Ads',
                                        access,
                                        profileId,
                                    });

                                if (
                                    Array.isArray(response?.data) &&
                                    response.data.length > 0
                                ) {
                                    if (
                                        response.data.some(
                                            data => data.errorDetails
                                        ) ||
                                        !response.data[0].orderId
                                    ) {
                                        createdAmazonCampaignsResult.fails.push(
                                            {
                                                name: campaign.id,
                                                ...response.data[0],
                                            }
                                        );
                                    } else {
                                        createdAmazonCampaignsResult.success.push(
                                            {
                                                name: campaignGroup.id,
                                                ...response.data[0],
                                            }
                                        );

                                        const orderId =
                                            response.data[0].orderId;

                                        for (const adset of campaign.adsets) {
                                            // check for non previously added adsets
                                            const adsetFoundInAllocations =
                                                await findIdInAllocations({
                                                    allocations: cgAllocations,
                                                    periods: cgPeriods,
                                                    id: adset.id,
                                                });

                                            if (!adsetFoundInAllocations) {
                                                const adsetResponse =
                                                    await req.amazon.createAdset(
                                                        {
                                                            adset,
                                                            orderId,
                                                            type: 'Sponsored Ads Line Item',
                                                            access,
                                                            profileId,
                                                        }
                                                    );
                                                if (
                                                    Array.isArray(
                                                        adsetResponse?.data
                                                    ) &&
                                                    adsetResponse.data.length >
                                                        0
                                                ) {
                                                    if (
                                                        adsetResponse.data.some(
                                                            data =>
                                                                data.errorDetails
                                                        ) ||
                                                        !adsetResponse.data[0]
                                                            .lineItemId
                                                    ) {
                                                        createdAmazonAdsetsResult.fails.push(
                                                            {
                                                                name: adset.id,
                                                                ...adsetResponse
                                                                    .data[0],
                                                            }
                                                        );
                                                    } else {
                                                        amazonAdset.push({
                                                            name: adset.id,
                                                            data: adsetResponse
                                                                .data[0]
                                                                .lineItemId,
                                                        });
                                                        createdAmazonAdsetsResult.success.push(
                                                            {
                                                                name: adset.id,
                                                                ...adsetResponse
                                                                    .data[0],
                                                            }
                                                        );
                                                    }
                                                } else {
                                                    createdAmazonAdsetsResult.fails.push(
                                                        {
                                                            name: adset.id,
                                                            errorDetails: {
                                                                message:
                                                                    'Invalid adset response',
                                                            },
                                                        }
                                                    );
                                                }
                                            }
                                        }

                                        amazonCampaigns.push({
                                            name: campaignGroup.id,
                                            data: response.data[0],
                                            adsets: amazonAdset,
                                        });
                                    }
                                } else {
                                    createdAmazonCampaignsResult.fails.push({
                                        name: campaign.id,
                                        errorDetails: {
                                            message:
                                                'Invalid campaign response',
                                        },
                                    });
                                }
                            } catch (campaignError) {
                                console.error(
                                    'Error creating campaign:',
                                    campaignError
                                );
                                createdAmazonCampaignsResult.fails.push({
                                    name: campaign.name,
                                    errorDetails: {
                                        message: campaignError.message,
                                        errors: [campaignError],
                                    },
                                });
                            }
                        }
                    }
                }
            }

            // amazon campaign creation
            const campaignAdSetAllocation =
                await generateCampaignsWithTimePeriodsAndAdsets({
                    ...req.body,
                });

            if (campaignDataByChannel['Facebook']) {
                if (!facebookAdAccountId) {
                    return res.status(400).json({
                        message: `Invalid Facebook ADAccountId`,
                    });
                }
                const { campaigns } = campaignAdSetAllocation.find(
                    channel => channel.name === 'Facebook'
                );

                for (const campaign of campaigns) {
                    let facebookAdset = [];

                    const campaingFoundInAllocations =
                        await findIdInAllocations({
                            allocations: cgAllocations,
                            periods: cgPeriods,
                            id: campaign.id,
                        });

                    if (!campaingFoundInAllocations) {
                        try {
                            const {
                                name,
                                campaignObjective,
                                specialAdCategories,
                                timePeriods,
                                buyingType,
                                status,
                                country,
                            } = campaign;
                            const facebookCampaign =
                                await req.facebook.createCampaign(
                                    secret.FACEBOOK_ACCESS_TOKEN,
                                    facebookAdAccountId,
                                    {
                                        name,
                                        objective: campaignObjective,
                                        special_ad_categories:
                                            specialAdCategories,
                                        special_ad_category_country: country
                                            ? [country]
                                            : null, // verificar si se manda como array o sin array
                                        status: status || 'PAUSED',
                                        buying_type: buyingType,
                                    }
                                );

                            createdfacebookCampaignsResult.success.push(
                                facebookCampaign
                            );

                            if (Array.isArray(timePeriods)) {
                                for (const timePeriod of timePeriods) {
                                    for (const adset of timePeriod.adsets) {
                                        const adsetFoundInAllocations =
                                            await findIdInAllocations({
                                                allocations: cgAllocations,
                                                periods: cgPeriods,
                                                id: adset.id,
                                            });

                                        if (!adsetFoundInAllocations) {
                                            try {
                                                const {
                                                    name: adsetName,
                                                    bid_strategy,
                                                    bid_amount,
                                                    billing_event,
                                                    budget,
                                                    daily_budget,
                                                    startDate: startTime,
                                                    endDate: endTime,
                                                    optimization_goal,
                                                    status,
                                                } = adset;
                                                const adsetResponse =
                                                    await req.facebook.createAdset(
                                                        secret.FACEBOOK_ACCESS_TOKEN,
                                                        facebookAdAccountId,
                                                        {
                                                            campaign_id:
                                                                facebookCampaign.id,
                                                            name: adsetName,
                                                            bid_amount,
                                                            billing_event,
                                                            lifetime_budget:
                                                                convertToCents(
                                                                    budget
                                                                ),
                                                            bid_strategy,
                                                            daily_budget:
                                                                convertToCents(
                                                                    daily_budget
                                                                ),
                                                            start_time:
                                                                startTime,
                                                            end_time: endTime,
                                                            optimization_goal,
                                                            targeting: {
                                                                geo_locations: {
                                                                    countries: [
                                                                        'US',
                                                                    ],
                                                                },
                                                            },
                                                            status:
                                                                status ||
                                                                'PAUSED',
                                                        }
                                                    );
                                                facebookAdset.push({
                                                    name: adset.id,
                                                    data: adsetResponse,
                                                });
                                                createdFacebookAdsetResult.success.push(
                                                    adsetResponse
                                                );
                                            } catch (adsetError) {
                                                console.error(
                                                    'Error creating adset:',
                                                    adsetError
                                                );
                                                const {
                                                    name: adsetName,
                                                    bid_amount,
                                                    billing_event,
                                                    budget,
                                                    start_time,
                                                    end_time,
                                                    optimization_goal,
                                                } = adset;
                                                createdFacebookAdsetResult.fails.push(
                                                    {
                                                        facebookCampaignId:
                                                            facebookCampaign.id,
                                                        adsetName: adset.name,
                                                        ...adsetError,
                                                        payload: {
                                                            campaign_id:
                                                                facebookCampaign.id,
                                                            name: adsetName,
                                                            bid_amount,
                                                            billing_event,
                                                            lifetime_budget:
                                                                budget,
                                                            start_time,
                                                            end_time,
                                                            optimization_goal,
                                                            targeting: {
                                                                geo_locations: {
                                                                    countries: [
                                                                        'US',
                                                                    ],
                                                                },
                                                            },
                                                            status: 'PAUSED',
                                                        },
                                                    }
                                                );
                                            }
                                        }
                                    }
                                }
                            }
                            facebookCampaigns.push({
                                name: campaign.id,
                                data: facebookCampaign,
                                adsets: facebookAdset,
                            });
                        } catch (campaignError) {
                            console.error(
                                'Error creating campaign:',
                                campaignError
                            );
                            createdfacebookCampaignsResult.fails.push({
                                name: campaign.name,
                                ...campaignError,
                            });
                        }
                    }
                }
            }

            const mergedAmazonCampaigns = await concatMissingCampaigns(
                campaignGroup.budgets[0].amazonCampaigns,
                amazonCampaigns
            );

            const mergedFacebookCampaigns = await concatMissingCampaigns(
                campaignGroup.budgets[0].facebookCampaigns,
                facebookCampaigns
            );

            // insert budget
            await Budget.create({
                campaign_group_id: campaignId,
                periods,
                allocations,
                amazonCampaigns: mergedAmazonCampaigns,
                facebookCampaigns: mergedFacebookCampaigns,
            });
        }

        res.status(200).json({
            message: 'Marketing campaign updated successfully',
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

// Delete marketing campaign for client
const deleteMarketingCampaign = async (req, res) => {
    const { id: clientId, cid: campaignId } = req.params;
    try {
        const client = await Client.findOne({
            where: { id: clientId },
        });

        if (!client) {
            return res.status(404).json({
                message: `Client not found`,
            });
        }

        const campaign = await CampaignGroup.findOne({
            where: { id: campaignId },
        });

        if (!campaign) {
            return res.status(404).json({
                message: `Marketing campaign not found`,
            });
        }

        await CampaignGroup.destroy({
            where: { id: campaignId },
        });

        res.status(200).json({
            message: 'Marketing campaign deleted successfully',
            data: campaign,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getClientBigqueryCampaigns = async (req, res) => {
    const { id: clientId } = req.params;
    const { keywords, channel, campaignName, campaignType } = req.query;
    try {
        const client = await Client.findOne({
            where: { id: clientId },
            include: [
                {
                    model: Agency,
                    as: 'agency',
                },
            ],
        });

        if (!client) {
            return res.status(404).json({
                message: `Client not found`,
            });
        } else {
            req.query.clientId = client.id;
        }

        const requiredFields = [
            'clientId',
            'channel',
            'campaignName',
            'campaignType',
        ];

        const missingFields = requiredFields.filter(field => !req.query[field]);

        if (missingFields.length > 0) {
            return res.status(400).json({
                message: `Missing required fields: ${missingFields.join(', ')}`,
            });
        }

        const splittedKeywords = keywords ? keywords.split(',') : [];
        const hasKeywords = splittedKeywords?.length > 0;

        let params = [];
        let sqlQuery = `SELECT cs.campaign_id, cs.campaign_name, cs.campaign_type
        FROM \`agency_6133.cs_paid_ads__basic_performance\` as cs
        `;

        const agency = client.agency;
        const lowerCampaignName = campaignName
            .replace(/[^a-zA-Z0-9 ]/g, ' ')
            .toLowerCase();

        if (!agency) {
            const datasource = channel;
            const advertiserAliases = client.aliases;
            const advertiserIds = client.advertiser_ids;

            params = [
                datasource,
                advertiserAliases,
                advertiserIds,
                `%${lowerCampaignName}%`,
            ];

            sqlQuery += `WHERE cs.datasource = ? AND cs.advertiser_name IN UNNEST(?) AND cs.advertiser_id IN UNNEST(?) `;
        } else {
            const advertiserIdField = agency.advertiser_id_field;
            const advertiserNameField = agency.advertiser_name_field;
            const agencyTableName = agency.table_name;
            const advertiserAliases = client.aliases;
            const subAdvertiserAliases = client.sub_advertiser_aliases;
            const advertiserIds = client.advertiser_ids;
            const subAdvertiserIds = client.sub_advertiser_ids;
            const agencyDatasources = agency.aliases;
            agencyDatasources.push(channel);

            params = [
                agencyDatasources,
                advertiserIds,
                subAdvertiserIds,
                advertiserAliases,
                subAdvertiserAliases,
                `%${lowerCampaignName}%`,
            ];

            sqlQuery += `LEFT JOIN \`agency_6133.${agencyTableName}\` as atn
            ON cs.campaign_id = atn.campaign_id 
            WHERE cs.datasource IN UNNEST(?) 
            AND (cs.advertiser_id IN UNNEST(?) OR atn.${advertiserIdField} IN UNNEST(?)) 
            AND (cs.advertiser_name IN UNNEST(?) OR atn.${advertiserNameField} IN UNNEST(?))
            `;
        }

        if (hasKeywords) {
            sqlQuery += `AND (LOWER(REGEXP_REPLACE(cs.campaign_name, r'[^a-zA-Z0-9 ]', ' ')) LIKE ? `;
            splittedKeywords.forEach(keyword => {
                const lowerKeyword = keyword
                    .replace(/[^a-zA-Z0-9 ]/g, ' ')
                    .toLowerCase();
                sqlQuery += `OR LOWER(REGEXP_REPLACE(cs.campaign_name, r'[^a-zA-Z0-9 ]', ' ')) LIKE ? `;
                params.push(`%${lowerKeyword}%`);
            });
            sqlQuery += `) `;
        } else {
            sqlQuery += `AND LOWER(REGEXP_REPLACE(cs.campaign_name, r'[^a-zA-Z0-9 ]', ' ')) LIKE ? `;
        }

        // look between range of dates
        // AND DATE(cs.date) BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH) AND CURRENT_DATE()
        sqlQuery += `AND cs.campaign_type LIKE ? GROUP BY 1,2,3`;

        params.push(`%${campaignType}%`);

        const options = {
            query: sqlQuery,
            params,
        };

        const response = await bigqueryClient.query(options);
        const campaigns = response[0];
        res.status(200).json({
            message: 'BigQuery campaigns retrieved successfully',
            data: campaigns,
        });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

const getClientBigqueryAdsets = async (req, res) => {
    const { id: clientId } = req.params;
    const { campaignId } = req.query;
    try {
        const client = await Client.findOne({
            where: { id: clientId },
            include: [
                {
                    model: Agency,
                    as: 'agency',
                },
            ],
        });

        if (!client) {
            return res.status(404).json({
                message: `Client not found`,
            });
        } else {
            req.query.clientId = client.id;
        }

        const requiredFields = ['clientId', 'campaignId'];
        const missingFields = requiredFields.filter(field => !req.query[field]);
        if (missingFields.length > 0) {
            return res.status(400).json({
                message: `Missing required fields: ${missingFields.join(', ')}`,
            });
        }

        let params = [];
        let sqlQuery = `SELECT cs.campaign_id, cs.campaign_name, cs.campaign_type, cs.adset_id, cs.adset_name  
        FROM \`agency_6133.cs_paid_ads__basic_performance\` as cs
        `;

        const agency = client.agency;

        if (!agency) {
            const advertiserAliases = client.aliases;
            const advertiserIds = client.advertiser_ids;

            params = [advertiserAliases, advertiserIds, campaignId];

            sqlQuery += `WHERE cs.advertiser_name IN UNNEST(?) AND cs.advertiser_id IN UNNEST(?) AND cs.campaign_id = ? `;
        } else {
            const advertiserIdField = agency.advertiser_id_field;
            const advertiserNameField = agency.advertiser_name_field;
            const agencyTableName = agency.table_name;
            const advertiserAliases = client.aliases;
            const subAdvertiserAliases = client.sub_advertiser_aliases;
            const advertiserIds = client.advertiser_ids;
            const subAdvertiserIds = client.sub_advertiser_ids;

            params = [
                advertiserIds,
                subAdvertiserIds,
                advertiserAliases,
                subAdvertiserAliases,
                campaignId,
            ];

            sqlQuery += `LEFT JOIN \`agency_6133.${agencyTableName}\` as atn
            ON cs.campaign_id = atn.campaign_id 
            WHERE (cs.advertiser_id IN UNNEST(?) OR atn.${advertiserIdField} IN UNNEST(?)) 
            AND (cs.advertiser_name IN UNNEST(?) OR atn.${advertiserNameField} IN UNNEST(?))
            AND cs.campaign_id = ? 
            `;
        }

        // look between range of dates
        // AND DATE(cs.date) BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH) AND CURRENT_DATE()
        sqlQuery += `GROUP BY 1,2,3,4,5`;

        const options = {
            query: sqlQuery,
            params,
        };

        const response = await bigqueryClient.query(options);
        const adsets = response[0];
        res.status(200).json({
            message: 'BigQuery adsets retrieved successfully',
            data: adsets,
        });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

// Returns only the recent marketing campaigns
const getRecentCampaigns = async (req, res) => {
    const { search } = req.query;
    try {
        const searchLower = search ? search.toLowerCase() : null;
        const campaigns = await CampaignGroup.findAll({
            limit: 10,
            order: [['createdAt', 'DESC']],
            attributes: [
                'id',
                'name',
                'company_name',
                'flight_time_start',
                'flight_time_end',
                'createdAt',
            ],
            where: {
                ...(searchLower
                    ? {
                          [Op.or]: [
                              {
                                  '$CampaignGroup.name$': sequelize.where(
                                      sequelize.fn(
                                          'LOWER',
                                          sequelize.col('CampaignGroup.name')
                                      ),
                                      'LIKE',
                                      `%${searchLower}%`
                                  ),
                              },
                              {
                                  company_name: sequelize.where(
                                      sequelize.fn(
                                          'LOWER',
                                          sequelize.col(
                                              'CampaignGroup.company_name'
                                          )
                                      ),
                                      'LIKE',
                                      `%${searchLower}%`
                                  ),
                              },
                              {
                                  createdAt: sequelize.where(
                                      sequelize.fn(
                                          'TO_CHAR',
                                          sequelize.col(
                                              'CampaignGroup.createdAt'
                                          ),
                                          'month'
                                      ),
                                      'LIKE',
                                      sequelize.literal(
                                          `LOWER('%${searchLower}%')`
                                      )
                                  ),
                              },
                          ],
                      }
                    : {}),
            },
            include: [
                {
                    model: Client,
                    as: 'client',
                    attributes: ['id', 'name'],
                },
                {
                    model: Budget,
                    as: 'budgets',
                    limit: 1,
                    order: [['updatedAt', 'DESC']],
                    attributes: ['periods', 'allocations'],
                },
            ],
        });

        const currentDate = new Date();
        for (const campaign of campaigns) {
            // Check if campaign is in flight
            const { inFlight } = checkInFlight({
                currentDate,
                campaign,
            });
            campaign.dataValues.inFlight = inFlight;

            // Check campaign link status
            campaign.dataValues.linked = !checkBigQueryIdExists({
                allocations: campaign.budgets[0].allocations,
            }).hasUnlinkedCampaigns;

            delete campaign.dataValues.budgets;
        }

        // if request has search param, return latest 10 campaigns without grouping
        if (search) {
            return res.status(200).json({
                message: 'Recent campaigns groups retrieved successfully',
                data: campaigns,
            });
        }

        // send grouped data into the frontend so test doesn't need to be changed every month
        const oneDay = 24 * 60 * 60 * 1000;

        const filteredData = campaigns.filter(item => {
            const itemDate = new Date(item.createdAt);
            const differenceInDays = Math.floor(
                (currentDate.getTime() - itemDate.getTime()) / oneDay
            );
            return differenceInDays <= 30;
        });

        const groupedData = filteredData.reduce(
            (acc, item) => {
                const itemDate = new Date(item.createdAt);
                const differenceInDays = Math.floor(
                    (currentDate.getTime() - itemDate.getTime()) / oneDay
                );
                if (differenceInDays === 0) {
                    acc.today.push(item);
                } else if (differenceInDays === 1) {
                    acc.yesterday.push(item);
                } else if (differenceInDays <= 7) {
                    acc.lastWeek.push(item);
                } else {
                    acc.lastMonth.push(item);
                }
                return acc;
            },
            { today: [], yesterday: [], lastWeek: [], lastMonth: [] }
        );

        const groupedDataArray = [
            { title: 'Today', data: groupedData.today },
            { title: 'Yesterday', data: groupedData.yesterday },
            { title: 'Last Week', data: groupedData.lastWeek },
            { title: 'Last Month', data: groupedData.lastMonth },
        ];

        return res.status(200).json({
            message: 'Recent campaigns groups retrieved successfully',
            data: groupedDataArray,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

getAllCampaignsByName = async (req, res) => {
    const { name } = req.params;

    try {
        if (!name) {
            return res
                .status(400)
                .json({ message: 'Name is required in the request params.' });
        }

        const searchLower = name.toLowerCase();

        const campaigns = await CampaignGroup.findAll({
            attributes: [
                'id',
                'name',
                'company_name',
                'flight_time_start',
                'flight_time_end',
                'createdAt',
            ],
            where: {
                '$CampaignGroup.name$': sequelize.where(
                    sequelize.fn('LOWER', sequelize.col('CampaignGroup.name')),
                    '=',
                    searchLower
                ),
            },
            include: [
                {
                    model: Client,
                    as: 'client',
                    attributes: ['id', 'name'],
                },
                {
                    model: Budget,
                    as: 'budgets',
                    limit: 1,
                    order: [['updatedAt', 'DESC']],
                    attributes: ['periods', 'allocations'],
                },
            ],
        });

        if (campaigns.length > 0) {
            return res.status(200).json({
                message: 'A campaign group with that name already exists',
                data: { unavailable: true },
            });
        } else {
            return res.status(404).json({
                message: 'The name is available',
                data: { unavailable: false },
            });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// temp endpoint to refresh metrics
const refreshMetrics = async (req, res) => {
    try {
        const campaigns = await fetchCampaignsWithBudgets();
        const currentDate = new Date();

        for (const campaign of campaigns) {
            const { periods, allocations } = await computeAndStoreMetrics({
                campaign,
                currentDate,
            });

            await updateOrInsertPacingMetrics({
                campaign,
                periods,
                allocations,
            });
        }

        res.status(200).json({
            message: 'Campaigns metrics refreshed successfully',
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// temp endpoint to trigger notifications for unlinked or off pace campaigns
const checkAndNotifyUnlinkedOrOffPaceCampaigns = async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({
            message: `Missing required fields: userId`,
        });
    }

    try {
        const campaigngroups = await fetchCampaignsWithPacingsByUserId({
            userId,
        });

        const currentDate = new Date();

        const { usersToNotify, usernames } = getUsersToNotifyWithCampaigns({
            campaigngroups,
            currentDate,
        });

        // send email to users
        for (const id in usersToNotify) {
            const user = usernames[id];
            const campaigns = usersToNotify[id];

            const html = emailTemplate({
                user: user.name,
                campaigns,
                baseUrl: process.env.WEB_URL,
            });

            // send notification to user in web
            await Promise.all(
                campaigns.map(campaign =>
                    sendNotification({
                        campaign,
                        subject: 'You have unlinked or off pace campaigns',
                        message: campaign.name + ' is unlinked or off pace',
                        type: 'email',
                    })
                )
            );

            // send email to user
            await send({
                to: user.email,
                subject: 'You have unlinked or off pace campaigns',
                message: 'You have unlinked or off pace campaigns',
                html,
                type: 'email',
            });
        }
        res.status(200).json({
            message: 'Campaigns notifications sent successfully',
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAmazonDSPCampaigns = async (req, res) => {
    try {
        const secret = await req.getSecrets();

        const access = {
            CLIENT_ID: secret.CLIENT_ID,
            ACCESS_TOKEN: req.session.amazonAccessToken.token,
        };

        const advertiserId = secret.CHANNELLOCK_ADVERTISER_ID;

        // profile id for amazon
        const profileId = secret.DSP_PROFILE_ID;

        const response = await req.amazonDSP.list({
            profileId,
            access,
            advertiserId,
        });

        res.status(200).json({
            message: 'Amazon DSP campaigns retrieved successfully',
            data: response.data,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

const createAmazonDSPCampaigns = async (req, res) => {
    const { campaigns } = req.body;
    try {
        const secret = await req.getSecrets();

        const access = {
            CLIENT_ID: secret.CLIENT_ID,
            ACCESS_TOKEN: req.session.amazonAccessToken.token,
        };

        const advertiserId = secret.CHANNELLOCK_ADVERTISER_ID;

        // profile id for amazon
        const profileId = secret.DSP_PROFILE_ID;

        const response = await req.amazonDSP.create({
            campaigns,
            profileId,
            access,
            advertiserId,
        });

        res.status(200).json({
            message: 'Amazon DSP campaigns retrieved successfully',
            data: response.data,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

function validateCampaignRequest(req) {
    const errors = [];
    const requiredFields = [
        'name',
        'goals',
        'total_gross_budget',
        'flight_time_start',
        'flight_time_end',
        'net_budget',
        'periods',
        'channels',
        'allocations',
        // add any other required fields here
    ];

    // Check for missing fields
    requiredFields.forEach(field => {
        if (!req.body[field]) {
            errors.push(`Missing required field: ${field}`);
        }
    });

    // Additional validations

    if (isNaN(req.body.margin)) {
        errors.push('Margin must be a number');
    }

    if (isNaN(req.body.total_gross_budget)) {
        errors.push('Total gross budget must be a number');
    }

    if (isNaN(req.body.net_budget)) {
        errors.push('Net budget must be a number');
    }

    if (
        new Date(req.body.flight_time_start) >
        new Date(req.body.flight_time_end)
    ) {
        errors.push('Flight time start must be before flight time end');
    }

    if (!Array.isArray(req.body.periods)) {
        errors.push('Periods must be an array');
    }

    if (!Array.isArray(req.body.channels)) {
        errors.push('Channels must be an array');
    }

    if (Array.isArray(req.body.channels)) {
        for (const channel of req.body.channels) {
            if (typeof channel.name !== 'string') {
                errors.push(`Invalid channels array, name must be string`);
            }
        }
    }
    if (Array.isArray(req.body.periods)) {
        const periodIds = req.body.periods.map(period => period.id);

        if (req.body.allocations && typeof req.body.allocations === 'object') {
            const { validation, message } = validateObjectAllocations(
                req.body.allocations,
                periodIds
            );
            if (!validation) {
                errors.push(message);
            }
        }
    }

    return {
        isValid: errors.length === 0,
        errors: errors,
    };
}

async function getClient(clientId) {
    if (!clientId) {
        throw new Error('Client ID is required');
    }

    const client = await Client.findOne({ where: { id: clientId } });

    return client;
}

async function prepareCampaignData(reqBody, client, user) {
    const campaignData = {
        userId: user?.id,
        clientId: client.id,
        companyName: client.name,
        name: reqBody.name,
        goals: reqBody.goals,
        totalGrossBudget: parseFloat(reqBody.total_gross_budget),
        margin: parseFloat(reqBody.margin),
        flightTimeStart: new Date(reqBody.flight_time_start),
        flightTimeEnd: new Date(reqBody.flight_time_end),
        netBudget: parseFloat(reqBody.net_budget),
        periods: reqBody.periods, // Assuming this is already in the desired format
        channels: reqBody.channels, // Assuming this is already in the desired format
        allocations: reqBody.allocations, // Assuming this is already in the desired format
        comments: reqBody.comments,
        status: reqBody.status,
        state: reqBody.state,
        facebookAdAccountId: reqBody.facebookAdAccountId,
        // ... any other data transformations needed
    };

    // Here you can add additional logic to transform or compute any other necessary data
    // For example, you might want to calculate some values based on the provided input

    return campaignData;
}

async function createCampaignGroup(campaignData, CampaignGroup) {
    const campaignGroup = (
        await CampaignGroup.create({
            user_id: campaignData.userId,
            client_id: campaignData.clientId,
            name: campaignData.name,
            company_name: campaignData.companyName,
            goals: campaignData.goals,
            total_gross_budget: campaignData.totalGrossBudget,
            margin: campaignData.margin,
            flight_time_start: campaignData.flightTimeStart,
            flight_time_end: campaignData.flightTimeEnd,
            net_budget: campaignData.netBudget,
            channels: campaignData.channels,
            comments: campaignData.comments,
            status: campaignData.status,
        })
    ).get({ plain: true });

    return campaignGroup;
}

module.exports = {
    getMarketingCampaignsByClient,
    getMarketingCampaignsById,
    createMarketingCampaign,
    updateMarketingCampaign,
    deleteMarketingCampaign,
    getClientBigqueryCampaigns,
    getClientBigqueryAdsets,
    getAllCampaignsByName,
    getRecentCampaigns,
    createReport,
    getCampaignGroupPacing,
    generatePacingReport,
    refreshMetrics,
    checkAndNotifyUnlinkedOrOffPaceCampaigns,
    getAmazonDSPCampaigns,
    createAmazonDSPCampaigns,
};
