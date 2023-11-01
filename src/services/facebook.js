const axios = require('axios');

function createCampaign(accessToken, adAccountId, campaignData) {
    return new Promise((resolve, reject) => {
        axios
            .post(
                `https://graph.facebook.com/vX.X/act_${adAccountId}/campaigns`,
                campaignData,
                {
                    params: {
                        access_token: accessToken,
                    },
                }
            )
            .then(response => {
                resolve(response.data);
            })
            .catch(error => {
                reject(error.response.data);
            });
    });
}

module.exports = { createCampaign };
