const express = require('express');
const router = express.Router();
const { channelController } = require('../controllers');

// channels routes
router.get('/', channelController.getChannels);

module.exports = router;