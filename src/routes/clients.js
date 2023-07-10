const express = require('express');
const router = express.Router();
const { clientController } = require('../controllers');

// client routes
router.get('/', clientController.getClients);

module.exports = router;