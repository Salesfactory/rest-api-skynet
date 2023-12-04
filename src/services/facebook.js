const axios = require('axios');

function createCampaign(accessToken, adAccountId, campaignData) {
    return new Promise((resolve, reject) => {
        if (accessToken === undefined) {
            console.error('Error: Access Token can not be undefined!');
            reject({ error: 'Access Token can not be undefined!' });
            return;
        }
        const campaignUrl = `https://graph.facebook.com/v18.0/act_${adAccountId}/campaigns`;

        console.log(`Creating a Facebook campaign at: ${campaignUrl}`);
        console.log('Campaign Data:', JSON.stringify(campaignData, null, 2));

        axios
            .post(campaignUrl, campaignData, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            })
            .then(response => {
                console.log('Campaign created successfully.');
                resolve(response.data);
            })
            .catch(error => {
                console.error(
                    'Error creating campaign:',
                    error.response ? error.response.data : error.message
                );
                reject(error.response.data);
            });
    });
}

function createAdset(accessToken, adAccountId, adsetData) {
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

module.exports = { createCampaign, createAdset };
