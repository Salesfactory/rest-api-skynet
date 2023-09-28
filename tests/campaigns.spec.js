const supertest = require('supertest');
const makeApp = require('../src/app');
const { Budget, Campaign, CampaignGroup, Client } = require('../src/models');
const { getUser } = require('../src/utils');

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

const app = makeApp();
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
                },
                {
                    id: 2,
                    name: 'Test campaign',
                    company_name: 'Test company name',
                    createdAt: '2023-07-11T16:38:59.516Z',
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
            CampaignGroup.create.mockResolvedValue(data);
            Budget.create.mockResolvedValue(data.budget);

            const response = await request
                .post(`/api/clients/${clientId}/marketingcampaign`)
                .send(sendData);

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
