const supertest = require('supertest');
const makeApp = require('../src/app');
const adsetFacebookPayload = require('./controllers-sample-data/orchestration-adset-facebook.json');
const campaignOrchestrationFacebookPayloadData = require('./controllers-sample-data/orchestration-facebook.json');
const { Budget, Channel, CampaignGroup, Client } = require('../src/models');
const { getUser } = require('../src/utils');

// Mocked utility functions
jest.mock('../src/utils/allocations', () => ({
    createCampaigns: jest.fn(),
}));
const { createCampaigns } = require('../src/utils/allocations');

jest.mock('../src/models', () => ({
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
    Channel: {
        findAll: jest.fn(),
    },
}));

jest.mock('../src/config/bigquery', () => ({
    bigqueryClient: {
        query: jest.fn(),
    },
}));

jest.mock('../src/utils', () => ({
    ...jest.requireActual('../src/utils'),
    getUser: jest.fn(),
}));

const getSecrets = jest.fn(() => ({
    CLIENT_ID: 'TEST',
    FACEBOOK_ACCESS_TOKEN: 'YOUR_ACCESS_TOKEN',
    CHANNELLOCK_ADVERTISER_ID: 'ADVERTISING_ID',
    DSP_PROFILE_ID: 'DSP_PROFILE_ID',
}));

const _createAmazonCampaign = jest.fn(() => {
    return Promise.resolve({ id: 'AMAZON_CAMPAIGN_ID' });
});
const _createFacebookCampaign = jest.fn(() => {
    return Promise.resolve({ id: 'FACEBOOK_CAMPAIGN_ID' });
});
const _createFacebookAdset = jest.fn(() => {
    return {};
});

const app = makeApp({
    getSecrets,
    amazon: {
        createCampaign: _createAmazonCampaign,
    },
    facebook: {
        createCampaign: _createFacebookCampaign,
        createAdset: _createFacebookAdset,
    },
});
const request = supertest(app);

