const axios = require('axios');

function createCampaign(accessToken, adAccountId, campaignData) {
    return new Promise((resolve, reject) => {
        axios
            .post(
                `https://graph.facebook.com/v18.0/act_${adAccountId}/campaigns`,
                campaignData,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
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
