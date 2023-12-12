function processJobs({ createAdset, Budget, CampaignGroup, delay, access }) {
    return function (job) {
        return new Promise(async (resolve, reject) => {
            try {
                await delay();
                const {
                    data: {
                        adset,
                        orderId,
                        type,
                        profileId,
                        campaignId,
                        campaignGroupId,
                        clientId,
                    },
                } = job;

                const adsetData = await createAdset({
                    adset,
                    orderId,
                    type,
                    profileId,
                    access,
                });

                const campaignGroup = await CampaignGroup.findOne({
                    where: { id: campaignGroupId, client_id: clientId },
                    include: [
                        {
                            model: Budget,
                            as: 'budgets',
                            limit: 1,
                            order: [['updatedAt', 'DESC']],
                            attributes: [
                                'id',
                                'periods',
                                'allocations',
                                'amazonCampaigns',
                                'facebookCampaigns',
                            ],
                        },
                    ],
                });

                const {
                    periods,
                    allocations,
                    facebookCampaigns,
                    amazonCampaigns,
                } = campaignGroup.budgets[0];

                const campaign = amazonCampaigns.find(c => c.id === campaignId);

                campaign.adsets.push({ id: adset.id, data: adsetData.data[0] });

                await Budget.create({
                    campaign_group_id: campaignGroupId,
                    periods,
                    allocations,
                    amazonCampaigns: amazonCampaigns,
                    facebookCampaigns,
                });

                resolve(); // Resolve the promise when everything is successful
            } catch (error) {
                reject(error); // Reject the promise if an error occurs
            }
        });
    };
}
module.exports = processJobs;
