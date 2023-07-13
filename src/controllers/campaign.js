const { bigqueryClient } = require('../config/bigquery');
const { Client } = require('../models');

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

module.exports = {
    getClientCampaignAdvertisements,
};
