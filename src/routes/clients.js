const express = require('express');
const router = express.Router();
const { clientController, campaignController } = require('../controllers');
const { hasPermissions, validateAmazonToken } = require('./middlewares');

// client routes
router.get(
    '/',
    [hasPermissions(['campaign-group-orchestration'])],
    clientController.getClients
);
router.get(
    '/:clientId',
    [hasPermissions(['campaign-group-orchestration'])],
    clientController.getClient
);
// non orchestrated campaign advertisements
router.get(
    '/:id/non-orchestrated/campaigns',
    [hasPermissions(['campaign-group-orchestration'])],
    campaignController.getClientBigqueryCampaigns
);
router.get(
    '/:id/non-orchestrated/adsets',
    [hasPermissions(['campaign-group-orchestration'])],
    campaignController.getClientBigqueryAdsets
);
// marketing campaigns routes
router.get(
    '/:id/marketingcampaign',
    [hasPermissions(['campaign-group-orchestration'])],
    campaignController.getMarketingCampaignsByClient
);
router.get(
    '/:id/marketingcampaign/:cid',
    [hasPermissions(['campaign-group-orchestration'])],
    campaignController.getMarketingCampaignsById
);
router.post(
    '/:id/marketingcampaign',
    [hasPermissions(['campaign-group-orchestration']), validateAmazonToken],
    campaignController.createMarketingCampaign
);
router.put(
    '/:id/marketingcampaign/:cid',
    [hasPermissions(['campaign-group-orchestration']), validateAmazonToken],
    campaignController.updateMarketingCampaign
);
router.delete(
    '/:id/marketingcampaign/:cid',
    [hasPermissions(['campaign-group-orchestration'])],
    campaignController.deleteMarketingCampaign
);
// get campaigngroup monthly budget spreadsheet
router.get(
    '/:id/marketingcampaign/:cid/generate-spreadsheet',
    [hasPermissions(['campaign-group-orchestration', 'reporting'])],
    campaignController.createReport
);
// get campaigngroup pacing spreadsheet
router.get(
    '/:id/marketingcampaign/:cid/generate-pacings-spreadsheet',
    [
        hasPermissions([
            'campaign-group-orchestration',
            'budget-pacing',
            'reporting',
        ]),
    ],
    campaignController.generatePacingReport
);
// get campaigngrop pacing
router.get(
    '/:id/marketingcampaign/:cid/spending',
    [
        hasPermissions([
            'campaign-group-orchestration',
            'budget-pacing',
            'reporting',
        ]),
    ],
    campaignController.getCampaignGroupPacing
);

module.exports = router;
