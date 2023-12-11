const {
    generateCampaignsWithTimePeriodsAndAdsets,
    convertToCents,
    concatMissingCampaigns,
} = require('../src/utils/parsers');
const orchestrationDataSample = require('./parser-sample-data/face-book-payload.json');
const multiChannelPayload = require('./parser-sample-data/multiChannelPayload.json');
const expected = [
    {
        id: '4',
        name: 'Facebook',
        isApiEnabled: true,
        type: 'CHANNEL',
        campaigns: [
            {
                objective: 'AWARENESS',
                specialAdCategories: 'NONE',
                campaignObjective: 'OUTCOME_AWARENESS',
                id: '4-OUTCOME_AWARENESS-Camp 1',
                name: '202312|OUTCOME_AWARENESS|AWARENESS|FB LINK|WINTER',
                goals: '',
                type: 'CAMPAIGN',
                campaignType: 'OUTCOME_AWARENESS',
                timePeriods: [
                    {
                        id: 'december_2023',
                        label: 'December 2023',
                        days: 31,
                        adsets: [
                            {
                                id: '4-OUTCOME_AWARENESS-Camp 1-Adset 1',
                                name: '202312|OUTCOME_AWARENESS|AWARENESS|FB LINK|WINTER|DADS|VIDEO',
                                budget: 2132.9900000000002,
                                percentage: 100,
                                type: 'ADSET',
                                startDate: '2023-12-01T05:00:00.000Z',
                                endDate: '2023-12-31T05:00:00.000Z',
                                status: 'PAUSED',
                                daily_budget: '68.81',
                                billing_event: 'POST_ENGAGEMENT',
                                bid_strategy: 'LOWEST_COST_WITH_BID_CAP',
                                bid_amount: '5',
                                optimization_goal: 'REACH',
                                targeting: 'DADS',
                                format: 'VIDEO',
                            },
                        ],
                    },
                    {
                        id: 'january_2024',
                        label: 'January 2024',
                        days: 31,
                        adsets: [
                            {
                                id: '4-OUTCOME_AWARENESS-Camp 1-Adset 1',
                                name: '202312|OUTCOME_AWARENESS|AWARENESS|FB LINK|WINTER|DADS|VIDEO',
                                budget: 1706.392,
                                percentage: 100,
                                type: 'ADSET',
                                startDate: '2024-01-01T05:00:00.000Z',
                                endDate: '2024-01-31T05:00:00.000Z',
                                status: 'PAUSED',
                                daily_budget: '68.81',
                                billing_event: 'POST_ENGAGEMENT',
                                bid_strategy: 'LOWEST_COST_WITH_BID_CAP',
                                bid_amount: '5',
                                optimization_goal: 'REACH',
                                targeting: 'DADS',
                                format: 'VIDEO',
                            },
                        ],
                    },
                    {
                        id: 'february_2024',
                        label: 'February 2024',
                        days: 29,
                        adsets: [
                            {
                                id: '4-OUTCOME_AWARENESS-Camp 1-Adset 1',
                                name: '202312|OUTCOME_AWARENESS|AWARENESS|FB LINK|WINTER|DADS|VIDEO',
                                budget: 1706.392,
                                percentage: 100,
                                type: 'ADSET',
                                startDate: '2024-02-01T05:00:00.000Z',
                                endDate: '2024-02-29T05:00:00.000Z',
                                status: 'PAUSED',
                                daily_budget: '68.81',
                                billing_event: 'POST_ENGAGEMENT',
                                bid_strategy: 'LOWEST_COST_WITH_BID_CAP',
                                bid_amount: '5',
                                optimization_goal: 'REACH',
                                targeting: 'DADS',
                                format: 'VIDEO',
                            },
                        ],
                    },
                    {
                        id: 'march_2024',
                        label: 'March 2024',
                        days: 31,
                        adsets: [
                            {
                                id: '4-OUTCOME_AWARENESS-Camp 1-Adset 1',
                                name: '202312|OUTCOME_AWARENESS|AWARENESS|FB LINK|WINTER|DADS|VIDEO',
                                budget: 1706.392,
                                percentage: 100,
                                type: 'ADSET',
                                startDate: '2024-03-01T05:00:00.000Z',
                                endDate: '2024-03-31T04:00:00.000Z',
                                status: 'PAUSED',
                                daily_budget: '68.81',
                                billing_event: 'POST_ENGAGEMENT',
                                bid_strategy: 'LOWEST_COST_WITH_BID_CAP',
                                bid_amount: '5',
                                optimization_goal: 'REACH',
                                targeting: 'DADS',
                                format: 'VIDEO',
                            },
                        ],
                    },
                    {
                        id: 'april_2024',
                        label: 'April 2024',
                        days: 30,
                        adsets: [
                            {
                                id: '4-OUTCOME_AWARENESS-Camp 1-Adset 1',
                                name: '202312|OUTCOME_AWARENESS|AWARENESS|FB LINK|WINTER|DADS|VIDEO',
                                budget: 1706.392,
                                percentage: 100,
                                type: 'ADSET',
                                startDate: '2024-04-01T04:00:00.000Z',
                                endDate: '2024-04-30T04:00:00.000Z',
                                status: 'PAUSED',
                                daily_budget: '68.81',
                                billing_event: 'POST_ENGAGEMENT',
                                bid_strategy: 'LOWEST_COST_WITH_BID_CAP',
                                bid_amount: '5',
                                optimization_goal: 'REACH',
                                targeting: 'DADS',
                                format: 'VIDEO',
                            },
                        ],
                    },
                    {
                        id: 'may_2024',
                        label: 'May 2024',
                        days: 31,
                        adsets: [
                            {
                                id: '4-OUTCOME_AWARENESS-Camp 1-Adset 1',
                                name: '202312|OUTCOME_AWARENESS|AWARENESS|FB LINK|WINTER|DADS|VIDEO',
                                budget: 1706.392,
                                percentage: 100,
                                type: 'ADSET',
                                startDate: '2024-05-01T04:00:00.000Z',
                                endDate: '2024-05-31T04:00:00.000Z',
                                status: 'PAUSED',
                                daily_budget: '68.81',
                                billing_event: 'POST_ENGAGEMENT',
                                bid_strategy: 'LOWEST_COST_WITH_BID_CAP',
                                bid_amount: '5',
                                optimization_goal: 'REACH',
                                targeting: 'DADS',
                                format: 'VIDEO',
                            },
                        ],
                    },
                ],
                buyingType: 'AUCTION',
                country: '',
            },
        ],
    },
];

