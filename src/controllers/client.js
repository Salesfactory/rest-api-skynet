const { Client } = require('../models');

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
};
