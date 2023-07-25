const { bigqueryClient } = require('../config/bigquery');

const getChannels = async (req, res) => {
    try {
        const response = await bigqueryClient.query(
            'SELECT channel FROM `agency_6133.cs_paid_ads__basic_performance` GROUP BY channel LIMIT 1000'
        );
        const channels = response[0];
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
        const { channelName } = req.params;
        const response = await bigqueryClient.query(
            `SELECT campaign_type FROM \`agency_6133.cs_paid_ads__basic_performance\` WHERE channel = '${channelName}' GROUP BY campaign_type LIMIT 1000`
        );
        const channelTypes = response[0];
        res.status(200).json({
            message: 'Campaign types retrieved successfully',
            data: channelTypes,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getChannels,
    getChannelTypes,
};
