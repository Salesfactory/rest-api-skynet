const {
    generateCampaignsWithTimePeriodsAndAdsets,
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
