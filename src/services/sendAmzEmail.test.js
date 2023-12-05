// Mock the 'send' function
jest.mock('../utils/email', () => ({
    send: jest.fn().mockResolvedValue({
        /* mocked response */
    }),
}));

const { send } = require('../utils/email');

const { emailAmzTemplate } = require('../templates/amzEmail');
const { sendAdsetCreationResultsToOwners } = require('./sendAmzEmail');

describe('sendAdsetCreationResultsToOwners', () => {
    it('sends emails to owners', async () => {
        const owners = [
            {
                name: 'Kenyer',
                email: 'kenyer@example.com',
                campaignGroup: {
                    name: 'Campaign group 1',
                },
                campaigns: [
                    {
                        campaignName: 'Campaign 1',
                        status: 'procesed',
                        description: 'foo',
                        adsets: [
                            {
                                adsetName: 'adset 1',
                                status: 'procesed',
                                description: 'foo',
                            },
                        ],
                    },
                    {
                        campaignName: 'Campaign 2',
                        status: 'pending',
                        description: 'bar',
                        adsets: [
                            {
                                adsetName: 'adset 2',
                                status: 'pending',
                                description: 'bar',
                            },
                            {
                                adsetName: 'adset 3',
                                status: 'processing',
                                description: 'baz',
                            },
                        ],
                    },
                    {
                        campaignName: 'Campaign 3',
                        status: 'procesed',
                        description: 'qux',
                        adsets: [
                            {
                                adsetName: 'adset 4',
                                status: 'procesed',
                                description: 'qux',
                            },
                        ],
                    },
                ],
            },
            {
                name: 'John Doe',
                email: 'john.doe@example.com',
                campaignGroup: {
                    name: 'Marketing Team A',
                },
                campaigns: [
                    {
                        campaignName: 'Summer Sale',
                        status: 'pending',
                        description: 'New summer sale campaign',
                        adsets: [
                            {
                                adsetName: 'adset 5',
                                status: 'pending',
                                description: 'Targeting beachgoers',
                            },
                        ],
                    },
                ],
            },
            {
                name: 'Alice Johnson',
                email: 'alice.johnson@example.com',
                campaignGroup: {
                    name: 'Product Launch',
                },
                campaigns: [
                    {
                        campaignName: 'New Product Launch',
                        status: 'procesed',
                        description: 'Launching the latest product',
                        adsets: [
                            {
                                adsetName: 'adset 6',
                                status: 'procesed',
                                description: 'Targeting tech enthusiasts',
                            },
                            {
                                adsetName: 'adset 7',
                                status: 'procesed',
                                description: 'Targeting early adopters',
                            },
                        ],
                    },
                ],
            },
        ];

        // Invoke the function
        await sendAdsetCreationResultsToOwners(owners);

        // Check if send function was called with the correct arguments
        expect(send).toHaveBeenCalledTimes(owners.length);

        owners.forEach((owner, index) => {
            const emailBody = emailAmzTemplate({
                owner,
                campaigns: owner.campaigns,
                campaignGroup: owner.campaignGroup,
            });

            // Check if send function was called with the correct arguments
            expect(send).toHaveBeenNthCalledWith(index + 1, {
                to: owner.email,
                subject: 'Amazon adsets report',
                message: 'Amazon test report',
                html: emailBody,
            });
        });
    });
});
