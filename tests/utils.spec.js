const axios = require('axios');
const utils = require('../src/utils');
const {
    validateCredentials,
    validateCampaignsArray,
    getConfig,
    getAxiosHeaders,
    getSponsoredProductsCreateData,
    getSponsoredBrandsCreateData,
    getSponsoredDisplayCreateData,
    createCampaigns,
    isValidDate,
    formatDateString,
    getSponsoredAdsCreateData,
    createDSPCampaign,
} = require('../src/utils/allocations');
const { groupCampaignAllocationsByType } = require('../src/utils/parsers');
jest.mock('../src/models', () => ({
    User: {
        findOne: jest.fn(),
    },
}));

describe('utils', () => {
    it('Validate (valid) budget allocation', () => {
        const campaignGroup = {
            allocations: {
                february: {
                    budget: 54.12,
                    percentage: 50,
                    allocations: [
                        {
                            id: '1',
                            name: 'Google Ads',
                            budget: 27.06,
                            percentage: 50,
                            type: 'CHANNEL',
                            allocations: [],
                        },
                        {
                            id: '2',
                            name: 'Amazon Advertising',
                            budget: 27.06,
                            percentage: 50,
                            type: 'CHANNEL',
                            allocations: [],
                        },
                    ],
                },
                march: {
                    budget: 54.12,
                    percentage: 50,
                    allocations: [
                        {
                            id: '1',
                            name: 'Google Ads',
                            budget: 27.06,
                            percentage: 50,
                            type: 'CHANNEL',
                            allocations: [],
                        },
                        {
                            id: '2',
                            name: 'Amazon Advertising',
                            budget: 27.06,
                            percentage: 50,
                            type: 'CHANNEL',
                            allocations: [],
                        },
                    ],
                },
            },
            periods: [
                { id: 'february', label: 'february' },
                { id: 'march', label: 'march' },
            ],
        };

        const periodIds = campaignGroup.periods.map(period => period.id);

        const { validation, message } = utils.validateObjectAllocations(
            campaignGroup.allocations,
            periodIds
        );

        expect(validation).toBe(true);
        expect(message).toBe('Valid object');
    });

    it('Validate (invalid) budget allocation', () => {
        const campaignGroup = {
            allocations: {
                february: {
                    budget: 54.12,
                    percentage: 50,
                    allocations: [
                        {
                            id: '1',
                            name: 'Google Ads',
                            budget: 27.06,
                            percentage: 50,
                            allocations: [],
                        },
                        {
                            id: '2',
                            name: 'Amazon Advertising',
                            budget: 27.06,
                            percentage: 50,
                            type: 'CHANNEL',
                            allocations: [],
                        },
                    ],
                },
            },
            periods: [
                { id: 'february', label: 'february' },
                { id: 'march', label: 'march' },
            ],
        };

        const periodIds = campaignGroup.periods.map(period => period.id);

        const { validation, message } = utils.validateObjectAllocations(
            campaignGroup.allocations,
            periodIds
        );

        expect(validation).toBe(false);
        expect(message).toBe(
            'Invalid allocations: Missing or invalid: [type] in allocation'
        );
    });
});
// Import your function

// Import your function here

