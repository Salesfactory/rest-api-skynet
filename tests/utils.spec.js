const utils = require('../src/utils');
const { groupCampaignAllocationsByType } = require('../src/utils/allocations');
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
            'Sponsored Display': [
                {
                    id: '1-SEARCH-dfsdfsd',
                    name: 'Campaign 1',
                    budget: 1000,
                    startDate: '2023-01-01',
                    endDate: '2023-02-01',
                },
                {
                    id: '1-SEARCH-dfsdfsd1',
                    name: 'Campaign 2',
                    budget: 1000,
                    startDate: '2023-01-01',
                    endDate: '2023-02-01',
                },
            ],
            'Sponsored Products': [
                {
                    id: '1-SEARCH-dfsdfsd212',
                    name: 'Campaign 3',
                    budget: 2000,
                    startDate: '2023-01-01',
                    endDate: '2023-02-01',
                },
            ],
            'Search Ads': [
                {
                    id: '2-SEARCH-123',
                    name: 'Campaign 4',
                    budget: 2000,
                    startDate: '2023-01-01',
                    endDate: '2023-02-01',
                },
            ],
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
