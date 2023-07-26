const express = require('express');
const router = express.Router();
const { clientController, campaignController } = require('../controllers');

// client routes
router.get('/', clientController.getClients);
// non orchestrated campaign advertisements
router.get('/:id/advertisements', campaignController.getClientCampaignAdvertisements);
// marketing campaigns routes
router.get('/:id/marketingcampaign', campaignController.getMarketingCampaignsByClient);
router.get('/:id/marketingcampaign/:cid', campaignController.getMarketingCampaignsById);
router.post('/:id/marketingcampaign', campaignController.createMarketingCampaign);
router.put('/:id/marketingcampaign/:cid', campaignController.updateMarketingCampaign);
router.delete('/:id/marketingcampaign/:cid', campaignController.deleteMarketingCampaign);
// marketing campaigns advertisements routes
router.get('/:id/marketingcampaign/:cid/campaigns', campaignController.getCampaignsByGroup);
router.get('/:id/marketingcampaign/:cid/campaigns/:caid', campaignController.getCampaignsById);
router.put('/:id/marketingcampaign/:cid/campaigns/:caid/goals', campaignController.updateCampaignGoals);

module.exports = router;