describe('groupCampaignAllocationsByType', () => {
    it('should return campaign data grouped by type', () => {
        // Sample input data
        const channelsWithApiEnabled = [
            { name: 'Amazon Advertising' },
            { name: 'Google Ads' },
        ];

        // Define mock values for flight_time_start and flight_time_end
        const flight_time_start = '2023-01-01T04:00:00.000Z';
        const flight_time_end = '2023-02-01T04:00:00.000Z';
        const allocations = {
            january_2023: {
                budget: 4000,
                allocations: [
                    {
                        name: 'Amazon Advertising',
                        allocations: [
                            {
                                name: 'Sponsored Display',
                                allocations: [
                                    {
                                        id: '1-SEARCH-dfsdfsd',
                                        name: 'Campaign 1',
                                        budget: '1000',
                                    },
                                    {
                                        id: '1-SEARCH-dfsdfsd1',
                                        name: 'Campaign 2',
                                        budget: '1000',
                                    },
                                ],
                            },
                            {
                                name: 'Sponsored Products',
                                allocations: [
                                    {
                                        id: '1-SEARCH-dfsdfsd212',
                                        name: 'Campaign 3',
                                        budget: '2000',
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        name: 'Google Ads',
                        allocations: [
                            {
                                name: 'Search Ads',
                                allocations: [
                                    {
                                        id: '2-SEARCH-123',
                                        name: 'Campaign 4',
                                        budget: '2000',
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        };

        const expectedOutput = {
            'Amazon Advertising': {
                'Sponsored Display': [
                    {
                        id: '1-SEARCH-dfsdfsd',
                        name: 'Campaign 1',
                        budget: 1000,
                        startDate: '2023-01-01',
                        endDate: '2023-02-01',
                        type: 'Sponsored Display',
                    },
                    {
                        id: '1-SEARCH-dfsdfsd1',
                        name: 'Campaign 2',
                        budget: 1000,
                        startDate: '2023-01-01',
                        endDate: '2023-02-01',
                        type: 'Sponsored Display',
                    },
                ],
                'Sponsored Products': [
                    {
                        id: '1-SEARCH-dfsdfsd212',
                        name: 'Campaign 3',
                        budget: 2000,
                        startDate: '2023-01-01',
                        endDate: '2023-02-01',
                        type: 'Sponsored Products',
                    },
                ],
            },
            'Google Ads': {
                'Search Ads': [
                    {
                        id: '2-SEARCH-123',
                        name: 'Campaign 4',
                        budget: 2000,
                        startDate: '2023-01-01',
                        endDate: '2023-02-01',
                        type: 'Search Ads',
                    },
                ],
            },
        };

        // Call the function with your sample input data
        const result = groupCampaignAllocationsByType({
            channelsWithApiEnabled,
            allocations,
            flight_time_start,
            flight_time_end,
        });

        // Assert that the result matches the expected output
        expect(result).toEqual(expectedOutput);
    });

    // Add more test cases to cover different scenarios

    // Example test case for when allocations is null
    it('should return an empty object when allocations is null', () => {
        // Sample input data
        const channelsWithApiEnabled = [
            { name: 'Amazon Advertising' },
            // Add more channels if needed
        ];

        // Define mock values for flight_time_start and flight_time_end
        const flight_time_start = '2023-01-01T04:00:00.000Z';
        const flight_time_end = '2023-02-01T04:00:00.000Z';
        const result = groupCampaignAllocationsByType({
            channelsWithApiEnabled,
            allocations: null,
            flight_time_start,
            flight_time_end,
        });

        expect(result).toEqual({});
    });
});

// Mock the console.error method to capture error messages

describe('validateCredentials', () => {
    it('should throw an error if CLIENT_ID is missing', () => {
        // Arrange: Prepare a mock access object with a missing CLIENT_ID
        const access = {
            ACCESS_TOKEN: 'your-access-token',
        };
        console.error = jest.fn();

        // Act and Assert: Ensure that the function throws an error with the expected message
        expect(() => validateCredentials(access)).toThrowError(
            'Access token or client ID is missing'
        );

        // Verify that console.error was called with the expected message
        expect(console.error).toHaveBeenCalledWith(
            'Access token or client ID is missing'
        );
    });

    it('should throw an error if ACCESS_TOKEN is missing', () => {
        // Arrange: Prepare a mock access object with a missing ACCESS_TOKEN
        const access = {
            CLIENT_ID: 'your-client-id',
        };
        console.error = jest.fn();

        // Act and Assert: Ensure that the function throws an error with the expected message
        expect(() => validateCredentials(access)).toThrowError(
            'Access token or client ID is missing'
        );

        // Verify that console.error was called with the expected message
        expect(console.error).toHaveBeenCalledWith(
            'Access token or client ID is missing'
        );
    });

    it('should not throw an error if both CLIENT_ID and ACCESS_TOKEN are present', () => {
        // Arrange: Prepare a mock access object with both CLIENT_ID and ACCESS_TOKEN
        const access = {
            CLIENT_ID: 'your-client-id',
            ACCESS_TOKEN: 'your-access-token',
        };
        console.error = jest.fn();

        // Act and Assert: Ensure that the function does not throw an error
        expect(() => validateCredentials(access)).not.toThrowError();

        // Verify that console.error was not called (no error should be logged)
        expect(console.error).not.toHaveBeenCalled();
    });
});

describe('validateCampaignsArray', () => {
    it('should throw an error if campaignsArray is not an array', () => {
        // Arrange: Prepare a mock campaigns array that is not an array
        const campaignsArray = 'not-an-array';
        console.error = jest.fn();
        // Act and Assert: Ensure that the function throws an error with the expected message
        expect(() => validateCampaignsArray(campaignsArray)).toThrowError(
            'Campaigns must be an array'
        );

        // Verify that console.error was called with the expected message
        expect(console.error).toHaveBeenCalledWith(
            'Campaigns must be an array'
        );
    });

    it('should not throw an error if campaignsArray is an array', () => {
        console.error = jest.fn();
        // Arrange: Prepare a mock campaigns array that is an array
        const campaignsArray = [
            {
                name: 'Campaign 1',
                startDate: '2023-01-01',
                endDate: '2023-01-31',
                budget: 1000,
            },
            {
                name: 'Campaign 2',
                startDate: '2023-02-01',
                endDate: '2023-02-28',
                budget: 1500,
            },
        ];

        // Act and Assert: Ensure that the function does not throw an error
        expect(() => validateCampaignsArray(campaignsArray)).not.toThrowError();

        // Verify that console.error was not called (no error should be logged)
        expect(console.error).not.toHaveBeenCalled();
    });
});

describe('getAxiosHeaders', () => {
    it('should return headers for Sponsored Products', () => {
        // Arrange: Prepare mock values for clientId, accessToken, profileId, and type
        const clientId = 'client-id';
        const accessToken = 'access-token';
        const profileId = 'profile-id';
        const type = 'Sponsored Products';

        // Act: Call the getAxiosHeaders function
        const headers = getAxiosHeaders({
            clientId,
            accessToken,
            profileId,
            type,
        });

        // Assert: Check if the returned headers match the expected headers for Sponsored Products
        expect(headers).toEqual({
            'Amazon-Advertising-API-ClientId': 'client-id',
            Authorization: 'Bearer access-token',
            'Amazon-Advertising-API-Scope': 'profile-id',
            Prefer: 'return=representation',
            Accept: 'application/vnd.spCampaign.v3+json',
            'Content-Type': 'application/vnd.spCampaign.v3+json',
        });
    });

    it('should return headers for Sponsored Brands', () => {
        // Arrange: Prepare mock values for clientId, accessToken, profileId, and type
        const clientId = 'client-id';
        const accessToken = 'access-token';
        const profileId = 'profile-id';
        const type = 'Sponsored Brands';

        // Act: Call the getAxiosHeaders function
        const headers = getAxiosHeaders({
            clientId,
            accessToken,
            profileId,
            type,
        });

        // Assert: Check if the returned headers match the expected headers for Sponsored Brands
        expect(headers).toEqual({
            'Amazon-Advertising-API-ClientId': 'client-id',
            Authorization: 'Bearer access-token',
            'Amazon-Advertising-API-Scope': 'profile-id',
            Accept: 'application/vnd.sbcampaignresource.v4+json',
        });
    });

    it('should return headers for Sponsored Display', () => {
        // Arrange: Prepare mock values for clientId, accessToken, profileId, and type
        const clientId = 'client-id';
        const accessToken = 'access-token';
        const profileId = 'profile-id';
        const type = 'Sponsored Display';

        // Act: Call the getAxiosHeaders function
        const headers = getAxiosHeaders({
            clientId,
            accessToken,
            profileId,
            type,
        });

        // Assert: Check if the returned headers match the expected headers for Sponsored Display
        expect(headers).toEqual({
            'Amazon-Advertising-API-ClientId': 'client-id',
            Authorization: 'Bearer access-token',
            'Amazon-Advertising-API-Scope': 'profile-id',
            'Content-Type': 'application/json',
        });
    });

    it('should throw an error for missing parameters', () => {
        // Arrange: Prepare mock values with missing parameters
        const clientId = 'client-id';
        const accessToken = null; // Missing accessToken
        const profileId = 'profile-id';
        const type = 'Sponsored Products';

        // Act and Assert: Check if the function throws an error for missing parameters
        expect(() =>
            getAxiosHeaders({ clientId, accessToken, profileId, type })
        ).toThrowError('Missing required parameters for headers');
    });

    it('should throw an error for unknown type', () => {
        // Arrange: Prepare mock values for clientId, accessToken, profileId, and an unknown type
        const clientId = 'client-id';
        const accessToken = 'access-token';
        const profileId = 'profile-id';
        const type = 'Unknown Type';

        expect(() =>
            getAxiosHeaders({ clientId, accessToken, profileId, type })
        ).toThrowError('Unknown type parameters for headers');
    });
});

describe('getConfig', () => {
    it('should return the correct config object', () => {
        // Arrange: Prepare mock values for type, access, and profileId
        const type = 'Sponsored Products';
        const access = {
            CLIENT_ID: 'your-client-id',
            ACCESS_TOKEN: 'your-access-token',
        };
        const profileId = 'your-profile-id';

        // Act: Call the getConfig function
        const config = getConfig({ type, access, profileId });

        // Assert: Check if the returned config object matches the expected structure
        expect(config).toEqual({
            method: 'post',
            maxBodyLength: Infinity,
            headers: {
                Accept: 'application/vnd.spCampaign.v3+json',
                'Amazon-Advertising-API-ClientId': 'your-client-id',
                'Amazon-Advertising-API-Scope': 'your-profile-id',
                Authorization: 'Bearer your-access-token',
                'Content-Type': 'application/vnd.spCampaign.v3+json',
                Prefer: 'return=representation',
            },
        });
    });
});

describe('getSponsoredProductsCreateData', () => {
    it('should format campaigns with complete data', () => {
        // Input campaigns with complete data
        const campaigns = [
            {
                name: 'Campaign 1',
                startDate: '2023-01-01',
                endDate: '2023-01-31',
                budget: 100,
            },
            {
                name: 'Campaign 2',
                startDate: '2023-02-01',
                endDate: '2023-02-28',
                budget: 200,
                strategy: 'NEW_STRATEGY',
            },
        ];

        const state = 'ACTIVE';

        const expectedData = JSON.stringify({
            campaigns: [
                {
                    endDate: '2023-01-31',
                    name: 'Campaign 1',
                    targetingType: 'MANUAL',
                    state: 'ACTIVE',
                    dynamicBidding: {
                        strategy: 'LEGACY_FOR_SALES',
                    },
                    startDate: '2023-01-01',
                    budget: {
                        budgetType: 'DAILY',
                        budget: 100,
                    },
                },
                {
                    endDate: '2023-02-28',
                    name: 'Campaign 2',
                    targetingType: 'MANUAL',
                    state: 'ACTIVE',
                    dynamicBidding: {
                        strategy: 'NEW_STRATEGY',
                    },
                    startDate: '2023-02-01',
                    budget: {
                        budgetType: 'DAILY',
                        budget: 200,
                    },
                },
            ],
        });

        const result = getSponsoredProductsCreateData({ campaigns, state });
        expect(result).toEqual(expectedData);
    });

    it('should format campaigns with missing strategy', () => {
        // Input campaigns with missing strategy
        const campaigns = [
            {
                name: 'Campaign 1',
                startDate: '2023-01-01',
                endDate: '2023-01-31',
                budget: 100,
            },
        ];

        const state = 'ACTIVE';

        const expectedData = JSON.stringify({
            campaigns: [
                {
                    endDate: '2023-01-31',
                    name: 'Campaign 1',
                    targetingType: 'MANUAL',
                    state: 'ACTIVE',
                    dynamicBidding: {
                        strategy: 'LEGACY_FOR_SALES',
                    },
                    startDate: '2023-01-01',
                    budget: {
                        budgetType: 'DAILY',
                        budget: 100,
                    },
                },
            ],
        });

        const result = getSponsoredProductsCreateData({ campaigns, state });
        expect(result).toEqual(expectedData);
    });

    it('should handle empty campaigns array', () => {
        // Input empty campaigns array
        const campaigns = [];
        const state = 'ACTIVE';

        const expectedData = JSON.stringify({
            campaigns: [],
        });

        const result = getSponsoredProductsCreateData({ campaigns, state });
        expect(result).toEqual(expectedData);
    });
});

describe('getSponsoredBrandsCreateData', () => {
    it('should format a single campaign correctly', () => {
        const input = {
            campaigns: [
                {
                    name: 'Campaign 1',
                    startDate: '2023-01-01',
                    budget: 100,
                },
            ],
            state: 'ACTIVE',
        };

        const expectedOutput = JSON.stringify({
            campaigns: [
                {
                    budgetType: 'DAILY',
                    name: 'Campaign 1',
                    state: 'ACTIVE',
                    productLocation: 'SOLD_ON_AMAZON',
                    startDate: '2023-01-01',
                    budget: 100,
                    bidding: {
                        bidOptimization: 'true',
                    },
                },
            ],
        });

        const result = getSponsoredBrandsCreateData(input);
        expect(result).toEqual(expectedOutput);
    });

    it('should format multiple campaigns correctly', () => {
        const input = {
            campaigns: [
                {
                    name: 'Campaign 1',
                    startDate: '2023-01-01',
                    budget: 100,
                },
                {
                    name: 'Campaign 2',
                    startDate: '2023-01-02',
                    budget: 200,
                },
            ],
            state: 'INACTIVE',
        };

        const expectedOutput = JSON.stringify({
            campaigns: [
                {
                    budgetType: 'DAILY',
                    name: 'Campaign 1',
                    state: 'INACTIVE',
                    productLocation: 'SOLD_ON_AMAZON',
                    startDate: '2023-01-01',
                    budget: 100,
                    bidding: {
                        bidOptimization: 'true',
                    },
                },
                {
                    budgetType: 'DAILY',
                    name: 'Campaign 2',
                    state: 'INACTIVE',
                    productLocation: 'SOLD_ON_AMAZON',
                    startDate: '2023-01-02',
                    budget: 200,
                    bidding: {
                        bidOptimization: 'true',
                    },
                },
            ],
        });

        const result = getSponsoredBrandsCreateData(input);
        expect(result).toEqual(expectedOutput);
    });

    it('should handle an empty campaigns array', () => {
        const input = {
            campaigns: [],
            state: 'ACTIVE',
        };

        const expectedOutput = JSON.stringify({
            campaigns: [],
        });

        const result = getSponsoredBrandsCreateData(input);
        expect(result).toEqual(expectedOutput);
    });

    // Add more test cases as needed to cover edge cases and scenarios.
});

describe('getSponsoredDisplayCreateData', () => {
    it('should format a single campaign correctly with a tactic', () => {
        const input = {
            campaigns: [
                {
                    name: 'Campaign 1',
                    startDate: '2023-01-01',
                    endDate: '2023-01-31',
                    budget: 1000,
                    state: 'Active',
                    tactic: 'T00040',
                },
            ],
            state: 'Active',
        };

        const expectedOutput = JSON.stringify([
            {
                name: 'Campaign 1',
                budgetType: 'daily',
                budget: '1000.00',
                startDate: '20230101',
                endDate: '20230131',
                costType: 'cpc',
                state: 'active',
                tactic: 'T00040',
            },
        ]);

        const result = getSponsoredDisplayCreateData(input);
        expect(result).toEqual(expectedOutput);
    });

    it('should format multiple campaigns correctly with and without tactics', () => {
        const input = {
            campaigns: [
                {
                    name: 'Campaign 1',
                    startDate: '2023-01-01',
                    endDate: '2023-01-31',
                    budget: 1000,
                    state: 'Active',
                },
                {
                    name: 'Campaign 2',
                    startDate: '2023-02-01',
                    endDate: '2023-02-28',
                    budget: 500,
                    state: 'Paused',
                    tactic: 'T00030',
                },
            ],
            state: 'Active',
        };

        const expectedOutput = JSON.stringify([
            {
                name: 'Campaign 1',
                budgetType: 'daily',
                budget: '1000.00',
                startDate: '20230101',
                endDate: '20230131',
                costType: 'cpc',
                state: 'active',
                tactic: 'T00020',
            },
            {
                name: 'Campaign 2',
                budgetType: 'daily',
                budget: '500.00',
                startDate: '20230201',
                endDate: '20230228',
                costType: 'cpc',
                state: 'active',
                tactic: 'T00030',
            },
        ]);

        const result = getSponsoredDisplayCreateData(input);
        expect(result).toEqual(expectedOutput);
    });

    it('should handle missing tactics', () => {
        const input = {
            campaigns: [
                {
                    name: 'Campaign 1',
                    startDate: '2023-01-01',
                    endDate: '2023-01-31',
                    budget: 1000,
                    state: 'Active',
                },
                {
                    name: 'Campaign 2',
                    startDate: '2023-02-01',
                    endDate: '2023-02-28',
                    budget: 500,
                    state: 'Paused',
                },
            ],
            state: 'Active',
        };

        const expectedOutput = JSON.stringify([
            {
                name: 'Campaign 1',
                budgetType: 'daily',
                budget: '1000.00',
                startDate: '20230101',
                endDate: '20230131',
                costType: 'cpc',
                state: 'active',
                tactic: 'T00020',
            },
            {
                name: 'Campaign 2',
                budgetType: 'daily',
                budget: '500.00',
                startDate: '20230201',
                endDate: '20230228',
                costType: 'cpc',
                state: 'active',
                tactic: 'T00020', // Default tactic
            },
        ]);

        const result = getSponsoredDisplayCreateData(input);
        expect(result).toEqual(expectedOutput);
    });

    it('should handle an empty campaigns array', () => {
        const input = {
            campaigns: [],
            state: 'Active',
        };

        const expectedOutput = JSON.stringify([]);

        const result = getSponsoredDisplayCreateData(input);
        expect(result).toEqual(expectedOutput);
    });

    // Add more test cases as needed to cover edge cases and scenarios.
});

describe('createCampaigns', () => {
    it('should resolve with errors and successes for Sponsored Products', async () => {
        // Mock axios request for testing
        axios.request = jest.fn().mockResolvedValue({
            data: {
                campaigns: {
                    error: [{ code: 'ERROR1' }],
                    success: [{ code: 'SUCCESS1' }],
                },
            },
        });

        const config = {};
        const type = 'Sponsored Products';
        const campaignsArray = [];
        const state = 'ACTIVE';

        const result = await createCampaigns(
            type,
            campaignsArray,
            config,
            state
        );

        expect(result).toEqual({
            errors: [{ code: 'ERROR1' }],
            successes: [{ code: 'SUCCESS1' }],
        });
    });

    it('should resolve with errors and successes for Sponsored Brands', async () => {
        // Mock axios request for testing
        axios.request = jest.fn().mockResolvedValue({
            data: {
                campaigns: {
                    error: [{ code: 'ERROR2' }],
                    success: [{ code: 'SUCCESS2' }],
                },
            },
        });

        const config = {};
        const type = 'Sponsored Brands';
        const campaignsArray = [];
        const state = 'PAUSED';

        const result = await createCampaigns(
            type,
            campaignsArray,
            config,
            state
        );

        expect(result).toEqual({
            errors: [{ code: 'ERROR2' }],
            successes: [{ code: 'SUCCESS2' }],
        });
    });

    it('should resolve with errors and successes for Sponsored Display', async () => {
        // Mock axios request for testing
        axios.request = jest.fn().mockResolvedValue({
            data: [
                { code: 'SUCCESS' },
                { code: 'ERROR3' },
                { code: 'SUCCESS' },
            ],
        });

        const config = {};
        const type = 'Sponsored Display';
        const campaignsArray = [];
        const state = 'PAUSED';

        const result = await createCampaigns(
            type,
            campaignsArray,
            config,
            state
        );

        expect(result).toEqual({
            errors: [{ code: 'ERROR3' }],
            successes: [{ code: 'SUCCESS' }, { code: 'SUCCESS' }],
        });
    });

    it('should reject with an error for an unknown type', async () => {
        const config = {};
        const type = 'Unknown Type';
        const campaignsArray = [];
        const state = 'PAUSED';

        await expect(
            createCampaigns(type, campaignsArray, config, state)
        ).rejects.toThrow('Unknown type');
    });
});

describe('isValidDate function', () => {
    it('valid date in "yyyy-MM-dd" format', () => {
        expect(isValidDate('2023-11-11')).toBe(true);
    });

    it('valid date in different format', () => {
        expect(isValidDate('November 11, 2023')).toBe(true);
    });

    it('invalid date', () => {
        expect(isValidDate('Invalid Date')).toBe(false);
    });

    it('empty string input', () => {
        expect(isValidDate('')).toBe(false);
    });

    it('undefined input', () => {
        expect(isValidDate(undefined)).toBe(false);
    });
});

describe('formatDateString function', () => {
    it('valid input date in "yyyy-MM-dd" format', () => {
        const inputDate = '2023-11-11';
        const formattedDate = formatDateString(inputDate);
        expect(isValidDate(formattedDate)).toBe(true);
    });

    it('valid input date in different format', () => {
        const inputDate = 'November 11, 2023';
        const formattedDate = formatDateString(inputDate);
        expect(isValidDate(formattedDate)).toBe(true);
    });

    it('invalid input date', () => {
        const inputDate = 'Invalid Date';
        const formattedDate = formatDateString(inputDate);
        expect(formattedDate).toBeNull();
    });

    it('empty string input', () => {
        const inputDate = '';
        const formattedDate = formatDateString(inputDate);
        expect(formattedDate).toBeNull();
    });

    it('undefined input', () => {
        const inputDate = undefined;
        const formattedDate = formatDateString(inputDate);
        expect(formattedDate).toBeNull();
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
        const config = getConfig({ type, access, profileId });

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
            config,
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
