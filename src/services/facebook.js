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

function updateCampaigns(accessToken, campaignId, campaignData) {
    return new Promise((resolve, reject) => {
        if (accessToken === undefined) {
            reject({ error: 'Access Token can not be undefined!' });
        } 
        if (campaignId === undefined) {
            reject({ error: 'The campaign ID can not be undefined!' });
        }
        if (campaignData === undefined){
            reject({error: 'The campaign data can not be undefined!'});
        }
            axios
                .post(
                    `https://graph.facebook.com/v18.0/${campaignId}`,
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

module.exports = { createCampaign, createAdsets, updateCampaigns };
