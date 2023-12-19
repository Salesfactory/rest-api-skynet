const {
    checkIfCampaignIsOffPace,
    checkBigQueryIdExists,
    checkPacingOffPace,
    countCampaignsAndAdsetsInAllocations,
    countCampaignAndAdsetsAmzFb,
    checkSameAmountOfCampaigns,
} = require('../src/utils/cronjobs');

jest.mock('../src/utils/cronjobs', () => ({
    ...jest.requireActual('../src/utils/cronjobs'),
    sendNotification: jest.fn(),
    checkIfCampaignIsUnlinked: jest.fn(),
    fetchCampaignsWithBudgets: jest.fn(),
    fetchCampaignsWithPacings: jest.fn(),
    updateOrInsertPacingMetrics: jest.fn(),
}));

jest.mock('../src/models', () => ({
    Notification: {
        create: jest.fn(),
    },
    Pacing: {
        create: jest.fn(),
        update: jest.fn(),
        findOne: jest.fn(),
    },
    User: {
        create: jest.fn(),
        update: jest.fn(),
        findOne: jest.fn(),
        findAll: jest.fn(),
        destroy: jest.fn(),
    },
    Budget: {
        create: jest.fn(),
        update: jest.fn(),
        findOne: jest.fn(),
        findAll: jest.fn(),
        destroy: jest.fn(),
    },
    Client: {
        findOne: jest.fn(),
        findAll: jest.fn(),
    },
    Campaign: {
        create: jest.fn(),
        update: jest.fn(),
        findOne: jest.fn(),
        findAll: jest.fn(),
        destroy: jest.fn(),
    },
    CampaignGroup: {
        create: jest.fn(),
        update: jest.fn(),
        findOne: jest.fn(),
        findAll: jest.fn(),
        destroy: jest.fn(),
    },
}));

