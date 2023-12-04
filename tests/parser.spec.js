const {
    generateCampaignsWithTimePeriodsAndAdsets,
    convertToCents,
    concatMissingCampaigns,
} = require('../src/utils/parsers');
const orchestrationDataSample = require('./parser-sample-data/orchestration-adset-facebook.json');

const expected = [
    {
        id: '4',
        name: 'Facebook',
        isApiEnabled: false,
        type: 'CHANNEL',
        campaigns: [
            {
                id: '4-PAGE_LIKES-api-test-1',
                name: 'api-test-1',
                goals: '',
                campaignType: 'PAGE_LIKES',
                type: 'CAMPAIGN',
                objective: 'OUTCOME_AWARENESS',
                specialAdCategories: 'NONE',
                timePeriods: [
                    {
                        id: 'january_2023',
                        label: 'January 2023',
                        days: 31,
                        adsets: [
                            {
                                id: '4-PAGE_LIKES-api-test-1-api-adset-test-1',
                                name: 'api-adset-test-1',
                                budget: 425,
                                percentage: 50,
                                type: 'ADSET',
                            },
                            {
                                id: '4-PAGE_LIKES-api-test-1-api-adset-test-2',
                                name: 'api-adset-test-2',
                                budget: 425,
                                percentage: 50,
                                type: 'ADSET',
                            },
                        ],
                    },
                    {
                        id: 'february_2023',
                        label: 'February 2023',
                        days: 28,
                        adsets: [
                            {
                                id: '4-PAGE_LIKES-api-test-1-api-adset-test-1',
                                name: 'api-adset-test-1',
                                budget: 680,
                                percentage: 50,
                                type: 'ADSET',
                            },
                            {
                                id: '4-PAGE_LIKES-api-test-1-api-adset-test-2',
                                name: 'api-adset-test-2',
                                budget: 680,
                                percentage: 50,
                                type: 'ADSET',
                            },
                        ],
                    },
                    {
                        id: 'march_2023',
                        label: 'March 2023',
                        days: 31,
                        adsets: [
                            {
                                id: '4-PAGE_LIKES-api-test-1-api-adset-test-1',
                                name: 'api-adset-test-1',
                                budget: 680,
                                percentage: 50,
                                type: 'ADSET',
                            },
                            {
                                id: '4-PAGE_LIKES-api-test-1-api-adset-test-2',
                                name: 'api-adset-test-2',
                                budget: 680,
                                percentage: 50,
                                type: 'ADSET',
                            },
                        ],
                    },
                    {
                        id: 'april_2023',
                        label: 'April 2023',
                        days: 30,
                        adsets: [
                            {
                                id: '4-PAGE_LIKES-api-test-1-api-adset-test-1',
                                name: 'api-adset-test-1',
                                budget: 680,
                                percentage: 50,
                                type: 'ADSET',
                            },
                            {
                                id: '4-PAGE_LIKES-api-test-1-api-adset-test-2',
                                name: 'api-adset-test-2',
                                budget: 680,
                                percentage: 50,
                                type: 'ADSET',
                            },
                        ],
                    },
                    {
                        id: 'may_2023',
                        label: 'May 2023',
                        days: 31,
                        adsets: [
                            {
                                id: '4-PAGE_LIKES-api-test-1-api-adset-test-1',
                                name: 'api-adset-test-1',
                                budget: 680,
                                percentage: 50,
                                type: 'ADSET',
                            },
                            {
                                id: '4-PAGE_LIKES-api-test-1-api-adset-test-2',
                                name: 'api-adset-test-2',
                                budget: 680,
                                percentage: 50,
                                type: 'ADSET',
                            },
                        ],
                    },
                    {
                        id: 'june_2023',
                        label: 'June 2023',
                        days: 30,
                        adsets: [
                            {
                                id: '4-PAGE_LIKES-api-test-1-api-adset-test-1',
                                name: 'api-adset-test-1',
                                budget: 680,
                                percentage: 50,
                                type: 'ADSET',
                            },
                            {
                                id: '4-PAGE_LIKES-api-test-1-api-adset-test-2',
                                name: 'api-adset-test-2',
                                budget: 680,
                                percentage: 50,
                                type: 'ADSET',
                            },
                        ],
                    },
                ],
            },
            {
                id: '4-PAGE_LIKES-api-campaign-2',
                name: 'api-campaign-2',
                goals: '',
                campaignType: 'PAGE_LIKES',
                type: 'CAMPAIGN',
                objective: 'OUTCOME_AWARENESS',
                specialAdCategories: 'NONE',
                timePeriods: [
                    {
                        id: 'january_2023',
                        label: 'January 2023',
                        days: 31,
                        adsets: [
                            {
                                id: '4-PAGE_LIKES-api-campaign-2-adtest-test-4',
                                name: 'adtest-test-4',
                                budget: 850,
                                percentage: 100,
                                type: 'ADSET',
                            },
                        ],
                    },
                    {
                        id: 'february_2023',
                        label: 'February 2023',
                        days: 28,
                        adsets: [
                            {
                                id: '4-PAGE_LIKES-api-campaign-2-adtest-test-4',
                                name: 'adtest-test-4',
                                budget: 680,
                                percentage: 100,
                                type: 'ADSET',
                            },
                        ],
                    },
                    {
                        id: 'march_2023',
                        label: 'March 2023',
                        days: 31,
                        adsets: [
                            {
                                id: '4-PAGE_LIKES-api-campaign-2-adtest-test-4',
                                name: 'adtest-test-4',
                                budget: 680,
                                percentage: 100,
                                type: 'ADSET',
                            },
                        ],
                    },
                    {
                        id: 'april_2023',
                        label: 'April 2023',
                        days: 30,
                        adsets: [
                            {
                                id: '4-PAGE_LIKES-api-campaign-2-adtest-test-4',
                                name: 'adtest-test-4',
                                budget: 680,
                                percentage: 100,
                                type: 'ADSET',
                            },
                        ],
                    },
                    {
                        id: 'may_2023',
                        label: 'May 2023',
                        days: 31,
                        adsets: [
                            {
                                id: '4-PAGE_LIKES-api-campaign-2-adtest-test-4',
                                name: 'adtest-test-4',
                                budget: 680,
                                percentage: 100,
                                type: 'ADSET',
                            },
                        ],
                    },
                    {
                        id: 'june_2023',
                        label: 'June 2023',
                        days: 30,
                        adsets: [
                            {
                                id: '4-PAGE_LIKES-api-campaign-2-adtest-test-4',
                                name: 'adtest-test-4',
                                budget: 680,
                                percentage: 100,
                                type: 'ADSET',
                            },
                        ],
                    },
                ],
            },
            {
                id: '4-CONVERSIONS-campaign-3-test',
                name: 'campaign-3-test',
                goals: '',
                campaignType: 'CONVERSIONS',
                type: 'CAMPAIGN',
                objective: 'OUTCOME_AWARENESS',
                specialAdCategories: 'NONE',
                timePeriods: [
                    {
                        id: 'january_2023',
                        label: 'January 2023',
                        days: 31,
                        adsets: [
                            {
                                id: '4-CONVERSIONS-campaign-3-test-adset-test-4',
                                name: 'adset-test-4',
                                budget: 425,
                                percentage: 50,
                                type: 'ADSET',
                            },
                            {
                                id: '4-CONVERSIONS-campaign-3-test-adtes-test-5',
                                name: 'adtes-test-5',
                                budget: 425,
                                percentage: 50,
                                type: 'ADSET',
                            },
                        ],
                    },
                    {
                        id: 'february_2023',
                        label: 'February 2023',
                        days: 28,
                        adsets: [
                            {
                                id: '4-CONVERSIONS-campaign-3-test-adset-test-4',
                                name: 'adset-test-4',
                                budget: 340,
                                percentage: 50,
                                type: 'ADSET',
                            },
                            {
                                id: '4-CONVERSIONS-campaign-3-test-adtes-test-5',
                                name: 'adtes-test-5',
                                budget: 340,
                                percentage: 50,
                                type: 'ADSET',
                            },
                        ],
                    },
                    {
                        id: 'march_2023',
                        label: 'March 2023',
                        days: 31,
                        adsets: [
                            {
                                id: '4-CONVERSIONS-campaign-3-test-adset-test-4',
                                name: 'adset-test-4',
                                budget: 340,
                                percentage: 50,
                                type: 'ADSET',
                            },
                            {
                                id: '4-CONVERSIONS-campaign-3-test-adtes-test-5',
                                name: 'adtes-test-5',
                                budget: 340,
                                percentage: 50,
                                type: 'ADSET',
                            },
                        ],
                    },
                    {
                        id: 'april_2023',
                        label: 'April 2023',
                        days: 30,
                        adsets: [
                            {
                                id: '4-CONVERSIONS-campaign-3-test-adset-test-4',
                                name: 'adset-test-4',
                                budget: 340,
                                percentage: 50,
                                type: 'ADSET',
                            },
                            {
                                id: '4-CONVERSIONS-campaign-3-test-adtes-test-5',
                                name: 'adtes-test-5',
                                budget: 340,
                                percentage: 50,
                                type: 'ADSET',
                            },
                        ],
                    },
                    {
                        id: 'may_2023',
                        label: 'May 2023',
                        days: 31,
                        adsets: [
                            {
                                id: '4-CONVERSIONS-campaign-3-test-adset-test-4',
                                name: 'adset-test-4',
                                budget: 340,
                                percentage: 50,
                                type: 'ADSET',
                            },
                            {
                                id: '4-CONVERSIONS-campaign-3-test-adtes-test-5',
                                name: 'adtes-test-5',
                                budget: 340,
                                percentage: 50,
                                type: 'ADSET',
                            },
                        ],
                    },
                    {
                        id: 'june_2023',
                        label: 'June 2023',
                        days: 30,
                        adsets: [
                            {
                                id: '4-CONVERSIONS-campaign-3-test-adset-test-4',
                                name: 'adset-test-4',
                                budget: 340,
                                percentage: 50,
                                type: 'ADSET',
                            },
                            {
                                id: '4-CONVERSIONS-campaign-3-test-adtes-test-5',
                                name: 'adtes-test-5',
                                budget: 340,
                                percentage: 50,
                                type: 'ADSET',
                            },
                        ],
                    },
                ],
            },
        ],
    },
];

