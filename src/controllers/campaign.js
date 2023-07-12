const { Campaign, Client } = require('../models');
const { Op } = require('sequelize');

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
        ];

        const missingFields = requiredFields.filter(field => !req.body[field]);

        if (missingFields.length > 0) {
            return res.status(400).json({
                message: `Missing required fields: ${missingFields.join(', ')}`,
            });
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

module.exports = {
    getMarketingCampaignsByClient,
    getMarketingCampaignsById,
    createMarketingCampaign,
    updateMarketingCampaign,
    deleteMarketingCampaign,
};
