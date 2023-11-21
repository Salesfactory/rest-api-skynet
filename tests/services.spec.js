const axios = require('axios');
const { createCampaign } = require('../src/services/facebook'); // Replace with the actual path to your function
const { createDSPCampaign } = require('../src/services/amazon');
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
            `https://graph.facebook.com/v18.0/act_${adAccountId}/campaigns`,
            campaignData,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
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
    it('should return an error when accessToken is undefined', async () => {
        const accessToken = undefined;
        const adAccountId = 'YOUR_AD_ACCOUNT_ID';
        const campaignData = {
            name: 'My Campaign',
            objective: 'LINK_CLICKS',
            status: 'PAUSED',
        };

        try {
            await createCampaign(accessToken, adAccountId, campaignData);
            expect(true).toBe(false);
        } catch (error) {
            expect(error).toEqual({
                error: 'Assess Token can not be undefined!',
            });
        }
    });
});
describe('createDSPCampaign function', () => {
    test('creates DSP campaign with valid input', async () => {
        const type = 'Sponsored Ads';
        const access = {
            CLIENT_ID: 'your-client-id',
            ACCESS_TOKEN: 'your-access-token',
        };
        const profileId = 'your-profile-id';

        // Act: Call the getConfig function

        const campaign = {
            advertiserId: '580945557665079951',
            name: 'test campaign',
            startDate: '2023-11-10 20:00:00 UTC',
            endDate: '2023-11-11 20:00:00 UTC',
            budget: 1,
            recurrenceTimePeriod: 'DAILY',
            frequencyCapType: 'CUSTOM',
            frequencyCapMaxImpressions: 10,
            frequencyCapTimeUnitCount: 2,
            frequencyCapTimeUnit: 'HOURS',
            productLocation: 'SOLD_ON_AMAZON',
            goal: 'AWARENESS',
            goalKpi: 'REACH',
        };

        // Mock axios request for testing
        axios.request = jest.fn().mockResolvedValue({
            data: [
                {
                    orderId: '123456789',
                },
            ],
        });

        const result = await createDSPCampaign({
            campaign,
            type,
            access,
            profileId,
        });

        expect(result).toEqual({
            data: [
                {
                    orderId: '123456789',
                },
            ],
        });
    });
});
