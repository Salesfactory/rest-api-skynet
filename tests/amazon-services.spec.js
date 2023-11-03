jest.mock('../src/utils/allocations', () => ({
    validateCredentials: jest.fn(),
    validateCampaignsArray: jest.fn(),
    getConfig: jest.fn(),
    createCampaigns: jest.fn(),
}));
const {
    validateCredentials,
    validateCampaignsArray,
    getConfig,
    createCampaigns,
} = require('../src/utils/allocations');
const { createAmazonCampaign } = require('../src/services/amazon');
const mockData = {
    campaigns: {
        'Sponsored Products': [
            {
                name: 'SP Campaign 1',
                startDate: '2023-01-01',
                endDate: '2023-01-10',
                budget: 100,
            },
        ],
        'Sponsored Brands': [
            {
                name: 'SB Campaign 1',
                startDate: '2023-01-15',
                endDate: '2023-01-25',
                budget: 200,
            },
        ],
    },
    state: 'ACTIVE',
    profileId: '12345',
    access: {
        CLIENT_ID: 'your-client-id',
        ACCESS_TOKEN: 'your-access-token',
    },
};
describe('createAmazonCampaign', () => {
    it('should create Amazon campaigns successfully', async () => {
        // Mock utility function behaviors
        validateCredentials.mockImplementation(() => {});
        validateCampaignsArray.mockImplementation(() => {});
        getConfig.mockImplementation(() => ({
            /* mock config object */
        }));
        createCampaigns.mockImplementation(() => ({
            errors: [],
            successes: [{ y: 'success' }],
        }));

        // Call the function
        const result = await createAmazonCampaign(mockData);

        // Assertions
        expect(result.message).toBe('Amazon campaign creation complete');
        expect(result.success).toEqual([{ y: 'success' }, { y: 'success' }]);
        expect(result.error).toEqual([]);
    });

    it('should handle errors during campaign creation', async () => {
        // Mock utility function behaviors
        validateCredentials.mockImplementation(() => {});
        validateCampaignsArray.mockImplementation(() => {});
        getConfig.mockImplementation(() => ({}));
        createCampaigns.mockImplementation(() => ({
            errors: [{ foo: 'bar' }],
            successes: [],
        }));

        // Call the function
        const result = await createAmazonCampaign(mockData);

        // Assertions
        expect(result.message).toBe('Amazon campaign creation complete');
        expect(result.success).toEqual([]);
        expect(result.error).toEqual([{ foo: 'bar' }, { foo: 'bar' }]);
    });

    it('should handle validation errors', async () => {
        // Mock utility function behaviors to throw validation errors
        validateCredentials.mockImplementation(() => {
            throw new Error('Access token or client ID is missing');
        });
        validateCampaignsArray.mockImplementation(() => {
            throw new Error('Campaigns must be an array');
        });

        // Call the function
        const result = await createAmazonCampaign(mockData);

        // Assertions
        expect(result.message).toBe('Amazon campaign creation failed');
        expect(result.success).toEqual([]);
        expect(result.error).toEqual({
            code: 500,
            message: 'Access token or client ID is missing', // Check the actual error message
        });
    });

    // Add more test cases to cover different scenarios and edge cases
});
