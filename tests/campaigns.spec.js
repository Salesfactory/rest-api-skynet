const supertest = require('supertest');
const makeApp = require('../src/app');
const adsetFacebookPayload = require('./controllers-sample-data/orchestration-adset-facebook.json');
const campaignOrchestrationFacebookPayloadData = require('./controllers-sample-data/orchestration-facebook.json');
const adsetAmazonDSPPayload = require('./controllers-sample-data/orchestration-adset-amazon-dsp.json');
const campaignOrchestrationAmazonDSPPayloadData = require('./controllers-sample-data/orchestration-amazon-dsp.json');
const {
    Budget,
    Channel,
    CampaignGroup,
    Client,
    Job,
} = require('../src/models');
const { getUser } = require('../src/utils');

// Mocked utility functions
jest.mock('../src/utils/allocations', () => ({
    createCampaigns: jest.fn(),
    findIdInAllocations: jest.fn(),
}));
jest.mock('../src/utils/email', () => ({
    send: jest.fn(),
}));
const {
    createCampaigns,
    findIdInAllocations,
} = require('../src/utils/allocations');

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
    Job: {
        findAll: jest.fn(() => {
            return Promise.resolve([
                {
                    dataValues: {
                        id: 1,
                        data: [
                            {
                                campaingId: 'foo',
                                orderIds: 'baa',
                            },
                        ],
                        status: 'completed',
                        processedAt: '2023-12-13T19:20:11.581Z',
                        batchId: 5,
                        createdAt: '2023-12-13T19:20:07.316Z',
                        updatedAt: '2023-12-13T19:20:11.581Z',
                    },
                },
            ]);
        }),
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
    return Promise.resolve({
        id: 'AMAZON_CAMPAIGN_ID',
        data: [
            {
                orderId: 2,
            },
        ],
    });
});
const _createAmazonAdset = jest.fn(() => {
    return {
        id: 'AMAZON_ADSET_ID',
        data: [
            {
                lineItem: 2,
            },
        ],
    };
});
const _createFacebookCampaign = jest.fn(() => {
    return Promise.resolve({ id: 'FACEBOOK_CAMPAIGN_ID' });
});
const _createFacebookAdset = jest.fn(() => {
    return {};
});

const _addJobToQueue = jest.fn(() => {
    return Promise.resolve({ id: 'JOB_ID' });
});

const _startProcessingJobs = jest.fn().mockImplementation(async callback => {
    // Call the passed function
    const job = { data: { foo: 'bar' } };
    const data = await callback(job);
    return Promise.resolve({ data });
});

const app = makeApp({
    getSecrets,
    amazon: {
        createCampaign: _createAmazonCampaign,
        createAdset: _createAmazonAdset,
    },
    facebook: {
        createCampaign: _createFacebookCampaign,
        createAdset: _createFacebookAdset,
    },
    amzQueue: {
        addJobToQueue: _addJobToQueue,
        startProcessingJobs: _startProcessingJobs,
    },
});
const request = supertest(app);

