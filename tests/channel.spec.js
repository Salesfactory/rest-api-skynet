const supertest = require('supertest');
const makeApp = require('../src/app');
const { bigqueryClient } = require('../src/config/bigquery');

const { User, Agency } = require('../src/models');

jest.mock('../src/models', () => ({
    User: {
        create: jest.fn(),
        update: jest.fn(),
        findOne: jest.fn(),
        findAll: jest.fn(),
        destroy: jest.fn(),
    },
    Agency: {
        findAll: jest.fn(),
    }
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

    describe('Get campaign types for a specific channel', () => {
        it('200', async () => {
            const channelName = 'Facebook';
            const data = [
                [{ campaign_type: 'SEARCH' }, { campaign_type: 'VIDEO' }],
            ];

            bigqueryClient.query.mockResolvedValue(data);

            Agency.findAll.mockResolvedValue([
                { aliases: ['Facebook', 'FB'] },
                { aliases: ['Google', 'GOOGL'] },
            ]);

            const response = await request.get(
                `/api/channels/campaignTypes?channelName=${channelName}`
            );

            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(data[0]);
            expect(response.body.message).toBe(
                'Campaign types retrieved successfully'
            );
        });

        it('500', async () => {
            const channelName = 'Facebook';

            bigqueryClient.query.mockRejectedValue(new Error('Error'));

            const response = await request.get(
                `/api/channels/campaignTypes?channelName=${channelName}`
            );

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error');
        });
    });
});
