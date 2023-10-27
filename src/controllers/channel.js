const { bigqueryClient } = require('../config/bigquery');
const { Agency, Channel } = require('../models');

const getProtectedBigqueryChannels = async () => {
    try {
        const response = await bigqueryClient.query(
            'SELECT datasource as channel FROM `agency_6133.cs_paid_ads__basic_performance` where channel != "" GROUP BY datasource LIMIT 1000'
        );
        const channels = response[0];
        return channels;
    } catch (error) {
        return [];
    }
};

const getChannels = async (req, res) => {
    try {
        const channels = await Channel.findAll({
            attributes: ['id', 'name', 'apiEnabled'],
            where: {
                active: true,
            },
        });
        res.status(200).json({
            message: 'Channels retrieved successfully',
            data: channels,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getChannelTypes = async (req, res) => {
    try {
        const { channelName } = req.query;

        if (!channelName) {
            return res.status(400).json({
                message: 'Channel name is required',
            });
        }

        const query = `SELECT campaign_type FROM \`agency_6133.cs_paid_ads__basic_performance\` 
        WHERE channel IN UNNEST(@channelNames) GROUP BY campaign_type LIMIT 1000
        `;
        // const agencies = await Agency.findAll();
        // const aliases = agencies.map(agency => agency.aliases).flat();
        // aliases.push(channelName);

        const params = {
            channelNames: [channelName],
        };

        const [rows] = await bigqueryClient.query({
            query,
            params,
        });

        const channelTypes = rows.filter(row => row.campaign_type != '');

        res.status(200).json({
            message: 'Campaign types retrieved successfully',
            data: channelTypes,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getProtectedBigqueryChannels,
    getChannels,
    getChannelTypes,
};
