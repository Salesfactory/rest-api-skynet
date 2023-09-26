const {
    checkIfCampaignIsOffPace,
    checkBigQueryIdExists,
    checkPacingOffPace,
} = require('../src/utils/cronjobs');

jest.mock('../src/utils/cronjobs', () => ({
    ...jest.requireActual('../src/utils/cronjobs'),
}));

describe('Cronjobs', () => {
    const currentDate = new Date('September 2023');

    describe('Check pacing off pace', () => {
        it('should return an array with length > 0', () => {
            const pacing = {
                periods: [],
                allocations: {
                    september_2023: {
                        allocations: [
                            {
                                name: 'Google Ads',
                                budget: 851.1560000000001,
                                allocations: [],
                                adb: 56.74373333333334,
                                adb_current: 340.4624,
                            },
                            {
                                name: 'Amazon Advertising',
                                budget: 851.1560000000001,
                                allocations: [],
                                adb: 56.74373333333334,
                                adb_current: 0.4624,
                            },
                        ],
                    },
                },
            };
            const result = checkPacingOffPace({ pacing, currentDate });
            expect(result).toHaveLength(2);
        });
        it('should return an array with length = 0 if pacing is null', () => {
            const pacing = null;
            const result = checkPacingOffPace({ pacing, currentDate });
            expect(result).toHaveLength(0);
        });
        it('should return an array with length = 0 if pacing is on pace', () => {
            const pacing = {
                periods: [],
                allocations: {
                    september_2023: {
                        allocations: [
                            {
                                name: 'Google Ads',
                                budget: 851.1560000000001,
                                type: 'CHANNEL',
                                allocations: [],
                                adb: 56.74373333333334,
                                adb_current: 56,
                            },
                        ],
                    },
                },
            };
            const result = checkPacingOffPace({ pacing, currentDate });
            expect(result).toHaveLength(0);
        });
    });

    describe('Check if campaign is off pace', () => {
        it('should return true if campaign is off pace', () => {
            const campaign = {
                name: 'Campaign 1',
                client: {
                    name: 'Client 1',
                },
                pacings: [
                    {
                        periods: [],
                        allocations: {
                            september_2023: {
                                allocations: [
                                    {
                                        name: 'Google Ads',
                                        budget: 851.1560000000001,
                                        allocations: [],
                                        adb: 56.74373333333334,
                                        adb_current: 340.4624,
                                    },
                                    {
                                        name: 'Amazon Advertising',
                                        budget: 851.1560000000001,
                                        allocations: [],
                                        adb: 56.74373333333334,
                                        adb_current: 0.4624,
                                    },
                                ],
                            },
                        },
                    },
                ],
            };
            const { hasOffPaceCampaigns } = checkIfCampaignIsOffPace({
                campaign,
                currentDate,
            });
            expect(hasOffPaceCampaigns).toBeTruthy();
        });
        it('should return false if campaign is on pace', () => {
            const campaign = {
                name: 'Campaign 1',
                client: {
                    name: 'Client 1',
                },
                pacings: [
                    {
                        periods: [],
                        allocations: {
                            september_2023: {
                                allocations: [
                                    {
                                        name: 'Google Ads',
                                        budget: 851.1560000000001,
                                        type: 'CHANNEL',
                                        allocations: [],
                                        adb: 56.74373333333334,
                                        adb_current: 56,
                                    },
                                ],
                            },
                        },
                    },
                ],
            };
            const { hasOffPaceCampaigns } = checkIfCampaignIsOffPace({
                campaign,
                currentDate,
            });
            expect(hasOffPaceCampaigns).toBeFalsy();
        });
    });

    describe('Check if bigquery id exists for unlinking process', () => {
        it('should return true if bigquery_campaign_id exist in every campaign', () => {
            const allocations = {
                september_2023: {
                    allocations: [
                        {
                            name: 'Google Ads',
                            budget: 851.1560000000001,
                            type: 'CHANNEL',
                            allocations: [
                                {
                                    name: 'Ad Type 1',
                                    budget: 851.1560000000001,
                                    type: 'CAMPAIGN_TYPE',
                                    allocations: [
                                        {
                                            name: 'Ad Group 1',
                                            budget: 851.1560000000001,
                                            type: 'CAMPAIGN',
                                            allocations: [],
                                            adb: 56.74373333333334,
                                            adb_current: 56,
                                            bigquery_campaign_id: 123,
                                        },
                                    ],
                                    adb: 56.74373333333334,
                                    adb_current: 56,
                                },
                            ],
                            adb: 56.74373333333334,
                            adb_current: 56,
                        },
                    ],
                },
            };

            const result = checkBigQueryIdExists({
                allocations,
            });
            expect(result).toBeTruthy();
        });

        it("should return false if bigquery_campaign_id doesn't exist", () => {
            const allocations = {
                september_2023: {
                    allocations: [
                        {
                            name: 'Google Ads',
                            budget: 851.1560000000001,
                            type: 'CHANNEL',
                            allocations: [
                                {
                                    name: 'Ad Type 1',
                                    budget: 851.1560000000001,
                                    type: 'CAMPAIGN_TYPE',
                                    allocations: [
                                        {
                                            name: 'Ad Group 1',
                                            budget: 851.1560000000001,
                                            type: 'CAMPAIGN',
                                            allocations: [],
                                            adb: 56.74373333333334,
                                            adb_current: 56,
                                        },
                                    ],
                                    adb: 56.74373333333334,
                                    adb_current: 56,
                                },
                            ],
                            adb: 56.74373333333334,
                            adb_current: 56,
                        },
                    ],
                },
            };

            const result = checkBigQueryIdExists({
                allocations,
            });
            expect(result).toBeFalsy();
        });

        it('should return false if there are no allocations at campaign level', () => {
            const allocations = {
                september_2023: {
                    allocations: [
                        {
                            name: 'Google Ads',
                            budget: 851.1560000000001,
                            type: 'CHANNEL',
                            allocations: [],
                            adb: 56.74373333333334,
                            adb_current: 56,
                        },
                    ],
                },
            };

            const result = checkBigQueryIdExists({
                allocations,
            });
            expect(result).toBeFalsy();
        });
    });
});
