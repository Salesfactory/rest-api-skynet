const express = require('express');
const router = express.Router();
const { notificationController } = require('../controllers');

router.get('/', notificationController.getNotifications);
router.post('/', notificationController.createNotification);
router.patch('/:id', notificationController.updateNotification);

module.exports = router;
