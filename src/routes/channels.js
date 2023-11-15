const express = require('express');
const router = express.Router();
const { channelController } = require('../controllers');
const { hasOneOfRoles } = require('./middlewares');

// channels routes
router.get(
    '/',
    [hasOneOfRoles(['Super', 'Admin', 'DM'])],
    channelController.getChannels
);
// channel campaign types
router.get(
    '/campaignTypes',
    [hasOneOfRoles(['Super', 'Admin', 'DM'])],
    channelController.getChannelTypes
);

module.exports = router;
