const express = require('express');
const router = express.Router();
const { campaignController } = require('../controllers');

// campaigns routes
router.get('/', campaignController.getRecentCampaigns);

module.exports = router;