describe('generateCampaignsWithTimePeriodsAndAdsets', () => {
    it('returns the expected required fields for Facebook advertising payload', () => {
        const result = generateCampaignsWithTimePeriodsAndAdsets(
            orchestrationDataSample
        );
        const { campaigns } = result.find(
            channel => channel.name === 'Facebook'
        );
        // Iterate through each campaign in the result
        campaigns.forEach(campaign => {
            // Check if the campaign contains the expected properties
            expect(campaign.name).toEqual(expect.any(String));
            expect(campaign.campaignObjective).toEqual(expect.any(String));
            expect(campaign.specialAdCategories).toEqual(expect.any(String));
            expect(campaign.country).toEqual(expect.any(String));
            expect(campaign.buyingType).toEqual(expect.any(String));
        });
    });
    it('returns the expected data', () => {
        const result = generateCampaignsWithTimePeriodsAndAdsets(
            orchestrationDataSample
        );

        expect(result).toEqual(expected);
    });
    test('given the payload coantin multiples channels', () => {
        const result =
            generateCampaignsWithTimePeriodsAndAdsets(multiChannelPayload);
        const { campaigns: fbCampaigns } = result.find(
            channel => channel.name === 'Facebook'
        );
        const { campaigns: AmzCampaigns } = result.find(
            channel => channel.name === 'Amazon Advertising DSP'
        );
        const { campaigns: googleCampaigns } = result.find(
            channel => channel.name === 'Google Ads'
        );

        const timePeriods = fbCampaigns[0].timePeriods;

        expect(fbCampaigns.length).toEqual(1);
        expect(AmzCampaigns.length).toEqual(1);
        expect(googleCampaigns.length).toEqual(1);
        expect(fbCampaigns[0].timePeriods.length).toEqual(3);
        expect(AmzCampaigns[0].timePeriods.length).toEqual(3);
        expect(googleCampaigns[0].timePeriods.length).toEqual(3);
        timePeriods.forEach(timePeriod => {
            expect(timePeriod.adsets.length).toEqual(1);
            expect(timePeriod).toHaveProperty('adsets');
            expect(Array.isArray(timePeriod.adsets)).toBeTruthy();
        });
    });
});

describe('convert dollars to cents', () => {
    it('convert dollars to cents', () => {
        const dollar = 50;
        const cents = 5000;

        const expectedCents = convertToCents(dollar);

        expect(cents).toEqual(expectedCents);
    });
    it('convert dollars to cents 2 decimals', () => {
        const dollar = 1053.252;
        const cents = 105325;

        const expectedCents = convertToCents(dollar);

        expect(cents).toEqual(expectedCents);
    });
    it('convert dollars to cents 2 decimals string', () => {
        const dollar = '1053.252';
        const cents = 105325;

        const expectedCents = convertToCents(dollar);

        expect(cents).toEqual(expectedCents);
    });
    it('convert dollars to cents N decimals string', () => {
        const dollar = '73.84999999999999';
        const cents = 7385;

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
