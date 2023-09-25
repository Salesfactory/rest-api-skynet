const { bigqueryClient } = require('../config/bigquery');
const { Client } = require('../models');

const getProtectedBigqueryClientsByChannel = async ({ datasources }) => {
    try {
        const sqlQuery = `
            SELECT datasource, advertiser_name, advertiser_id FROM \`agency_6133.cs_paid_ads__basic_performance\` as cs
            WHERE cs.datasource IN UNNEST(?) 
            GROUP BY 1,2,3
        `;

        const options = {
            query: sqlQuery,
            params: [datasources],
        };

        const response = await bigqueryClient.query(options);

        const clients = response[0];
        return clients;
    } catch (error) {
        return [];
    }
};

const getClients = async (req, res) => {
    try {
        const clients = await Client.findAll();
        return res.status(200).json({
            message: 'Clients retrieved successfully',
            data: clients,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
const getClient = async (req, res) => {
    const { clientId } = req.params;
    try {
        const client = await Client.findOne({
            where: { id: clientId },
        });

        if (!client) {
            return res.status(404).json({
                message: `Client not found`,
            });
        }
        return res.status(200).json({
            message: 'Client retrieved successfully',
            data: client,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
module.exports = {
    getClients,
    getClient,
    getProtectedBigqueryClientsByChannel,
};
