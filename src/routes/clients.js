const express = require('express');
const router = express.Router();
const { clientController, campaignController } = require('../controllers');

// client routes
router.get('/', clientController.getClients);
router.get('/:clientId', clientController.getClient);
// non orchestrated campaign advertisements
router.get(
    '/:id/non-orchestrated/campaigns',
    campaignController.getClientBigqueryCampaigns
);
router.get(
    '/:id/non-orchestrated/adsets',
    campaignController.getClientBigqueryAdsets
);
// marketing campaigns routes
router.get(
    '/:id/marketingcampaign',
    campaignController.getMarketingCampaignsByClient
);
router.get(
    '/:id/marketingcampaign/:cid',
    campaignController.getMarketingCampaignsById
);
router.post(
    '/:id/marketingcampaign',
    campaignController.createMarketingCampaign
);
router.put(
    '/:id/marketingcampaign/:cid',
    campaignController.updateMarketingCampaign
);
router.delete(
    '/:id/marketingcampaign/:cid',
    campaignController.deleteMarketingCampaign
);
// get campaigngroup monthly budget spreadsheet
router.get(
    '/:id/marketingcampaign/:cid/generate-spreadsheet',
    campaignController.createReport
);
// get campaigngrop pacing
router.get(
    '/:id/marketingcampaign/:cid/spending',
    campaignController.getCampaignGroupPacing
);

module.exports = router;
