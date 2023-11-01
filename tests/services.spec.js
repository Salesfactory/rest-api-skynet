const axios = require('axios');
const { createCampaign } = require('../src/services/facebook'); // Replace with the actual path to your function

// Mock axios.post to simulate API responses
jest.mock('axios');
axios.post.mockResolvedValue({ data: { id: '12345', name: 'Test Campaign' } });

describe('createCampaign function', () => {
    it('creates a campaign successfully', async () => {
        const accessToken = 'YOUR_ACCESS_TOKEN';
        const adAccountId = 'YOUR_AD_ACCOUNT_ID';
        const campaignData = {
            name: 'My Campaign',
            objective: 'LINK_CLICKS',
            status: 'PAUSED',
        };

        const createdCampaign = await createCampaign(
            accessToken,
            adAccountId,
            campaignData
        );

        expect(axios.post).toHaveBeenCalledWith(
            `https://graph.facebook.com/vX.X/act_${adAccountId}/campaigns`,
            campaignData,
            {
                params: {
                    access_token: accessToken,
                },
            }
        );

        expect(createdCampaign).toEqual({ id: '12345', name: 'Test Campaign' });
    });

    it('handles errors when creating a campaign', async () => {
        // Mock a failed API response
        axios.post.mockRejectedValue({
            response: { data: { error: 'Campaign creation failed' } },
        });

        const accessToken = 'YOUR_ACCESS_TOKEN';
        const adAccountId = 'YOUR_AD_ACCOUNT_ID';
        const campaignData = {
            name: 'My Campaign',
            objective: 'LINK_CLICKS',
            status: 'PAUSED',
        };

        try {
            await createCampaign(accessToken, adAccountId, campaignData);
            // If no error is thrown, the test should fail
            expect(true).toBe(false);
        } catch (error) {
            expect(error).toEqual({ error: 'Campaign creation failed' });
        }
    });
});
