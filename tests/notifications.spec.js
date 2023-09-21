const supertest = require('supertest');
const makeApp = require('../src/app');
const { Notification } = require('../src/models');
const { getUser } = require('../src/utils');

jest.mock('../src/models', () => ({
    Notification: {
        create: jest.fn(),
        update: jest.fn(),
        findOne: jest.fn(),
        findAll: jest.fn(),
    },
}));

jest.mock('../src/utils', () => ({
    getUser: jest.fn(),
}));

const app = makeApp();
const request = supertest(app);

describe('Notifications Endpoints Test', () => {
    describe('Get all unread notifications', () => {
        it('200', async () => {
            const data = [
                {
                    id: 1,
                    title: 'Notification',
                    message: 'This is a notification',
                    campaign_group_info: {
                        id: 1,
                        name: 'Campaign',
                    },
                    client_info: {
                        id: 1,
                        name: 'Client',
                    },
                    type: 'bell',
                    status: 'unread',
                    timestamp: '2023-09-21T21:45:13.770Z',
                },
            ];

            const user = {
                id: 1,
                username: '123',
            };

            getUser.mockResolvedValue(user);
            Notification.findAll.mockResolvedValue(data);

            const response = await request.get('/api/notifications');
            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(data);
            expect(response.body.message).toBe(
                'Notifications retrieved successfully'
            );
        });

        it('500', async () => {
            Notification.findAll.mockRejectedValue(new Error('Error'));
            const response = await request.get('/api/notifications');
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error');
        });
    });

    describe('Get notifications by status', () => {
        it("400 if status isn't unread or read", async () => {
            const response = await request.get('/api/notifications/status/abc');
            expect(response.status).toBe(400);
            expect(response.body.message).toBe(
                'Invalid notification status: abc'
            );
        });

        it('200', async () => {
            const data = [
                {
                    id: 1,
                    title: 'Notification',
                    message: 'This is a notification',
                    campaign_group_info: {
                        id: 1,
                        name: 'Campaign',
                    },
                    client_info: {
                        id: 1,
                        name: 'Client',
                    },
                    type: 'bell',
                    status: 'unread',
                    timestamp: '2023-09-21T21:45:13.770Z',
                },
            ];

            const user = {
                id: 1,
                username: '123',
            };

            getUser.mockResolvedValue(user);
            Notification.findAll.mockResolvedValue(data);

            const response = await request.get(
                '/api/notifications/status/unread'
            );
            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(data);
            expect(response.body.message).toBe(
                'Notifications retrieved successfully'
            );
        });

        it('500', async () => {
            Notification.findAll.mockRejectedValue(new Error('Error'));
            const response = await request.get(
                '/api/notifications/status/unread'
            );
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error');
        });
    });

    describe('Create notification', () => {
        it('400 if missing title', async () => {
            const response = await request.post('/api/notifications').send({
                message: 'This is a notification',
                campaign_group_info: {
                    id: 1,
                    name: 'Campaign',
                },
                client_info: {
                    id: 1,
                    name: 'Client',
                },
                type: 'bell',
                status: 'unread',
            });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe(
                'Missing required fields: title'
            );
        });

        it('201', async () => {
            const data = {
                id: 1,
                title: 'Notification',
                message: 'This is a notification',
                campaign_group_info: {
                    id: 1,
                    name: 'Campaign',
                },
                client_info: {
                    id: 1,
                    name: 'Client',
                },
                type: 'bell',
                status: 'unread',
                timestamp: '2023-09-21T21:45:13.770Z',
            };

            const user = {
                id: 1,
                username: '123',
            };

            getUser.mockResolvedValue(user);
            Notification.create.mockResolvedValue(data);

            const response = await request.post('/api/notifications').send({
                title: 'Notification',
                message: 'This is a notification',
                campaign_group_info: {
                    id: 1,
                    name: 'Campaign',
                },
                client_info: {
                    id: 1,
                    name: 'Client',
                },
                type: 'bell',
                status: 'unread',
            });
            expect(response.status).toBe(201);
            expect(response.body.data).toEqual(data);
            expect(response.body.message).toBe(
                'Notification created successfully'
            );
        });

        it('500', async () => {
            Notification.create.mockRejectedValue(new Error('Error'));
            const response = await request.post('/api/notifications').send({
                title: 'Notification',
                message: 'This is a notification',
                campaign_group_info: {
                    id: 1,
                    name: 'Campaign',
                },
                client_info: {
                    id: 1,
                    name: 'Client',
                },
                type: 'bell',
                status: 'unread',
            });
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error');
        });
    });

    describe('Update notification', () => {
        it('404 if notification not found', async () => {
            const response = await request.patch('/api/notifications/1').send({
                title: 'Notification',
                message: 'This is a notification',
                campaign_group_info: {
                    id: 1,
                    name: 'Campaign',
                },
                client_info: {
                    id: 1,
                    name: 'Client',
                },
                type: 'bell',
                status: 'unread',
            });
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Notification not found');
        });

        it('200', async () => {
            const data = {
                id: 1,
                title: 'Notification',
                message: 'This is a notification',
                campaign_group_info: {
                    id: 1,
                    name: 'Campaign',
                },
                client_info: {
                    id: 1,
                    name: 'Client',
                },
                type: 'bell',
                status: 'unread',
                timestamp: '2023-09-21T21:45:13.770Z',
            };

            const user = {
                id: 1,
                username: '123',
            };

            getUser.mockResolvedValue(user);
            Notification.findOne.mockResolvedValue(data);
            Notification.update.mockResolvedValue();

            const response = await request.patch('/api/notifications/1').send({
                title: 'Notification',
                message: 'This is a notification',
                campaign_group_info: {
                    id: 1,
                    name: 'Campaign',
                },
                client_info: {
                    id: 1,
                    name: 'Client',
                },
                type: 'bell',
                status: 'unread',
            });
            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(data);
            expect(response.body.message).toBe(
                'Notification with id 1 updated successfully'
            );
        });

        it('500', async () => {
            Notification.findOne.mockRejectedValue(new Error('Error'));
            const response = await request.patch('/api/notifications/1').send({
                title: 'Notification',
                message: 'This is a notification',
                campaign_group_info: {
                    id: 1,
                    name: 'Campaign',
                },
                client_info: {
                    id: 1,
                    name: 'Client',
                },
                type: 'bell',
                status: 'unread',
            });
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error');
        });
    });

    describe('Mark notification as read', () => {
        it('404 if notification not found', async () => {
            Notification.findOne.mockResolvedValue(null);
            const response = await request.patch('/api/notifications/1/read');
            expect(response.status).toBe(404);
            expect(response.body.message).toBe(
                'Notification not found or already marked as read'
            );
        });

        it('200', async () => {
            const data = {
                id: 1,
                title: 'Notification',
                message: 'This is a notification',
                campaign_group_info: {
                    id: 1,
                    name: 'Campaign',
                },
                client_info: {
                    id: 1,
                    name: 'Client',
                },
                type: 'bell',
                status: 'read',
                timestamp: '2023-09-21T21:45:13.770Z',
            };

            const user = {
                id: 1,
                username: '123',
            };

            getUser.mockResolvedValue(user);
            Notification.findOne.mockResolvedValue(data);
            Notification.update.mockResolvedValue();

            const response = await request.patch('/api/notifications/1/read');
            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(data);
            expect(response.body.message).toBe(
                'Notification with id 1 was marked as read'
            );
        });

        it('500', async () => {
            Notification.findOne.mockRejectedValue(new Error('Error'));
            const response = await request.patch('/api/notifications/1/read');
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error');
        });
    });
});
