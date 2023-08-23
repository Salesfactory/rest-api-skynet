const utils = require('../src/utils');

describe('utils', () => {
    it('Validate (valid) budget allocation', () => {
        const campaignGroup = {
            allocations: {
                february: {
                    budget: 54.12,
                    percentage: 50,
                    allocations: [
                        {
                            id: '1',
                            name: 'Google Ads',
                            budget: 27.06,
                            percentage: 50,
                            type: 'CHANNEL',
                            allocations: [],
                        },
                        {
                            id: '2',
                            name: 'Amazon Advertising',
                            budget: 27.06,
                            percentage: 50,
                            type: 'CHANNEL',
                            allocations: [],
                        },
                    ],
                },
                march: {
                    budget: 54.12,
                    percentage: 50,
                    allocations: [
                        {
                            id: '1',
                            name: 'Google Ads',
                            budget: 27.06,
                            percentage: 50,
                            type: 'CHANNEL',
                            allocations: [],
                        },
                        {
                            id: '2',
                            name: 'Amazon Advertising',
                            budget: 27.06,
                            percentage: 50,
                            type: 'CHANNEL',
                            allocations: [],
                        },
                    ],
                },
            },
            periods: ['february', 'march'],
        };

        const { validation, message } = utils.validateObjectAllocations(
            campaignGroup.allocations,
            campaignGroup.periods
        );

        expect(validation).toBe(true);
        expect(message).toBe('Valid object');
    });

    it('Validate (invalid) budget allocation', () => {
        const campaignGroup = {
            allocations: {
                february: {
                    budget: 54.12,
                    percentage: 50,
                    allocations: [
                        {
                            id: '1',
                            name: 'Google Ads',
                            budget: 27.06,
                            percentage: 50,
                            allocations: [],
                        },
                        {
                            id: '2',
                            name: 'Amazon Advertising',
                            budget: 27.06,
                            percentage: 50,
                            type: 'CHANNEL',
                            allocations: [],
                        },
                    ],
                },
            },
            periods: ['february', 'march'],
        };

        const { validation, message } = utils.validateObjectAllocations(
            campaignGroup.allocations,
            campaignGroup.periods
        );

        expect(validation).toBe(false);
        expect(message).toBe(
            'Invalid allocations: [{"id":"1","name":"Google Ads","budget":27.06,"percentage":50,"allocations":[]},{"id":"2","name":"Amazon Advertising","budget":27.06,"percentage":50,"type":"CHANNEL","allocations":[]}]'
        );
    });
});
