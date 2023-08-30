const supertest = require('supertest');
const makeApp = require('../src/app');
const { bigqueryClient } = require('../src/config/bigquery');

const { Agency, Channel } = require('../src/models');

jest.mock('../src/models', () => ({
    Agency: {
        findAll: jest.fn(),
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

const app = makeApp();
const request = supertest(app);

describe('Channel Endpoints Test', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Get all channels', () => {
        it('200', async () => {
            const data = [
                [
                    { id: 1, channel: 'Reddit' },
                    { id: 2, channel: 'Facebook' },
                ],
            ];
            Channel.findAll.mockResolvedValue(data[0]);

            const response = await request.get('/api/channels');
            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(data[0]);
            expect(response.body.message).toBe(
                'Channels retrieved successfully'
            );
        });

        it('500', async () => {
            Channel.findAll.mockRejectedValue(new Error('Error'));
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
