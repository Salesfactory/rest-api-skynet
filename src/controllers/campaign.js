const { bigqueryClient } = require('../config/bigquery');
const { createSheet } = require('../utils/reports');
const {
    Agency,
    Budget,
    Campaign,
    CampaignGroup,
    Client,
    Pacing,
    User,
} = require('../models');
const { Op } = require('sequelize');
const sequelize = require('sequelize');
const { validateObjectAllocations } = require('../utils');
const { getUser } = require('../utils');

//creacion de reporte excel
const createReport = async (req, res) => {
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

        await createSheet(timePeriod, allocations)
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

// Marketing campaign list for client
const getMarketingCampaignsByClient = async (req, res) => {
    const { id: clientId } = req.params;
    const { channel, campaignName } = req.query;
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

        const searchParams = {
            client_id: client.id,
            ...(channel
                ? {
                      channels: {
                          [Op.like]: `%${channel}%`,
                      },
                  }
                : {}),
            ...(campaignName
                ? {
                      name: {
                          [Op.like]: `%${campaignName}%`,
                      },
                  }
                : {}),
        };

        const campaigns = await CampaignGroup.findAll({
            where: searchParams,
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
            where: { id: campaignId },
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
    } = req.body;
    const user = await getUser(res);

    try {
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
    const { keywords, campaignId, adsetName } = req.query;
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

        const requiredFields = ['clientId', 'campaignId', 'adsetName'];
        const missingFields = requiredFields.filter(field => !req.query[field]);
        if (missingFields.length > 0) {
            return res.status(400).json({
                message: `Missing required fields: ${missingFields.join(', ')}`,
            });
        }

        const splittedKeywords = keywords ? keywords.split(',') : [];
        const hasKeywords = splittedKeywords?.length > 0;

        let params = [];
        let sqlQuery = `SELECT cs.campaign_id, cs.campaign_name, cs.campaign_type, cs.adset_id, cs.adset_name  
        FROM \`agency_6133.cs_paid_ads__basic_performance\` as cs
        `;

        const agency = client.agency;
        const lowerAdsetName = adsetName
            .replace(/[^a-zA-Z0-9 ]/g, ' ')
            .toLowerCase();

        if (!agency) {
            const advertiserAliases = client.aliases;
            const advertiserIds = client.advertiser_ids;

            params = [
                advertiserAliases,
                advertiserIds,
                campaignId,
                `%${lowerAdsetName}%`,
            ];

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
                `%${lowerAdsetName}%`,
            ];

            sqlQuery += `LEFT JOIN \`agency_6133.${agencyTableName}\` as atn
            ON cs.campaign_id = atn.campaign_id 
            WHERE (cs.advertiser_id IN UNNEST(?) OR atn.${advertiserIdField} IN UNNEST(?)) 
            AND (cs.advertiser_name IN UNNEST(?) OR atn.${advertiserNameField} IN UNNEST(?))
            AND cs.campaign_id = ? 
            `;
        }

        if (hasKeywords) {
            sqlQuery += `AND (LOWER(REGEXP_REPLACE(cs.adset_name, r'[^a-zA-Z0-9 ]', ' ')) LIKE ? `;
            splittedKeywords.forEach(keyword => {
                const lowerKeyword = keyword
                    .replace(/[^a-zA-Z0-9 ]/g, ' ')
                    .toLowerCase();
                sqlQuery += `OR LOWER(REGEXP_REPLACE(cs.adset_name, r'[^a-zA-Z0-9 ]', ' ')) LIKE ? `;
                params.push(`%${lowerKeyword}%`);
            });
            sqlQuery += `) `;
        } else {
            sqlQuery += `AND LOWER(REGEXP_REPLACE(cs.adset_name, r'[^a-zA-Z0-9 ]', ' ')) LIKE ? `;
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
            attributes: ['id', 'name', 'company_name', 'createdAt'],
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
            ],
        });

        res.status(200).json({
            message: 'Recent campaigns groups retrieved successfully',
            data: campaigns,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getCampaignsByGroup = async (req, res) => {
    const { id: clientId, cid: marketingCampaignId } = req.params;
    const { channel, campaignType } = req.query;
    try {
        const client = await Client.findOne({
            where: { id: clientId },
        });

        if (!client) {
            return res.status(404).json({
                message: `Client not found`,
            });
        }

        const marketingCampaign = await CampaignGroup.findOne({
            where: {
                id: marketingCampaignId,
            },
        });

        if (!marketingCampaign) {
            return res.status(404).json({
                message: `Marketing campaign not found`,
            });
        }

        const filteredCampaigns = await Campaign.findAll({
            where: {
                campaign_group_id: marketingCampaignId,
                channel: sequelize.where(
                    sequelize.fn('LOWER', sequelize.col('channel')),
                    'LIKE',
                    `%${channel}%`
                ),
                campaign_type: sequelize.where(
                    sequelize.fn('LOWER', sequelize.col('campaign_type')),
                    'LIKE',
                    `%${campaignType}%`
                ),
            },
            include: [
                {
                    model: CampaignGroup,
                    as: 'campaign_group',
                },
            ],
        });

        if (filteredCampaigns.length === 0) {
            return res.status(404).json({
                message: `Campaigns not found`,
            });
        }

        filteredCampaigns.forEach(campaign => {
            campaign.clientId = clientId;
        });

        res.status(200).json({
            message: 'Campaigns retrieved successfully',
            data: filteredCampaigns,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getCampaignsById = async (req, res) => {
    const {
        id: clientId,
        cid: marketingCampaignId,
        caid: campaignId,
    } = req.params;

    try {
        const client = await Client.findOne({
            where: { id: clientId },
        });

        if (!client) {
            return res.status(404).json({
                message: `Client not found`,
            });
        }

        const marketingCampaign = await CampaignGroup.findOne({
            where: {
                id: marketingCampaignId,
            },
        });

        if (!marketingCampaign) {
            return res.status(404).json({
                message: `Marketing campaign not found`,
            });
        }

        let filteredCampaigns = await Campaign.findAll({
            where: {
                campaign_group_id: marketingCampaignId,
            },
            include: [
                {
                    model: CampaignGroup,
                    as: 'campaign_group',
                },
            ],
        });

        if (filteredCampaigns.length === 0) {
            return res.status(404).json({
                message: `Campaign not found`,
            });
        }

        res.status(200).json({
            message: 'Campaign retrieved successfully',
            data: filteredCampaigns,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateCampaignGoals = async (req, res) => {
    const {
        id: clientId,
        cid: marketingCampaignId,
        caid: campaignId,
    } = req.params;
    const { goals } = req.body;

    try {
        if (!goals) {
            return res.status(400).json({
                message: `Missing required fields: goals`,
            });
        }

        const client = await Client.findOne({
            where: { id: clientId },
        });

        if (!client) {
            return res.status(404).json({
                message: `Client not found`,
            });
        }

        const marketingCampaign = await CampaignGroup.findOne({
            where: { id: marketingCampaignId },
        });

        if (!marketingCampaign) {
            return res.status(404).json({
                message: `Marketing campaign not found`,
            });
        }

        const campaign = await Campaign.findOne({
            where: { id: campaignId },
        });

        if (!campaign) {
            return res.status(404).json({
                message: `Campaign not found`,
            });
        }

        const updatedCampaign = await Campaign.update(
            {
                goal: goals,
            },
            {
                where: { id: campaignId },
                returning: true,
                plain: true,
            }
        );

        res.status(200).json({
            message: 'Campaign goals updated successfully',
            data: updatedCampaign[1],
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const pauseCampaign = async (req, res) => {
    const { id: clientId, cid: campaignGroupId, caid: campaignId } = req.params;
    const { pause, reason } = req.body;

    try {
        if (typeof pause !== 'boolean') {
            return res.status(400).json({
                message: `Missing required fields: pause or pause is not a boolean`,
            });
        }

        const campaignGroup = await CampaignGroup.findOne({
            where: { id: campaignGroupId, client_id: clientId },
        });

        if (!campaignGroup) {
            return res.status(404).json({
                message: `Campaign group not found`,
            });
        }

        const campaign = await Campaign.findOne({
            where: { id: campaignId, campaign_group_id: campaignGroupId },
        });

        if (!campaign) {
            return res.status(404).json({
                message: `Campaign not found`,
            });
        }

        const updatedCampaign = await Campaign.update(
            {
                paused: pause,
                pause_reason: reason,
            },
            {
                where: { id: campaignId },
                returning: true,
                plain: true,
            }
        );

        res.status(200).json({
            message: 'Campaign paused status updated successfully',
            data: updatedCampaign[1],
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteCampaign = async (req, res) => {
    const { id: clientId, cid: campaignGroupId, caid: campaignId } = req.params;

    const { reason } = req.body;

    try {
        const campaignGroup = await CampaignGroup.findOne({
            where: { id: campaignGroupId, client_id: clientId },
        });

        if (!campaignGroup) {
            return res.status(404).json({
                message: `Campaign group not found`,
            });
        }

        const campaign = await Campaign.findOne({
            where: { id: campaignId, campaign_group_id: campaignGroupId },
        });

        if (!campaign) {
            return res.status(404).json({
                message: `Campaign not found`,
            });
        }

        const updatedCampaign = await Campaign.update(
            {
                deleted: true,
                deleted_at: new Date()
                    .toISOString()
                    .slice(0, 19)
                    .replace('T', ' '),
                delete_reason: reason,
            },
            {
                where: { id: campaignId },
                returning: true,
                plain: true,
            }
        );

        res.status(200).json({
            message: 'Campaign deleted successfully',
            data: updatedCampaign[1],
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
    getCampaignsByGroup,
    getCampaignsById,
    updateCampaignGoals,
    pauseCampaign,
    deleteCampaign,
    createReport,
    getCampaignGroupPacing,
};
