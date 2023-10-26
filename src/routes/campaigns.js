const express = require('express');
const router = express.Router();
const { campaignController, amazonController } = require('../controllers');

// campaigns routes
router.get('/', campaignController.getRecentCampaigns);
// this is a temp route to test refresh budget pacing (must be deleted later)
router.get('/refresh-metrics', campaignController.refreshMetrics);
// this is a temp route to test email sending (must be deleted later)
router.get(
    '/check-and-notify-email',
    campaignController.checkAndNotifyUnlinkedOrOffPaceCampaigns
);

// amazon routes
router.get(
    '/amazon',
    [amazonController.validateAmazonToken],
    amazonController.getAmazonCampaignsEndpoint
);
router.post(
    '/amazon',
    [amazonController.validateAmazonToken],
    amazonController.createAmazonCampaignEndpoint
);

module.exports = router;
