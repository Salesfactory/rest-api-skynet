const express = require('express');
const router = express.Router();
const { campaignController } = require('../controllers');

// campaigns routes
router.get('/', campaignController.getRecentCampaigns);
// this is a temp route to test refresh budget pacing (must be deleted later)
router.get('/refresh-metrics', campaignController.refreshMetrics);

module.exports = router;
