const supertest = require('supertest');
const makeApp = require('../src/app');
const { Campaign, Client } = require('../src/models');
const { bigqueryClient } = require('../src/config/bigquery');

jest.mock('../src/models', () => ({
    User: {
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
            Campaign.findAll.mockResolvedValue(data);

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
            Campaign.findAll.mockRejectedValue(new Error('Error'));
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
            Campaign.findOne.mockResolvedValue(null);
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
            Campaign.findOne.mockResolvedValue(data);

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
            Campaign.findOne.mockRejectedValue(new Error('Error'));
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
                `Missing required fields: name, company_name, total_gross_budget, margin, flight_time_start, flight_time_end, net_budget, channels`
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
            Campaign.create.mockResolvedValue(data);

            const response = await request
                .post(`/api/clients/${clientId}/marketingcampaign`)
                .send(sendData);
            expect(response.status).toBe(201);
            expect(response.body.data).toEqual(data);
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
            Campaign.findOne.mockResolvedValue(null);
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
            Campaign.findOne.mockResolvedValue(data);
            Campaign.update.mockResolvedValue([null, data]);

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
            Campaign.findOne.mockResolvedValue(null);
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
            Campaign.findOne.mockResolvedValue(data);
            Campaign.destroy.mockResolvedValue(1);

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
});
