const express = require('express');
const router = express.Router();
const { channelController } = require('../controllers');

// channels routes
router.get('/', channelController.getChannels);
// channel campaign types
router.get('/campaignTypes', channelController.getChannelTypes);

module.exports = router;