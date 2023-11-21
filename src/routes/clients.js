const express = require('express');
const router = express.Router();
const { clientController, campaignController } = require('../controllers');
const { validateAmazonToken, hasOneOfRoles } = require('./middlewares');

// client routes
router.get(
    '/',
    [hasOneOfRoles(['Super', 'Admin', 'DM'])],
    clientController.getClients
);
router.get(
    '/:clientId',
    [hasOneOfRoles(['Super', 'Admin', 'DM'])],
    clientController.getClient
);
// non orchestrated campaign advertisements
router.get(
    '/:id/non-orchestrated/campaigns',
    [hasOneOfRoles(['Super', 'Admin', 'DM'])],
    campaignController.getClientBigqueryCampaigns
);
router.get(
    '/:id/non-orchestrated/adsets',
    [hasOneOfRoles(['Super', 'Admin', 'DM'])],
    campaignController.getClientBigqueryAdsets
);
// marketing campaigns routes
router.get(
    '/:id/marketingcampaign',
    [hasOneOfRoles(['Super', 'Admin', 'DM'])],
    campaignController.getMarketingCampaignsByClient
);
router.get(
    '/:id/marketingcampaign/:cid',
    [hasOneOfRoles(['Super', 'Admin', 'DM'])],
    campaignController.getMarketingCampaignsById
);
router.post(
    '/:id/marketingcampaign',
    [hasOneOfRoles(['Super', 'Admin', 'DM']), validateAmazonToken],
    campaignController.createMarketingCampaign
);
router.put(
    '/:id/marketingcampaign/:cid',
    [hasOneOfRoles(['Super', 'Admin', 'DM']), validateAmazonToken],
    campaignController.updateMarketingCampaign
);
router.delete(
    '/:id/marketingcampaign/:cid',
    [hasOneOfRoles(['Super', 'Admin', 'DM'])],
    campaignController.deleteMarketingCampaign
);
// get campaigngroup monthly budget spreadsheet
router.get(
    '/:id/marketingcampaign/:cid/generate-spreadsheet',
    [hasOneOfRoles(['Super', 'Admin', 'DM', 'Analyst'])],
    campaignController.createReport
);
// get campaigngroup pacing spreadsheet
router.get(
    '/:id/marketingcampaign/:cid/generate-pacings-spreadsheet',
    [hasOneOfRoles(['Super', 'Admin', 'DM', 'Analyst'])],
    campaignController.generatePacingReport
);
// get campaigngrop pacing
router.get(
    '/:id/marketingcampaign/:cid/spending',
    [hasOneOfRoles(['Super', 'Admin', 'DM', 'Analyst'])],
    campaignController.getCampaignGroupPacing
);

module.exports = router;
