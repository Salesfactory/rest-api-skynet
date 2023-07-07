const supertest = require('supertest');
const makeApp = require('../src/app');
const { bigqueryClient } = require('../src/config/bigquery');

const { User } = require('../src/models');

jest.mock('../src/models', () => ({
    User: {
        create: jest.fn(),
        update: jest.fn(),
        findOne: jest.fn(),
        findAll: jest.fn(),
        destroy: jest.fn()
    },
}));

jest.mock('../src/config/bigquery', () => ({
    bigqueryClient: {
        query: jest.fn(),
    },
}));

const app = makeApp();
const request = supertest(app);

describe('Channel Endpoints Test', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Get all channels', () => {
        it('200', async () => {
            const data = [[{ channel: 'Reddit' }, { channel: 'Facebook' }]];

            bigqueryClient.query.mockResolvedValue(data);

            const response = await request.get('/api/channels');
            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(data[0]);
            expect(response.body.message).toBe(
                'Channels retrieved successfully'
            );
        });

        it('500', async () => {
            bigqueryClient.query.mockRejectedValue(new Error('Error'));
            const response = await request.get('/api/channels');

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error');
        });
    });
});