describe('Campaign Endpoints Test', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Get recent campaigns', () => {
        it('200', async () => {
            const data = [
                {
                    id: 1,
                    name: 'Test campaign',
                    company_name: 'Test company name',
                    createdAt: '2023-08-11T16:47:01.294Z',
                    budgets: [
                        {
                            periods: [],
                            allocations: {
                                august_2023: {
                                    allocations: [
                                        {
                                            type: 'CHANNEL',
                                            allocations: [
                                                {
                                                    type: 'CAMPAIGN_TYPE',
                                                    allocations: [
                                                        {
                                                            type: 'CAMPAIGN',
                                                            allocations: [
                                                                {
                                                                    percentage: 100,
                                                                    type: 'ADSET',
                                                                    bigquery_adset_id:
                                                                        '137922937858',
                                                                },
                                                            ],
                                                            bidgquery_campaign_id:
                                                                '137922937858',
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                },
                            },
                        },
                    ],
                    flight_time_start: '2023-08-01T04:00:00.000Z',
                    flight_time_end: '2023-09-01T04:00:00.000Z',
                    dataValues: {},
                },
                {
                    id: 2,
                    name: 'Test campaign',
                    company_name: 'Test company name',
                    createdAt: '2023-07-11T16:38:59.516Z',
                    budgets: [
                        {
                            periods: [],
                            allocations: {
                                august_2023: {
                                    allocations: [
                                        {
                                            type: 'CHANNEL',
                                            allocations: [
                                                {
                                                    type: 'CAMPAIGN_TYPE',
                                                    allocations: [
                                                        {
                                                            type: 'CAMPAIGN',
                                                            allocations: [
                                                                {
                                                                    percentage: 100,
                                                                    type: 'ADSET',
                                                                    bigquery_adset_id:
                                                                        '137922937858',
                                                                },
                                                            ],
                                                            bidgquery_campaign_id:
                                                                '137922937858',
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                },
                            },
                        },
                    ],
                    flight_time_start: '2023-08-01T04:00:00.000Z',
                    flight_time_end: '2023-09-01T04:00:00.000Z',
                    dataValues: {},
                },
            ];

            const search = 'august';

            CampaignGroup.findAll.mockResolvedValue(data);

            const response = await request.get(
                `/api/campaigns?search=${search}`
            );
            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(data);
            expect(response.body.message).toBe(
                'Recent campaigns groups retrieved successfully'
            );
        });

        it('500', async () => {
            CampaignGroup.findAll.mockRejectedValue(new Error('Error'));
            const response = await request.get(`/api/campaigns`);

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error');
        });
    });

    describe('Get all campaigns', () => {
        const clientId = 1;

        it('404', async () => {
            Client.findOne.mockResolvedValue(null);
            const response = await request.get(
                `/api/clients/${clientId}/marketingcampaign`
            );
            expect(response.status).toBe(404);
            expect(response.body.message).toBe(`Client not found`);
        });

        it('200', async () => {
            const data = [
                {
                    id: 1,
                    name: 'Campaña 1',
                    client: 'Test Client 1',
                    company_name: 'Company',
                    goals: '1',
                    total_gross_budget: 1,
                    margin: 1,
                    flight_time_start: '2022-11-11 00:00:00-04',
                    flight_time_end: '2023-11-11 00:00:00-04',
                    net_budget: 1,
                    channels: 'a,b,c',
                    createdAt: '2023-07-07 18:13:23.552748-04',
                    updatedAt: '2023-07-07 18:13:23.552748-04',
                    dataValues: {},
                    budgets: [
                        {
                            periods: [],
                            allocations: {
                                august_2023: {
                                    allocations: [
                                        {
                                            type: 'CHANNEL',
                                            allocations: [
                                                {
                                                    type: 'CAMPAIGN_TYPE',
                                                    allocations: [
                                                        {
                                                            type: 'CAMPAIGN',
                                                            allocations: [
                                                                {
                                                                    percentage: 100,
                                                                    type: 'ADSET',
                                                                    bigquery_adset_id:
                                                                        '137922937858',
                                                                },
                                                            ],
                                                            bidgquery_campaign_id:
                                                                '137922937858',
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                },
                            },
                        },
                    ],
                },
            ];

            Client.findOne.mockResolvedValue({
                id: 1,
                name: 'Test Client 1',
            });
            CampaignGroup.findAll.mockResolvedValue(data);

            const response = await request.get(
                `/api/clients/${clientId}/marketingcampaign`
            );
            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(data);
            expect(response.body.message).toBe(
                'Marketing campaigns retrieved successfully'
            );
        });

        it('500', async () => {
            CampaignGroup.findAll.mockRejectedValue(new Error('Error'));
            const response = await request.get(
                `/api/clients/${clientId}/marketingcampaign`
            );

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error');
        });
    });

    describe('Get campaign by id', () => {
        const clientId = 1;
        const campaignId = 1;

        it('404 client', async () => {
            Client.findOne.mockResolvedValue(null);
            const response = await request.get(
                `/api/clients/${clientId}/marketingcampaign/${campaignId}`
            );
            expect(response.status).toBe(404);
            expect(response.body.message).toBe(`Client not found`);
        });

        it('404 campaigns', async () => {
            Client.findOne.mockResolvedValue({
                id: 1,
                name: 'Test Client 1',
            });
            CampaignGroup.findOne.mockResolvedValue(null);
            const response = await request.get(
                `/api/clients/${clientId}/marketingcampaign/${campaignId}`
            );
            expect(response.status).toBe(404);
            expect(response.body.message).toBe(`Marketing campaign not found`);
        });

        it('200', async () => {
            const data = {
                id: 1,
                name: 'Campaña 1',
                client: 'Test Client 1',
                company_name: 'Company',
                goals: '1',
                total_gross_budget: 1,
                margin: 1,
                flight_time_start: '2022-11-11 00:00:00-04',
                flight_time_end: '2023-11-11 00:00:00-04',
                net_budget: 1,
                channels: 'a,b,c',
                createdAt: '2023-07-07 18:13:23.552748-04',
                updatedAt: '2023-07-07 18:13:23.552748-04',
                dataValues: {},
                budgets: [
                    {
                        periods: [],
                        allocations: {
                            august_2023: {
                                allocations: [
                                    {
                                        type: 'CHANNEL',
                                        allocations: [
                                            {
                                                type: 'CAMPAIGN_TYPE',
                                                allocations: [
                                                    {
                                                        type: 'CAMPAIGN',
                                                        allocations: [
                                                            {
                                                                percentage: 100,
                                                                type: 'ADSET',
                                                                bigquery_adset_id:
                                                                    '137922937858',
                                                            },
                                                        ],
                                                        bidgquery_campaign_id:
                                                            '137922937858',
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                ],
                            },
                        },
                    },
                ],
            };

            Client.findOne.mockResolvedValue({
                id: 1,
                name: 'Test Client 1',
            });
            CampaignGroup.findOne.mockResolvedValue(data);

            const response = await request.get(
                `/api/clients/${clientId}/marketingcampaign/${campaignId}`
            );
            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(data);
            expect(response.body.message).toBe(
                'Marketing campaign retrieved successfully'
            );
        });

        it('500', async () => {
            CampaignGroup.findOne.mockRejectedValue(new Error('Error'));
            const response = await request.get(
                `/api/clients/${clientId}/marketingcampaign/${campaignId}`
            );

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error');
        });
    });

    describe('Create campaign', () => {
        const clientId = 1;
        const campaignId = 1;

        it('404 client', async () => {
            Client.findOne.mockResolvedValue(null);
            const user = {
                id: 1,
                username: '123',
            };
            getUser.mockResolvedValue(user);
            const response = await request.post(
                `/api/clients/${clientId}/marketingcampaign`
            );
            expect(response.status).toBe(404);
            expect(response.body.message).toBe(`Client not found`);
        });

        it('400', async () => {
            Client.findOne.mockResolvedValue({
                id: 1,
                name: 'Test Client 1',
            });
            const user = {
                id: 1,
                username: '123',
            };
            getUser.mockResolvedValue(user);
            const response = await request.post(
                `/api/clients/${clientId}/marketingcampaign`
            );

            expect(response.status).toBe(400);
            expect(response.body.message).toBe(
                `Missing required fields: name, goals, total_gross_budget, flight_time_start, flight_time_end, net_budget, periods, channels, allocations`
            );
        });

        it('201', async () => {
            const sendData = {
                name: 'Campaña 1',
                goals: 'test',
                total_gross_budget: 123,
                margin: 0.12,
                flight_time_start: '2023-02-01T04:00:00.000Z',
                flight_time_end: '2023-03-01T04:00:00.000Z',
                net_budget: '108.24',
                channels: [
                    { id: '1', name: 'Google Ads' },
                    { id: '2', name: 'Amazon Advertising' },
                ],
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
            const data = {
                id: 1,
                ...sendData,
                createdAt: '2023-07-07 18:13:23.552748-04',
                updatedAt: '2023-07-07 18:13:23.552748-04',
                get: jest.fn().mockResolvedValue({
                    campaigns: [
                        {
                            id: 1,
                            name: 'Test Campaign 1',
                        },
                    ],
                }),
            };
            const user = {
                id: 1,
                username: '123',
            };

            getUser.mockResolvedValue(user);

            Client.findOne.mockResolvedValue({
                id: 1,
                name: 'Test Client 1',
            });

            Channel.findAll.mockResolvedValue([
                { id: 2, name: 'Amazon Advertising' },
            ]);

            createCampaigns.mockImplementation(() => ({
                errors: [],
                successes: [{ y: 'success' }],
            }));
            CampaignGroup.create.mockResolvedValue(data);
            Budget.create.mockResolvedValue(data.budget);

            const response = await request
                .post(`/api/clients/${clientId}/marketingcampaign`)
                .send(sendData);

            console.log(response.body);

            expect(response.status).toBe(201);
            expect(response.body.data).toEqual({
                budgets: data.budget,
            });
            expect(response.body.message).toBe(
                'Marketing campaign created successfully'
            );
        });

        it('500', async () => {
            const user = {
                id: 1,
                username: '123',
            };
            getUser.mockResolvedValue(user);
            Client.findOne.mockRejectedValue(new Error('Error'));
            const response = await request.post(
                `/api/clients/${clientId}/marketingcampaign`
            );
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error');
        });

        describe('Test Amazon DSP Campaigns Creation', () => {
            test("Given the payload doesn't contain a Amazon campaign, the Amazon API should not be called", async () => {
                const campaignOrchestrationPayloadData = {
                    name: 'Campaña 1',
                    goals: 'test',
                    total_gross_budget: 123,
                    margin: 0.12,
                    flight_time_start: '2023-02-01T04:00:00.000Z',
                    flight_time_end: '2023-03-01T04:00:00.000Z',
                    net_budget: '108.24',
                    channels: [
                        { id: '1', name: 'Google Ads' },
                        { id: '2', name: 'Facebook' },
                    ],
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
                                    name: 'Facebook',
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
                                    name: 'Facebook',
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
                    facebookAdAccountId: 'YOUR_AD_ACCOUNT_ID',
                };
                const data = {
                    id: 1,
                    ...campaignOrchestrationPayloadData,
                    createdAt: '2023-07-07 18:13:23.552748-04',
                    updatedAt: '2023-07-07 18:13:23.552748-04',
                    get: jest.fn().mockResolvedValue({
                        campaigns: [
                            {
                                id: 1,
                                name: 'Test Campaign 1',
                            },
                        ],
                    }),
                };
                const user = {
                    id: 1,
                    username: '123',
                };

                Channel.findAll.mockResolvedValue([
                    { id: 2, name: 'Amazon Advertising' },
                    { id: 3, name: 'Facebook' },
                ]);

                getUser.mockResolvedValue(user);

                createCampaigns.mockImplementation(() => ({
                    errors: [],
                    successes: [{ y: 'success' }],
                }));
                Client.findOne.mockResolvedValue({
                    id: 1,
                    name: 'Test Client 1',
                });
                CampaignGroup.create.mockResolvedValue(data);
                Budget.create.mockResolvedValue(data.budget);

                const response = await request
                    .post(`/api/clients/${clientId}/marketingcampaign`)
                    .send(campaignOrchestrationPayloadData);

                expect(_createAmazonCampaign).not.toHaveBeenCalled();
            });
            test('Given the payload contain 2 Amazon campaign, the Amazon API should be called 2 times', async () => {
                const campaignOrchestrationPayloadData = {
                    name: 'AMZ Manuel test 4',
                    goals: 'Sale More',
                    total_gross_budget: 10000,
                    margin: 0.15,
                    flight_time_start: '2023-01-01T04:00:00.000Z',
                    flight_time_end: '2023-02-01T04:00:00.000Z',
                    net_budget: '8500.00',
                    change_reason_log: '',
                    channels: [
                        {
                            id: '7',
                            name: 'TikTok Ads',
                            isApiEnabled: false,
                        },
                        {
                            id: '2',
                            name: 'Amazon Advertising',
                            isApiEnabled: true,
                        },
                    ],
                    allocations: {
                        january_2023: {
                            budget: 4250,
                            percentage: 50,
                            allocations: [
                                {
                                    id: '7',
                                    name: 'TikTok Ads',
                                    isApiEnabled: false,
                                    budget: 2125,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    allocations: [],
                                },
                                {
                                    id: '2',
                                    name: 'Amazon Advertising',
                                    isApiEnabled: true,
                                    budget: 2125,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    allocations: [
                                        {
                                            id: '2-Sponsored Ads',
                                            name: 'Sponsored Ads',
                                            budget: 2125,
                                            percentage: 100,
                                            type: 'CAMPAIGN_TYPE',
                                            allocations: [
                                                {
                                                    id: '2-Sponsored Ads-test-campaign',
                                                    name: 'test-campaign',
                                                    budget: 2125,
                                                    percentage: 100,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '2-Sponsored Ads-test-campaign-test-campaign-adset',
                                                            name: 'test-campaign-adset',
                                                            budget: 2125,
                                                            percentage: 100,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                                {
                                                    id: '3-Sponsored Ads-test-campaign',
                                                    name: 'test-campaign-3',
                                                    budget: 2125,
                                                    percentage: 100,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '2-Sponsored Ads-test-campaign-test-campaign-adset',
                                                            name: 'test-campaign-adset',
                                                            budget: 2125,
                                                            percentage: 100,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                        february_2023: {
                            budget: 4250,
                            percentage: 50,
                            allocations: [
                                {
                                    id: '7',
                                    name: 'TikTok Ads',
                                    isApiEnabled: false,
                                    budget: 2125,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    allocations: [],
                                },
                                {
                                    id: '2',
                                    name: 'Amazon Advertising',
                                    isApiEnabled: true,
                                    budget: 2125,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    allocations: [
                                        {
                                            id: '2-Sponsored Ads',
                                            name: 'Sponsored Ads',
                                            budget: 2125,
                                            percentage: 100,
                                            type: 'CAMPAIGN_TYPE',
                                            allocations: [
                                                {
                                                    id: '2-Sponsored Ads-test-campaign',
                                                    name: 'test-campaign',
                                                    budget: 2125,
                                                    percentage: 100,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '2-Sponsored Ads-test-campaign-test-campaign-adset',
                                                            name: 'test-campaign-adset',
                                                            budget: 2125,
                                                            percentage: 100,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                                {
                                                    id: '3-Sponsored Ads-test-campaign',
                                                    name: 'test-campaign-3',
                                                    budget: 2125,
                                                    percentage: 100,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '2-Sponsored Ads-test-campaign-test-campaign-adset',
                                                            name: 'test-campaign-adset',
                                                            budget: 2125,
                                                            percentage: 100,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                    periods: [
                        {
                            id: 'january_2023',
                            label: 'January 2023',
                            days: 31,
                        },
                        {
                            id: 'february_2023',
                            label: 'February 2023',
                            days: 28,
                        },
                    ],
                    status: 'Not tracking',
                };

                const data = {
                    id: 1,
                    ...campaignOrchestrationPayloadData,
                    createdAt: '2023-07-07 18:13:23.552748-04',
                    updatedAt: '2023-07-07 18:13:23.552748-04',
                    get: jest.fn().mockResolvedValue({
                        campaigns: [
                            {
                                id: 1,
                                name: 'Test Campaign 1',
                            },
                        ],
                    }),
                };
                const user = {
                    id: 1,
                    username: '123',
                };

                Channel.findAll.mockResolvedValue([
                    { id: 2, name: 'Amazon Advertising' },
                    { id: 3, name: 'Facebook' },
                ]);

                getUser.mockResolvedValue(user);

                createCampaigns.mockImplementation(() => ({
                    errors: [],
                    successes: [{ y: 'success' }],
                }));
                Client.findOne.mockResolvedValue({
                    id: 1,
                    name: 'Test Client 1',
                });
                CampaignGroup.create.mockResolvedValue(data);
                Budget.create.mockResolvedValue(data.budget);

                await request
                    .post(`/api/clients/${clientId}/marketingcampaign`)
                    .send(campaignOrchestrationPayloadData);

                expect(_createAmazonCampaign).toHaveBeenCalledTimes(2);
            });
            it('should call the Amazon API with specific parameters', async () => {
                const campaignOrchestrationPayloadData = {
                    name: 'AMZ Manuel test 4',
                    goals: 'Sale More',
                    total_gross_budget: 10000,
                    margin: 0.15,
                    flight_time_start: '2023-01-01T04:00:00.000Z',
                    flight_time_end: '2023-02-01T04:00:00.000Z',
                    net_budget: '8500.00',
                    change_reason_log: '',
                    channels: [
                        {
                            id: '7',
                            name: 'TikTok Ads',
                            isApiEnabled: false,
                        },
                        {
                            id: '2',
                            name: 'Amazon Advertising',
                            isApiEnabled: true,
                        },
                    ],
                    allocations: {
                        january_2023: {
                            budget: 4250,
                            percentage: 50,
                            allocations: [
                                {
                                    id: '7',
                                    name: 'TikTok Ads',
                                    isApiEnabled: false,
                                    budget: 2125,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    allocations: [],
                                },
                                {
                                    id: '2',
                                    name: 'Amazon Advertising',
                                    isApiEnabled: true,
                                    budget: 2125,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    allocations: [
                                        {
                                            id: '2-Sponsored Ads',
                                            name: 'Sponsored Ads',
                                            budget: 2125,
                                            percentage: 100,
                                            type: 'CAMPAIGN_TYPE',
                                            allocations: [
                                                {
                                                    id: '2-Sponsored Ads-test-campaign',
                                                    name: 'test-campaign',
                                                    budget: 2125,
                                                    percentage: 100,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '2-Sponsored Ads-test-campaign-test-campaign-adset',
                                                            name: 'test-campaign-adset',
                                                            budget: 2125,
                                                            percentage: 100,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                    frequencyCapMaxImpressions: 10,
                                                    frequencyCapTimeUnit: 'day',
                                                    frequencyCapTimeUnitCount: 7,
                                                    frequencyCapType: 'CUSTOM',
                                                    orderGoal: 'Increase Sales',
                                                    orderGoalKpi: 'Revenue',
                                                    productLocation: 'New York',
                                                    recurrenceTimePeriod:
                                                        'Monthly',
                                                },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                        february_2023: {
                            budget: 4250,
                            percentage: 50,
                            allocations: [
                                {
                                    id: '7',
                                    name: 'TikTok Ads',
                                    isApiEnabled: false,
                                    budget: 2125,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    allocations: [],
                                },
                                {
                                    id: '2',
                                    name: 'Amazon Advertising',
                                    isApiEnabled: true,
                                    budget: 2125,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    allocations: [
                                        {
                                            id: '2-Sponsored Ads',
                                            name: 'Sponsored Ads',
                                            budget: 2125,
                                            percentage: 100,
                                            type: 'CAMPAIGN_TYPE',
                                            allocations: [
                                                {
                                                    id: '2-Sponsored Ads-test-campaign',
                                                    name: 'test-campaign',
                                                    budget: 2125,
                                                    percentage: 100,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '2-Sponsored Ads-test-campaign-test-campaign-adset',
                                                            name: 'test-campaign-adset',
                                                            budget: 2125,
                                                            percentage: 100,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                    frequencyCapMaxImpressions: 10,
                                                    frequencyCapTimeUnit: 'day',
                                                    frequencyCapTimeUnitCount: 7,
                                                    frequencyCapType: 'CUSTOM',
                                                    orderGoal: 'Increase Sales',
                                                    orderGoalKpi: 'Revenue',
                                                    productLocation: 'New York',
                                                    recurrenceTimePeriod:
                                                        'Monthly',
                                                },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                    periods: [
                        {
                            id: 'january_2023',
                            label: 'January 2023',
                            days: 31,
                        },
                        {
                            id: 'february_2023',
                            label: 'February 2023',
                            days: 28,
                        },
                    ],
                    status: 'Not tracking',
                };
                const data = {
                    id: 1,
                    ...campaignOrchestrationPayloadData,
                    createdAt: '2023-07-07 18:13:23.552748-04',
                    updatedAt: '2023-07-07 18:13:23.552748-04',
                    get: jest.fn().mockResolvedValue({
                        campaigns: [
                            {
                                id: 1,
                                name: 'Test Campaign 1',
                            },
                        ],
                    }),
                };
                const user = {
                    id: 1,
                    username: '123',
                };

                Channel.findAll.mockResolvedValue([
                    { id: 2, name: 'Amazon Advertising' },
                    { id: 3, name: 'Facebook' },
                ]);

                getUser.mockResolvedValue(user);

                createCampaigns.mockImplementation(() => ({
                    errors: [],
                    successes: [{ y: 'success' }],
                }));
                Client.findOne.mockResolvedValue({
                    id: 1,
                    name: 'Test Client 1',
                });
                CampaignGroup.create.mockResolvedValue(data);
                Budget.create.mockResolvedValue(data.budget);

                const response = await request
                    .post(`/api/clients/${clientId}/marketingcampaign`)
                    .send(campaignOrchestrationPayloadData);

                // Check if _createFAcebook was called with the expected parameters
                expect(_createAmazonCampaign).toHaveBeenCalledWith({
                    access: { ACCESS_TOKEN: '123', CLIENT_ID: 'TEST' },
                    campaign: {
                        id: '2-Sponsored Ads-test-campaign',
                        name: 'test-campaign',
                        advertiserId: 'ADVERTISING_ID',
                        budget: 4250,
                        endDate: '2023-02-01',
                        frequencyCapMaxImpressions: 10,
                        frequencyCapTimeUnit: 'day',
                        frequencyCapTimeUnitCount: 7,
                        frequencyCapType: 'CUSTOM',
                        goal: 'Increase Sales',
                        goalKpi: 'Revenue',
                        productLocation: 'New York',
                        recurrenceTimePeriod: 'Monthly',
                        startDate: '2023-01-01',
                        type: 'Sponsored Ads',
                    },
                    profileId: 'DSP_PROFILE_ID',
                    type: 'Sponsored Ads',
                });
            });
            test('Given the payload contains 2 facebook campaigns and one faild to create, the endpoint should return an object with the llist of failed campaigns', async () => {
                const campaignOrchestrationPayloadData = {
                    name: 'AMZ Manuel test 4',
                    goals: 'Sale More',
                    total_gross_budget: 10000,
                    margin: 0.15,
                    flight_time_start: '2023-01-01T04:00:00.000Z',
                    flight_time_end: '2023-02-01T04:00:00.000Z',
                    net_budget: '8500.00',
                    change_reason_log: '',
                    channels: [
                        {
                            id: '7',
                            name: 'TikTok Ads',
                            isApiEnabled: false,
                        },
                        {
                            id: '2',
                            name: 'Amazon Advertising',
                            isApiEnabled: true,
                        },
                    ],
                    allocations: {
                        january_2023: {
                            budget: 4250,
                            percentage: 50,
                            allocations: [
                                {
                                    id: '7',
                                    name: 'TikTok Ads',
                                    isApiEnabled: false,
                                    budget: 2125,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    allocations: [],
                                },
                                {
                                    id: '2',
                                    name: 'Amazon Advertising',
                                    isApiEnabled: true,
                                    budget: 2125,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    allocations: [
                                        {
                                            id: '2-Sponsored Ads',
                                            name: 'Sponsored Ads',
                                            budget: 2125,
                                            percentage: 100,
                                            type: 'CAMPAIGN_TYPE',
                                            allocations: [
                                                {
                                                    id: '2-Sponsored Ads-test-campaign',
                                                    name: 'test-campaign',
                                                    budget: 2125,
                                                    percentage: 100,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '2-Sponsored Ads-test-campaign-test-campaign-adset',
                                                            name: 'test-campaign-adset',
                                                            budget: 2125,
                                                            percentage: 100,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                                {
                                                    id: '3-Sponsored Ads-test-campaign',
                                                    name: 'test-campaign-3',
                                                    budget: 2125,
                                                    percentage: 100,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '2-Sponsored Ads-test-campaign-test-campaign-adset',
                                                            name: 'test-campaign-adset',
                                                            budget: 2125,
                                                            percentage: 100,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                        february_2023: {
                            budget: 4250,
                            percentage: 50,
                            allocations: [
                                {
                                    id: '7',
                                    name: 'TikTok Ads',
                                    isApiEnabled: false,
                                    budget: 2125,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    allocations: [],
                                },
                                {
                                    id: '2',
                                    name: 'Amazon Advertising',
                                    isApiEnabled: true,
                                    budget: 2125,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    allocations: [
                                        {
                                            id: '2-Sponsored Ads',
                                            name: 'Sponsored Ads',
                                            budget: 2125,
                                            percentage: 100,
                                            type: 'CAMPAIGN_TYPE',
                                            allocations: [
                                                {
                                                    id: '2-Sponsored Ads-test-campaign',
                                                    name: 'test-campaign',
                                                    budget: 2125,
                                                    percentage: 100,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '2-Sponsored Ads-test-campaign-test-campaign-adset',
                                                            name: 'test-campaign-adset',
                                                            budget: 2125,
                                                            percentage: 100,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                                {
                                                    id: '3-Sponsored Ads-test-campaign',
                                                    name: 'test-campaign-3',
                                                    budget: 2125,
                                                    percentage: 100,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '2-Sponsored Ads-test-campaign-test-campaign-adset',
                                                            name: 'test-campaign-adset',
                                                            budget: 2125,
                                                            percentage: 100,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                    periods: [
                        {
                            id: 'january_2023',
                            label: 'January 2023',
                            days: 31,
                        },
                        {
                            id: 'february_2023',
                            label: 'February 2023',
                            days: 28,
                        },
                    ],
                    status: 'Not tracking',
                };
                const data = {
                    id: 1,
                    ...campaignOrchestrationPayloadData,
                    createdAt: '2023-07-07 18:13:23.552748-04',
                    updatedAt: '2023-07-07 18:13:23.552748-04',
                    get: jest.fn().mockResolvedValue({
                        campaigns: [
                            {
                                id: 1,
                                name: 'Test Campaign 1',
                            },
                        ],
                    }),
                };
                const user = {
                    id: 1,
                    username: '123',
                };

                Channel.findAll.mockResolvedValue([
                    { id: 2, name: 'Amazon Advertising' },
                    { id: 3, name: 'Facebook' },
                ]);

                getUser.mockResolvedValue(user);

                createCampaigns.mockImplementation(() => ({
                    errors: [],
                    successes: [{ y: 'success' }],
                }));
                Client.findOne.mockResolvedValue({
                    id: 1,
                    name: 'Test Client 1',
                });
                CampaignGroup.create.mockResolvedValue(data);
                Budget.create.mockResolvedValue(data.budget);

                _createAmazonCampaign.mockRejectedValueOnce({
                    response: {
                        data: {
                            error: 'Bad Request',
                            message: 'Invalid campaign data',
                        },
                        status: 400, // Or any other non-2xx status code
                        statusText: 'Bad Request',
                        headers: {},
                    },
                });

                _createAmazonCampaign.mockResolvedValueOnce({
                    data: { id: 'AMAZON_CAMPAIGN_ID' },
                    status: 200,
                    statusText: 'OK',
                    headers: {},
                });

                const response = await request
                    .post(`/api/clients/${clientId}/marketingcampaign`)
                    .send(campaignOrchestrationPayloadData);

                expect(response.status).toBe(207);
                expect(_createAmazonCampaign).toHaveBeenCalledTimes(2);
                expect(response.body).toEqual({
                    code: 207,
                    data: {
                        amazonData: {
                            error: [
                                {
                                    name: 'test-campaign',
                                    response: {
                                        data: {
                                            error: 'Bad Request',
                                            message: 'Invalid campaign data',
                                        },
                                        headers: {},
                                        status: 400,
                                        statusText: 'Bad Request',
                                    },
                                },
                            ],
                            success: [
                                {
                                    data: {
                                        id: 'AMAZON_CAMPAIGN_ID',
                                    },
                                    headers: {},
                                    status: 200,
                                    statusText: 'OK',
                                },
                            ],
                        },
                    },
                    message: 'Marketing campaign created with errors',
                });

                _createAmazonCampaign.mockClear();
            });
        });

        describe('Test Facebook Campaigns Creation', () => {
            test("Given the payload doesn't contain a Facebook campaign, the Facebook API should not be called", async () => {
                const campaignOrchestrationPayloadData = {
                    name: 'Campaña 1',
                    goals: 'test',
                    total_gross_budget: 123,
                    margin: 0.12,
                    flight_time_start: '2023-02-01T04:00:00.000Z',
                    flight_time_end: '2023-03-01T04:00:00.000Z',
                    net_budget: '108.24',
                    channels: [
                        { id: '1', name: 'Google Ads' },
                        { id: '2', name: 'Amazon Advertising' },
                    ],
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
                    facebookAdAccountId: 'YOUR_AD_ACCOUNT_ID',
                };
                const data = {
                    id: 1,
                    ...campaignOrchestrationPayloadData,
                    createdAt: '2023-07-07 18:13:23.552748-04',
                    updatedAt: '2023-07-07 18:13:23.552748-04',
                    get: jest.fn().mockResolvedValue({
                        campaigns: [
                            {
                                id: 1,
                                name: 'Test Campaign 1',
                            },
                        ],
                    }),
                };
                const user = {
                    id: 1,
                    username: '123',
                };

                Channel.findAll.mockResolvedValue([
                    { id: 2, name: 'Amazon Advertising' },
                    { id: 3, name: 'Facebook' },
                ]);

                getUser.mockResolvedValue(user);

                createCampaigns.mockResolvedValue({
                    errors: [],
                    successes: [{ y: 'success' }],
                });
                Client.findOne.mockResolvedValue({
                    id: 1,
                    name: 'Test Client 1',
                });
                CampaignGroup.create.mockResolvedValue(data);
                Budget.create.mockResolvedValue(data.budget);

                const response = await request
                    .post(`/api/clients/${clientId}/marketingcampaign`)
                    .send(campaignOrchestrationPayloadData);

                expect(_createFacebookCampaign).not.toHaveBeenCalled();
            });
            test('Given the payload  contain a Facebook campaign, the Facebook API should be called', async () => {
                const data = {
                    id: 1,
                    ...campaignOrchestrationFacebookPayloadData,
                    createdAt: '2023-07-07 18:13:23.552748-04',
                    updatedAt: '2023-07-07 18:13:23.552748-04',
                    get: jest.fn().mockResolvedValue({
                        campaigns: [
                            {
                                id: 1,
                                name: 'Test Campaign 1',
                            },
                        ],
                    }),
                };
                const user = {
                    id: 1,
                    username: '123',
                };

                Channel.findAll.mockResolvedValue([
                    { id: 2, name: 'Amazon Advertising' },
                    { id: 3, name: 'Facebook' },
                ]);

                getUser.mockResolvedValue(user);

                createCampaigns.mockImplementation(() => ({
                    errors: [],
                    successes: [{ y: 'success' }],
                }));
                Client.findOne.mockResolvedValue({
                    id: 1,
                    name: 'Test Client 1',
                });
                CampaignGroup.create.mockResolvedValue(data);
                Budget.create.mockResolvedValue(data.budget);

                await request
                    .post(`/api/clients/${clientId}/marketingcampaign`)
                    .send(campaignOrchestrationFacebookPayloadData);

                expect(_createFacebookCampaign).toHaveBeenCalled();
            });
            test('Given the payload  contain 2 Facebook campaign, the Facebook API should be called 2 Times', async () => {
                const data = {
                    id: 1,
                    ...campaignOrchestrationFacebookPayloadData,
                    createdAt: '2023-07-07 18:13:23.552748-04',
                    updatedAt: '2023-07-07 18:13:23.552748-04',
                    get: jest.fn().mockResolvedValue({
                        campaigns: [
                            {
                                id: 1,
                                name: 'Test Campaign 1',
                            },
                        ],
                    }),
                };
                const user = {
                    id: 1,
                    username: '123',
                };

                Channel.findAll.mockResolvedValue([
                    { id: 2, name: 'Amazon Advertising' },
                    { id: 3, name: 'Facebook' },
                ]);

                getUser.mockResolvedValue(user);

                createCampaigns.mockImplementation(() => ({
                    errors: [],
                    successes: [{ y: 'success' }],
                }));
                Client.findOne.mockResolvedValue({
                    id: 1,
                    name: 'Test Client 1',
                });
                CampaignGroup.create.mockResolvedValue(data);
                Budget.create.mockResolvedValue(data.budget);

                const response = await request
                    .post(`/api/clients/${clientId}/marketingcampaign`)
                    .send(campaignOrchestrationFacebookPayloadData);

                expect(_createFacebookCampaign).toHaveBeenCalledTimes(2);
            });
            it('should the Facebook API with specific parameters', async () => {
                const campaignOrchestrationPayloadData = {
                    name: 'Campaña 1',
                    goals: 'test',
                    total_gross_budget: 123,
                    margin: 0.12,
                    flight_time_start: '2023-02-01T04:00:00.000Z',
                    flight_time_end: '2023-03-01T04:00:00.000Z',
                    net_budget: '108.24',
                    channels: [
                        { id: '1', name: 'Facebook' },
                        { id: '2', name: 'Amazon Advertising' },
                    ],
                    facebookAdAccountId: 'YOUR_AD_ACCOUNT_ID',
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
                                    id: '4',
                                    name: 'Facebook',
                                    isApiEnabled: false,
                                    budget: 561,
                                    percentage: 33,
                                    type: 'CHANNEL',
                                    allocations: [
                                        {
                                            id: '4-CONVERSIONS',
                                            name: 'CONVERSIONS',
                                            budget: 280.5,
                                            percentage: 50,
                                            type: 'CAMPAIGN_TYPE',
                                            allocations: [
                                                {
                                                    id: '4-CONVERSIONS-test-api-2',
                                                    name: 'test-api-2',
                                                    budget: 280.5,
                                                    percentage: 100,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    objective:
                                                        'OUTCOME_AWARENESS',
                                                    specialAdCategories: 'NONE',
                                                },
                                            ],
                                        },
                                        {
                                            id: '4-POST_ENGAGEMENT',
                                            name: 'POST_ENGAGEMENT',
                                            budget: 280.5,
                                            percentage: 50,
                                            type: 'CAMPAIGN_TYPE',
                                            allocations: [
                                                {
                                                    id: '4-POST_ENGAGEMENT-Manuel-API-test-1',
                                                    name: 'Manuel-API-test-1',
                                                    budget: 280.5,
                                                    percentage: 100,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    objective:
                                                        'OUTCOME_AWARENESS',
                                                    specialAdCategories: 'NONE',
                                                },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    id: '6',
                                    name: 'Reddit',
                                    isApiEnabled: false,
                                    budget: 561,
                                    percentage: 33,
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
                                    id: '4',
                                    name: 'Facebook',
                                    isApiEnabled: false,
                                    budget: 561,
                                    percentage: 33,
                                    type: 'CHANNEL',
                                    allocations: [
                                        {
                                            id: '4-CONVERSIONS',
                                            name: 'CONVERSIONS',
                                            budget: 280.5,
                                            percentage: 50,
                                            type: 'CAMPAIGN_TYPE',
                                            allocations: [
                                                {
                                                    id: '4-CONVERSIONS-test-api-2',
                                                    name: 'test-api-2',
                                                    budget: 280.5,
                                                    percentage: 100,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    objective:
                                                        'OUTCOME_AWARENESS',
                                                    specialAdCategories: 'NONE',
                                                },
                                            ],
                                        },
                                        {
                                            id: '4-POST_ENGAGEMENT',
                                            name: 'POST_ENGAGEMENT',
                                            budget: 280.5,
                                            percentage: 50,
                                            type: 'CAMPAIGN_TYPE',
                                            allocations: [
                                                {
                                                    id: '4-POST_ENGAGEMENT-Manuel-API-test-1',
                                                    name: 'Manuel-API-test-1',
                                                    budget: 280.5,
                                                    percentage: 100,
                                                    objective:
                                                        'OUTCOME_AWARENESS',
                                                    specialAdCategories: 'NONE',
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    id: '6',
                                    name: 'Reddit',
                                    isApiEnabled: false,
                                    budget: 561,
                                    percentage: 33,
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
                const data = {
                    id: 1,
                    ...campaignOrchestrationPayloadData,
                    createdAt: '2023-07-07 18:13:23.552748-04',
                    updatedAt: '2023-07-07 18:13:23.552748-04',
                    get: jest.fn().mockResolvedValue({
                        campaigns: [
                            {
                                id: 1,
                                name: 'Test Campaign 1',
                            },
                        ],
                    }),
                };
                const user = {
                    id: 1,
                    username: '123',
                };

                Channel.findAll.mockResolvedValue([
                    { id: 2, name: 'Amazon Advertising' },
                    { id: 3, name: 'Facebook' },
                ]);

                getUser.mockResolvedValue(user);

                createCampaigns.mockImplementation(() => ({
                    errors: [],
                    successes: [{ y: 'success' }],
                }));
                Client.findOne.mockResolvedValue({
                    id: 1,
                    name: 'Test Client 1',
                });
                CampaignGroup.create.mockResolvedValue(data);
                Budget.create.mockResolvedValue(data.budget);

                await request
                    .post(`/api/clients/${clientId}/marketingcampaign`)
                    .send(campaignOrchestrationPayloadData);

                // Check if _createFAcebook was called with the expected parameters
                expect(_createFacebookCampaign).toHaveBeenCalledWith(
                    'YOUR_ACCESS_TOKEN',
                    'YOUR_AD_ACCOUNT_ID',
                    {
                        name: 'Manuel-API-test-1',
                        objective: 'OUTCOME_AWARENESS',
                        special_ad_categories: 'NONE',
                        status: 'PAUSED',
                    }
                );
            });
            test('Given the payload contains 2 facebook campaigns and one faild to create, the endpoint should return an object with the llist of failed campaigns', async () => {
                const data = {
                    id: 1,
                    ...campaignOrchestrationFacebookPayloadData,
                    createdAt: '2023-07-07 18:13:23.552748-04',
                    updatedAt: '2023-07-07 18:13:23.552748-04',
                    get: jest.fn().mockResolvedValue({
                        campaigns: [
                            {
                                id: 1,
                                name: 'Test Campaign 1',
                            },
                        ],
                    }),
                };
                const user = {
                    id: 1,
                    username: '123',
                };

                Channel.findAll.mockResolvedValue([
                    { id: 2, name: 'Amazon Advertising' },
                    { id: 3, name: 'Facebook' },
                ]);

                getUser.mockResolvedValue(user);

                createCampaigns.mockImplementation(() => ({
                    errors: [],
                    successes: [{ y: 'success' }],
                }));
                Client.findOne.mockResolvedValue({
                    id: 1,
                    name: 'Test Client 1',
                });
                CampaignGroup.create.mockResolvedValue(data);
                Budget.create.mockResolvedValue(data.budget);

                _createFacebookCampaign.mockRejectedValueOnce({
                    response: {
                        data: {
                            error: 'Bad Request',
                            message: 'Invalid campaign data',
                        },
                        status: 400, // Or any other non-2xx status code
                        statusText: 'Bad Request',
                        headers: {},
                    },
                });

                _createFacebookCampaign.mockResolvedValueOnce({
                    data: { id: 'FACEBOOK_CAMPAIGN_ID' },
                    status: 200,
                    statusText: 'OK',
                    headers: {},
                });

                const response = await request
                    .post(`/api/clients/${clientId}/marketingcampaign`)
                    .send(campaignOrchestrationFacebookPayloadData);

                expect(response.status).toBe(207);
                expect(_createFacebookCampaign).toHaveBeenCalledTimes(2);
                expect(response.body).toEqual({
                    code: 207,
                    data: {
                        amazonData: {
                            error: null,
                            success: null,
                        },
                        facebook: {
                            error: [
                                {
                                    name: 'test-api-2',
                                    response: {
                                        data: {
                                            error: 'Bad Request',
                                            message: 'Invalid campaign data',
                                        },
                                        headers: {},
                                        status: 400,
                                        statusText: 'Bad Request',
                                    },
                                },
                            ],
                            success: [
                                {
                                    data: {
                                        id: 'FACEBOOK_CAMPAIGN_ID',
                                    },
                                    headers: {},
                                    status: 200,
                                    statusText: 'OK',
                                },
                            ],
                            adsets: {
                                success: expect.any(Array),
                                error: expect.any(Array),
                            },
                        },
                    },
                    message: 'Marketing campaign created with errors',
                });

                _createFacebookCampaign.mockClear();
            });
        });

        describe('Test Facebook Adset Creation', () => {
            test("Given the payload doesn't contain a Facebook Adset, the Facebook Adset API should not be called", async () => {
                const data = {
                    id: 1,
                    ...campaignOrchestrationFacebookPayloadData,
                    createdAt: '2023-07-07 18:13:23.552748-04',
                    updatedAt: '2023-07-07 18:13:23.552748-04',
                    get: jest.fn().mockResolvedValue({
                        campaigns: [
                            {
                                id: 1,
                                name: 'Test Campaign 1',
                            },
                        ],
                    }),
                };
                const user = {
                    id: 1,
                    username: '123',
                };

                Channel.findAll.mockResolvedValue([
                    { id: 2, name: 'Amazon Advertising' },
                    { id: 3, name: 'Facebook' },
                ]);

                getUser.mockResolvedValue(user);

                createCampaigns.mockImplementation(() => ({
                    errors: [],
                    successes: [{ y: 'success' }],
                }));
                Client.findOne.mockResolvedValue({
                    id: 1,
                    name: 'Test Client 1',
                });
                CampaignGroup.create.mockResolvedValue(data);
                Budget.create.mockResolvedValue(data.budget);

                const response = await request
                    .post(`/api/clients/${clientId}/marketingcampaign`)
                    .send(campaignOrchestrationFacebookPayloadData);

                expect(_createFacebookAdset).not.toHaveBeenCalled();
            });
            test('Given the payload  contain a Facebook Adset, the Facebook Adset API should be called', async () => {
                const data = {
                    id: 1,
                    ...adsetFacebookPayload,
                    createdAt: '2023-07-07 18:13:23.552748-04',
                    updatedAt: '2023-07-07 18:13:23.552748-04',
                    get: jest.fn().mockResolvedValue({
                        campaigns: [
                            {
                                id: 1,
                                name: 'Test Campaign 1',
                            },
                        ],
                    }),
                };

                const user = {
                    id: 1,
                    username: '123',
                };

                Channel.findAll.mockResolvedValue([
                    { id: 2, name: 'Amazon Advertising' },
                    { id: 4, name: 'Facebook' },
                ]);

                getUser.mockResolvedValue(user);

                createCampaigns.mockImplementation(() => ({
                    errors: [],
                    successes: [{ y: 'success' }],
                }));

                Client.findOne.mockResolvedValue({
                    id: 1,
                    name: 'Test Client 1',
                });
                CampaignGroup.create.mockResolvedValue(data);
                Budget.create.mockResolvedValue(data.budget);
                const response = await request
                    .post(`/api/clients/${clientId}/marketingcampaign`)
                    .send(adsetFacebookPayload);

                expect(_createFacebookAdset).toHaveBeenCalled();
            });
            test('Given the payload  contain 30 Facebook adset, the Facebook API should be called 30 Times', async () => {
                const data = {
                    id: 1,
                    ...adsetFacebookPayload,
                    createdAt: '2023-07-07 18:13:23.552748-04',
                    updatedAt: '2023-07-07 18:13:23.552748-04',
                    get: jest.fn().mockResolvedValue({
                        campaigns: [
                            {
                                id: 1,
                                name: 'Test Campaign 1',
                            },
                        ],
                    }),
                };
                const user = {
                    id: 1,
                    username: '123',
                };

                Channel.findAll.mockResolvedValue([
                    { id: 2, name: 'Amazon Advertising' },
                    { id: 3, name: 'Facebook' },
                ]);

                getUser.mockResolvedValue(user);

                createCampaigns.mockImplementation(() => ({
                    errors: [],
                    successes: [{ y: 'success' }],
                }));
                Client.findOne.mockResolvedValue({
                    id: 1,
                    name: 'Test Client 1',
                });
                CampaignGroup.create.mockResolvedValue(data);
                Budget.create.mockResolvedValue(data.budget);

                await request
                    .post(`/api/clients/${clientId}/marketingcampaign`)
                    .send(adsetFacebookPayload);

                expect(_createFacebookAdset).toHaveBeenCalledTimes(30);
            });
            it('should the Facebook API with specific parameters', async () => {
                const data = {
                    id: 1,
                    ...adsetFacebookPayload,
                    createdAt: '2023-07-07 18:13:23.552748-04',
                    updatedAt: '2023-07-07 18:13:23.552748-04',
                    get: jest.fn().mockResolvedValue({
                        campaigns: [
                            {
                                id: 1,
                                name: 'Test Campaign 1',
                            },
                        ],
                    }),
                };
                const user = {
                    id: 1,
                    username: '123',
                };

                Channel.findAll.mockResolvedValue([
                    { id: 2, name: 'Amazon Advertising' },
                    { id: 3, name: 'Facebook' },
                ]);

                getUser.mockResolvedValue(user);

                createCampaigns.mockImplementation(() => ({
                    errors: [],
                    successes: [{ y: 'success' }],
                }));
                Client.findOne.mockResolvedValue({
                    id: 1,
                    name: 'Test Client 1',
                });
                CampaignGroup.create.mockResolvedValue(data);
                Budget.create.mockResolvedValue(data.budget);

                const response = await request
                    .post(`/api/clients/${clientId}/marketingcampaign`)
                    .send(adsetFacebookPayload);

                // Check if _createFAcebook was called with the expected parameters
                expect(_createFacebookAdset).toHaveBeenCalledWith(
                    'YOUR_ACCESS_TOKEN',
                    'YOUR_AD_ACCOUNT_ID',
                    {
                        name: 'api-adset-test-1',
                        campaign_id: 'FACEBOOK_CAMPAIGN_ID',
                        lifetime_budget: 42500,
                        bid_amount: 200,
                        billing_event: 'PAGE_LIKES',
                        start_time: '2023-01-01T00:00:17+0000',
                        end_time: '2023-02-01T00:00:17+0000',
                        optimization_goal: 'REACH',
                        targeting: { geo_locations: { countries: ['US'] } },
                        status: 'PAUSED',
                    }
                );
            });
            test('When the payload contains data for creating 3 Facebook adsets, and the process results in 2 adsets failing during creation, the API response should include a list of successfully created adsets and a list of adsets that failed to be created.', async () => {
                const data = {
                    id: 1,
                    ...adsetFacebookPayload,
                    createdAt: '2023-07-07 18:13:23.552748-04',
                    updatedAt: '2023-07-07 18:13:23.552748-04',
                    get: jest.fn().mockResolvedValue({
                        campaigns: [
                            {
                                id: 1,
                                name: 'Test Campaign 1',
                            },
                        ],
                    }),
                };
                const user = {
                    id: 1,
                    username: '123',
                };

                Channel.findAll.mockResolvedValue([
                    { id: 2, name: 'Amazon Advertising' },
                    { id: 3, name: 'Facebook' },
                ]);

                getUser.mockResolvedValue(user);

                createCampaigns.mockImplementation(() => ({
                    errors: [],
                    successes: [{ y: 'success' }],
                }));
                Client.findOne.mockResolvedValue({
                    id: 1,
                    name: 'Test Client 1',
                });
                CampaignGroup.create.mockResolvedValue(data);
                Budget.create.mockResolvedValue(data.budget);

                _createFacebookAdset.mockRejectedValueOnce({
                    response: {
                        data: {
                            error: 'Bad Request',
                            message: 'Invalid adset data',
                        },
                        status: 400, // Or any other non-2xx status code
                        statusText: 'Bad Request',
                        headers: {},
                    },
                });
                const response = await request
                    .post(`/api/clients/${clientId}/marketingcampaign`)
                    .send(adsetFacebookPayload);

                expect(response.status).toBe(207);
                expect(response.body).toEqual({
                    code: 207,
                    data: {
                        amazonData: {
                            error: null,
                            success: null,
                        },
                        facebook: {
                            error: expect.any(Array),
                            success: expect.any(Array),
                            adsets: {
                                error: [
                                    {
                                        adsetName: 'api-adset-test-1',
                                        facebookCampaignId:
                                            'FACEBOOK_CAMPAIGN_ID',
                                        response: {
                                            data: {
                                                error: 'Bad Request',
                                                message: 'Invalid adset data',
                                            },
                                            headers: {},
                                            status: 400,
                                            statusText: 'Bad Request',
                                        },
                                        payload: expect.any(Object),
                                    },
                                ],
                                success: expect.any(Array),
                            },
                        },
                    },
                    message: 'Marketing campaign created with errors',
                });
                _createFacebookCampaign.mockClear();
            });
        });
    });

    describe('Update campaign', () => {
        const clientId = 1;
        const campaignId = 1;

        it('404 client', async () => {
            Client.findOne.mockResolvedValue(null);
            const response = await request.put(
                `/api/clients/${clientId}/marketingcampaign/${campaignId}`
            );
            expect(response.status).toBe(404);
            expect(response.body.message).toBe(`Client not found`);
        });

        it('404 campaign', async () => {
            Client.findOne.mockResolvedValue({
                id: 1,
                name: 'Test Client 1',
            });
            CampaignGroup.findOne.mockResolvedValue(null);
            const response = await request.put(
                `/api/clients/${clientId}/marketingcampaign/${campaignId}`
            );
            expect(response.status).toBe(404);
            expect(response.body.message).toBe(`Marketing campaign not found`);
        });

        it('200', async () => {
            const sendData = {
                name: 'asd',
                goals: 'asd',
                total_gross_budget: 123,
                margin: 0.12,
                flight_time_start: '2023-02-01T04:00:00.000Z',
                flight_time_end: '2023-03-01T04:00:00.000Z',
                net_budget: '108.24',
                channels: [{ id: 1, name: 'Google Ads' }],
                periods: [
                    { id: 'february', label: 'february' },
                    { id: 'march', label: 'march' },
                ],
            };

            const data = {
                id: 1,
                ...sendData,
                createdAt: '2023-07-07 18:13:23.552748-04',
                updatedAt: '2023-07-07 18:13:23.552748-04',
            };

            Client.findOne.mockResolvedValue({
                id: 1,
                name: 'Test Client 1',
            });
            CampaignGroup.findOne.mockResolvedValue(data);
            CampaignGroup.update.mockResolvedValue([null, data]);

            const response = await request
                .put(`/api/clients/${clientId}/marketingcampaign/${campaignId}`)
                .send(sendData);
            expect(response.status).toBe(200);
            expect(response.body.data).toEqual({});
            expect(response.body.message).toBe(
                'Marketing campaign updated successfully'
            );
        });

        it('500', async () => {
            Client.findOne.mockRejectedValue(new Error('Error'));
            const response = await request.put(
                `/api/clients/${clientId}/marketingcampaign/${campaignId}`
            );
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error');
        });
    });

    describe('Delete campaign', () => {
        const clientId = 1;
        const campaignId = 1;

        it('404 client', async () => {
            Client.findOne.mockResolvedValue(null);
            const response = await request.delete(
                `/api/clients/${clientId}/marketingcampaign/${campaignId}`
            );
            expect(response.status).toBe(404);
            expect(response.body.message).toBe(`Client not found`);
        });

        it('404 campaign', async () => {
            Client.findOne.mockResolvedValue({
                id: 1,
                name: 'Test Client 1',
            });
            CampaignGroup.findOne.mockResolvedValue(null);
            const response = await request.delete(
                `/api/clients/${clientId}/marketingcampaign/${campaignId}`
            );
            expect(response.status).toBe(404);
            expect(response.body.message).toBe(`Marketing campaign not found`);
        });

        it('200', async () => {
            const data = {
                id: 1,
                name: 'Campaña 1',
            };
            Client.findOne.mockResolvedValue({
                id: 1,
                name: 'Test Client 1',
            });
            CampaignGroup.findOne.mockResolvedValue(data);
            CampaignGroup.destroy.mockResolvedValue(1);

            const response = await request.delete(
                `/api/clients/${clientId}/marketingcampaign/${campaignId}`
            );

            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(data);
            expect(response.body.message).toBe(
                'Marketing campaign deleted successfully'
            );
        });

        it('500', async () => {
            Client.findOne.mockRejectedValue(new Error('Error'));
            const response = await request.delete(
                `/api/clients/${clientId}/marketingcampaign/${campaignId}`
            );
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error');
        });
    });

    describe('Budget pacing', () => {
        const clientId = 1;
        const campaignId = 1;

        it('404 client', async () => {
            Client.findOne.mockResolvedValue(null);
            const response = await request.get(
                `/api/clients/${clientId}/marketingcampaign/${campaignId}/spending`
            );
            expect(response.status).toBe(404);
            expect(response.body.message).toBe(`Client not found`);
        });

        it('404 campaign', async () => {
            Client.findOne.mockResolvedValue({
                id: 1,
                name: 'Test Client 1',
            });
            CampaignGroup.findOne.mockResolvedValue(null);
            const response = await request.get(
                `/api/clients/${clientId}/marketingcampaign/${campaignId}/spending`
            );
            expect(response.status).toBe(404);
            expect(response.body.message).toBe(`Campaign group not found`);
        });

        it('200', async () => {
            Client.findOne.mockResolvedValue({
                id: 1,
                name: 'Test Client 1',
            });
            const pacings = [
                {
                    periods: [
                        {
                            id: 'february_2023',
                            label: 'February 2023',
                            days: 28,
                        },
                    ],
                    allocations: {
                        february_2023: {
                            budget: 54.12,
                            percentage: 50,
                            allocations: [],
                        },
                    },
                },
            ];
            CampaignGroup.findOne.mockResolvedValue({
                id: 1,
                name: 'Campaña 1',
                client: 'Test Client 1',
                pacings,
            });

            const response = await request.get(
                `/api/clients/${clientId}/marketingcampaign/${campaignId}/spending`
            );
            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(pacings[0]);
        });

        it('500', async () => {
            Client.findOne.mockRejectedValue(new Error('Error'));
            const response = await request.get(
                `/api/clients/${clientId}/marketingcampaign/${campaignId}/spending`
            );
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error');
        });
    });
});
