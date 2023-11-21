const userController = require('./user');
const channelController = require('./channel');
const clientController = require('./client');
const campaignController = require('./campaign');
const notificationController = require('./notification');
const roleController = require('./role');
const s3controller = require('./s3');

module.exports = {
    userController,
    channelController,
    clientController,
    campaignController,
    notificationController,
    roleController,
    s3controller,
};
