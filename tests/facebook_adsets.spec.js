const axios = require('axios');
const { createAdsets } = require('../src/services/facebook'); // Replace with the actual path to your function

// Mock axios.post to simulate API responses
jest.mock('axios');
axios.post.mockResolvedValue({ data: { id: '12345', name: 'Test Adset' } });

describe('createAdsets function', () => {
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
            status: 'PAUSED'
        };

        const createdAdset = await createAdsets(
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
            await createAdsets(accessToken, adAccountId, adsetData);
            // If no error is thrown, the test should fail
            expect(true).toBe(false);
        } catch (error) {
            expect(error).toEqual({ error: 'Adset creation failed' });
        }
    });
});
