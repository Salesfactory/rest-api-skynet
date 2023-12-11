// emailSender.test.js
const { sendEmails } = require('./emailSender');
const { CampaignGroup, Job } = require('../models');
const { send } = require('../utils/email');
const { emailAmzTemplate } = require('../templates/amzEmail');

jest.mock('../models', () => ({
    CampaignGroup: { findOne: jest.fn() },
    Job: { findAll: jest.fn() },
}));
jest.mock('../utils/email', () => ({ send: jest.fn() }));
jest.mock('../templates/amzEmail', () => ({ emailAmzTemplate: jest.fn() }));

describe('sendEmails', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should send an email if user and jobs are found', async () => {
        CampaignGroup.findOne.mockResolvedValue({
            name: 'Campaign Group Name',
            user: { email: 'test@example.com', name: 'Test User' },
        });
        Job.findAll.mockResolvedValue([
            {
                dataValues: {
                    /* mock job data */
                },
            },
        ]);
        emailAmzTemplate.mockReturnValue('<p>Mock Email Body</p>');

        await sendEmails(1);

        expect(send).toHaveBeenCalledWith({
            to: 'test@example.com',
            subject: 'Amazon adsets report',
            message: 'Amazon test report',
            html: '<p>Mock Email Body</p>',
        });
    });

    it('should not send an email if no user is found', async () => {
        CampaignGroup.findOne.mockResolvedValue(null);

        await sendEmails(1);

        expect(send).not.toHaveBeenCalled();
    });

    it('should not send an email if no jobs are found', async () => {
        CampaignGroup.findOne.mockResolvedValue({
            name: 'Campaign Group Name',
            user: { email: 'test@example.com', name: 'Test User' },
        });
        Job.findAll.mockResolvedValue([]);

        await sendEmails(1);

        expect(send).not.toHaveBeenCalled();
    });

    it('should handle errors when sending emails', async () => {
        CampaignGroup.findOne.mockResolvedValue({
            name: 'Campaign Group Name',
            user: { email: 'test@example.com', name: 'Test User' },
        });
        Job.findAll.mockResolvedValue([
            {
                dataValues: {
                    /* mock job data */
                },
            },
        ]);
        emailAmzTemplate.mockReturnValue('<p>Mock Email Body</p>');
        send.mockRejectedValue(new Error('Email send failed'));

        await expect(sendEmails(1)).rejects.toThrow('Email send failed');
    });

    // Add more tests as needed...
});
