const express = require('express');
const router = express.Router();
const { campaignController } = require('../controllers');
const { hasPermissions, hasRole } = require('./middlewares');

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

module.exports = router;
