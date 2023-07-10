const supertest = require('supertest');
const makeApp = require('../src/app');
const { Client } = require('../src/models');

jest.mock('../src/models', () => ({
    User: {
        create: jest.fn(),
        update: jest.fn(),
        findOne: jest.fn(),
        findAll: jest.fn(),
        destroy: jest.fn(),
    },
    Client: {
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
});
