const express = require('express');
const router = express.Router();
const { campaignController } = require('../controllers');
const {
    hasRole,
    hasOneOfRoles,
    validateAmazonToken,
} = require('./middlewares');

// campaigns routes
router.get(
    '/',
    [hasOneOfRoles(['Super', 'Admin', 'DM'])],
    campaignController.getRecentCampaigns
);
// campaign names
router.get(
    '/campaign-group-name/:name',
    [hasOneOfRoles(['Super', 'Admin', 'DM'])],
    campaignController.getAllCampaignsByName
);
// this is a temp route to test refresh budget pacing (must be deleted later)
router.get(
    '/refresh-metrics',
    [hasRole('Super')],
    campaignController.refreshMetrics
);
// this is a temp route to test email sending (must be deleted later)
router.get(
    '/check-and-notify-email',
    [hasRole('Super')],
    campaignController.checkAndNotifyUnlinkedOrOffPaceCampaigns
);

// amazon DSP
router.get(
    '/amazon-dsp',
    [hasOneOfRoles(['Super', 'Admin', 'DM']), validateAmazonToken],
    campaignController.getAmazonDSPCampaigns
);
router.post(
    '/amazon-dsp',
    [hasOneOfRoles(['Super', 'Admin', 'DM']), validateAmazonToken],
    campaignController.createAmazonDSPCampaigns
);

module.exports = router;
