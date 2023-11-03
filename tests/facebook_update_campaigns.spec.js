const axios = require('axios');
const { updateCampaigns } = require('../src/services/facebook'); // Replace with the actual path to your function

// Mock axios.post to simulate API responses
jest.mock('axios');
axios.post.mockResolvedValue({ data: { id: '12345', name: 'Test Campaign updated' } });

describe('updateCampaigns function', () => {
    it('update a campaign successfully', async () => {
        const accessToken = 'YOUR_ACCESS_TOKEN';
        const campaignId = 'YOUR_CAMPAIGN_ID';
        const campaignData = {
            name: 'My Campaign updated',
            objective: 'OUTCOME_SALES',
            status: 'PAUSED',
        };

        const updatedCampaign = await updateCampaigns(
            accessToken,
            campaignId,
            campaignData
        );

        expect(axios.post).toHaveBeenCalledWith(
            `https://graph.facebook.com/v18.0/${campaignId}`,
            campaignData,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        expect(updatedCampaign).toEqual({
            id: '12345',
            name: 'Test Campaign updated',
        });
    });

    it('handles errors when updating a campaign', async () => {
        // Mock a failed API response
        axios.post.mockRejectedValue({
            response: { data: { error: 'Campaign updated failed' } },
        });

        const accessToken = 'YOUR_ACCESS_TOKEN';
        const campaignId = 'YOUR_CAMPAIGN_ID';
        const campaignData = {
            name: 'My Campaign updated',
            objective: 'OUTCOME_SALES',
            status: 'PAUSED',
        };

        try {
            await updateCampaigns(accessToken, campaignId, campaignData);
            // If no error is thrown, the test should fail
            expect(true).toBe(false);
        } catch (error) {
            expect(error).toEqual({ error: 'Campaign updated failed' });
        }
    });

    it('should return an error if the access token is undefined', async () => {
        const accessToken = undefined;
        const campaignId = 'YOUR_CAMPAIGN_ID';
        const campaignData = {
            name: 'My Campaign updated',
            objective: 'OUTCOME_SALES',
            status: 'PAUSED',
        };

        try {
            await updateCampaigns(accessToken, campaignId, campaignData);
            expect(true).toBe(false);
        } catch (error) {
            expect(error).toEqual({
                error: 'Access Token can not be undefined!',
            });
        }
    });

    it('should return an error if campaign id is undefined', async () => {
        const accessToken = 'YOUR_ACCESS_TOKEN';
        const campaignId = undefined;
        const campaignData = {
            name: 'My Campaign updated',
            objective: 'OUTCOME_SALES',
            status: 'PAUSED',
        };

        try {
            await updateCampaigns(accessToken, campaignId, campaignData);
            expect(true).toBe(false);
        } catch (error) {
            expect(error).toEqual({
                error: 'The campaign ID can not be undefined!',
            });
        }
    });

    it('should return an error if the campaign data is undefined', async () => {
        const accessToken = 'YOUR_ACCESS_TOKEN';
        const campaignId = 'YOUR_CAMPAIGN_ID';
        const campaignData = undefined;

        try {
            await updateCampaigns(accessToken, campaignId, campaignData);
            expect(true).toBe(false);
        } catch (error) {
            expect(error).toEqual({
                error: 'The campaign data can not be undefined!',
            });
        }
    });
});
