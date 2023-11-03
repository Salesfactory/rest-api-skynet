const axios = require('axios');

function createCampaign(accessToken, adAccountId, campaignData) {
    return new Promise((resolve, reject) => {
        if (accessToken === undefined) {
            reject({ error: 'Assess Token can not be undefined!' });
        }
        axios
            .post(
                `https://graph.facebook.com/v18.0/act_${adAccountId}/campaigns`,
                campaignData,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
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

function createAdsets(accessToken, adAccountId, adsetData) {
    return new Promise((resolve, reject) => {
        if (accessToken === undefined) {
            reject({ error: 'Assess Token can not be undefined!' });
        }
        if (adAccountId === undefined) {
            reject({ error: 'Account ID can not be undefined!' });
        }
        if (adsetData === undefined) {
            reject({ error: 'the Adset Data can not be undefined!' });
        }
        axios
            .post(
                `https://graph.facebook.com/v18.0/act_${adAccountId}/adsets`,
                adsetData,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
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

module.exports = { createCampaign, createAdsets };