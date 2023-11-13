const axios = require('axios');
const { createAdset } = require('../src/services/facebook'); // Replace with the actual path to your function

// Mock axios.post to simulate API responses
jest.mock('axios');
axios.post.mockResolvedValue({ data: { id: '12345', name: 'Test Adset' } });

describe('createAdset function', () => {
    it('creates an adset successfully', async () => {
        const accessToken = 'YOUR_ACCESS_TOKEN';
        const adAccountId = 'YOUR_AD_ACCOUNT_ID';
        const adsetData = {
            name: 'Example adset',
            campaign_id: '123456',
            bid_amount: 200,
            billing_event: 'IMPRESSIONS',
            lifetime_budget: '2000000',
            start_time: '2023-12-26T04:45:17+0000',
            end_time: '2024-03-26T04:45:17+0000',
            optimization_goal: 'REACH',
            targeting: { geo_locations: { countries: ['US'] } },
            status: 'PAUSED',
        };

        const createdAdset = await createAdset(
            accessToken,
            adAccountId,
            adsetData
        );

        expect(axios.post).toHaveBeenCalledWith(
            `https://graph.facebook.com/v18.0/act_${adAccountId}/adsets`,
            adsetData,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        expect(createdAdset).toEqual({ id: '12345', name: 'Test Adset' });
    });

    it('handles errors when creating a campaign', async () => {
        // Mock a failed API response
        axios.post.mockRejectedValue({
            response: { data: { error: 'Adset creation failed' } },
        });

        const accessToken = 'YOUR_ACCESS_TOKEN';
        const adAccountId = 'YOUR_AD_ACCOUNT_ID';
        const adsetData = {
            name: 'Example adset',
            campaign_id: '123456',
            bid_amount: 200,
            billing_event: 'IMPRESSIONS',
            lifetime_budget: '2000000',
            start_time: '2023-12-26T04:45:17+0000',
            end_time: '2024-03-26T04:45:17+0000',
            optimization_goal: 'REACH',
            targeting: { geo_locations: { countries: ['US'] } },
            status: 'PAUSED',
        };

        try {
            await createAdset(accessToken, adAccountId, adsetData);
            // If no error is thrown, the test should fail
            expect(true).toBe(false);
        } catch (error) {
            expect(error).toEqual({ error: 'Adset creation failed' });
        }
    });

    it('should return an error when accessToken is undefined', async () => {
        const accessToken = undefined;
        const adAccountId = 'YOUR_AD_ACCOUNT_ID';
        const campaignData = {
            name: 'My Campaign',
            objective: 'LINK_CLICKS',
            status: 'PAUSED',
        };

        try {
            await createAdset(accessToken, adAccountId, campaignData);
            expect(true).toBe(false);
        } catch (error) {
            expect(error).toEqual({
                error: 'Assess Token can not be undefined!',
            });
        }
    });
    it('should return an error when accessToken is undefined', async () => {
        const accessToken = 'ACCESS_TOKEN';
        const adAccountId = undefined;
        const campaignData = {
            name: 'My Campaign',
            objective: 'LINK_CLICKS',
            status: 'PAUSED',
        };

        try {
            await createAdset(accessToken, adAccountId, campaignData);
            expect(true).toBe(false);
        } catch (error) {
            expect(error).toEqual({
                error: 'Account ID can not be undefined!',
            });
        }
    });
    it('should return an error when accessToken is undefined', async () => {
        const accessToken = 'ACCESS_TOKEN';
        const adAccountId = 'YOUR_AD_ACCOUNT_ID';
        const campaignData = undefined;

        try {
            await createAdset(accessToken, adAccountId, campaignData);
            expect(true).toBe(false);
        } catch (error) {
            expect(error).toEqual({
                error: 'the Adset Data can not be undefined!',
            });
        }
    });
});
