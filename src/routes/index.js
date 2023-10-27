const express = require('express');
const router = express.Router();
const userRouter = require('./users');
const channelRouter = require('./channels');
const clientRouter = require('./clients');
const campaigntRouter = require('./campaigns');
const emailRouter = require('./emails');
const notificationRouter = require('./notifications');
const rolesRouter = require('./roles');
const { validateToken } = require('./middlewares');

router.use('/users', validateToken, userRouter);
router.use('/channels', validateToken, channelRouter);
router.use('/clients', validateToken, clientRouter);
router.use('/campaigns', validateToken, campaigntRouter);
router.use('/notifications', validateToken, notificationRouter);
router.use('/roles', validateToken, rolesRouter);

// this is a temp route to test email sending (must be deleted later)
router.use('/emails', validateToken, emailRouter);

module.exports = router;
