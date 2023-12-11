// emailSender.test.js
const { sendEmails } = require('./sendAmzEmail');
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
            campaignGroupName: 'Campaign Group Name',
            user: { email: 'test@example.com', name: 'Test User' },
        });
        Job.findAll.mockResolvedValue([
            {
                dataValues: {
                    id: 12,
                    data: {
                        type: 'Sponsored Ads',
                        adset: {
                            id: '3-SEARCH-dfsdfsd-sdfdx',
                            name: '202301|SEARCH|OBJETIVE|NAMESD|SCOPE|TARGET|FORMAT',
                            type: 'ADSET',
                            budget: 2125,
                            format: 'FORMAT',
                            targeting: 'TARGET',
                            percentage: 100,
                        },
                        orderId: 2,
                        profileId: 'DSP_PROFILE_ID',
                        campaignId: '2-SEARCH-dfsdfsd1',
                    },
                    status: 'pending',
                    processedAt: null,
                    batchId: 4,
                    createdAt: `2023-12-11T11:47:06.834Z`,
                    updatedAt: `2023-12-11T11:47:06.834Z`,
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
        CampaignGroup.findOne.mockResolvedValue({ name: '', user: null });

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

    // it('should handle errors when sending emails', async () => {
    //     CampaignGroup.findOne.mockResolvedValue({
    //         name: 'Campaign Group Name',
    //         user: { email: 'test@example.com', name: 'Test User' },
    //     });
    //     Job.findAll.mockResolvedValue([
    //         {
    //             dataValues: {
    //                 id: 12,
    //                 data: {
    //                     type: 'Sponsored Ads',
    //                     adset: {
    //                         id: '3-SEARCH-dfsdfsd-sdfdx',
    //                         name: '202301|SEARCH|OBJETIVE|NAMESD|SCOPE|TARGET|FORMAT',
    //                         type: 'ADSET',
    //                         budget: 2125,
    //                         format: 'FORMAT',
    //                         targeting: 'TARGET',
    //                         percentage: 100,
    //                     },
    //                     orderId: 2,
    //                     profileId: 'DSP_PROFILE_ID',
    //                     campaignId: '2-SEARCH-dfsdfsd1',
    //                 },
    //                 status: 'pending',
    //                 processedAt: null,
    //                 batchId: 4,
    //                 createdAt: `2023-12-11T11:47:06.834Z`,
    //                 updatedAt: `2023-12-11T11:47:06.834Z`,
    //             },
    //         },
    //     ]);
    //     emailAmzTemplate.mockReturnValue('<p>Mock Email Body</p>');
    //     send.mockRejectedValue(new Error('Email send failed'));

    //     await expect(sendEmails(1)).rejects.toThrow('Email send failed');
    // });

    // Add more tests as needed...
});
