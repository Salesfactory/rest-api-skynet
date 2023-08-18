const { bigqueryClient } = require('../config/bigquery');
const {
    Budget,
    Campaign,
    CampaignGroup,
    Client,
    Agency,
} = require('../models');
const { Op } = require('sequelize');
const sequelize = require('sequelize');
const ExcelJS = require('exceljs');

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
                    attributes: [
                        'months',
                        'percentages',
                        'net_budgets',
                        'channels',
                        'campaign_types',
                        'campaigns',
                        'adsets',
                    ],
                },
                {
                    model: Campaign,
                    as: 'campaigns',
                    attributes: [
                        'id_campaign',
                        'name',
                        'goal',
                        'channel',
                        'campaign_type',
                        'adset',
                        'paused',
                        'deleted',
                    ],
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
                    attributes: [
                        'id',
                        'months',
                        'percentages',
                        'net_budgets',
                        'channels',
                        'campaign_types',
                        'campaigns',
                        'adsets',
                    ],
                },
                {
                    model: Campaign,
                    as: 'campaigns',
                    attributes: [
                        'id_campaign',
                        'name',
                        'goal',
                        'channel',
                        'campaign_type',
                        'adset',
                        'paused',
                        'deleted',
                    ],
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
        } else {
            req.body.client_id = client.id;
        }

        const requiredFields = [
            'client_id',
            'name',
            'company_name',
            'total_gross_budget',
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

        if (isNaN(margin)) {
            return res.status(400).json({
                message: `Margin is required or must be a number`,
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

        const campaignGroup = (
            await CampaignGroup.create({
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
            })
        ).get({ plain: true });

        if (campaignGroup) {
            const newBudget = await Budget.create({
                campaign_group_id: campaignGroup.id,
                months: budget.months,
                percentages: budget.percentages,
                net_budgets: budget.net_budgets,
                channels: budget.channels,
                campaign_types: budget.campaign_types,
                campaigns: budget.campaigns,
                adsets: budget.adsets,
            });
            campaignGroup.budgets = newBudget;
        }

        if (campaigns && Array.isArray(campaigns)) {
            campaigns.forEach(async campaign => {
                const campaignData = {
                    campaign_group_id: campaignGroup.id,
                    name: campaign.name,
                    goal: campaign.goal,
                    channel: campaign.channel,
                    campaign_type: campaign.campaign_type,
                    adset: adsets.filter(
                        adset => adset.campaign_id === campaign.id
                    ),
                    paused: false,
                    deleted: false,
                };
                await Campaign.create({
                    id_campaign: campaign.id,
                    ...campaignData,
                });
            });
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

        const campaign = await CampaignGroup.findOne({
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

        const updatedCampaignGroup = await CampaignGroup.update(
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
            },
            {
                where: { id: campaignId },
                returning: true,
                plain: true,
            }
        );

        if (budget) {
            const newBudget = await Budget.create({
                campaign_group_id: campaignId,
                months: budget.months,
                percentages: budget.percentages,
                net_budgets: budget.net_budgets,
                channels: budget.channels,
                campaign_types: budget.campaign_types,
                campaigns: budget.campaigns,
                adsets: budget.adsets,
            });
            updatedCampaignGroup[1].budgets = newBudget;
        }

        if (campaigns) {
            campaigns.forEach(async campaign => {
                const campaignExists = await Campaign.findOne({
                    where: { id_campaign: campaign.id },
                });

                const campaignData = {
                    campaign_group_id: campaignId,
                    name: campaign.name,
                    goal: campaign.goal,
                    channel: campaign.channel,
                    campaign_type: campaign.campaign_type,
                    adset: adsets.filter(
                        adset => adset.campaign_id === campaign.id
                    ),
                    paused: false,
                    deleted: false,
                };

                if (campaignExists) {
                    Campaign.update(campaignData, {
                        where: { id_campaign: campaign.id },
                    });
                } else {
                    Campaign.create({
                        id_campaign: campaign.id,
                        ...campaignData,
                    });
                }
            });
        }

        res.status(200).json({
            message: 'Marketing campaign updated successfully',
            data: updatedCampaignGroup[1],
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

        sqlQuery += `AND cs.campaign_type LIKE ?
        AND DATE(cs.date) BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH) AND CURRENT_DATE()
        GROUP BY 1,2,3
        `;

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

        sqlQuery += `
        AND DATE(cs.date) BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH) AND CURRENT_DATE()
        GROUP BY 1,2,3,4,5
        `;

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

const getCampaignGroupSpreadsheet = async (req, res) => {
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
                    attributes: [
                        'months',
                        'percentages',
                        'net_budgets',
                        'channels',
                        'campaign_types',
                        'campaigns',
                        'adsets',
                    ],
                },
            ],
        });

        if (!campaignGroup) {
            return res.status(404).json({
                message: `Campaign group not found`,
            });
        }

        const campaignGroupBudget = campaignGroup.budgets[0];
        const xlsxDataset = [];

        if (!campaignGroupBudget) {
            return res.status(404).json({
                message: `This campaigngroup doesn't have a budget linked to it`,
            });
        } else {
            const allMonths = [
                'january',
                'february',
                'march',
                'april',
                'may',
                'june',
                'july',
                'august',
                'september',
                'october',
                'november',
                'december',
            ];

            const randomId =
                Math.random().toString(36).substring(2, 15) +
                Math.random().toString(23).substring(2, 5);
            const fileName = `${randomId}.xlsx`;

            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('Sheet1');

            sheet.addRow(['Monthly Budget Allocation']);
            sheet.addRow([
                'Channel',
                'Campaign Type/Tactic',
                'Campaign Name',
                'Campaign Goal',
                'Adset Name',
                ...allMonths.flatMap(month => {
                    const monthR =
                        month.charAt(0).toUpperCase() + month.slice(1);
                    return [monthR, monthR + ' ADB'];
                }),
                'Total',
            ]);

            const lastDayOfTheMonth = [
                31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31,
            ];

            const channels = campaignGroupBudget.channels.map(
                channel => channel.name
            );

            let totalsByMonth = new Array(25).fill(0);

            channels.forEach(channel => {
                const campaignTypes = campaignGroupBudget.campaign_types
                    .filter(type => type.channel === channel)
                    .map(type => type.name);

                campaignTypes.forEach(campaignType => {
                    const campaigns = campaignGroupBudget.campaigns.filter(
                        campaign =>
                            campaign.channel === channel &&
                            campaign.campaign_type === campaignType
                    );

                    campaigns.forEach(campaign => {
                        const adsets = campaignGroupBudget.adsets.filter(
                            adset =>
                                adset.channel === channel &&
                                adset.campaign_type === campaignType &&
                                adset.campaign === campaign.name
                        );

                        adsets.forEach(adset => {
                            const row = [
                                channel,
                                campaignType,
                                campaign.name,
                                campaign.goal,
                                adset.name,
                            ];

                            let total = 0;
                            allMonths.forEach((month, index) => {
                                const mappedCampaignMonths =
                                    campaignGroupBudget.months.map(month =>
                                        month.toLowerCase()
                                    );
                                if (mappedCampaignMonths.includes(month)) {
                                    const monthIndex =
                                        mappedCampaignMonths.indexOf(month);

                                    const cleanValue = Number(
                                        adset.values[monthIndex].value.replace(
                                            /[^0-9.-]+/g,
                                            ''
                                        )
                                    );

                                    if (isNaN(cleanValue) || cleanValue === 0) {
                                        row.push('');
                                        row.push('');
                                    } else {
                                        const monthValue = cleanValue;
                                        const monthValueADB =
                                            cleanValue /
                                            lastDayOfTheMonth[index];

                                        row.push(monthValue);
                                        row.push(monthValueADB);

                                        total += monthValue + monthValueADB;

                                        totalsByMonth[index * 2] += monthValue;
                                        totalsByMonth[index * 2 + 1] +=
                                            monthValueADB;
                                    }
                                } else {
                                    row.push('');
                                    row.push('');
                                    totalsByMonth[index * 2] += 0;
                                    totalsByMonth[index * 2 + 1] += 0;
                                }
                            });
                            row.push(total);
                            totalsByMonth[totalsByMonth.length - 1] += total;

                            xlsxDataset.push(row);
                        });
                    });
                });
            });

            xlsxDataset.push([
                '',
                '',
                'Total Base Budget',
                '',
                '',
                ...totalsByMonth,
            ]);

            xlsxDataset.forEach(row => {
                sheet.addRow(row);
            });

            res.setHeader(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
            res.setHeader(
                'Content-Disposition',
                'attachment; filename=' + fileName
            );

            workbook.xlsx.write(res).then(function (data) {
                res.end();
            });
        }
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
    getCampaignGroupSpreadsheet,
};
