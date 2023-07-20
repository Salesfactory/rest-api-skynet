const { bigqueryClient } = require('../config/bigquery');
const { Campaign, Client } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('sequelize');

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

        const campaigns = await Campaign.findAll({
            where: searchParams,
            include: [
                {
                    model: Client,
                    as: 'client',
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

        const campaign = await Campaign.findOne({
            where: { id: campaignId },
            include: [
                {
                    model: Client,
                    as: 'client',
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
        company_name,
        goals,
        total_gross_budget,
        margin,
        flight_time_start,
        flight_time_end,
        net_budget,
        channels,
        comments,
        budget,
    } = req.body;
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
        }

        const requiredFields = [
            'client_id',
            'name',
            'company_name',
            'total_gross_budget',
            'margin',
            'flight_time_start',
            'flight_time_end',
            'net_budget',
            'channels',
            'budget',
        ];

        const missingFields = requiredFields.filter(field => !req.body[field]);

        if (missingFields.length > 0) {
            return res.status(400).json({
                message: `Missing required fields: ${missingFields.join(', ')}`,
            });
        }

        if (!budget.months || !Array.isArray(budget.months)) {
            return res.status(400).json({
                message: `Missing required fields: budget.months`,
            });
        }

        if (
            !budget.percentages ||
            !Array.isArray(budget.percentages) ||
            budget.percentages.length !== budget.months.length
        ) {
            return res.status(400).json({
                message: `Missing required fields: budget.percentages or budget.percentages.length !== budget.months.length`,
            });
        }

        if (
            !budget.net_budgets ||
            !Array.isArray(budget.net_budgets) ||
            budget.net_budgets.length !== budget.months.length
        ) {
            return res.status(400).json({
                message: `Missing required fields: budget.net_budgets or budget.net_budgets.length !== budget.months.length`,
            });
        }

        if (!budget.channels || !Array.isArray(budget.channels)) {
            return res.status(400).json({
                message: `Missing required fields: budget.channels`,
            });
        }

        for (const channel of budget.channels) {
            if (!channel.name || typeof channel.name !== 'string') {
                return res.status(400).json({
                    message: `Missing required fields: budget.channels.name`,
                });
            }
            if (
                !channel.values ||
                !Array.isArray(channel.values) ||
                channel.values.length !== budget.months.length
            ) {
                return res.status(400).json({
                    message: `Missing required fields: budget.channels.values or budget.channels.values.length !== budget.months.length`,
                });
            }
        }

        const campaign = await Campaign.create({
            client_id: clientId,
            name,
            company_name,
            goals,
            total_gross_budget,
            margin,
            flight_time_start,
            flight_time_end,
            net_budget,
            channels,
            comments,
            budget,
        });

        res.status(201).json({
            message: 'Marketing campaign created successfully',
            data: campaign,
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
        company_name,
        goals,
        total_gross_budget,
        margin,
        flight_time_start,
        flight_time_end,
        net_budget,
        channels,
        comments,
        budget,
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

        const campaign = await Campaign.findOne({
            where: { id: campaignId },
        });

        if (!campaign) {
            return res.status(404).json({
                message: `Marketing campaign not found`,
            });
        }

        if (budget) {
            if (!budget.months || !Array.isArray(budget.months)) {
                return res.status(400).json({
                    message: `Missing required fields: budget.months`,
                });
            }

            if (
                !budget.percentages ||
                !Array.isArray(budget.percentages) ||
                budget.percentages.length !== budget.months.length
            ) {
                return res.status(400).json({
                    message: `Missing required fields: budget.percentages or budget.percentages.length !== budget.months.length`,
                });
            }

            if (
                !budget.net_budgets ||
                !Array.isArray(budget.net_budgets) ||
                budget.net_budgets.length !== budget.months.length
            ) {
                return res.status(400).json({
                    message: `Missing required fields: budget.net_budgets or budget.net_budgets.length !== budget.months.length`,
                });
            }

            if (!budget.channels || !Array.isArray(budget.channels)) {
                return res.status(400).json({
                    message: `Missing required fields: budget.channels`,
                });
            }

            for (const channel of budget.channels) {
                if (!channel.name || typeof channel.name !== 'string') {
                    return res.status(400).json({
                        message: `Missing required fields: budget.channels.name`,
                    });
                }
                if (
                    !channel.values ||
                    !Array.isArray(channel.values) ||
                    channel.values.length !== budget.months.length
                ) {
                    return res.status(400).json({
                        message: `Missing required fields: budget.channels.values or budget.channels.values.length !== budget.months.length`,
                    });
                }
            }
        }

        const updatedCampaign = await Campaign.update(
            {
                client_id: clientId,
                name,
                company_name,
                goals,
                total_gross_budget,
                margin,
                flight_time_start,
                flight_time_end,
                net_budget,
                channels,
                comments,
                budget,
            },
            {
                where: { id: campaignId },
                returning: true,
                plain: true,
            }
        );
        res.status(200).json({
            message: 'Marketing campaign updated successfully',
            data: updatedCampaign[1],
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

        const campaign = await Campaign.findOne({
            where: { id: campaignId },
        });

        if (!campaign) {
            return res.status(404).json({
                message: `Marketing campaign not found`,
            });
        }

        await Campaign.destroy({
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

const getClientCampaignAdvertisements = async (req, res) => {
    const { id: clientId } = req.params;
    const { channel, adName, campaignName } = req.query;
    try {
        const client = await Client.findOne({
            where: { id: clientId },
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
            'adName',
            'campaignName',
        ];
        const missingFields = requiredFields.filter(field => !req.query[field]);
        if (missingFields.length > 0) {
            return res.status(400).json({
                message: `Missing required fields: ${missingFields.join(', ')}`,
            });
        }

        let sqlQuery = `
        SELECT campaign_id, campaign_name, adset_id, adset_name 
        FROM \`agency_6133.cs_paid_ads__basic_performance\` 
        WHERE datasource = ?
        AND advertiser_name = ? 
        AND ad_name LIKE ?
        AND campaign_name LIKE ?
        AND DATE(date) BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH) AND CURRENT_DATE()
        GROUP BY 1,2,3,4
        `;

        const options = {
            query: sqlQuery,
            params: [channel, client.name, `%${adName}%`, `%${campaignName}%`],
        };

        const response = await bigqueryClient.query(options);
        const advertisements = response[0];
        res.status(200).json({
            message: 'Advertisements retrieved successfully',
            data: advertisements,
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
        const campaigns = await Campaign.findAll({
            limit: 10,
            order: [['createdAt', 'DESC']],
            attributes: ['id', 'name', 'company_name', 'createdAt'],
            where: {
                ...(searchLower
                    ? {
                          [Op.or]: [
                              {
                                  name: sequelize.where(
                                      sequelize.fn(
                                          'LOWER',
                                          sequelize.col('name')
                                      ),
                                      'LIKE',
                                      `%${searchLower}%`
                                  ),
                              },
                              {
                                  company_name: sequelize.where(
                                      sequelize.fn(
                                          'LOWER',
                                          sequelize.col('company_name')
                                      ),
                                      'LIKE',
                                      `%${searchLower}%`
                                  ),
                              },
                              {
                                  createdAt: sequelize.where(
                                      sequelize.literal(
                                          `TO_CHAR("createdAt", 'month')`
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
        });

        res.status(200).json({
            message: 'Recent marketing campaigns retrieved successfully',
            data: campaigns,
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
    getClientCampaignAdvertisements,
    getRecentCampaigns,
};
