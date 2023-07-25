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
        campaign_types,
        campaigns,
        adsets,
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

            if (
                !budget.campaign_types ||
                !Array.isArray(budget.campaign_types)
            ) {
                return res.status(400).json({
                    message: `Missing required fields: budget.campaign_types`,
                });
            }

            for (const type of budget.campaign_types) {
                if (!type.name || typeof type.name !== 'string') {
                    return res.status(400).json({
                        message: `Missing required fields: budget.campaign_types.name`,
                    });
                }
                if (!type.channel || typeof type.channel !== 'string') {
                    return res.status(400).json({
                        message: `Missing required fields: budget.campaign_types.channel`,
                    });
                }
                if (
                    !type.values ||
                    !Array.isArray(type.values) ||
                    type.values.length !== budget.months.length
                ) {
                    return res.status(400).json({
                        message: `Missing required fields: budget.campaign_types.values or budget.campaign_types.values.length !== budget.months.length`,
                    });
                }
            }

            if (!budget.campaigns || !Array.isArray(budget.campaigns)) {
                return res.status(400).json({
                    message: `Missing required fields: budget.campaigns`,
                });
            }

            for (const campaign of budget.campaigns) {
                if (!campaign.id) {
                    return res.status(400).json({
                        message: `Missing required fields: budget.campaigns.id`,
                    });
                }
                if (!campaign.name || typeof campaign.name !== 'string') {
                    return res.status(400).json({
                        message: `Missing required fields: budget.campaigns.name`,
                    });
                }
                if (!campaign.channel || typeof campaign.channel !== 'string') {
                    return res.status(400).json({
                        message: `Missing required fields: budget.campaigns.channel`,
                    });
                }
                if (
                    !campaign.campaign_type ||
                    typeof campaign.campaign_type !== 'string'
                ) {
                    return res.status(400).json({
                        message: `Missing required fields: budget.campaigns.campaign_type`,
                    });
                }
                if (budget.campaign_types.length > 0) {
                    const campaignType = budget.campaign_types.find(
                        type => type.name === campaign.campaign_type
                    );
                    if (!campaignType) {
                        return res.status(400).json({
                            message: `Missing required fields: budget.campaigns.campaign_type`,
                        });
                    }
                }
                if (
                    !campaign.values ||
                    !Array.isArray(campaign.values) ||
                    campaign.values.length !== budget.months.length
                ) {
                    return res.status(400).json({
                        message: `Missing required fields: budget.campaigns.values or budget.campaigns.values.length !== budget.months.length`,
                    });
                }
            }

            if (!budget.adsets || !Array.isArray(budget.adsets)) {
                return res.status(400).json({
                    message: `Missing required fields: budget.adsets`,
                });
            }

            for (const adset of budget.adsets) {
                if (!adset.id) {
                    return res.status(400).json({
                        message: `Missing required fields: budget.adsets.id`,
                    });
                }
                if (!adset.name || typeof adset.name !== 'string') {
                    return res.status(400).json({
                        message: `Missing required fields: budget.adsets.name`,
                    });
                }
                if (!adset.channel || typeof adset.channel !== 'string') {
                    return res.status(400).json({
                        message: `Missing required fields: budget.adsets.channel`,
                    });
                }
                if (
                    !adset.campaign_type ||
                    typeof adset.campaign_type !== 'string'
                ) {
                    return res.status(400).json({
                        message: `Missing required fields: budget.adsets.campaign_type`,
                    });
                }
                if (!adset.campaign || typeof adset.campaign !== 'string') {
                    return res.status(400).json({
                        message: `Missing required fields: budget.adsets.campaign`,
                    });
                }
                if (budget.campaigns.length > 0) {
                    const campaign = budget.campaigns.find(
                        campaign => campaign.name === adset.campaign
                    );
                    if (!campaign) {
                        return res.status(400).json({
                            message: `Missing required fields: budget.adsets.campaign`,
                        });
                    }
                }
                if (
                    !adset.values ||
                    !Array.isArray(adset.values) ||
                    adset.values.length !== budget.months.length
                ) {
                    return res.status(400).json({
                        message: `Missing required fields: budget.adsets.values or budget.adsets.values.length !== budget.months.length`,
                    });
                }
            }
        }

        if (campaign_types) {
            if (!Array.isArray(campaign_types)) {
                return res.status(400).json({
                    message: `Missing required fields: campaign_types`,
                });
            }
            for (const type of campaign_types) {
                if (!type.name || typeof type.name !== 'string') {
                    return res.status(400).json({
                        message: `Missing required fields: campaign_types.name`,
                    });
                }
                if (!type.channel || typeof type.channel !== 'string') {
                    return res.status(400).json({
                        message: `Missing required fields: campaign_types.channel`,
                    });
                }
            }
        }

        if (campaigns) {
            if (!Array.isArray(campaigns)) {
                return res.status(400).json({
                    message: `Missing required fields: campaigns`,
                });
            }
            for (const campaign of campaigns) {
                if (!campaign.id) {
                    return res.status(400).json({
                        message: `Missing required fields: campaigns.id`,
                    });
                }
                if (!campaign.name || typeof campaign.name !== 'string') {
                    return res.status(400).json({
                        message: `Missing required fields: campaigns.name`,
                    });
                }
                if (!campaign.channel || typeof campaign.channel !== 'string') {
                    return res.status(400).json({
                        message: `Missing required fields: campaigns.channel`,
                    });
                }
                if (
                    !campaign.campaign_type ||
                    typeof campaign.campaign_type !== 'string'
                ) {
                    return res.status(400).json({
                        message: `Missing required fields: campaigns.campaign_type`,
                    });
                }
                if (budget.campaign_types.length > 0) {
                    const campaignType = budget.campaign_types.find(
                        type => type.name === campaign.campaign_type
                    );
                    if (!campaignType) {
                        return res.status(400).json({
                            message: `Missing required fields: campaigns.campaign_type`,
                        });
                    }
                }
            }
        }

        if (adsets) {
            if (!Array.isArray(adsets)) {
                return res.status(400).json({
                    message: `Missing required fields: adsets`,
                });
            }
            for (const adset of adsets) {
                if (!adset.id) {
                    return res.status(400).json({
                        message: `Missing required fields: adsets.id`,
                    });
                }
                if (!adset.campaign_id) {
                    return res.status(400).json({
                        message: `Missing required fields: adsets.campaign_id`,
                    });
                }
                if (!adset.name || typeof adset.name !== 'string') {
                    return res.status(400).json({
                        message: `Missing required fields: adsets.name`,
                    });
                }
                if (!adset.channel || typeof adset.channel !== 'string') {
                    return res.status(400).json({
                        message: `Missing required fields: adsets.channel`,
                    });
                }
                if (
                    !adset.campaign_type ||
                    typeof adset.campaign_type !== 'string'
                ) {
                    return res.status(400).json({
                        message: `Missing required fields: adsets.campaign_type`,
                    });
                }
                if (!adset.campaign || typeof adset.campaign !== 'string') {
                    return res.status(400).json({
                        message: `Missing required fields: adsets.campaign`,
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
                campaign_types,
                campaigns,
                adsets,
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