describe('generateCampaignsWithTimePeriodsAndAdsets', () => {
    it('returns the expected data', () => {
        const result = generateCampaignsWithTimePeriodsAndAdsets(
            orchestrationDataSample
        );

        expect(result).toEqual(expected);
    });
});

describe('convert dollars to cents', () => {
    it('convert dollars to cents', () => {
        const dollar = 50;
        const cents = 5000;

        const expectedCents = convertToCents(dollar);

        expect(cents).toEqual(expectedCents);
    });
});

describe('concatMissingCampaigns', () => {
    it('it should return 2 campaigns', async () => {
        const amazonCampaignsPrev = [
            {
                name: 'test campaign 1',
                data: '123123',
                adsets: [
                    {
                        name: 'test adset 1',
                        data: '35533451',
                    },
                    {
                        name: 'test adset 2',
                        data: '35533452',
                    },
                    {
                        name: 'test adset 3',
                        data: '35533453',
                    },
                ],
            },
        ];
        const amazonCampaignsNew = [
            {
                name: 'test campaign 2',
                data: '123123',
                adsets: [
                    {
                        name: 'test adset 1',
                        data: '35533451',
                    },
                ],
            },
        ];

        const result = await concatMissingCampaigns(
            amazonCampaignsPrev,
            amazonCampaignsNew
        );

        expect(result.length).toEqual(2);
    });

    it('should return 1 campaign with 3 adsets and 1 campaign with 1 adset', async () => {
        const amazonCampaignsPrev = [
            {
                name: 'test campaign 1',
                data: '123123',
                adsets: [
                    {
                        name: 'test adset 1',
                        data: '35533451',
                    },
                    {
                        name: 'test adset 2',
                        data: '35533452',
                    },
                    {
                        name: 'test adset 3',
                        data: '35533453',
                    },
                ],
            },
        ];
        const amazonCampaignsNew = [
            {
                name: 'test campaign 2',
                data: '123123',
                adsets: [
                    {
                        name: 'test adset 1',
                        data: '35533451',
                    },
                ],
            },
        ];

        const result = await concatMissingCampaigns(
            amazonCampaignsPrev,
            amazonCampaignsNew
        );

        expect(result[0].adsets.length).toEqual(3);
        expect(result[1].adsets.length).toEqual(1);
    });

    it('should return 1 campaign from new data and 0 from prev data', async () => {
        const amazonCampaignsPrev = {
            name: 'test campaign 1',
            data: '123123',
            adsets: [
                {
                    name: 'test adset 1',
                    data: '35533451',
                },
                {
                    name: 'test adset 2',
                    data: '35533452',
                },
                {
                    name: 'test adset 3',
                    data: '35533453',
                },
            ],
        };
        const amazonCampaignsNew = [
            {
                name: 'test campaign 2',
                data: '123123',
                adsets: [
                    {
                        name: 'test adset 1',
                        data: '35533451',
                    },
                ],
            },
        ];

        const result = await concatMissingCampaigns(
            amazonCampaignsPrev,
            amazonCampaignsNew
        );

        expect(result.length).toEqual(1);
    });
});
