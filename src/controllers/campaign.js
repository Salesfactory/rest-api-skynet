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
const { send } = require('../utils/email');
const { createAmazonCampaign } = require('../utils/campaign-controller');
const { groupCampaignAllocationsByType } = require('../utils/allocations');

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
    const { id: clientId } = req.params;
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
        status,
        state,
    } = req.body;

    const user = await getUser(res);

    try {
        const secret = await req.getSecrets();
        console.log(Object.keys(secret));
        const client = await Client.findOne({
            where: { id: clientId },
        });

        if (!client) {
            return res.status(404).json({
                message: `Client not found`,
            });
        } else {
            req.body.client_id = client.id;
            req.body.company_name = client.name;
        }

        const requiredFields = [
            'client_id',
            'company_name',
            'name',
            'goals',
            'total_gross_budget',
            'flight_time_start',
            'flight_time_end',
            'net_budget',
            'periods',
            'channels',
            'allocations',
        ];

        const missingFields = requiredFields.filter(field => !req.body[field]);

        if (missingFields.length > 0) {
            return res.status(400).json({
                message: `Missing required fields: ${missingFields.join(', ')}`,
            });
        }

        if (isNaN(margin)) {
            return res.status(400).json({
                message: `Margin is required or must be a number`,
            });
        }

        if (!Array.isArray(periods)) {
            return res.status(400).json({
                message: `Invalid periods array`,
            });
        }

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

        const periodIds = periods.map(period => period.id);

        if (allocations && typeof allocations === 'object') {
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

        const access = {
            CLIENT_ID: secret.CLIENT_ID,
            ACCESS_TOKEN: req.session.amazonAccessToken.token,
        };

        // HARDCODED PROFILE ID
        const profileId = '1330860679472894';

        const channelsWithApiEnabled = await Channel.findAll({
            where: { apiEnabled: true },
        });

        const campaignDataByChannel = groupCampaignAllocationsByType({
            channelsWithApiEnabled,
            allocations,
            flight_time_start,
            flight_time_end,
        });

        const campaignGroup = (
            await CampaignGroup.create({
                user_id: user?.id,
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
                status,
            })
        ).get({ plain: true });

        if (campaignGroup) {
            // the following logic must be done before inserting budget since we need to get the campaignid
            // returned from amazon and then link it to the campaign group
            const amazonCampaignDataByType =
                campaignDataByChannel['Amazon Advertising'];

            // amazon campaign creation
            if (amazonCampaignDataByType) {
                const { message, success, error } = await createAmazonCampaign({
                    campaigns: amazonCampaignDataByType,
                    state: state || 'PAUSED',
                    profileId,
                    access,
                });

                // handle response from amazon or do nothing
                console.log(message, success, error);
                // we could insert it and link, but we need to find what campaign was created
                // also we need tyo check if the insert campaignId is the same as the one used in bigquery
                // sample of response in success array gotten from amazon [ { campaignId: 459943342579515, code: 'SUCCESS' } ]
                // from success array proceed to link campaigns
            }

            // add logic for other channels here

            // insert budget
            const newBudget = await Budget.create({
                campaign_group_id: campaignGroup.id,
                periods,
                allocations,
            });
            campaignGroup.budgets = newBudget;
        }

        res.status(201).json({
            message: 'Marketing campaign created successfully',
            data: campaignGroup,
        });
    } catch (error) {
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
    } = req.body;
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
            where: { id: campaignId, client_id: client.id },
        });

        if (!campaign) {
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

        if (allocations) {
            await Budget.create({
                campaign_group_id: campaignId,
                periods,
                allocations,
            });
        }

        res.status(200).json({
            message: 'Marketing campaign updated successfully',
        });
    } catch (error) {
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

        res.status(200).json({
            message: 'Recent campaigns groups retrieved successfully',
            data: campaigns,
        });
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

module.exports = {
    getMarketingCampaignsByClient,
    getMarketingCampaignsById,
    createMarketingCampaign,
    updateMarketingCampaign,
    deleteMarketingCampaign,
    getClientBigqueryCampaigns,
    getClientBigqueryAdsets,
    getRecentCampaigns,
    createReport,
    getCampaignGroupPacing,
    generatePacingReport,
    refreshMetrics,
    checkAndNotifyUnlinkedOrOffPaceCampaigns,
};