describe('Cronjobs', () => {
    const currentDate = new Date('September 2023');

    describe('Check pacing off pace', () => {
        it('should return an array with length == 1 if a campaign is underpace', () => {
            const pacing = {
                periods: [],
                allocations: {
                    september_2023: {
                        allocations: [
                            {
                                name: 'Amazon Advertising',
                                budget: 851.1560000000001,
                                allocations: [
                                    {
                                        name: 'Campaign Type',
                                        budget: 851.1560000000001,
                                        allocations: [
                                            {
                                                name: 'Campaign',
                                                budget: 851.1560000000001,
                                                allocations: [],
                                                adb: 56.74373333333334,
                                                adb_current: 0.4624,
                                                type: 'CAMPAIGN',
                                            },
                                        ],
                                        adb: 56.74373333333334,
                                        adb_current: 0.4624,
                                        type: 'CAMPAIGN_TYPE',
                                    },
                                ],
                                adb: 56.74373333333334,
                                adb_current: 0.4624,
                                type: 'CHANNEL',
                            },
                        ],
                    },
                },
            };
            const { overPaceCampaigns, underPaceCampaigns } =
                checkPacingOffPace({
                    pacing,
                    currentDate,
                });
            const offPaceCampaigns = [
                ...overPaceCampaigns,
                ...underPaceCampaigns,
            ];
            expect(offPaceCampaigns).toHaveLength(1);
        });
        it('should return an array with length == 1 if a campaign is overpaced', () => {
            const pacing = {
                periods: [],
                allocations: {
                    september_2023: {
                        allocations: [
                            {
                                name: 'Amazon Advertising',
                                budget: 851.1560000000001,
                                allocations: [
                                    {
                                        name: 'Campaign Type',
                                        budget: 851.1560000000001,
                                        allocations: [
                                            {
                                                name: 'Campaign',
                                                budget: 851.1560000000001,
                                                allocations: [],
                                                adb: 56.74373333333334,
                                                adb_current: 0.4624,
                                                type: 'CAMPAIGN',
                                            },
                                        ],
                                        adb: 56.74373333333334,
                                        adb_current: 0.4624,
                                        type: 'CAMPAIGN_TYPE',
                                    },
                                ],
                                adb: 56.74373333333334,
                                adb_current: 0.4624,
                                type: 'CHANNEL',
                            },
                        ],
                    },
                },
            };
            const { overPaceCampaigns, underPaceCampaigns } =
                checkPacingOffPace({
                    pacing,
                    currentDate,
                });
            const offPaceCampaigns = [
                ...overPaceCampaigns,
                ...underPaceCampaigns,
            ];
            expect(offPaceCampaigns).toHaveLength(1);
        });
        it('should return an array with length == 2 if a campaign is offpace', () => {
            const pacing = {
                periods: [],
                allocations: {
                    september_2023: {
                        allocations: [
                            {
                                name: 'Google Ads',
                                budget: 851.1560000000001,
                                allocations: [
                                    {
                                        name: 'Campaign Type',
                                        budget: 851.1560000000001,
                                        allocations: [
                                            {
                                                name: 'Campaign',
                                                budget: 851.1560000000001,
                                                allocations: [],
                                                adb: 56.74373333333334,
                                                adb_current: 340.4624,
                                                type: 'CAMPAIGN',
                                            },
                                        ],
                                        adb: 56.74373333333334,
                                        adb_current: 340.4624,
                                        type: 'CAMPAIGN_TYPE',
                                    },
                                ],
                                adb: 56.74373333333334,
                                adb_current: 340.4624,
                                type: 'CHANNEL',
                            },
                            {
                                name: 'Amazon Advertising',
                                budget: 851.1560000000001,
                                allocations: [
                                    {
                                        name: 'Campaign Type',
                                        budget: 851.1560000000001,
                                        allocations: [
                                            {
                                                name: 'Campaign',
                                                budget: 851.1560000000001,
                                                allocations: [],
                                                adb: 56.74373333333334,
                                                adb_current: 0.4624,
                                                type: 'CAMPAIGN',
                                            },
                                        ],
                                        adb: 56.74373333333334,
                                        adb_current: 0.4624,
                                        type: 'CAMPAIGN_TYPE',
                                    },
                                ],
                                adb: 56.74373333333334,
                                adb_current: 0.4624,
                                type: 'CHANNEL',
                            },
                        ],
                    },
                },
            };
            const { overPaceCampaigns, underPaceCampaigns } =
                checkPacingOffPace({
                    pacing,
                    currentDate,
                });
            const offPaceCampaigns = [
                ...overPaceCampaigns,
                ...underPaceCampaigns,
            ];
            expect(offPaceCampaigns).toHaveLength(2);
        });
        it('should return an array with length = 0 if pacing is null', () => {
            const pacing = null;
            const { overPaceCampaigns, underPaceCampaigns } =
                checkPacingOffPace({
                    pacing,
                    currentDate,
                });
            const offPaceCampaigns = [
                ...overPaceCampaigns,
                ...underPaceCampaigns,
            ];
            expect(offPaceCampaigns).toHaveLength(0);
        });
        it('should return an array with length = 0 if pacing is on pace', () => {
            const pacing = {
                periods: [],
                allocations: {
                    september_2023: {
                        allocations: [
                            {
                                name: 'Google Ads',
                                budget: 851.1560000000001,
                                type: 'CHANNEL',
                                allocations: [],
                                adb: 56.74373333333334,
                                adb_current: 56,
                            },
                        ],
                    },
                },
            };
            const { overPaceCampaigns, underPaceCampaigns } =
                checkPacingOffPace({
                    pacing,
                    currentDate,
                });
            const offPaceCampaigns = [
                ...overPaceCampaigns,
                ...underPaceCampaigns,
            ];
            expect(offPaceCampaigns).toHaveLength(0);
        });
    });

    describe('Check if campaign is off pace', () => {
        it('should return true if campaign is off pace', () => {
            const campaign = {
                name: 'Campaign 1',
                client: {
                    name: 'Client 1',
                },
                pacings: [
                    {
                        periods: [],
                        allocations: {
                            september_2023: {
                                allocations: [
                                    {
                                        name: 'Google Ads',
                                        budget: 851.1560000000001,
                                        allocations: [
                                            {
                                                name: 'Campaign Type',
                                                budget: 851.1560000000001,
                                                allocations: [
                                                    {
                                                        name: 'Campaign',
                                                        budget: 851.1560000000001,
                                                        allocations: [],
                                                        adb: 56.74373333333334,
                                                        adb_current: 340.4624,
                                                        type: 'CAMPAIGN',
                                                    },
                                                ],
                                                adb: 56.74373333333334,
                                                adb_current: 340.4624,
                                                type: 'CAMPAIGN_TYPE',
                                            },
                                        ],
                                        adb: 56.74373333333334,
                                        adb_current: 340.4624,
                                        type: 'CHANNEL',
                                    },
                                    {
                                        name: 'Amazon Advertising',
                                        budget: 851.1560000000001,
                                        allocations: [
                                            {
                                                name: 'Campaign Type',
                                                budget: 851.1560000000001,
                                                allocations: [
                                                    {
                                                        name: 'Campaign',
                                                        budget: 851.1560000000001,
                                                        allocations: [],
                                                        adb: 56.74373333333334,
                                                        adb_current: 0.4624,
                                                        type: 'CAMPAIGN',
                                                    },
                                                ],
                                                adb: 56.74373333333334,
                                                adb_current: 0.4624,
                                                type: 'CAMPAIGN_TYPE',
                                            },
                                        ],
                                        adb: 56.74373333333334,
                                        adb_current: 0.4624,
                                        type: 'CHANNEL',
                                    },
                                ],
                            },
                        },
                    },
                ],
            };
            const { hasOffPaceCampaigns } = checkIfCampaignIsOffPace({
                campaign,
                currentDate,
            });
            expect(hasOffPaceCampaigns).toBeTruthy();
        });
        it('should return false if campaign is on pace', () => {
            const campaign = {
                name: 'Campaign 1',
                client: {
                    name: 'Client 1',
                },
                pacings: [
                    {
                        periods: [],
                        allocations: {
                            september_2023: {
                                allocations: [
                                    {
                                        name: 'Google Ads',
                                        budget: 851.1560000000001,
                                        type: 'CHANNEL',
                                        allocations: [
                                            {
                                                name: 'Campaign Type',
                                                budget: 851.1560000000001,
                                                type: 'CAMPAIGN_TYPE',
                                                allocations: [
                                                    {
                                                        name: 'Campaign',
                                                        budget: 851.1560000000001,
                                                        type: 'CAMPAIGN',
                                                        allocations: [],
                                                        adb: 56.74373333333334,
                                                        adb_current: 56,
                                                    },
                                                ],
                                                adb: 56.74373333333334,
                                                adb_current: 56,
                                            },
                                        ],
                                        adb: 56.74373333333334,
                                        adb_current: 56,
                                    },
                                ],
                            },
                        },
                    },
                ],
            };
            const { hasOffPaceCampaigns } = checkIfCampaignIsOffPace({
                campaign,
                currentDate,
            });
            expect(hasOffPaceCampaigns).toBeFalsy();
        });
    });

    describe('Check if bigquery id exists for unlinking process', () => {
        it('should return true if bigquery_campaign_id exist in every campaign', () => {
            const allocations = {
                september_2023: {
                    allocations: [
                        {
                            name: 'Google Ads',
                            budget: 851.1560000000001,
                            type: 'CHANNEL',
                            allocations: [
                                {
                                    name: 'Ad Type 1',
                                    budget: 851.1560000000001,
                                    type: 'CAMPAIGN_TYPE',
                                    allocations: [
                                        {
                                            name: 'Ad Group 1',
                                            budget: 851.1560000000001,
                                            type: 'CAMPAIGN',
                                            allocations: [],
                                            adb: 56.74373333333334,
                                            adb_current: 56,
                                            bigquery_campaign_id: 123,
                                        },
                                    ],
                                    adb: 56.74373333333334,
                                    adb_current: 56,
                                },
                            ],
                            adb: 56.74373333333334,
                            adb_current: 56,
                        },
                    ],
                },
            };

            const { hasUnlinkedCampaigns } = checkBigQueryIdExists({
                allocations,
            });
            expect(!hasUnlinkedCampaigns).toBeTruthy();
        });

        it("should return false if bigquery_campaign_id doesn't exist", () => {
            const allocations = {
                september_2023: {
                    allocations: [
                        {
                            name: 'Google Ads',
                            budget: 851.1560000000001,
                            type: 'CHANNEL',
                            allocations: [
                                {
                                    name: 'Ad Type 1',
                                    budget: 851.1560000000001,
                                    type: 'CAMPAIGN_TYPE',
                                    allocations: [
                                        {
                                            name: 'Ad Group 1',
                                            budget: 851.1560000000001,
                                            type: 'CAMPAIGN',
                                            allocations: [],
                                            adb: 56.74373333333334,
                                            adb_current: 56,
                                        },
                                    ],
                                    adb: 56.74373333333334,
                                    adb_current: 56,
                                },
                            ],
                            adb: 56.74373333333334,
                            adb_current: 56,
                        },
                    ],
                },
            };

            const { hasUnlinkedCampaigns } = checkBigQueryIdExists({
                allocations,
            });
            expect(!hasUnlinkedCampaigns).toBeFalsy();
        });

        it('should return false if there are no allocations at campaign level', () => {
            const allocations = {
                september_2023: {
                    allocations: [
                        {
                            name: 'Google Ads',
                            budget: 851.1560000000001,
                            type: 'CHANNEL',
                            allocations: [],
                            adb: 56.74373333333334,
                            adb_current: 56,
                        },
                    ],
                },
            };

            const { hasUnlinkedCampaigns } = checkBigQueryIdExists({
                allocations,
            });
            expect(!hasUnlinkedCampaigns).toBeTruthy();
        });
    });

    describe('countCampaignsAndAdsetsInAllocations', () => {
        const periods = [
            { id: 'january_2024', label: 'January 2024', days: 31 },
        ];

        const allocations = {
            january_2024: {
                budget: 52.275,
                percentage: 50,
                allocations: [
                    {
                        id: '8',
                        name: 'Amazon Advertising DSP',
                        isApiEnabled: true,
                        deprecatedCampaignTypes: [],
                        budget: 52.275,
                        percentage: 100,
                        type: 'CHANNEL',
                        allocations: [
                            {
                                id: '8-Responsive eCommerce',
                                name: 'Responsive eCommerce',
                                budget: 52.275,
                                percentage: 100,
                                type: 'CAMPAIGN_TYPE',
                                allocations: [
                                    {
                                        id: '8-Responsive eCommerce-b',
                                        name: '202401|Responsive eCommerce|CCCC|CCCC|CCCC',
                                        budget: 52.275,
                                        percentage: 100,
                                        goals: '',
                                        type: 'CAMPAIGN',
                                        allocations: [
                                            {
                                                id: '8-Responsive eCommerce-b-v',
                                                name: '202401|Responsive eCommerce|CCCC|CCCC|CCCC|CCC|CCC',
                                                budget: 52.275,
                                                percentage: 100,
                                                type: 'ADSET',
                                                startDate:
                                                    '2024-01-01T04:00:00.000Z',
                                                endDate:
                                                    '2024-02-01T04:00:00.000Z',
                                                lineItemType:
                                                    'STANDARD_DISPLAY',
                                                frequencyCap: 'UNCAPPED',
                                                timeUnit: '',
                                                maximumImpressions: '',
                                                timeUnitCount: '',
                                                targeting: 'CCC',
                                                format: 'CCC',
                                            },
                                        ],
                                        status: 'PAUSED',
                                        productLocation: 'SOLD_ON_AMAZON',
                                        orderGoal: 'AWARENESS',
                                        orderGoalKpi: 'REACH',
                                        recurrenceTimePeriod: 'UNCAPPED',
                                        amount: '',
                                        autoOptimizations: 'BUDGET',
                                        biddingStrategy: 'SPEND_BUDGET_IN_FULL',
                                        frequencyCap: 'UNCAPPED',
                                        timeUnit: '',
                                        maximumImpressions: '',
                                        timeUnitCount: '',
                                        apiCampaign: true,
                                        objective: 'CCCC',
                                        nameFragment: 'CCCC',
                                        scope: 'CCCC',
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        };

        // Test Case 1: Valid input with a channel that exists
        it('should count campaigns and adsets for a valid channel', () => {
            const result = countCampaignsAndAdsetsInAllocations({
                campaign: { budgets: [{ allocations, periods }] },
                channelName: 'Amazon Advertising DSP',
            });

            expect(result.campaignCount).toBe(1);
            expect(result.adsetCount).toBe(1);
        });

        // Test Case 2: Valid input with a channel that does not exist
        it('should return 0 for campaign and adset count for a nonexistent channel', () => {
            const result = countCampaignsAndAdsetsInAllocations({
                campaign: { budgets: [{ allocations, periods }] },
                channelName: 'Nonexistent Channel',
            });

            expect(result.campaignCount).toBe(0);
            expect(result.adsetCount).toBe(0);
        });

        // Test Case 3: Valid input with empty allocations
        it('should return 0 for campaign and adset count when allocations are empty', () => {
            const result = countCampaignsAndAdsetsInAllocations({
                campaign: { budgets: [] },
                channelName: 'Amazon Advertising DSP',
            });

            expect(result.campaignCount).toBe(0);
            expect(result.adsetCount).toBe(0);
        });

        // Test Case 4: Valid input with no allocations for the specified channel
        it('should return 0 for campaign and adset count when channel allocations are empty', () => {
            const result = countCampaignsAndAdsetsInAllocations({
                campaign: { budgets: [] },
                channelName: 'Nonexistent Channel',
            });

            expect(result.campaignCount).toBe(0);
            expect(result.adsetCount).toBe(0);
        });
    });

    describe('countCampaignAndAdsetsAmzFb', () => {
        // Test Case 1: Valid input with a single campaign and adset
        it('should count one campaign and one adset without jobId', () => {
            const campaigns = [
                {
                    name: '8-Responsive eCommerce-b',
                    data: { orderId: '576931729185683972' },
                    adsets: [{ jobId: 4, adset: null }],
                },
            ];

            const result = countCampaignAndAdsetsAmzFb({ campaigns });

            expect(result.campaignCount).toBe(1);
            expect(result.adsetCount).toBe(0); // Since adset has a jobId
        });

        // Test Case 2: Valid input with multiple adsets and some with jobId
        it('should count one campaign and the number of adsets without jobId', () => {
            const campaigns = [
                {
                    name: '4-OUTCOME_ENGAGEMENT-Camp 1',
                    data: { id: '120203871033130360' },
                    adsets: [
                        {
                            name: '4-OUTCOME_ENGAGEMENT-Camp 1-Adset 1',
                            data: { id: '120203871034260360' },
                        },
                        {
                            name: '4-OUTCOME_ENGAGEMENT-Camp 1-Adset 1',
                            data: { id: '120203871035910360' },
                        },
                        {
                            name: '4-OUTCOME_ENGAGEMENT-Camp 1-Adset 1',
                            data: { id: '120203871038160360' },
                        },
                        {
                            name: '4-OUTCOME_ENGAGEMENT-Camp 1-Adset 1',
                            data: {},
                            jobId: 5,
                        },
                    ],
                },
            ];

            const result = countCampaignAndAdsetsAmzFb({ campaigns });

            expect(result.campaignCount).toBe(1);
            expect(result.adsetCount).toBe(3); // Three adsets without jobId
        });

        // Test Case 3: Valid input with a campaign and an adset with lineItemId instead of jobId
        it('should count one campaign and one adset without jobId but with lineItemId', () => {
            const campaigns = [
                {
                    name: '8-Responsive eCommerce-b',
                    data: { orderId: '578226298195109291' },
                    adsets: [{ lineItemId: '591061514652715947' }],
                },
            ];

            const result = countCampaignAndAdsetsAmzFb({ campaigns });

            expect(result.campaignCount).toBe(1);
            expect(result.adsetCount).toBe(1);
        });

        // Test Case 4: Valid input with empty campaigns array
        it('should return zero counts for empty campaigns array', () => {
            const campaigns = [];

            const result = countCampaignAndAdsetsAmzFb({ campaigns });

            expect(result.campaignCount).toBe(0);
            expect(result.adsetCount).toBe(0);
        });
    });
});
