const express = require('express');
const router = express.Router();
const { clientController, campaignController } = require('../controllers');

// client routes
router.get('/', clientController.getClients);
// non orchestrated campaign advertisements
router.get('/:id/advertisements', campaignController.getClientCampaignAdvertisements);

module.exports = router;