// Import the necessary modules and functions
const processJobs = require('./processQueueJobs'); // Replace with the actual path to your processJobs module

// Mock the dependencies and setup mocks
const createAdset = jest.fn(async () => ({
    data: [{ id: 123, name: 'Adset Name' }],
}));

const initialAmazonCampaigns = [
    {
        id: 101,
        name: 'Campaign 1',
        adsets: [],
    },
    {
        id: 102,
        name: 'Campaign 2',
        adsets: [],
    },
];

const Budget = {
    findOne: jest.fn(async () => ({
        budgets: [
            {
                id: 1,
                periods: 12,
                allocations: 1000,
                amazonCampaigns: initialAmazonCampaigns,
                facebookCampaigns: [],
            },
        ],
    })),
    create: jest.fn(async () => {}),
};

const CampaignGroup = {
    findOne: jest.fn(async () => ({
        budgets: [
            {
                id: 1,
                periods: 12,
                allocations: 1000,
                amazonCampaigns: initialAmazonCampaigns,
                facebookCampaigns: [],
            },
        ],
    })),
};

const delay = jest.fn(async () => {});

const access = 'sampleAccess';

// Mock the job data
const job = {
    data: {
        adset: {
            id: 123,
            name: 'Sample Adset',
        },
        orderId: 456,
        type: 'sampleType',
        profileId: 789,
        campaignId: 101,
        campaignGroupId: 202,
        clientId: 303,
    },
};

describe('processJobs', () => {
    it('should process a job and add adset to amazonCampaigns', async () => {
        // Call the processJobs function with mocked dependencies
        const processJobFunction = processJobs({
            createAdset,
            Budget,
            CampaignGroup,
            delay,
            access,
        });

        await processJobFunction(job);

        // Verify that the asynchronous functions were called with the expected arguments
        expect(createAdset).toHaveBeenCalledWith({
            adset: {
                id: 123,
                name: 'Sample Adset',
            },
            orderId: 456,
            type: 'sampleType',
            profileId: 789,
            access: 'sampleAccess',
        });

        expect(CampaignGroup.findOne).toHaveBeenCalledWith({
            where: { id: 202, client_id: 303 },
            include: [
                {
                    model: Budget,
                    as: 'budgets',
                    limit: 1,
                    order: [['updatedAt', 'DESC']],
                    attributes: [
                        'id',
                        'periods',
                        'allocations',
                        'amazonCampaigns',
                        'facebookCampaigns',
                    ],
                },
            ],
        });

        expect(Budget.create).toHaveBeenCalledWith({
            campaign_group_id: 202,
            periods: 12,
            allocations: 1000,
            amazonCampaigns: expect.arrayContaining([
                expect.objectContaining({
                    id: 101, // Ensure that the adset is added to the correct campaign
                    adsets: expect.arrayContaining([
                        expect.objectContaining({
                            id: 123, // Ensure that the adset ID is in the campaign's adsets
                        }),
                    ]),
                }),
            ]),
            facebookCampaigns: [],
        });

        // Ensure that the delay function was called
        expect(delay).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
        // Mock the createAdset function to throw an error
        createAdset.mockRejectedValue(new Error('Adset creation error'));

        // Call the processJobs function with mocked dependencies
        const processJobFunction = processJobs({
            createAdset,
            Budget,
            CampaignGroup,
            delay,
            access,
        });

        // Use Jest's expect.assertions to verify that the Promise rejects with an error
        await expect(processJobFunction(job)).rejects.toThrow(
            'Adset creation error'
        );
    });
});
