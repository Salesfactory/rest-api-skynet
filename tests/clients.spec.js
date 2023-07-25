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

    describe('Get advertisements by: channel, adsetName, campaignName, campaignType', () => {
        const clientId = 1;
        it('404 client not found', async () => {
            Client.findOne.mockResolvedValue(null);

            const response = await request.get(
                `/api/clients/${clientId}/advertisements?channel=Test&adsetName=Test%20Ad&campaignName=Test%20Campaign&campaignType=Test`
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
                `/api/clients/${clientId}/advertisements?channel=Test&adsetName=Test%20Ad`
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
                        adset_id: '23855226587570359',
                        adset_name: 'Test Ad',
                        campaign_type: 'Test',
                    },
                    {
                        campaign_id: '23855226587440359',
                        campaign_name: 'Test Campaign',
                        adset_id: '23855229119530359',
                        adset_name: 'Test Ad',
                        campaign_type: 'Test',
                    },
                ],
            ];

            bigqueryClient.query.mockResolvedValue(data);
            const response = await request.get(
                `/api/clients/${clientId}/advertisements?channel=Test&adsetName=Test%20Ad&campaignName=Test%20Campaign&campaignType=Test`
            );
            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(data[0]);
            expect(response.body.message).toBe(
                'Advertisements retrieved successfully'
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
                `/api/clients/${clientId}/advertisements?channel=Test&adsetName=Test%20Ad&campaignName=Test%20Campaign&campaignType=Test`
            );
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error');
        });
    });
});
