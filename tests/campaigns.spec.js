const supertest = require('supertest');
const makeApp = require('../src/app');
const { Budget, Campaign, CampaignGroup, Client } = require('../src/models');

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
            const response = await request.post(
                `/api/clients/${clientId}/marketingcampaign`
            );

            expect(response.status).toBe(400);
            expect(response.body.message).toBe(
                `Missing required fields: name, company_name, total_gross_budget, flight_time_start, flight_time_end, net_budget, channels, budget`
            );
        });

        it('201', async () => {
            const sendData = {
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
                budget: {
                    months: ['august', 'september', 'october', 'november'],
                    percentages: [25, 25, 25, 25],
                    net_budgets: [1, 1, 1, 1],
                    channels: [
                        {
                            name: 'Facebook',
                            values: [1, 1, 1, 1],
                        },
                    ],
                    campaign_types: [
                        {
                            name: 'Test Campaign Type 1',
                            channel: 'Facebook',
                            values: [1, 1, 1, 1],
                        },
                    ],
                    campaigns: [
                        {
                            name: 'Test Campaign 1',
                            channel: 'Facebook',
                            campaign_type: 'Test Campaign Type 1',
                            values: [1, 1, 1, 1],
                        },
                    ],
                    adsets: [
                        {
                            name: 'Test Adset 1',
                            campaign: 'Test Campaign 1',
                            channel: 'Facebook',
                            campaign_type: 'Test Campaign Type 1',
                            values: [1, 1, 1, 1],
                        },
                    ],
                },
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
            expect(response.body.data).toEqual(data);
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

    describe('Get campaigns by group', () => {
        const clientId = 1;
        const campaignId = 1;

        it('200', async () => {
            const marketingCampaign = {
                id: 1,
                client_id: 1,
                name: 'Test campaign',
                campaigns: [
                    {
                        id: 1,
                        name: 'Facebook Ads - Campaign 1',
                        channel: 'Facebook',
                        campaign_type: 'Facebook Ads',
                        goals: '1. Do something\n2. Do something else\n3. Nothing else',
                    },
                ],
                adsets: [
                    {
                        id: 1,
                        campaign_id: 1,
                        name: 'Facebook Ads - Campaign 1 - Adset 1',
                        channel: 'Facebook',
                        campaign_type: 'Facebook Ads',
                        campaign: 'Facebook Ads - Campaign 1',
                    },
                    {
                        id: 2,
                        campaign_id: 1,
                        name: 'Facebook Ads - Campaign 1 - Adset 2',
                        channel: 'Facebook',
                        campaign_type: 'Facebook Ads',
                        campaign: 'Facebook Ads - Campaign 1',
                    },
                ],
            };
            const data = [
                {
                    id: 1,
                    name: 'Facebook Ads - Campaign 1',
                    channel: 'Facebook',
                    campaign_type: 'Facebook Ads',
                    goals: '1. Do something\n2. Do something else\n3. Nothing else',
                    clientId: '1',
                },
            ];

            const channel = 'face';
            const campaignType = 'ads';

            Client.findOne.mockResolvedValue({
                id: 1,
                name: 'Test Client 1',
            });
            CampaignGroup.findOne.mockResolvedValue(marketingCampaign);
            Campaign.findAll.mockResolvedValue(marketingCampaign.campaigns);

            const response = await request.get(
                `/api/clients/${clientId}/marketingcampaign/${campaignId}/campaigns?channel=${channel}&campaignType=${campaignType}`
            );

            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(data);
            expect(response.body.message).toBe(
                'Campaigns retrieved successfully'
            );
        });

        it('404 client', async () => {
            Client.findOne.mockResolvedValue(null);
            const response = await request.get(
                `/api/clients/${clientId}/marketingcampaign/${campaignId}/campaigns`
            );
            expect(response.status).toBe(404);
            expect(response.body.message).toBe(`Client not found`);
        });

        it('404 marketing campaign', async () => {
            Client.findOne.mockResolvedValue({
                id: 1,
                name: 'Test Client 1',
            });
            CampaignGroup.findOne.mockResolvedValue(null);
            const response = await request.get(
                `/api/clients/${clientId}/marketingcampaign/${campaignId}/campaigns`
            );
            expect(response.status).toBe(404);
            expect(response.body.message).toBe(`Marketing campaign not found`);
        });

        it('404 campaign', async () => {
            const marketingCampaign = {
                id: 1,
                client_id: 1,
                name: 'Test campaign',
                campaigns: [
                    {
                        id: 1,
                        name: 'Facebook Ads - Campaign 1',
                        channel: 'Facebook',
                        campaign_type: 'Facebook Ads',
                        goals: '1. Do something\n2. Do something else\n3. Nothing else',
                    },
                ],
                adsets: [
                    {
                        id: 1,
                        campaign_id: 1,
                        name: 'Facebook Ads - Campaign 1 - Adset 1',
                        channel: 'Facebook',
                        campaign_type: 'Facebook Ads',
                        campaign: 'Facebook Ads - Campaign 1',
                    },
                    {
                        id: 2,
                        campaign_id: 1,
                        name: 'Facebook Ads - Campaign 1 - Adset 2',
                        channel: 'Facebook',
                        campaign_type: 'Facebook Ads',
                        campaign: 'Facebook Ads - Campaign 1',
                    },
                ],
            };

            Client.findOne.mockResolvedValue({
                id: 1,
                name: 'Test Client 1',
            });
            CampaignGroup.findOne.mockResolvedValue(marketingCampaign);
            Campaign.findAll.mockResolvedValue([]);

            const channel = 'facex';
            const campaignType = 'ads';

            const response = await request.get(
                `/api/clients/${clientId}/marketingcampaign/${campaignId}/campaigns?channel=${channel}&campaignType=${campaignType}`
            );
            expect(response.status).toBe(404);
            expect(response.body.message).toBe(`Campaigns not found`);
        });

        it('500', async () => {
            Client.findOne.mockRejectedValue(new Error('Error'));
            const response = await request.get(
                `/api/clients/${clientId}/marketingcampaign/${campaignId}/campaigns`
            );
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error');
        });
    });

    describe('Get campaign by id', () => {
        const clientId = 1;
        const marketingCampaignId = 1;
        const campaignId = 1;

        it('200', async () => {
            const marketingCampaign = {
                id: 1,
                client_id: 1,
                name: 'Test campaign',
                campaigns: [
                    {
                        id: 1,
                        name: 'Facebook Ads - Campaign 1',
                        channel: 'Facebook',
                        campaign_type: 'Facebook Ads',
                        goals: '1. Do something\n2. Do something else\n3. Nothing else',
                    },
                ],
                adsets: [
                    {
                        id: 1,
                        campaign_id: 1,
                        name: 'Facebook Ads - Campaign 1 - Adset 1',
                        channel: 'Facebook',
                        campaign_type: 'Facebook Ads',
                        campaign: 'Facebook Ads - Campaign 1',
                    },
                    {
                        id: 2,
                        campaign_id: 1,
                        name: 'Facebook Ads - Campaign 1 - Adset 2',
                        channel: 'Facebook',
                        campaign_type: 'Facebook Ads',
                        campaign: 'Facebook Ads - Campaign 1',
                    },
                ],
            };

            const data = [
                {
                    id: 1,
                    name: 'Facebook Ads - Campaign 1',
                    channel: 'Facebook',
                    campaign_type: 'Facebook Ads',
                    goals: '1. Do something\n2. Do something else\n3. Nothing else',
                    adsets: [
                        {
                            id: 1,
                            campaign_id: 1,
                            name: 'Facebook Ads - Campaign 1 - Adset 1',
                            channel: 'Facebook',
                            campaign_type: 'Facebook Ads',
                            campaign: 'Facebook Ads - Campaign 1',
                        },
                        {
                            id: 2,
                            campaign_id: 1,
                            name: 'Facebook Ads - Campaign 1 - Adset 2',
                            channel: 'Facebook',
                            campaign_type: 'Facebook Ads',
                            campaign: 'Facebook Ads - Campaign 1',
                        },
                    ],
                },
            ];

            Client.findOne.mockResolvedValue({
                id: 1,
                name: 'Test Client 1',
            });
            CampaignGroup.findOne.mockResolvedValue(marketingCampaign);
            Campaign.findAll.mockResolvedValue(data);

            const response = await request.get(
                `/api/clients/${clientId}/marketingcampaign/${marketingCampaignId}/campaigns/${campaignId}`
            );
            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(data);
            expect(response.body.message).toBe(
                'Campaign retrieved successfully'
            );
        });

        it('404 client', async () => {
            Client.findOne.mockResolvedValue(null);
            const response = await request.get(
                `/api/clients/${clientId}/marketingcampaign/${marketingCampaignId}/campaigns/${campaignId}`
            );
            expect(response.status).toBe(404);
            expect(response.body.message).toBe(`Client not found`);
        });

        it('404 marketing campaign', async () => {
            Client.findOne.mockResolvedValue({
                id: 1,
                name: 'Test Client 1',
            });
            CampaignGroup.findOne.mockResolvedValue(null);
            const response = await request.get(
                `/api/clients/${clientId}/marketingcampaign/${marketingCampaignId}/campaigns/${campaignId}`
            );
            expect(response.status).toBe(404);
            expect(response.body.message).toBe(`Marketing campaign not found`);
        });

        it('404 campaign', async () => {
            const marketingCampaign = {
                id: 2,
                client_id: 1,
                name: 'Test campaign',
                campaigns: [
                    {
                        id: 2,
                        name: 'Facebook Ads - Campaign 1',
                        channel: 'Facebook',
                        campaign_type: 'Facebook Ads',
                        goals: '1. Do something\n2. Do something else\n3. Nothing else',
                    },
                ],
                adsets: [
                    {
                        id: 1,
                        campaign_id: 2,
                        name: 'Facebook Ads - Campaign 1 - Adset 1',
                        channel: 'Facebook',
                        campaign_type: 'Facebook Ads',
                        campaign: 'Facebook Ads - Campaign 1',
                    },
                    {
                        id: 2,
                        campaign_id: 2,
                        name: 'Facebook Ads - Campaign 1 - Adset 2',
                        channel: 'Facebook',
                        campaign_type: 'Facebook Ads',
                        campaign: 'Facebook Ads - Campaign 1',
                    },
                ],
            };

            Client.findOne.mockResolvedValue({
                id: 1,
                name: 'Test Client 1',
            });
            CampaignGroup.findOne.mockResolvedValue(marketingCampaign);
            Campaign.findAll.mockResolvedValue([]);

            const response = await request.get(
                `/api/clients/${clientId}/marketingcampaign/${marketingCampaignId}/campaigns/${campaignId}`
            );
            expect(response.status).toBe(404);
            expect(response.body.message).toBe(`Campaign not found`);
        });

        it('500', async () => {
            Client.findOne.mockRejectedValue(new Error('Error'));
            const response = await request.get(
                `/api/clients/${clientId}/marketingcampaign/${marketingCampaignId}/campaigns/${campaignId}`
            );
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error');
        });
    });

    describe('Update campaign goals', () => {
        const clientId = 1;
        const marketingCampaignId = 1;
        const campaignId = 1;

        it('200', async () => {
            const data = {
                id: 1,
                name: 'Campaña 1',
                client: 'Test Client 1',
                company_name: 'Company',
                goals: '1. test\n2. test\n3. test',
                total_gross_budget: 1,
                margin: 1,
                flight_time_start: '2022-11-11 00:00:00-04',
                flight_time_end: '2023-11-11 00:00:00-04',
                net_budget: 1,
                channels: 'a,b,c',
                createdAt: '2023-07-07 18:13:23.552748-04',
                updatedAt: '2023-07-07 18:13:23.552748-04',
                campaigns: [
                    {
                        id: 1,
                        name: 'Test Campaign 1',
                    },
                ],
                budget: {
                    campaigns: [
                        {
                            id: 1,
                            name: 'Test Campaign 1',
                        },
                    ],
                },
            };

            const sendData = {
                goals: '1. test\n2. test\n3. test',
            };

            Client.findOne.mockResolvedValue({
                id: 1,
                name: 'Test Client 1',
            });
            CampaignGroup.findOne.mockResolvedValue(data);
            Campaign.findOne.mockResolvedValue({
                id: 1,
                name: 'Test Campaign 1',
            });
            Campaign.update.mockResolvedValue([null, data.campaigns[0]]);

            const response = await request
                .put(
                    `/api/clients/${clientId}/marketingcampaign/${marketingCampaignId}/campaigns/${campaignId}/goals`
                )
                .send(sendData);
            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(data.campaigns[0]);
            expect(response.body.message).toBe(
                'Campaign goals updated successfully'
            );
        });

        it('400', async () => {
            const sendData = {};

            Client.findOne.mockResolvedValue({
                id: 1,
                name: 'Test Client 1',
            });

            const response = await request
                .put(
                    `/api/clients/${clientId}/marketingcampaign/${marketingCampaignId}/campaigns/${campaignId}/goals`
                )
                .send(sendData);
            expect(response.status).toBe(400);
            expect(response.body.message).toBe(
                `Missing required fields: goals`
            );
        });

        it('404 client', async () => {
            const sendData = {
                goals: 'test',
            };

            Client.findOne.mockResolvedValue(null);
            const response = await request
                .put(
                    `/api/clients/${clientId}/marketingcampaign/${marketingCampaignId}/campaigns/${campaignId}/goals`
                )
                .send(sendData);
            expect(response.status).toBe(404);
            expect(response.body.message).toBe(`Client not found`);
        });

        it('404 marketing campaign', async () => {
            const sendData = {
                goals: 'test',
            };
            Client.findOne.mockResolvedValue({
                id: 1,
                name: 'Test Client 1',
            });
            CampaignGroup.findOne.mockResolvedValue(null);
            const response = await request
                .put(
                    `/api/clients/${clientId}/marketingcampaign/${marketingCampaignId}/campaigns/${campaignId}/goals`
                )
                .send(sendData);
            expect(response.status).toBe(404);
            expect(response.body.message).toBe(`Marketing campaign not found`);
        });

        it('500', async () => {
            const sendData = {
                goals: 'test',
            };
            Client.findOne.mockRejectedValue(new Error('Error'));
            const response = await request
                .put(
                    `/api/clients/${clientId}/marketingcampaign/${marketingCampaignId}/campaigns/${campaignId}/goals`
                )
                .send(sendData);
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error');
        });
    });

    describe('Pause campaign from campaign group', () => {
        const clientId = 1;
        const marketingCampaignId = 1;
        const campaignId = 1;

        it('200', async () => {
            const data = {
                id: 1,
                name: 'Campaña 1',
                client: 'Test Client 1',
                campaigns: [
                    {
                        id: 1,
                        name: 'Test Campaign 1',
                        paused: true,
                    },
                ],
                budget: {
                    campaigns: [
                        {
                            id: 1,
                            name: 'Test Campaign 1',
                            paused: true,
                        },
                    ],
                },
            };

            CampaignGroup.findOne.mockResolvedValue(data);
            Campaign.findOne.mockResolvedValue(data.campaigns[0]);
            Campaign.update.mockResolvedValue([null, data.campaigns[0]]);

            const response = await request
                .put(
                    `/api/clients/${clientId}/marketingcampaign/${marketingCampaignId}/campaigns/${campaignId}/pause`
                )
                .send({ pause: true });
            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(data.campaigns[0]);
            expect(response.body.message).toBe(
                'Campaign paused status updated successfully'
            );
        });

        it('400', async () => {
            const response = await request.put(
                `/api/clients/${clientId}/marketingcampaign/${marketingCampaignId}/campaigns/${campaignId}/pause`
            );
            expect(response.status).toBe(400);
            expect(response.body.message).toBe(
                'Missing required fields: pause or pause is not a boolean'
            );
        });

        it('404 campaign group', async () => {
            CampaignGroup.findOne.mockResolvedValue(null);

            const response = await request
                .put(
                    `/api/clients/${clientId}/marketingcampaign/${marketingCampaignId}/campaigns/${campaignId}/pause`
                )
                .send({ pause: true });
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Campaign group not found');
        });

        it('500', async () => {
            CampaignGroup.findOne.mockRejectedValue(new Error('Error'));
            const response = await request
                .put(
                    `/api/clients/${clientId}/marketingcampaign/${marketingCampaignId}/campaigns/${campaignId}/pause`
                )
                .send({ pause: true });
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error');
        });
    });

    describe('Delete campaign from campaign group', () => {
        const clientId = 1;
        const campaignGroupId = 1;
        const campaignId = 1;

        it('200', async () => {
            const data = {
                id: 1,
                name: 'Campaña 1',
                client: 'Test Client 1',
                campaigns: [
                    {
                        id: 1,
                        name: 'Test Campaign 1',
                        deleted: false,
                    },
                ],
                budget: {
                    campaigns: [
                        {
                            id: 1,
                            name: 'Test Campaign 1',
                            deleted: false,
                        },
                    ],
                },
            };

            CampaignGroup.findOne.mockResolvedValue(data);
            CampaignGroup.update.mockResolvedValue([null, data]);
            Campaign.findOne.mockResolvedValue(data.campaigns[0]);
            Campaign.update.mockResolvedValue([null, data.campaigns[0]]);

            const response = await request.delete(
                `/api/clients/${clientId}/marketingcampaign/${campaignGroupId}/campaigns/${campaignId}`
            );
            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(data.campaigns[0]);
            expect(response.body.message).toBe('Campaign deleted successfully');
        });

        it('404 campaign group', async () => {
            CampaignGroup.findOne.mockResolvedValue(null);

            const response = await request.delete(
                `/api/clients/${clientId}/marketingcampaign/${campaignGroupId}/campaigns/${campaignId}`
            );
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Campaign group not found');
        });

        it('500', async () => {
            CampaignGroup.findOne.mockRejectedValue(new Error('Error'));
            const response = await request.delete(
                `/api/clients/${clientId}/marketingcampaign/${campaignGroupId}/campaigns/${campaignId}`
            );
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error');
        });
    });
});
