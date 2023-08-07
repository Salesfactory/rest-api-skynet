const supertest = require('supertest');
const makeApp = require('../src/app');
const { Client } = require('../src/models');
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
}));

jest.mock('../src/config/bigquery', () => ({
    bigqueryClient: {
        query: jest.fn(),
    },
}));

const app = makeApp();
const request = supertest(app);

describe('Client Endpoints Test', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Get all clients', () => {
        it('200', async () => {
            const data = [
                { id: 1, name: 'Client 1' },
                { id: 2, name: 'Client 2' },
            ];

            Client.findAll.mockResolvedValue(data);

            const response = await request.get('/api/clients');
            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(data);
            expect(response.body.message).toBe(
                'Clients retrieved successfully'
            );
        });

        it('500', async () => {
            Client.findAll.mockRejectedValue(new Error('Error'));
            const response = await request.get('/api/clients');

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error');
        });
    });

    describe('Get Client', () => {
        it('should retrieve client successfully', async () => {
            const data = { id: 1, name: 'Client 1' };
            Client.findOne.mockResolvedValue(data);

            const res = await request.get(`/api/clients/1`);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Client retrieved successfully');
            expect(res.body.data).toMatchObject(data); // Assumes data returns the plain object of client
        });

        // Not found test case
        it('should return 404 if client is not found', async () => {
            Client.findOne.mockResolvedValue(null);
            const res = await request.get('/api/clients/9999999'); // assuming this ID does not exist

            expect(res.status).toBe(404);
            expect(res.body.message).toBe('Client not found');
        });

        // Failure test case
        it('should return 500 if server error occurs', async () => {
            // Here you would need to mock a situation where the server will throw an error
            // This might be mocking the Client.findOne method to throw an error, or some other way that suits your codebase

            Client.findOne.mockRejectedValue(new Error('Server Error'));

            const res = await request.get('/api/clients/1');

            expect(res.status).toBe(500);
            expect(res.body.message).toBe('Server Error');
        });
    });

    describe('Get non-orchestrated campaigns by: channel, campaignName, campaignType', () => {
        const clientId = 1;
        it('404 client not found', async () => {
            Client.findOne.mockResolvedValue(null);

            const response = await request.get(
                `/api/clients/${clientId}/non-orchestrated/campaigns?channel=Test&campaignName=Test%20Campaign&campaignType=Test`
            );
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Client not found');
        });

        it('400 missing required fields', async () => {
            const client = {
                id: 1,
                name: 'Test Client 1',
            };
            Client.findOne.mockResolvedValue(client);

            const response = await request.get(
                `/api/clients/${clientId}/non-orchestrated/campaigns?channel=Test`
            );
            expect(response.status).toBe(400);
            expect(response.body.message).toBe(
                'Missing required fields: campaignName, campaignType'
            );
        });

        it('200', async () => {
            const client = {
                id: 1,
                name: 'Test Client 1',
            };
            Client.findOne.mockResolvedValue(client);
            const data = [
                [
                    {
                        campaign_id: '23855226587440359',
                        campaign_name: 'Test Campaign',
                        campaign_type: 'Test',
                    },
                    {
                        campaign_id: '23855226587440359',
                        campaign_name: 'Test Campaign',
                        campaign_type: 'Test',
                    },
                ],
            ];

            bigqueryClient.query.mockResolvedValue(data);
            const response = await request.get(
                `/api/clients/${clientId}/non-orchestrated/campaigns?channel=Test&campaignName=Test%20Campaign&campaignType=Test`
            );
            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(data[0]);
            expect(response.body.message).toBe(
                'BigQuery campaigns retrieved successfully'
            );
        });

        it('500', async () => {
            const client = {
                id: 1,
                name: 'Test Client 1',
            };
            Client.findOne.mockResolvedValue(client);
            bigqueryClient.query.mockRejectedValue(new Error('Error'));

            const response = await request.get(
                `/api/clients/${clientId}/non-orchestrated/campaigns?channel=Test&campaignName=Test%20Campaign&campaignType=Test`
            );
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error');
        });
    });

    describe('Get non-orchestrated adsets by: campaign id, adset name', () => {
        const clientId = 1;
        it('404 client not found', async () => {
            Client.findOne.mockResolvedValue(null);

            const response = await request.get(
                `/api/clients/${clientId}/non-orchestrated/adsets?campaignId=123&adsetName=Test%20Adset`
            );
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Client not found');
        });

        it('400 missing required fields', async () => {
            const client = {
                id: 1,
                name: 'Test Client 1',
            };
            Client.findOne.mockResolvedValue(client);

            const response = await request.get(
                `/api/clients/${clientId}/non-orchestrated/adsets?`
            );
            expect(response.status).toBe(400);
            expect(response.body.message).toBe(
                'Missing required fields: campaignId, adsetName'
            );
        });

        it('200', async () => {
            const client = {
                id: 1,
                name: 'Test Client 1',
            };
            Client.findOne.mockResolvedValue(client);
            const data = [
                [
                    {
                        campaign_id: '23855226587440359',
                        campaign_name: 'Test Campaign',
                        campaign_type: 'Test',
                        adset_id: '23855226587440359',
                        adset_name: 'Test Adset',
                    },
                    {
                        campaign_id: '23855226587440359',
                        campaign_name: 'Test Campaign',
                        campaign_type: 'Test',
                        adset_id: '23855226587440359',
                        adset_name: 'Test Adset',
                    },
                ],
            ];

            bigqueryClient.query.mockResolvedValue(data);
            const response = await request.get(
                `/api/clients/${clientId}/non-orchestrated/adsets?campaignId=123&adsetName=Test%20Adset`
            );
            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(data[0]);
            expect(response.body.message).toBe(
                'BigQuery adsets retrieved successfully'
            );
        });

        it('500', async () => {
            const client = {
                id: 1,
                name: 'Test Client 1',
            };
            Client.findOne.mockResolvedValue(client);
            bigqueryClient.query.mockRejectedValue(new Error('Error'));

            const response = await request.get(
                `/api/clients/${clientId}/non-orchestrated/adsets?campaignId=123&adsetName=Test%20Adset`
            );
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error');
        });
    });
});
