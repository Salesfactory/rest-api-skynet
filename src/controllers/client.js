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

module.exports = {
    getClients,
};
