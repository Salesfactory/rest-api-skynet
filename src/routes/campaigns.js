const express = require('express');
const router = express.Router();
const { campaignController } = require('../controllers');
const {
    hasPermissions,
    hasRole,
    validateAmazonToken,
} = require('./middlewares');

// campaigns routes
router.get(
    '/',
    [hasPermissions(['campaign-group-orchestration'])],
    campaignController.getRecentCampaigns
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
    [hasPermissions(['campaign-group-orchestration']), validateAmazonToken],
    campaignController.getAmazonDSPCampaigns
);
router.post(
    '/amazon-dsp',
    [hasPermissions(['campaign-group-orchestration']), validateAmazonToken],
    campaignController.createAmazonDSPCampaigns
);

module.exports = router;
