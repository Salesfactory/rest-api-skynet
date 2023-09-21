const express = require('express');
const router = express.Router();
const { notificationController } = require('../controllers');

router.get('/', notificationController.getNotifications);
router.post('/', notificationController.createNotification);
router.get('/status/:status', notificationController.getNotificationsByStatus);
router.patch('/:id', notificationController.updateNotification);
router.patch('/:id/read', notificationController.markAsRead);

module.exports = router;