describe('Campaign Endpoints Test', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Get recent campaigns', () => {
        it('200 with search term', async () => {
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

        it('200 with no search term', async () => {
            jest.useFakeTimers('modern');
            jest.setSystemTime(new Date(2023, 8, 10));
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

            const expectedData = [
                { title: 'Today', data: [] },
                { title: 'Yesterday', data: [] },
                { title: 'Last Week', data: [] },
                {
                    title: 'Last Month',
                    data: [
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
                                                                    allocations:
                                                                        [
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
                            dataValues: { inFlight: true, linked: false },
                        },
                    ],
                },
            ];
            CampaignGroup.findAll.mockResolvedValue(data);

            const response = await request.get(`/api/campaigns`);
            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(expectedData);
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
            expect(response.body.message).toBe('Client with ID 1 not found');
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
                'Missing required field: name; Missing required field: goals; Missing required field: total_gross_budget; Missing required field: flight_time_start; Missing required field: flight_time_end; Missing required field: net_budget; Missing required field: periods; Missing required field: channels; Missing required field: allocations; Margin must be a number; Total gross budget must be a number; Net budget must be a number; Periods must be an array; Channels must be an array'
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
                                name: 'Amazon Advertising DSP',
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
                                name: 'Amazon Advertising DSP',
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

            expect(response.status).toBe(201);
            expect(response.body.data).toEqual({
                campaigns: [
                    {
                        id: 1,
                        name: 'Test Campaign 1',
                    },
                ],
                budgets: data.budget,
                amazonData: {
                    adsets: {
                        error: [],
                        success: [],
                    },
                    error: [],
                    success: [],
                },
                facebook: {
                    adsets: {
                        error: [],
                        success: [],
                    },
                    error: [],
                    success: [],
                },
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
                    { id: 2, name: 'Amazon Advertising DSP' },
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
                            name: 'Amazon Advertising DSP',
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
                                    name: 'Amazon Advertising DSP',
                                    isApiEnabled: true,
                                    budget: 2125,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    allocations: [
                                        {
                                            id: '2-Sponsored Ads',
                                            name: 'Responsive eCommerce',
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
                                    name: 'Amazon Advertising DSP',
                                    isApiEnabled: true,
                                    budget: 2125,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    allocations: [
                                        {
                                            id: '2-Sponsored Ads',
                                            name: 'Responsive eCommerce',
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
                    { id: 2, name: 'Amazon Advertising DSP' },
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
                            name: 'Amazon Advertising DSP',
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
                                    name: 'Amazon Advertising DSP',
                                    isApiEnabled: true,
                                    budget: 2125,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    allocations: [
                                        {
                                            id: '2-Sponsored Ads',
                                            name: 'Responsive eCommerce',
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
                                    name: 'Amazon Advertising DSP',
                                    isApiEnabled: true,
                                    budget: 2125,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    allocations: [
                                        {
                                            id: '2-Sponsored Ads',
                                            name: 'Responsive eCommerce',
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
                    { id: 2, name: 'Amazon Advertising DSP' },
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
                        adsets: [
                            {
                                budget: 2125,
                                id: '2-Sponsored Ads-test-campaign-test-campaign-adset',
                                name: 'test-campaign-adset',
                                percentage: 100,
                                type: 'ADSET',
                                totalBudget: 4250,
                            },
                        ],
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
                        startDate: '2023-01-01T04:00:00.000Z',
                        endDate: '2023-02-01T04:00:00.000Z',
                        type: 'Responsive eCommerce',
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
                            name: 'Amazon Advertising DSP',
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
                                    name: 'Amazon Advertising DSP',
                                    isApiEnabled: true,
                                    budget: 2125,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    allocations: [
                                        {
                                            id: '2-Sponsored Ads',
                                            name: 'Responsive eCommerce',
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
                                    name: 'Amazon Advertising DSP',
                                    isApiEnabled: true,
                                    budget: 2125,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    allocations: [
                                        {
                                            id: '2-Sponsored Ads',
                                            name: 'Responsive eCommerce',
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
                    { id: 2, name: 'Amazon Advertising DSP' },
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
                    message: 'Marketing campaign created with errors',
                    data: {
                        campaigns: [
                            {
                                id: 1,
                                name: 'Test Campaign 1',
                            },
                        ],
                        amazonData: {
                            success: [],
                            error: [
                                {
                                    name: 'test-campaign',
                                    errorDetails: {
                                        errors: [
                                            {
                                                response: {
                                                    data: {
                                                        error: 'Bad Request',
                                                        message:
                                                            'Invalid campaign data',
                                                    },
                                                    status: 400,
                                                    statusText: 'Bad Request',
                                                    headers: {},
                                                },
                                            },
                                        ],
                                    },
                                },
                                {
                                    name: '3-Sponsored Ads-test-campaign',
                                    errorDetails: {
                                        message: 'Invalid campaign response',
                                    },
                                },
                            ],
                            adsets: { success: [], error: [] },
                        },
                        facebook: {
                            success: [],
                            error: [],
                            adsets: { success: [], error: [] },
                        },
                    },
                });

                _createAmazonCampaign.mockClear();
            });
        });

        describe('Test Amazon DSP Adset Creation', () => {
            test("Given the payload doesn't contain a Amazon Adset, the Amazon Adset API should not be called", async () => {
                const data = {
                    id: 1,
                    ...campaignOrchestrationAmazonDSPPayloadData,
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
                    { id: 2, name: 'Amazon Advertising DSP' },
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
                    .send(campaignOrchestrationAmazonDSPPayloadData);

                expect(_addJobToQueue).not.toHaveBeenCalled();
            });
            test('Given the payload  contain an Amazon Adset, the Amazon Adset API should be called', async () => {
                const data = {
                    id: 1,
                    ...adsetAmazonDSPPayload,
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
                    { id: 2, name: 'Amazon Advertising DSP' },
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
                    .send(adsetAmazonDSPPayload);

                expect(_addJobToQueue).toHaveBeenCalled();
                expect(_startProcessingJobs).toHaveBeenCalled();
            });
            test('Given the payload  contain 2 Amazon adset, the Amazon API should be called 2 Times', async () => {
                const data = {
                    id: 1,
                    ...adsetAmazonDSPPayload,
                    createdAt: '2023-07-07 18:13:23.552748-04',
                    updatedAt: '2023-07-07 18:13:23.552748-04',
                    get: jest.fn().mockResolvedValue({
                        id: 'campaing-group-id',
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
                    { id: 2, name: 'Amazon Advertising DSP' },
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
                jest.spyOn(global, 'setTimeout').mockImplementation(callback =>
                    callback()
                );

                Budget.findOne.mockResolvedValue({
                    id: 1,
                    amazonCampaigns: [
                        {
                            name: '8-Responsive eCommerce-b',
                            data: { orderId: '587878912348263615' },
                            adsets: [{ jobId: 10, adset: null }],
                        },
                    ],
                });

                await request
                    .post(`/api/clients/${clientId}/marketingcampaign`)
                    .send(adsetAmazonDSPPayload);

                expect(_addJobToQueue).toHaveBeenCalledTimes(2);
                expect(_addJobToQueue).toHaveBeenCalledWith({
                    jobData: {
                        adset: {
                            budget: 2125,
                            format: 'FORMAT',
                            id: '1-SEARCH-dfsdfsd-sdfdx',
                            name: '202301|SEARCH|OBJETIVE|NAMESD|SCOPE|TARGET|FORMAT',
                            percentage: 100,
                            targeting: 'TARGET',
                            type: 'ADSET',
                            totalBudget: 4250,
                        },
                        orderId: 2,
                        profileId: 'DSP_PROFILE_ID',
                        campaignId: '1-SEARCH-dfsdfsd1',
                        campaignGroupId: 'campaing-group-id',
                        type: 'Sponsored Ads Line Item',
                    },
                    batchId: 'campaing-group-id',
                });

                expect(_startProcessingJobs).toHaveBeenCalledTimes(1);

                expect(_createAmazonAdset).toHaveBeenCalledTimes(1);
                expect(_createAmazonAdset).toHaveBeenCalledWith({
                    access: {
                        ACCESS_TOKEN: '123',
                        CLIENT_ID: 'TEST',
                    },
                    foo: 'bar',
                });

                global.setTimeout.mockRestore();
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
                                    name: 'Amazon Advertising DSP',
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
                                    name: 'Amazon Advertising DSP',
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
                        buying_type: undefined,
                        name: 'test-api-2',
                        objective: undefined,
                        special_ad_categories: 'NONE',
                        special_ad_category_country: null,
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
                        campaigns: [
                            {
                                id: 1,
                                name: 'Test Campaign 1',
                            },
                        ],
                        amazonData: {
                            error: [],
                            success: [],
                            adsets: {
                                error: [],
                                success: [],
                            },
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
            test('Given the payload  contain 5 Facebook adset, the Facebook API should be called 5 Times', async () => {
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

                expect(_createFacebookAdset).toHaveBeenCalledTimes(5);
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

                await request
                    .post(`/api/clients/${clientId}/marketingcampaign`)
                    .send(adsetFacebookPayload);

                // Check if _createFAcebook was called with the expected parameters
                expect(_createFacebookAdset).toHaveBeenCalledWith(
                    'YOUR_ACCESS_TOKEN',
                    'YOUR_AD_ACCOUNT_ID',
                    {
                        name: 'api-adset-test-1',
                        campaign_id: 'FACEBOOK_CAMPAIGN_ID',
                        lifetime_budget: 331500,
                        bid_amount: 200,
                        billing_event: 'PAGE_LIKES',
                        start_time: '2023-01-01T00:00:17+0000',
                        end_time: '2023-02-01T00:00:17+0000',
                        bid_strategy: undefined,
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
                        campaigns: [
                            {
                                id: 1,
                                name: 'Test Campaign 1',
                            },
                        ],
                        amazonData: {
                            error: [],
                            success: [],
                            adsets: {
                                error: [],
                                success: [],
                            },
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
            expect(response.body.data).toEqual({
                id: 1,
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
                createdAt: '2023-07-07 18:13:23.552748-04',
                updatedAt: '2023-07-07 18:13:23.552748-04',
                amazonData: {
                    success: [],
                    error: [],
                    adsets: { success: [], error: [] },
                },
                facebook: {
                    success: [],
                    error: [],
                    adsets: { success: [], error: [] },
                },
            });
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

        describe('Test Amazon DSP Campaigns and adsets Update', () => {
            test("Given the payload doesn't contain a Amazon campaign, the Amazon API should not be called", async () => {
                const campaignOrchestrationPayloadData = {
                    name: 'Campaña 1',
                    goals: 'test',
                    total_gross_budget: 123,
                    margin: 0.12,
                    flight_time_start: '2023-02-01T04:00:00.000Z',
                    flight_time_end: '2023-03-01T04:00:00.000Z',
                    net_budget: '108.24',
                    channels: [{ id: '1', name: 'Amazon Advertising' }],
                    allocations: {
                        february: {
                            budget: 54.12,
                            percentage: 50,
                            allocations: [
                                {
                                    id: '1',
                                    name: 'Amazon Advertising DSP',
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
                                    name: 'Amazon Advertising DSP',
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
                    { id: 2, name: 'Amazon Advertising DSP' },
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
                CampaignGroup.findOne.mockResolvedValue(data);
                Budget.create.mockResolvedValue(data.budget);

                const response = await request
                    .put(
                        `/api/clients/${clientId}/marketingcampaign/${campaignId}`
                    )
                    .send(campaignOrchestrationPayloadData);

                expect(_createAmazonCampaign).not.toHaveBeenCalled();
                expect(_addJobToQueue).not.toHaveBeenCalled();
            });
            test('Given the payload contain 2 new Amazon campaign, the Amazon API campaign should be called 2 times and addJobToQueue 2 times', async () => {
                const campaignOrchestrationSavedData = {
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
                            id: '2',
                            name: 'Amazon Advertising DSP',
                            isApiEnabled: true,
                        },
                    ],
                    allocations: {
                        january_2023: {
                            budget: 4250,
                            percentage: 50,
                            allocations: [
                                {
                                    id: '2',
                                    name: 'Amazon Advertising DSP',
                                    isApiEnabled: true,
                                    budget: 2125,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    allocations: [
                                        {
                                            id: '2-Sponsored Ads',
                                            name: 'Responsive eCommerce',
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
                                                            id: '3-Sponsored Ads-test-campaign-test-campaign-adset',
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
                                    id: '2',
                                    name: 'Amazon Advertising DSP',
                                    isApiEnabled: true,
                                    budget: 2125,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    allocations: [
                                        {
                                            id: '2-Sponsored Ads',
                                            name: 'Responsive eCommerce',
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
                                                            id: '3-Sponsored Ads-test-campaign-test-campaign-adset',
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
                            id: '2',
                            name: 'Amazon Advertising DSP',
                            isApiEnabled: true,
                        },
                    ],
                    allocations: {
                        january_2023: {
                            budget: 4250,
                            percentage: 50,
                            allocations: [
                                {
                                    id: '2',
                                    name: 'Amazon Advertising DSP',
                                    isApiEnabled: true,
                                    budget: 2125,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    allocations: [
                                        {
                                            id: '2-Sponsored Ads',
                                            name: 'Responsive eCommerce',
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
                                                            id: '3-Sponsored Ads-test-campaign-test-campaign-adset',
                                                            name: 'test-campaign-adset',
                                                            budget: 2125,
                                                            percentage: 100,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                                {
                                                    id: '4-Sponsored Ads-test-campaign',
                                                    name: 'test-campaign-4',
                                                    budget: 2125,
                                                    percentage: 100,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '4-Sponsored Ads-test-campaign-test-campaign-adset',
                                                            name: 'test-campaign-adset',
                                                            budget: 2125,
                                                            percentage: 100,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                                {
                                                    id: '5-Sponsored Ads-test-campaign',
                                                    name: 'test-campaign-5',
                                                    budget: 2125,
                                                    percentage: 100,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '5-Sponsored Ads-test-campaign-test-campaign-adset',
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
                                    id: '2',
                                    name: 'Amazon Advertising DSP',
                                    isApiEnabled: true,
                                    budget: 2125,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    allocations: [
                                        {
                                            id: '2-Sponsored Ads',
                                            name: 'Responsive eCommerce',
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
                                                            id: '3-Sponsored Ads-test-campaign-test-campaign-adset',
                                                            name: 'test-campaign-adset',
                                                            budget: 2125,
                                                            percentage: 100,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                                {
                                                    id: '4-Sponsored Ads-test-campaign',
                                                    name: 'test-campaign-4',
                                                    budget: 2125,
                                                    percentage: 100,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '4-Sponsored Ads-test-campaign-test-campaign-adset',
                                                            name: 'test-campaign-adset',
                                                            budget: 2125,
                                                            percentage: 100,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                                {
                                                    id: '5-Sponsored Ads-test-campaign',
                                                    name: 'test-campaign-5',
                                                    budget: 2125,
                                                    percentage: 100,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '5-Sponsored Ads-test-campaign-test-campaign-adset',
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
                    ...campaignOrchestrationSavedData,
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
                    budgets: [
                        {
                            facebookCampaigns: [],
                            amazonCampaigns: [],
                        },
                    ],
                };

                const user = {
                    id: 1,
                    username: '123',
                };

                Channel.findAll.mockResolvedValue([
                    { id: 2, name: 'Amazon Advertising DSP' },
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
                findIdInAllocations.mockResolvedValue(false);
                CampaignGroup.findOne.mockResolvedValue(data);
                Budget.create.mockResolvedValue(data.budgets);
                Job.findAll.mockResolvedValue([
                    {
                        id: 15,
                        data: {
                            type: 'Sponsored Ads Line Item',
                            adset: {
                                id: '2-Sponsored Ads-test-campaign-test-campaign-adset',
                                name: 'test-campaign-adset',
                                budget: 2125,
                                percentage: 100,
                                type: 'ADSET',
                            },
                            campaignId: '2-Sponsored Ads-test-campaign',
                        },
                        status: 'completed',
                        batchId: 16,
                    },
                    {
                        id: 15,
                        data: {
                            type: 'Sponsored Ads Line Item',
                            adset: {
                                id: '3-Sponsored Ads-test-campaign-test-campaign-adset',
                                name: 'test-campaign-adset',
                                budget: 2125,
                                percentage: 100,
                                type: 'ADSET',
                            },
                            campaignId: '3-Sponsored Ads-test-campaign',
                        },
                        status: 'completed',
                        batchId: 16,
                    },
                ]);

                await request
                    .put(
                        `/api/clients/${clientId}/marketingcampaign/${campaignId}`
                    )
                    .send(campaignOrchestrationPayloadData);

                expect(_createAmazonCampaign).toHaveBeenCalledTimes(2);
                expect(_addJobToQueue).toHaveBeenCalledTimes(2);
                // expect(_createAmazonAdset).toHaveBeenCalledTimes(2);
            });
            test('Given the payload contain 2 Amazon campaign, the Amazon API campaign and adsets should not be called because campaigns already exist', async () => {
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
                            id: '2',
                            name: 'Amazon Advertising DSP',
                            isApiEnabled: true,
                        },
                    ],
                    allocations: {
                        january_2023: {
                            budget: 4250,
                            percentage: 50,
                            allocations: [
                                {
                                    id: '2',
                                    name: 'Amazon Advertising DSP',
                                    isApiEnabled: true,
                                    budget: 2125,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    allocations: [
                                        {
                                            id: '2-Sponsored Ads',
                                            name: 'Responsive eCommerce',
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
                                    id: '2',
                                    name: 'Amazon Advertising DSP',
                                    isApiEnabled: true,
                                    budget: 2125,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    allocations: [
                                        {
                                            id: '2-Sponsored Ads',
                                            name: 'Responsive eCommerce',
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
                    budgets: [
                        {
                            facebookCampaigns: [],
                            amazonCampaigns: [],
                        },
                    ],
                };
                const user = {
                    id: 1,
                    username: '123',
                };

                Channel.findAll.mockResolvedValue([
                    { id: 2, name: 'Amazon Advertising DSP' },
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
                findIdInAllocations.mockResolvedValue(true);
                CampaignGroup.findOne.mockResolvedValue(data);
                Budget.create.mockResolvedValue(data.budget);
                Job.findAll.mockResolvedValue([
                    {
                        dataValues: {
                            id: 15,
                            data: {
                                type: 'Sponsored Ads Line Item',
                                adset: {
                                    id: '2-Sponsored Ads-test-campaign-test-campaign-adset',
                                    name: 'test-campaign-adset',
                                    budget: 2125,
                                    percentage: 100,
                                    type: 'ADSET',
                                },
                                campaignId: '2-Sponsored Ads-test-campaign',
                            },
                            status: 'completed',
                            batchId: 16,
                        },
                    },
                    {
                        dataValues: {
                            id: 15,
                            data: {
                                type: 'Sponsored Ads Line Item',
                                adset: {
                                    id: '2-Sponsored Ads-test-campaign-test-campaign-adset',
                                    name: 'test-campaign-adset',
                                    budget: 2125,
                                    percentage: 100,
                                    type: 'ADSET',
                                },
                                campaignId: '3-Sponsored Ads-test-campaign',
                            },
                            status: 'completed',
                            batchId: 16,
                        },
                    },
                ]);
                await request
                    .put(
                        `/api/clients/${clientId}/marketingcampaign/${campaignId}`
                    )
                    .send(campaignOrchestrationPayloadData);

                expect(_createAmazonCampaign).toHaveBeenCalledTimes(0);
                expect(_addJobToQueue).not.toHaveBeenCalled();
                expect(_createAmazonAdset).toHaveBeenCalledTimes(0);
            });
            test('Given the payload contain previus saved Amazon campaign and 2 new adset, the Amazon API campaign should NOT be called  addJobToQueue 2 times', async () => {
                const campaignOrchestrationSavedData = {
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
                            id: '2',
                            name: 'Amazon Advertising DSP',
                            isApiEnabled: true,
                        },
                    ],
                    allocations: {
                        january_2023: {
                            budget: 4250,
                            percentage: 50,
                            allocations: [
                                {
                                    id: '2',
                                    name: 'Amazon Advertising DSP',
                                    isApiEnabled: true,
                                    budget: 2125,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    allocations: [
                                        {
                                            id: '2-Sponsored Ads',
                                            name: 'Responsive eCommerce',
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
                                                            id: '3-Sponsored Ads-test-campaign-test-campaign-adset',
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
                                    id: '2',
                                    name: 'Amazon Advertising DSP',
                                    isApiEnabled: true,
                                    budget: 2125,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    allocations: [
                                        {
                                            id: '2-Sponsored Ads',
                                            name: 'Responsive eCommerce',
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
                                                            id: '3-Sponsored Ads-test-campaign-test-campaign-adset',
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
                            id: '2',
                            name: 'Amazon Advertising DSP',
                            isApiEnabled: true,
                        },
                    ],
                    allocations: {
                        january_2023: {
                            budget: 4250,
                            percentage: 50,
                            allocations: [
                                {
                                    id: '2',
                                    name: 'Amazon Advertising DSP',
                                    isApiEnabled: true,
                                    budget: 2125,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    allocations: [
                                        {
                                            id: '2-Sponsored Ads',
                                            name: 'Responsive eCommerce',
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
                                                        {
                                                            id: '2-Sponsored Ads-test-campaign-test-campaign-adset-2',
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
                                                            id: '3-Sponsored Ads-test-campaign-test-campaign-adset',
                                                            name: 'test-campaign-adset',
                                                            budget: 2125,
                                                            percentage: 100,
                                                            type: 'ADSET',
                                                        },
                                                        {
                                                            id: '3-Sponsored Ads-test-campaign-test-campaign-adset-1',
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
                                    id: '2',
                                    name: 'Amazon Advertising DSP',
                                    isApiEnabled: true,
                                    budget: 2125,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    allocations: [
                                        {
                                            id: '2-Sponsored Ads',
                                            name: 'Responsive eCommerce',
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
                                                        {
                                                            id: '2-Sponsored Ads-test-campaign-test-campaign-adset-2',
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
                                                            id: '3-Sponsored Ads-test-campaign-test-campaign-adset',
                                                            name: 'test-campaign-adset',
                                                            budget: 2125,
                                                            percentage: 100,
                                                            type: 'ADSET',
                                                        },
                                                        {
                                                            id: '3-Sponsored Ads-test-campaign-test-campaign-adset-1',
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
                    ...campaignOrchestrationSavedData,
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
                    budgets: [
                        {
                            facebookCampaigns: [],
                            amazonCampaigns: [],
                        },
                    ],
                };

                const user = {
                    id: 1,
                    username: '123',
                };

                Channel.findAll.mockResolvedValue([
                    { id: 2, name: 'Amazon Advertising DSP' },
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
                findIdInAllocations.mockResolvedValue(false);
                CampaignGroup.findOne.mockResolvedValue(data);
                Budget.create.mockResolvedValue(data.budgets);
                Job.findAll.mockResolvedValue([
                    {
                        id: 15,
                        data: {
                            type: 'Sponsored Ads Line Item',
                            adset: {
                                id: '2-Sponsored Ads-test-campaign-test-campaign-adset',
                                name: 'test-campaign-adset',
                                budget: 2125,
                                percentage: 100,
                                type: 'ADSET',
                            },
                            campaignId: '2-Sponsored Ads-test-campaign',
                            orderId: 'order-2',
                        },
                        status: 'completed',
                        batchId: 16,
                    },
                    {
                        id: 15,
                        data: {
                            type: 'Sponsored Ads Line Item',
                            adset: {
                                id: '3-Sponsored Ads-test-campaign-test-campaign-adset',
                                name: 'test-campaign-adset',
                                budget: 2125,
                                percentage: 100,
                                type: 'ADSET',
                            },
                            campaignId: '3-Sponsored Ads-test-campaign',
                            orderId: 'order-2',
                        },
                        status: 'completed',
                        batchId: 16,
                    },
                ]);

                await request
                    .put(
                        `/api/clients/${clientId}/marketingcampaign/${campaignId}`
                    )
                    .send(campaignOrchestrationPayloadData);

                expect(_createAmazonCampaign).toHaveBeenCalledTimes(0);
                expect(_addJobToQueue).toHaveBeenCalledTimes(2);
                // expect(_createAmazonAdset).toHaveBeenCalledTimes(2);
            });
        });

        describe('Test Facebook Campaigns and adsets Update', () => {
            test("Given the payload doesn't contain a Facebook campaign, the Facebook Adset API should not be called", async () => {
                const payload = {
                    name: 'Manuel Test Facebook API 2',
                    goals: 'More Sales',
                    total_gross_budget: 10000,
                    margin: 0.15,
                    flight_time_start: '2023-01-01T04:00:00.000Z',
                    flight_time_end: '2023-05-01T04:00:00.000Z',
                    net_budget: '8500.00',
                    change_reason_log: '',
                    channels: [
                        {
                            id: '1',
                            name: 'Google Ads',
                            isApiEnabled: false,
                        },
                        {
                            id: '6',
                            name: 'Reddit',
                            isApiEnabled: false,
                        },
                    ],
                    allocations: {
                        january_2023: {
                            budget: 1700,
                            percentage: 20,
                            allocations: [
                                {
                                    id: '1',
                                    name: 'Google Ads',
                                    isApiEnabled: false,
                                    budget: 578,
                                    percentage: 34,
                                    type: 'CHANNEL',
                                    allocations: [],
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
                        february_2023: {
                            budget: 1700,
                            percentage: 20,
                            allocations: [
                                {
                                    id: '1',
                                    name: 'Google Ads',
                                    isApiEnabled: false,
                                    budget: 578,
                                    percentage: 34,
                                    type: 'CHANNEL',
                                    allocations: [],
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
                    facebookAdAccountId: 'YOUR_AD_ACCOUNT_ID',
                };
                const data = {
                    id: 1,
                    ...payload,
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
                CampaignGroup.findOne.mockResolvedValue(data);
                Budget.create.mockResolvedValue(data.budget);

                await request
                    .put(
                        `/api/clients/${clientId}/marketingcampaign/${campaignId}`
                    )
                    .send(payload);

                expect(_createFacebookCampaign).not.toHaveBeenCalled();
            });
            test('Given the payload contain a Facebook campaign, the Facebook API campaign and adset should be called', async () => {
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
                findIdInAllocations.mockResolvedValue(false);
                CampaignGroup.findOne.mockResolvedValue(data);
                Budget.create.mockResolvedValue(data.budget);
                const response = await request
                    .put(
                        `/api/clients/${clientId}/marketingcampaign/${campaignId}`
                    )
                    .send(adsetFacebookPayload);

                expect(_createFacebookCampaign).toHaveBeenCalledTimes(3);
                expect(_createFacebookAdset).toHaveBeenCalledTimes(30);
            });
            test('Given the payload contain a Facebook campaign, the Facebook API campaign and adset should not be called because they already exist', async () => {
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
                findIdInAllocations.mockResolvedValue(true);
                CampaignGroup.findOne.mockResolvedValue(data);
                Budget.create.mockResolvedValue(data.budget);
                const response = await request
                    .put(
                        `/api/clients/${clientId}/marketingcampaign/${campaignId}`
                    )
                    .send(adsetFacebookPayload);

                expect(_createFacebookCampaign).toHaveBeenCalledTimes(0);
                expect(_createFacebookAdset).toHaveBeenCalledTimes(0);
            });
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
