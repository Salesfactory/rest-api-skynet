const express = require('express');
const router = express.Router();
const { channelController } = require('../controllers');
const { hasPermissions } = require('./middlewares');

// channels routes
router.get(
    '/',
    [hasPermissions(['campaign-group-orchestration'])],
    channelController.getChannels
);
// channel campaign types
router.get(
    '/campaignTypes',
    [hasPermissions(['campaign-group-orchestration'])],
    channelController.getChannelTypes
);

module.exports = router;
