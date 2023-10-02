const {
    calculatePercentageMonthElapsed,
    parseMonthYearToIndexAndYear,
    calculateDaysInMonth,
    calculateDaysElapsedInMonth,
    calculateRemainingDaysInMonth,
    computeAndStoreMetrics,
    extractCampaignAndAdsetIds,
} = require('../src/utils/bq_spend');

const util = require('util');

const { bigqueryClient } = require('../src/config/bigquery');

jest.mock('../src/config/bigquery', () => ({
    bigqueryClient: {
        query: jest.fn(),
    },
}));

describe('parseMonthYearToIndexAndYear', () => {
    it('should return correct month index and year for valid input', () => {
        expect(parseMonthYearToIndexAndYear('January 2020')).toEqual({
            monthIndex: 0,
            year: 2020,
        });
    });

    it('should return both monthIndex and year as null for non-integer year', () => {
        expect(parseMonthYearToIndexAndYear('January NotAYear')).toEqual({
            monthIndex: 0,
            year: null,
        });
    });

    it('should handle case insensitivity for month names', () => {
        expect(parseMonthYearToIndexAndYear('jAnUaRy 2020')).toEqual({
            monthIndex: 0,
            year: 2020,
        });
    });

    it('should return monthIndex as 0 and year as null for only month provided', () => {
        expect(parseMonthYearToIndexAndYear('January')).toEqual({
            monthIndex: 0,
            year: null,
        });
    });

    it('should return monthIndex as -1 and year as parsed year for only year provided', () => {
        expect(parseMonthYearToIndexAndYear('2020')).toEqual({
            monthIndex: -1,
            year: null,
        });
    });
});

describe('calculatePercentageMonthElapsed', () => {
    it('should return 100% if the current date year is greater than provided year', () => {
        const result = calculatePercentageMonthElapsed({
            currentDate: new Date('2024-01-15'),
            monthIndex: 5,
            year: 2023,
        });
        expect(result).toBe(100);
    });

    it('should return 100% if the current date month is greater than provided month in the same year', () => {
        const result = calculatePercentageMonthElapsed({
            currentDate: new Date('2023-07-15'),
            monthIndex: 5,
            year: 2023,
        });
        expect(result).toBe(100);
    });

    it('should return the correct percentage for the current month', () => {
        const result = calculatePercentageMonthElapsed({
            currentDate: new Date(
                'Jun 15 2023 11:36:22 GMT-0400 (Venezuela Time)'
            ),
            monthIndex: 5,
            year: 2023,
        });
        // For June 2023, by the 15th, 50% of the month (30 days) has elapsed.
        expect(result).toBeCloseTo(50, 2);
    });

    it('should return 0% if the current date year is less than the provided year', () => {
        const result = calculatePercentageMonthElapsed({
            currentDate: new Date('2022-12-31'),
            monthIndex: 5,
            year: 2023,
        });
        expect(result).toBe(0);
    });

    it('should return 0% if the current date month is less than the provided month in the same year', () => {
        const result = calculatePercentageMonthElapsed({
            currentDate: new Date('2023-04-01'),
            monthIndex: 5,
            year: 2023,
        });
        expect(result).toBe(0);
    });
});

describe('calculateDaysInMonth', () => {
    it('should return 31 for January', () => {
        const result = calculateDaysInMonth({ monthIndex: 0, year: 2023 });
        expect(result).toBe(31);
    });

    it('should return 28 for February in a common year', () => {
        const result = calculateDaysInMonth({ monthIndex: 1, year: 2023 });
        expect(result).toBe(28);
    });

    it('should return 29 for February in a leap year', () => {
        const result = calculateDaysInMonth({ monthIndex: 1, year: 2020 });
        expect(result).toBe(29);
    });

    it('should return 30 for April', () => {
        const result = calculateDaysInMonth({ monthIndex: 3, year: 2023 });
        expect(result).toBe(30);
    });

    // ... you can continue for other months if you want comprehensive coverage ...
});

describe('calculateDaysElapsedInMonth', () => {
    it('should return days elapsed in the current month', () => {
        const result = calculateDaysElapsedInMonth({
            currentDate: new Date('Sat Jan 15 2023 20:00:00'),
            monthIndex: 0,
            year: 2023,
        });
        expect(result).toBe(14);
    });

    it('should return total days of the month if current date is in a subsequent month of the same year', () => {
        const result = calculateDaysElapsedInMonth({
            currentDate: new Date('Wed Feb 01 2023 20:00:00'),
            monthIndex: 0,
            year: 2023,
        });
        expect(result).toBe(31); // January has 31 days
    });

    it('should return total days of the month if current date is in a subsequent year', () => {
        const result = calculateDaysElapsedInMonth({
            currentDate: new Date(
                'Sun Dec 31 2024 20:00:00 GMT-0400 (Venezuela Time)'
            ),
            monthIndex: 11,
            year: 2023,
        });
        expect(result).toBe(31); // December has 31 days
    });

    it('should return 0 if current date is in a preceding month of the same year', () => {
        const result = calculateDaysElapsedInMonth({
            currentDate: new Date('2023-01-01'),
            monthIndex: 2,
            year: 2023,
        });
        expect(result).toBe(0); // March has not yet occurred by January 1
    });

    it('should return 0 if current date is in a preceding year', () => {
        const result = calculateDaysElapsedInMonth({
            currentDate: new Date('2022-12-31'),
            monthIndex: 0,
            year: 2023,
        });
        expect(result).toBe(0); // January 2023 has not yet occurred by December 31, 2022
    });
});

describe('calculateRemainingDaysInMonth', () => {
    it('should return remaining days in the current month', () => {
        const result = calculateRemainingDaysInMonth({
            currentDate: new Date('Sun Jan 15 2023 20:00:00'),
            monthIndex: 0,
            year: 2023,
        });
        expect(result).toBe(16); // January has 31 days, so 16 days are remaining after the 15th
    });

    it('should return 0 if current date is in a subsequent month of the same year', () => {
        const result = calculateRemainingDaysInMonth({
            currentDate: new Date('2023-02-01'),
            monthIndex: 0,
            year: 2023,
        });
        expect(result).toBe(0); // January is over
    });

    it('should return 0 if current date is in a subsequent year', () => {
        const result = calculateRemainingDaysInMonth({
            currentDate: new Date('2024-01-01'),
            monthIndex: 11,
            year: 2023,
        });
        expect(result).toBe(0); // December 2023 is over
    });

    it('should return total days if current date is in a preceding month of the same year', () => {
        const result = calculateRemainingDaysInMonth({
            currentDate: new Date('2023-01-01'),
            monthIndex: 2,
            year: 2023,
        });
        expect(result).toBe(31); // March has 31 days
    });

    it('should return total days if current date is in a preceding year', () => {
        const result = calculateRemainingDaysInMonth({
            currentDate: new Date('2022-12-31'),
            monthIndex: 0,
            year: 2023,
        });
        expect(result).toBe(31); // January 2023 has 31 days
    });
});

describe('computeAndStoreMetrics', () => {
    it('Validate computeAndStoreMetrics function for a campaign group with no bigquery ids', async () => {
        const expectedAllocations = {
            august_2023: {
                budget: 15006.576000000001,
                percentage: 16,
                allocations: [
                    {
                        id: '5',
                        name: 'LinkedIn Ads',
                        budget: 7503.2880000000005,
                        percentage: 50,
                        type: 'CHANNEL',
                        allocations: [
                            {
                                id: '5-video',
                                name: 'video',
                                budget: 7503.2880000000005,
                                percentage: 100,
                                type: 'CAMPAIGN_TYPE',
                                allocations: [],
                                error: false,
                                mtd_spent: 0,
                                budget_remaining: 7503.2880000000005,
                                budget_spent: 0,
                                month_elapsed: 100,
                                adb: 242.04154838709678,
                                adb_current: 0,
                                avg_daily_spent: 'N/A',
                                carry_over: 0,
                            },
                        ],
                        error: false,
                        mtd_spent: 0,
                        budget_remaining: 7503.2880000000005,
                        budget_spent: 0,
                        month_elapsed: 100,
                        adb: 242.04154838709678,
                        adb_current: 0,
                        avg_daily_spent: 'N/A',
                        carry_over: 0,
                    },
                    {
                        name: 'Facebook',
                        id: '4',
                        budget: 7503.2880000000005,
                        percentage: 50,
                        type: 'CHANNEL',
                        error: false,
                    },
                ],
                error: false,
                mtd_spent: 0,
            },
            september_2023: {
                budget: 13130.754,
                percentage: 14,
                allocations: [
                    {
                        id: '5',
                        name: 'LinkedIn Ads',
                        budget: 9191.5278,
                        percentage: '70',
                        type: 'CHANNEL',
                        allocations: [
                            {
                                id: '5-video',
                                name: 'video',
                                budget: 9191.5278,
                                percentage: 100,
                                type: 'CAMPAIGN_TYPE',
                                allocations: [],
                                error: false,
                                mtd_spent: 0,
                                budget_remaining: 16694.8158,
                                budget_spent: 0,
                                month_elapsed: 66.66666666666666,
                                adb: 556.49386,
                                adb_current: 0,
                                avg_daily_spent: 1669.4815800000001,
                                carry_over: 7503.2880000000005,
                            },
                        ],
                        error: false,
                        mtd_spent: 0,
                        budget_remaining: 16694.8158,
                        budget_spent: 0,
                        month_elapsed: 66.66666666666666,
                        adb: 556.49386,
                        adb_current: 0,
                        avg_daily_spent: 1669.4815800000001,
                        carry_over: 7503.2880000000005,
                    },
                    {
                        name: 'Facebook',
                        id: '4',
                        budget: 3939.2262,
                        percentage: '30',
                        type: 'CHANNEL',
                        error: false,
                    },
                ],
                error: false,
                mtd_spent: 0,
            },
            october_2023: {
                budget: 13130.754,
                percentage: 14,
                allocations: [
                    {
                        id: '5',
                        name: 'LinkedIn Ads',
                        budget: 6565.377,
                        percentage: 50,
                        type: 'CHANNEL',
                        allocations: [
                            {
                                id: '5-video',
                                name: 'video',
                                budget: 6565.377,
                                percentage: 100,
                                type: 'CAMPAIGN_TYPE',
                                allocations: [],
                                error: false,
                                mtd_spent: 0,
                                budget_remaining: 23260.1928,
                                budget_spent: 0,
                                month_elapsed: 0,
                                adb: 750.3288,
                                adb_current: 'N/A',
                                avg_daily_spent: 750.3288,
                                carry_over: 16694.8158,
                            },
                        ],
                        error: false,
                        mtd_spent: 0,
                        budget_remaining: 23260.1928,
                        budget_spent: 0,
                        month_elapsed: 0,
                        adb: 750.3288,
                        adb_current: 'N/A',
                        avg_daily_spent: 750.3288,
                        carry_over: 16694.8158,
                    },
                    {
                        name: 'Facebook',
                        id: '4',
                        budget: 6565.377,
                        percentage: 50,
                        type: 'CHANNEL',
                        error: false,
                    },
                ],
                error: false,
                mtd_spent: 0,
            },
            november_2023: {
                budget: 13130.754,
                percentage: 14,
                allocations: [
                    {
                        id: '5',
                        name: 'LinkedIn Ads',
                        budget: 6565.377,
                        percentage: 50,
                        type: 'CHANNEL',
                        allocations: [
                            {
                                id: '5-video',
                                name: 'video',
                                budget: 6565.377,
                                percentage: 100,
                                type: 'CAMPAIGN_TYPE',
                                allocations: [],
                                error: false,
                                mtd_spent: 0,
                                budget_remaining: 29825.5698,
                                budget_spent: 0,
                                month_elapsed: 0,
                                adb: 994.18566,
                                adb_current: 'N/A',
                                avg_daily_spent: 994.18566,
                                carry_over: 23260.1928,
                            },
                        ],
                        error: false,
                        mtd_spent: 0,
                        budget_remaining: 29825.5698,
                        budget_spent: 0,
                        month_elapsed: 0,
                        adb: 994.18566,
                        adb_current: 'N/A',
                        avg_daily_spent: 994.18566,
                        carry_over: 23260.1928,
                    },
                    {
                        name: 'Facebook',
                        id: '4',
                        budget: 6565.377,
                        percentage: 50,
                        type: 'CHANNEL',
                        error: false,
                    },
                ],
                error: false,
                mtd_spent: 0,
            },
            december_2023: {
                budget: 13130.754,
                percentage: 14,
                allocations: [
                    {
                        id: '5',
                        name: 'LinkedIn Ads',
                        budget: 6565.377,
                        percentage: 50,
                        type: 'CHANNEL',
                        allocations: [
                            {
                                id: '5-video',
                                name: 'video',
                                budget: 6565.377,
                                percentage: 100,
                                type: 'CAMPAIGN_TYPE',
                                allocations: [],
                                error: false,
                                mtd_spent: 0,
                                budget_remaining: 36390.946800000005,
                                budget_spent: 0,
                                month_elapsed: 0,
                                adb: 1173.9015096774194,
                                adb_current: 'N/A',
                                avg_daily_spent: 1173.9015096774194,
                                carry_over: 29825.5698,
                            },
                        ],
                        error: false,
                        mtd_spent: 0,
                        budget_remaining: 36390.946800000005,
                        budget_spent: 0,
                        month_elapsed: 0,
                        adb: 1173.9015096774194,
                        adb_current: 'N/A',
                        avg_daily_spent: 1173.9015096774194,
                        carry_over: 29825.5698,
                    },
                    {
                        name: 'Facebook',
                        id: '4',
                        budget: 6565.377,
                        percentage: 50,
                        type: 'CHANNEL',
                        error: false,
                    },
                ],
                error: false,
                mtd_spent: 0,
            },
            january_2024: {
                budget: 13130.754,
                percentage: 14,
                allocations: [
                    {
                        id: '5',
                        name: 'LinkedIn Ads',
                        budget: 6565.377,
                        percentage: 50,
                        type: 'CHANNEL',
                        allocations: [
                            {
                                id: '5-video',
                                name: 'video',
                                budget: 6565.377,
                                percentage: 100,
                                type: 'CAMPAIGN_TYPE',
                                allocations: [],
                                error: false,
                                mtd_spent: 0,
                                budget_remaining: 42956.323800000006,
                                budget_spent: 0,
                                month_elapsed: 0,
                                adb: 1385.6878645161291,
                                adb_current: 'N/A',
                                avg_daily_spent: 1385.6878645161291,
                                carry_over: 36390.946800000005,
                            },
                        ],
                        error: false,
                        mtd_spent: 0,
                        budget_remaining: 42956.323800000006,
                        budget_spent: 0,
                        month_elapsed: 0,
                        adb: 1385.6878645161291,
                        adb_current: 'N/A',
                        avg_daily_spent: 1385.6878645161291,
                        carry_over: 36390.946800000005,
                    },
                    {
                        name: 'Facebook',
                        id: '4',
                        budget: 6565.377,
                        percentage: 50,
                        type: 'CHANNEL',
                        error: false,
                    },
                ],
                error: false,
                mtd_spent: 0,
            },
            february_2024: {
                budget: 13130.754,
                percentage: 14,
                allocations: [
                    {
                        id: '5',
                        name: 'LinkedIn Ads',
                        budget: 6565.377,
                        percentage: 50,
                        type: 'CHANNEL',
                        allocations: [
                            {
                                id: '5-video',
                                name: 'video',
                                budget: 6565.377,
                                percentage: 100,
                                type: 'CAMPAIGN_TYPE',
                                allocations: [],
                                error: false,
                                mtd_spent: 0,
                                budget_remaining: 49521.700800000006,
                                budget_spent: 0,
                                month_elapsed: 0,
                                adb: 1707.644855172414,
                                adb_current: 'N/A',
                                avg_daily_spent: 1707.644855172414,
                                carry_over: 42956.323800000006,
                            },
                        ],
                        error: false,
                        mtd_spent: 0,
                        budget_remaining: 49521.700800000006,
                        budget_spent: 0,
                        month_elapsed: 0,
                        adb: 1707.644855172414,
                        adb_current: 'N/A',
                        avg_daily_spent: 1707.644855172414,
                        carry_over: 42956.323800000006,
                    },
                    {
                        name: 'Facebook',
                        id: '4',
                        budget: 6565.377,
                        percentage: 50,
                        type: 'CHANNEL',
                        error: false,
                    },
                ],
                error: false,
                mtd_spent: 0,
            },
        };

        const campaign = {
            id: 38,
            client_id: 4,
            name: 'Sports Broadcast 1',
            company_name: 'SFW Agency',
            goals: 'Awareness and Increase Revenue',
            total_gross_budget: 120245,
            margin: 0.22,
            channels: [
                { id: '4', name: 'Facebook' },
                { id: '5', name: 'LinkedIn Ads' },
            ],
            net_budget: 93791.1,
            comments: null,
            change_reason_log: null,
            status: 'N/S',
            budgets: [
                {
                    periods: [
                        { id: 'august_2023', label: 'August 2023' },
                        { id: 'september_2023', label: 'September 2023' },
                        { id: 'october_2023', label: 'October 2023' },
                        { id: 'november_2023', label: 'November 2023' },
                        { id: 'december_2023', label: 'December 2023' },
                        { id: 'january_2024', label: 'January 2024' },
                        { id: 'february_2024', label: 'February 2024' },
                    ],
                    allocations: {
                        august_2023: {
                            budget: 15006.576000000001,
                            percentage: 16,
                            allocations: [
                                {
                                    id: '5',
                                    name: 'LinkedIn Ads',
                                    budget: 7503.2880000000005,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    allocations: [
                                        {
                                            id: '5-video',
                                            name: 'video',
                                            budget: 7503.2880000000005,
                                            percentage: 100,
                                            type: 'CAMPAIGN_TYPE',
                                            allocations: [
                                                {
                                                    id: '5-video-Campaign Name 1',
                                                    name: 'Campaign Name 1',
                                                    budget: 1500.6576000000002,
                                                    percentage: '20',
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '5-video-Campaign Name 1-CN1 Adset 1',
                                                            name: 'CN1 Adset 1',
                                                            budget: 750.3288000000001,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                            error: false,
                                                        },
                                                        {
                                                            id: '5-video-Campaign Name 1-CN1 Adset 2',
                                                            name: 'CN1 Adset 2',
                                                            budget: 750.3288000000001,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                            error: false,
                                                        },
                                                    ],
                                                    error: false,
                                                },
                                                {
                                                    id: '5-video-Campaign Name 2',
                                                    name: 'Campaign Name 2',
                                                    budget: 5252.3016,
                                                    percentage: '70',
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '5-video-Campaign Name 2-CN2 Adset 1',
                                                            name: 'CN2 Adset 1',
                                                            budget: 2626.1508,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                            error: false,
                                                        },
                                                        {
                                                            id: '5-video-Campaign Name 2-CN2 Adset 2',
                                                            name: 'CN2 Adset 2',
                                                            budget: 2626.1508,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                            error: false,
                                                        },
                                                    ],
                                                    error: false,
                                                },
                                                {
                                                    id: '5-video-Campaign Name 3',
                                                    name: 'Campaign Name 3',
                                                    budget: 750.3288000000001,
                                                    percentage: '10',
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '5-video-Campaign Name 3-CN3 Adset 1',
                                                            name: 'CN3 Adset 1',
                                                            budget: 255.11179200000007,
                                                            percentage: 34,
                                                            type: 'ADSET',
                                                            error: false,
                                                        },
                                                        {
                                                            id: '5-video-Campaign Name 3-CN3 Adset 2',
                                                            name: 'CN3 Adset 2',
                                                            budget: 247.60850400000004,
                                                            percentage: 33,
                                                            type: 'ADSET',
                                                            error: false,
                                                        },
                                                        {
                                                            id: '5-video-Campaign Name 3-CN3 Adset 3',
                                                            name: 'CN3 Adset 3',
                                                            budget: 247.60850400000004,
                                                            percentage: 33,
                                                            type: 'ADSET',
                                                            error: false,
                                                        },
                                                    ],
                                                    error: false,
                                                },
                                            ],
                                            error: false,
                                        },
                                    ],
                                    error: false,
                                },
                                {
                                    name: 'Facebook',
                                    id: '4',
                                    budget: 7503.2880000000005,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    error: false,
                                },
                            ],
                            error: false,
                        },
                        september_2023: {
                            budget: 13130.754,
                            percentage: 14,
                            allocations: [
                                {
                                    id: '5',
                                    name: 'LinkedIn Ads',
                                    budget: 9191.5278,
                                    percentage: '70',
                                    type: 'CHANNEL',
                                    allocations: [
                                        {
                                            id: '5-video',
                                            name: 'video',
                                            budget: 9191.5278,
                                            percentage: 100,
                                            type: 'CAMPAIGN_TYPE',
                                            allocations: [
                                                {
                                                    id: '5-video-Campaign Name 1',
                                                    name: 'Campaign Name 1',
                                                    budget: 3125.1194520000004,
                                                    percentage: 34,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '5-video-Campaign Name 1-CN1 Adset 1',
                                                            name: 'CN1 Adset 1',
                                                            budget: 1562.5597260000002,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                            error: false,
                                                        },
                                                        {
                                                            id: '5-video-Campaign Name 1-CN1 Adset 2',
                                                            name: 'CN1 Adset 2',
                                                            budget: 1562.5597260000002,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                            error: false,
                                                        },
                                                    ],
                                                    error: false,
                                                },
                                                {
                                                    id: '5-video-Campaign Name 2',
                                                    name: 'Campaign Name 2',
                                                    budget: 3033.204174,
                                                    percentage: 33,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '5-video-Campaign Name 2-CN2 Adset 1',
                                                            name: 'CN2 Adset 1',
                                                            budget: 1516.602087,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                            error: false,
                                                        },
                                                        {
                                                            id: '5-video-Campaign Name 2-CN2 Adset 2',
                                                            name: 'CN2 Adset 2',
                                                            budget: 1516.602087,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                            error: false,
                                                        },
                                                    ],
                                                    error: false,
                                                },
                                                {
                                                    id: '5-video-Campaign Name 3',
                                                    name: 'Campaign Name 3',
                                                    budget: 3033.204174,
                                                    percentage: 33,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '5-video-Campaign Name 3-CN3 Adset 1',
                                                            name: 'CN3 Adset 1',
                                                            budget: 1031.28941916,
                                                            percentage: 34,
                                                            type: 'ADSET',
                                                            error: false,
                                                        },
                                                        {
                                                            id: '5-video-Campaign Name 3-CN3 Adset 2',
                                                            name: 'CN3 Adset 2',
                                                            budget: 1000.9573774200001,
                                                            percentage: 33,
                                                            type: 'ADSET',
                                                            error: false,
                                                        },
                                                        {
                                                            id: '5-video-Campaign Name 3-CN3 Adset 3',
                                                            name: 'CN3 Adset 3',
                                                            budget: 1000.9573774200001,
                                                            percentage: 33,
                                                            type: 'ADSET',
                                                            error: false,
                                                        },
                                                    ],
                                                    error: false,
                                                },
                                            ],
                                            error: false,
                                        },
                                    ],
                                    error: false,
                                },
                                {
                                    name: 'Facebook',
                                    id: '4',
                                    budget: 3939.2262,
                                    percentage: '30',
                                    type: 'CHANNEL',
                                    error: false,
                                },
                            ],
                            error: false,
                        },
                        october_2023: {
                            budget: 13130.754,
                            percentage: 14,
                            allocations: [
                                {
                                    id: '5',
                                    name: 'LinkedIn Ads',
                                    budget: 6565.377,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    allocations: [
                                        {
                                            id: '5-video',
                                            name: 'video',
                                            budget: 6565.377,
                                            percentage: 100,
                                            type: 'CAMPAIGN_TYPE',
                                            allocations: [
                                                {
                                                    id: '5-video-Campaign Name 1',
                                                    name: 'Campaign Name 1',
                                                    budget: 2232.2281800000005,
                                                    percentage: 34,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '5-video-Campaign Name 1-CN1 Adset 1',
                                                            name: 'CN1 Adset 1',
                                                            budget: 0,
                                                            percentage: '0',
                                                            type: 'ADSET',
                                                            error: false,
                                                        },
                                                        {
                                                            id: '5-video-Campaign Name 1-CN1 Adset 2',
                                                            name: 'CN1 Adset 2',
                                                            budget: 2232.2281800000005,
                                                            percentage: '100',
                                                            type: 'ADSET',
                                                            error: false,
                                                        },
                                                    ],
                                                    error: false,
                                                },
                                                {
                                                    id: '5-video-Campaign Name 2',
                                                    name: 'Campaign Name 2',
                                                    budget: 2166.57441,
                                                    percentage: 33,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '5-video-Campaign Name 2-CN2 Adset 1',
                                                            name: 'CN2 Adset 1',
                                                            budget: 1083.287205,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                            error: false,
                                                        },
                                                        {
                                                            id: '5-video-Campaign Name 2-CN2 Adset 2',
                                                            name: 'CN2 Adset 2',
                                                            budget: 1083.287205,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                            error: false,
                                                        },
                                                    ],
                                                    error: false,
                                                },
                                                {
                                                    id: '5-video-Campaign Name 3',
                                                    name: 'Campaign Name 3',
                                                    budget: 2166.57441,
                                                    percentage: 33,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '5-video-Campaign Name 3-CN3 Adset 1',
                                                            name: 'CN3 Adset 1',
                                                            budget: 736.6352994000001,
                                                            percentage: 34,
                                                            type: 'ADSET',
                                                            error: false,
                                                        },
                                                        {
                                                            id: '5-video-Campaign Name 3-CN3 Adset 2',
                                                            name: 'CN3 Adset 2',
                                                            budget: 714.9695553000001,
                                                            percentage: 33,
                                                            type: 'ADSET',
                                                            error: false,
                                                        },
                                                        {
                                                            id: '5-video-Campaign Name 3-CN3 Adset 3',
                                                            name: 'CN3 Adset 3',
                                                            budget: 714.9695553000001,
                                                            percentage: 33,
                                                            type: 'ADSET',
                                                            error: false,
                                                        },
                                                    ],
                                                    error: false,
                                                },
                                            ],
                                            error: false,
                                        },
                                    ],
                                    error: false,
                                },
                                {
                                    name: 'Facebook',
                                    id: '4',
                                    budget: 6565.377,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    error: false,
                                },
                            ],
                            error: false,
                        },
                        november_2023: {
                            budget: 13130.754,
                            percentage: 14,
                            allocations: [
                                {
                                    id: '5',
                                    name: 'LinkedIn Ads',
                                    budget: 6565.377,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    allocations: [
                                        {
                                            id: '5-video',
                                            name: 'video',
                                            budget: 6565.377,
                                            percentage: 100,
                                            type: 'CAMPAIGN_TYPE',
                                            allocations: [
                                                {
                                                    id: '5-video-Campaign Name 1',
                                                    name: 'Campaign Name 1',
                                                    budget: 2232.2281800000005,
                                                    percentage: 34,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '5-video-Campaign Name 1-CN1 Adset 1',
                                                            name: 'CN1 Adset 1',
                                                            budget: 1116.1140900000003,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                            error: false,
                                                        },
                                                        {
                                                            id: '5-video-Campaign Name 1-CN1 Adset 2',
                                                            name: 'CN1 Adset 2',
                                                            budget: 1116.1140900000003,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                            error: false,
                                                        },
                                                    ],
                                                    error: false,
                                                },
                                                {
                                                    id: '5-video-Campaign Name 2',
                                                    name: 'Campaign Name 2',
                                                    budget: 2166.57441,
                                                    percentage: 33,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '5-video-Campaign Name 2-CN2 Adset 1',
                                                            name: 'CN2 Adset 1',
                                                            budget: 1083.287205,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                            error: false,
                                                        },
                                                        {
                                                            id: '5-video-Campaign Name 2-CN2 Adset 2',
                                                            name: 'CN2 Adset 2',
                                                            budget: 1083.287205,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                            error: false,
                                                        },
                                                    ],
                                                    error: false,
                                                },
                                                {
                                                    id: '5-video-Campaign Name 3',
                                                    name: 'Campaign Name 3',
                                                    budget: 2166.57441,
                                                    percentage: 33,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '5-video-Campaign Name 3-CN3 Adset 1',
                                                            name: 'CN3 Adset 1',
                                                            budget: 736.6352994000001,
                                                            percentage: 34,
                                                            type: 'ADSET',
                                                            error: false,
                                                        },
                                                        {
                                                            id: '5-video-Campaign Name 3-CN3 Adset 2',
                                                            name: 'CN3 Adset 2',
                                                            budget: 714.9695553000001,
                                                            percentage: 33,
                                                            type: 'ADSET',
                                                            error: false,
                                                        },
                                                        {
                                                            id: '5-video-Campaign Name 3-CN3 Adset 3',
                                                            name: 'CN3 Adset 3',
                                                            budget: 714.9695553000001,
                                                            percentage: 33,
                                                            type: 'ADSET',
                                                            error: false,
                                                        },
                                                    ],
                                                    error: false,
                                                },
                                            ],
                                            error: false,
                                        },
                                    ],
                                    error: false,
                                },
                                {
                                    name: 'Facebook',
                                    id: '4',
                                    budget: 6565.377,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    error: false,
                                },
                            ],
                            error: false,
                        },
                        december_2023: {
                            budget: 13130.754,
                            percentage: 14,
                            allocations: [
                                {
                                    id: '5',
                                    name: 'LinkedIn Ads',
                                    budget: 6565.377,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    allocations: [
                                        {
                                            id: '5-video',
                                            name: 'video',
                                            budget: 6565.377,
                                            percentage: 100,
                                            type: 'CAMPAIGN_TYPE',
                                            allocations: [
                                                {
                                                    id: '5-video-Campaign Name 1',
                                                    name: 'Campaign Name 1',
                                                    budget: 2232.2281800000005,
                                                    percentage: 34,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '5-video-Campaign Name 1-CN1 Adset 1',
                                                            name: 'CN1 Adset 1',
                                                            budget: 1116.1140900000003,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                            error: false,
                                                        },
                                                        {
                                                            id: '5-video-Campaign Name 1-CN1 Adset 2',
                                                            name: 'CN1 Adset 2',
                                                            budget: 1116.1140900000003,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                            error: false,
                                                        },
                                                    ],
                                                    error: false,
                                                },
                                                {
                                                    id: '5-video-Campaign Name 2',
                                                    name: 'Campaign Name 2',
                                                    budget: 2166.57441,
                                                    percentage: 33,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '5-video-Campaign Name 2-CN2 Adset 1',
                                                            name: 'CN2 Adset 1',
                                                            budget: 1083.287205,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                            error: false,
                                                        },
                                                        {
                                                            id: '5-video-Campaign Name 2-CN2 Adset 2',
                                                            name: 'CN2 Adset 2',
                                                            budget: 1083.287205,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                            error: false,
                                                        },
                                                    ],
                                                    error: false,
                                                },
                                                {
                                                    id: '5-video-Campaign Name 3',
                                                    name: 'Campaign Name 3',
                                                    budget: 2166.57441,
                                                    percentage: 33,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '5-video-Campaign Name 3-CN3 Adset 1',
                                                            name: 'CN3 Adset 1',
                                                            budget: 736.6352994000001,
                                                            percentage: 34,
                                                            type: 'ADSET',
                                                            error: false,
                                                        },
                                                        {
                                                            id: '5-video-Campaign Name 3-CN3 Adset 2',
                                                            name: 'CN3 Adset 2',
                                                            budget: 714.9695553000001,
                                                            percentage: 33,
                                                            type: 'ADSET',
                                                            error: false,
                                                        },
                                                        {
                                                            id: '5-video-Campaign Name 3-CN3 Adset 3',
                                                            name: 'CN3 Adset 3',
                                                            budget: 714.9695553000001,
                                                            percentage: 33,
                                                            type: 'ADSET',
                                                            error: false,
                                                        },
                                                    ],
                                                    error: false,
                                                },
                                            ],
                                            error: false,
                                        },
                                    ],
                                    error: false,
                                },
                                {
                                    name: 'Facebook',
                                    id: '4',
                                    budget: 6565.377,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    error: false,
                                },
                            ],
                            error: false,
                        },
                        january_2024: {
                            budget: 13130.754,
                            percentage: 14,
                            allocations: [
                                {
                                    id: '5',
                                    name: 'LinkedIn Ads',
                                    budget: 6565.377,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    allocations: [
                                        {
                                            id: '5-video',
                                            name: 'video',
                                            budget: 6565.377,
                                            percentage: 100,
                                            type: 'CAMPAIGN_TYPE',
                                            allocations: [
                                                {
                                                    id: '5-video-Campaign Name 1',
                                                    name: 'Campaign Name 1',
                                                    budget: 2232.2281800000005,
                                                    percentage: 34,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '5-video-Campaign Name 1-CN1 Adset 1',
                                                            name: 'CN1 Adset 1',
                                                            budget: 1116.1140900000003,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                            error: false,
                                                        },
                                                        {
                                                            id: '5-video-Campaign Name 1-CN1 Adset 2',
                                                            name: 'CN1 Adset 2',
                                                            budget: 1116.1140900000003,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                            error: false,
                                                        },
                                                    ],
                                                    error: false,
                                                },
                                                {
                                                    id: '5-video-Campaign Name 2',
                                                    name: 'Campaign Name 2',
                                                    budget: 2166.57441,
                                                    percentage: 33,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '5-video-Campaign Name 2-CN2 Adset 1',
                                                            name: 'CN2 Adset 1',
                                                            budget: 1083.287205,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                            error: false,
                                                        },
                                                        {
                                                            id: '5-video-Campaign Name 2-CN2 Adset 2',
                                                            name: 'CN2 Adset 2',
                                                            budget: 1083.287205,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                            error: false,
                                                        },
                                                    ],
                                                    error: false,
                                                },
                                                {
                                                    id: '5-video-Campaign Name 3',
                                                    name: 'Campaign Name 3',
                                                    budget: 2166.57441,
                                                    percentage: 33,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '5-video-Campaign Name 3-CN3 Adset 1',
                                                            name: 'CN3 Adset 1',
                                                            budget: 736.6352994000001,
                                                            percentage: 34,
                                                            type: 'ADSET',
                                                            error: false,
                                                        },
                                                        {
                                                            id: '5-video-Campaign Name 3-CN3 Adset 2',
                                                            name: 'CN3 Adset 2',
                                                            budget: 714.9695553000001,
                                                            percentage: 33,
                                                            type: 'ADSET',
                                                            error: false,
                                                        },
                                                        {
                                                            id: '5-video-Campaign Name 3-CN3 Adset 3',
                                                            name: 'CN3 Adset 3',
                                                            budget: 714.9695553000001,
                                                            percentage: 33,
                                                            type: 'ADSET',
                                                            error: false,
                                                        },
                                                    ],
                                                    error: false,
                                                },
                                            ],
                                            error: false,
                                        },
                                    ],
                                    error: false,
                                },
                                {
                                    name: 'Facebook',
                                    id: '4',
                                    budget: 6565.377,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    error: false,
                                },
                            ],
                            error: false,
                        },
                        february_2024: {
                            budget: 13130.754,
                            percentage: 14,
                            allocations: [
                                {
                                    id: '5',
                                    name: 'LinkedIn Ads',
                                    budget: 6565.377,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    allocations: [
                                        {
                                            id: '5-video',
                                            name: 'video',
                                            budget: 6565.377,
                                            percentage: 100,
                                            type: 'CAMPAIGN_TYPE',
                                            allocations: [
                                                {
                                                    id: '5-video-Campaign Name 1',
                                                    name: 'Campaign Name 1',
                                                    budget: 2232.2281800000005,
                                                    percentage: 34,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '5-video-Campaign Name 1-CN1 Adset 1',
                                                            name: 'CN1 Adset 1',
                                                            budget: 1116.1140900000003,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                            error: false,
                                                        },
                                                        {
                                                            id: '5-video-Campaign Name 1-CN1 Adset 2',
                                                            name: 'CN1 Adset 2',
                                                            budget: 1116.1140900000003,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                            error: false,
                                                        },
                                                    ],
                                                    error: false,
                                                },
                                                {
                                                    id: '5-video-Campaign Name 2',
                                                    name: 'Campaign Name 2',
                                                    budget: 2166.57441,
                                                    percentage: 33,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '5-video-Campaign Name 2-CN2 Adset 1',
                                                            name: 'CN2 Adset 1',
                                                            budget: 1083.287205,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                            error: false,
                                                        },
                                                        {
                                                            id: '5-video-Campaign Name 2-CN2 Adset 2',
                                                            name: 'CN2 Adset 2',
                                                            budget: 1083.287205,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                            error: false,
                                                        },
                                                    ],
                                                    error: false,
                                                },
                                                {
                                                    id: '5-video-Campaign Name 3',
                                                    name: 'Campaign Name 3',
                                                    budget: 2166.57441,
                                                    percentage: 33,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '5-video-Campaign Name 3-CN3 Adset 1',
                                                            name: 'CN3 Adset 1',
                                                            budget: 736.6352994000001,
                                                            percentage: 34,
                                                            type: 'ADSET',
                                                            error: false,
                                                        },
                                                        {
                                                            id: '5-video-Campaign Name 3-CN3 Adset 2',
                                                            name: 'CN3 Adset 2',
                                                            budget: 714.9695553000001,
                                                            percentage: 33,
                                                            type: 'ADSET',
                                                            error: false,
                                                        },
                                                        {
                                                            id: '5-video-Campaign Name 3-CN3 Adset 3',
                                                            name: 'CN3 Adset 3',
                                                            budget: 714.9695553000001,
                                                            percentage: 33,
                                                            type: 'ADSET',
                                                            error: false,
                                                        },
                                                    ],
                                                    error: false,
                                                },
                                            ],
                                            error: false,
                                        },
                                    ],
                                    error: false,
                                },
                                {
                                    name: 'Facebook',
                                    id: '4',
                                    budget: 6565.377,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    error: false,
                                },
                            ],
                            error: false,
                        },
                    },
                },
            ],
        };

        const currentDate = new Date('Sep 20 2023');

        const { periods, allocations } = await computeAndStoreMetrics({
            campaign,
            currentDate,
        });

        expect(periods).toEqual(campaign.budgets[0].periods);
        expect(allocations).toEqual(expectedAllocations);
    });

    it('Validate computeAndStoreMetrics function for a campaign group with bigquery ids', async () => {
        const expectedAllocations = {
            september_2023: {
                budget: 2154.8,
                percentage: '10',
                allocations: [
                    {
                        id: '1',
                        name: 'Google Ads',
                        budget: 1077.4,
                        percentage: 50,
                        type: 'CHANNEL',
                        allocations: [
                            {
                                id: '1-SEARCH',
                                name: 'SEARCH',
                                budget: 538.7,
                                percentage: 50,
                                type: 'CAMPAIGN_TYPE',
                                allocations: [
                                    {
                                        id: '1-SEARCH-Products',
                                        name: 'Primo Market Test | Bakersfield',
                                        budget: 269.35,
                                        percentage: 50,
                                        goals: '',
                                        type: 'CAMPAIGN',
                                        allocations: [
                                            {
                                                id: '1-SEARCH-Products-Water',
                                                name: 'Mindful Morgan',
                                                budget: 134.675,
                                                percentage: 50,
                                                type: 'ADSET',
                                                bigquery_adset_id:
                                                    '142232761402',
                                                mtd_spent: 0,
                                                budget_remaining: 134.675,
                                                budget_spent: 0,
                                                month_elapsed: 66.66666666666666,
                                                adb: 4.489166666666667,
                                                adb_current: 0,
                                                avg_daily_spent: 13.467500000000001,
                                                carry_over: 0,
                                            },
                                        ],
                                        bigquery_campaign_id: '18195521903',
                                        mtd_spent: 0,
                                        budget_remaining: 269.35,
                                        budget_spent: 0,
                                        month_elapsed: 66.66666666666666,
                                        adb: 8.978333333333333,
                                        adb_current: 0,
                                        avg_daily_spent: 26.935000000000002,
                                        carry_over: 0,
                                    },
                                    {
                                        id: '1-SEARCH-Services',
                                        name: 'Primo Market Test | Lafayette',
                                        budget: 269.35,
                                        percentage: 50,
                                        goals: '',
                                        type: 'CAMPAIGN',
                                        allocations: [
                                            {
                                                id: '1-SEARCH-Services-Dispenser',
                                                name: 'Striving Selena',
                                                budget: 134.675,
                                                percentage: 50,
                                                type: 'ADSET',
                                                bigquery_adset_id:
                                                    '143495582551',
                                                mtd_spent: 0,
                                                budget_remaining: 134.675,
                                                budget_spent: 0,
                                                month_elapsed: 66.66666666666666,
                                                adb: 4.489166666666667,
                                                adb_current: 0,
                                                avg_daily_spent: 13.467500000000001,
                                                carry_over: 0,
                                            },
                                        ],
                                        bigquery_campaign_id: '18197143856',
                                        mtd_spent: 0,
                                        budget_remaining: 269.35,
                                        budget_spent: 0,
                                        month_elapsed: 66.66666666666666,
                                        adb: 8.978333333333333,
                                        adb_current: 0,
                                        avg_daily_spent: 26.935000000000002,
                                        carry_over: 0,
                                    },
                                ],
                                mtd_spent: 0,
                                budget_remaining: 538.7,
                                budget_spent: 0,
                                month_elapsed: 66.66666666666666,
                                adb: 17.956666666666667,
                                adb_current: 0,
                                avg_daily_spent: 53.870000000000005,
                                carry_over: 0,
                            },
                            {
                                id: '1-SHOPPING',
                                name: 'SHOPPING',
                                budget: 538.7,
                                percentage: 50,
                                type: 'CAMPAIGN_TYPE',
                                allocations: [],
                                mtd_spent: 0,
                                budget_remaining: 538.7,
                                budget_spent: 0,
                                month_elapsed: 66.66666666666666,
                                adb: 17.956666666666667,
                                adb_current: 0,
                                avg_daily_spent: 53.870000000000005,
                                carry_over: 0,
                            },
                        ],
                        error: false,
                        mtd_spent: 0,
                        budget_remaining: 1077.4,
                        budget_spent: 0,
                        month_elapsed: 66.66666666666666,
                        adb: 35.913333333333334,
                        adb_current: 0,
                        avg_daily_spent: 107.74000000000001,
                        carry_over: 0,
                    },
                    {
                        id: '2',
                        name: 'Amazon Advertising',
                        budget: 1077.4,
                        percentage: 50,
                        type: 'CHANNEL',
                        allocations: [
                            {
                                id: '2-Sponsored Display',
                                name: 'Sponsored Display',
                                budget: 538.7,
                                percentage: 50,
                                type: 'CAMPAIGN_TYPE',
                                allocations: [],
                                mtd_spent: 0,
                                budget_remaining: 538.7,
                                budget_spent: 0,
                                month_elapsed: 66.66666666666666,
                                adb: 17.956666666666667,
                                adb_current: 0,
                                avg_daily_spent: 53.870000000000005,
                                carry_over: 0,
                            },
                            {
                                id: '2-Sponsored Products',
                                name: 'Sponsored Products',
                                budget: 538.7,
                                percentage: 50,
                                type: 'CAMPAIGN_TYPE',
                                allocations: [],
                                mtd_spent: 0,
                                budget_remaining: 538.7,
                                budget_spent: 0,
                                month_elapsed: 66.66666666666666,
                                adb: 17.956666666666667,
                                adb_current: 0,
                                avg_daily_spent: 53.870000000000005,
                                carry_over: 0,
                            },
                        ],
                        error: false,
                        mtd_spent: 0,
                        budget_remaining: 1077.4,
                        budget_spent: 0,
                        month_elapsed: 66.66666666666666,
                        adb: 35.913333333333334,
                        adb_current: 0,
                        avg_daily_spent: 107.74000000000001,
                        carry_over: 0,
                    },
                ],
                error: false,
                mtd_spent: 0,
            },
            october_2023: {
                budget: 2370.28,
                percentage: '11',
                allocations: [
                    {
                        id: '1',
                        name: 'Google Ads',
                        budget: 1185.14,
                        percentage: 50,
                        type: 'CHANNEL',
                        allocations: [
                            {
                                id: '1-SEARCH',
                                name: 'SEARCH',
                                budget: 592.57,
                                percentage: 50,
                                type: 'CAMPAIGN_TYPE',
                                allocations: [
                                    {
                                        id: '1-SEARCH-Products',
                                        name: 'Primo Market Test | Bakersfield',
                                        budget: 296.285,
                                        percentage: 50,
                                        goals: '',
                                        type: 'CAMPAIGN',
                                        allocations: [
                                            {
                                                id: '1-SEARCH-Products-Water',
                                                name: 'Mindful Morgan',
                                                budget: 148.1425,
                                                percentage: 50,
                                                type: 'ADSET',
                                                bigquery_adset_id:
                                                    '142232761402',
                                                mtd_spent: 0,
                                                budget_remaining: 282.8175,
                                                budget_spent: 0,
                                                month_elapsed: 0,
                                                adb: 9.123145161290322,
                                                adb_current: 'N/A',
                                                avg_daily_spent: 9.123145161290322,
                                                carry_over: 134.675,
                                            },
                                        ],
                                        bigquery_campaign_id: '18195521903',
                                        mtd_spent: 0,
                                        budget_remaining: 565.635,
                                        budget_spent: 0,
                                        month_elapsed: 0,
                                        adb: 18.246290322580645,
                                        adb_current: 'N/A',
                                        avg_daily_spent: 18.246290322580645,
                                        carry_over: 269.35,
                                    },
                                    {
                                        id: '1-SEARCH-Services',
                                        name: 'Primo Market Test | Lafayette',
                                        budget: 296.285,
                                        percentage: 50,
                                        goals: '',
                                        type: 'CAMPAIGN',
                                        allocations: [
                                            {
                                                id: '1-SEARCH-Services-Dispenser',
                                                name: 'Striving Selena',
                                                budget: 148.1425,
                                                percentage: 50,
                                                type: 'ADSET',
                                                bigquery_adset_id:
                                                    '143495582551',
                                                mtd_spent: 0,
                                                budget_remaining: 282.8175,
                                                budget_spent: 0,
                                                month_elapsed: 0,
                                                adb: 9.123145161290322,
                                                adb_current: 'N/A',
                                                avg_daily_spent: 9.123145161290322,
                                                carry_over: 134.675,
                                            },
                                        ],
                                        bigquery_campaign_id: '18197143856',
                                        mtd_spent: 0,
                                        budget_remaining: 565.635,
                                        budget_spent: 0,
                                        month_elapsed: 0,
                                        adb: 18.246290322580645,
                                        adb_current: 'N/A',
                                        avg_daily_spent: 18.246290322580645,
                                        carry_over: 269.35,
                                    },
                                ],
                                mtd_spent: 0,
                                budget_remaining: 1131.27,
                                budget_spent: 0,
                                month_elapsed: 0,
                                adb: 36.49258064516129,
                                adb_current: 'N/A',
                                avg_daily_spent: 36.49258064516129,
                                carry_over: 538.7,
                            },
                            {
                                id: '1-SHOPPING',
                                name: 'SHOPPING',
                                budget: 592.57,
                                percentage: 50,
                                type: 'CAMPAIGN_TYPE',
                                allocations: [],
                                mtd_spent: 0,
                                budget_remaining: 1131.27,
                                budget_spent: 0,
                                month_elapsed: 0,
                                adb: 36.49258064516129,
                                adb_current: 'N/A',
                                avg_daily_spent: 36.49258064516129,
                                carry_over: 538.7,
                            },
                        ],
                        error: false,
                        mtd_spent: 0,
                        budget_remaining: 2262.54,
                        budget_spent: 0,
                        month_elapsed: 0,
                        adb: 72.98516129032258,
                        adb_current: 'N/A',
                        avg_daily_spent: 72.98516129032258,
                        carry_over: 1077.4,
                    },
                    {
                        id: '2',
                        name: 'Amazon Advertising',
                        budget: 1185.14,
                        percentage: 50,
                        type: 'CHANNEL',
                        allocations: [
                            {
                                id: '2-Sponsored Display',
                                name: 'Sponsored Display',
                                budget: 592.57,
                                percentage: 50,
                                type: 'CAMPAIGN_TYPE',
                                allocations: [],
                                mtd_spent: 0,
                                budget_remaining: 1131.27,
                                budget_spent: 0,
                                month_elapsed: 0,
                                adb: 36.49258064516129,
                                adb_current: 'N/A',
                                avg_daily_spent: 36.49258064516129,
                                carry_over: 538.7,
                            },
                            {
                                id: '2-Sponsored Products',
                                name: 'Sponsored Products',
                                budget: 592.57,
                                percentage: 50,
                                type: 'CAMPAIGN_TYPE',
                                allocations: [],
                                mtd_spent: 0,
                                budget_remaining: 1131.27,
                                budget_spent: 0,
                                month_elapsed: 0,
                                adb: 36.49258064516129,
                                adb_current: 'N/A',
                                avg_daily_spent: 36.49258064516129,
                                carry_over: 538.7,
                            },
                        ],
                        error: false,
                        mtd_spent: 0,
                        budget_remaining: 2262.54,
                        budget_spent: 0,
                        month_elapsed: 0,
                        adb: 72.98516129032258,
                        adb_current: 'N/A',
                        avg_daily_spent: 72.98516129032258,
                        carry_over: 1077.4,
                    },
                ],
                error: false,
                mtd_spent: 0,
            },
            november_2023: {
                budget: 7110.84,
                percentage: '33',
                allocations: [
                    {
                        id: '1',
                        name: 'Google Ads',
                        budget: 3555.42,
                        percentage: 50,
                        type: 'CHANNEL',
                        allocations: [
                            {
                                id: '1-SEARCH',
                                name: 'SEARCH',
                                budget: 1777.71,
                                percentage: 50,
                                type: 'CAMPAIGN_TYPE',
                                allocations: [
                                    {
                                        id: '1-SEARCH-Products',
                                        name: 'Primo Market Test | Bakersfield',
                                        budget: 888.855,
                                        percentage: 50,
                                        goals: '',
                                        type: 'CAMPAIGN',
                                        allocations: [
                                            {
                                                id: '1-SEARCH-Products-Water',
                                                name: 'Mindful Morgan',
                                                budget: 444.4275,
                                                percentage: 50,
                                                type: 'ADSET',
                                                bigquery_adset_id:
                                                    '142232761402',
                                                mtd_spent: 0,
                                                budget_remaining: 727.245,
                                                budget_spent: 0,
                                                month_elapsed: 0,
                                                adb: 24.2415,
                                                adb_current: 'N/A',
                                                avg_daily_spent: 24.2415,
                                                carry_over: 282.8175,
                                            },
                                        ],
                                        bigquery_campaign_id: '18195521903',
                                        mtd_spent: 0,
                                        budget_remaining: 1454.49,
                                        budget_spent: 0,
                                        month_elapsed: 0,
                                        adb: 48.483,
                                        adb_current: 'N/A',
                                        avg_daily_spent: 48.483,
                                        carry_over: 565.635,
                                    },
                                    {
                                        id: '1-SEARCH-Services',
                                        name: 'Primo Market Test | Lafayette',
                                        budget: 888.855,
                                        percentage: 50,
                                        goals: '',
                                        type: 'CAMPAIGN',
                                        allocations: [
                                            {
                                                id: '1-SEARCH-Services-Dispenser',
                                                name: 'Striving Selena',
                                                budget: 444.4275,
                                                percentage: 50,
                                                type: 'ADSET',
                                                bigquery_adset_id:
                                                    '143495582551',
                                                mtd_spent: 0,
                                                budget_remaining: 727.245,
                                                budget_spent: 0,
                                                month_elapsed: 0,
                                                adb: 24.2415,
                                                adb_current: 'N/A',
                                                avg_daily_spent: 24.2415,
                                                carry_over: 282.8175,
                                            },
                                        ],
                                        bigquery_campaign_id: '18197143856',
                                        mtd_spent: 0,
                                        budget_remaining: 1454.49,
                                        budget_spent: 0,
                                        month_elapsed: 0,
                                        adb: 48.483,
                                        adb_current: 'N/A',
                                        avg_daily_spent: 48.483,
                                        carry_over: 565.635,
                                    },
                                ],
                                mtd_spent: 0,
                                budget_remaining: 2908.98,
                                budget_spent: 0,
                                month_elapsed: 0,
                                adb: 96.966,
                                adb_current: 'N/A',
                                avg_daily_spent: 96.966,
                                carry_over: 1131.27,
                            },
                            {
                                id: '1-SHOPPING',
                                name: 'SHOPPING',
                                budget: 1777.71,
                                percentage: 50,
                                type: 'CAMPAIGN_TYPE',
                                allocations: [],
                                mtd_spent: 0,
                                budget_remaining: 2908.98,
                                budget_spent: 0,
                                month_elapsed: 0,
                                adb: 96.966,
                                adb_current: 'N/A',
                                avg_daily_spent: 96.966,
                                carry_over: 1131.27,
                            },
                        ],
                        error: false,
                        mtd_spent: 0,
                        budget_remaining: 5817.96,
                        budget_spent: 0,
                        month_elapsed: 0,
                        adb: 193.932,
                        adb_current: 'N/A',
                        avg_daily_spent: 193.932,
                        carry_over: 2262.54,
                    },
                    {
                        id: '2',
                        name: 'Amazon Advertising',
                        budget: 3555.42,
                        percentage: 50,
                        type: 'CHANNEL',
                        allocations: [
                            {
                                id: '2-Sponsored Display',
                                name: 'Sponsored Display',
                                budget: 1777.71,
                                percentage: 50,
                                type: 'CAMPAIGN_TYPE',
                                allocations: [],
                                mtd_spent: 0,
                                budget_remaining: 2908.98,
                                budget_spent: 0,
                                month_elapsed: 0,
                                adb: 96.966,
                                adb_current: 'N/A',
                                avg_daily_spent: 96.966,
                                carry_over: 1131.27,
                            },
                            {
                                id: '2-Sponsored Products',
                                name: 'Sponsored Products',
                                budget: 1777.71,
                                percentage: 50,
                                type: 'CAMPAIGN_TYPE',
                                allocations: [],
                                mtd_spent: 0,
                                budget_remaining: 2908.98,
                                budget_spent: 0,
                                month_elapsed: 0,
                                adb: 96.966,
                                adb_current: 'N/A',
                                avg_daily_spent: 96.966,
                                carry_over: 1131.27,
                            },
                        ],
                        error: false,
                        mtd_spent: 0,
                        budget_remaining: 5817.96,
                        budget_spent: 0,
                        month_elapsed: 0,
                        adb: 193.932,
                        adb_current: 'N/A',
                        avg_daily_spent: 193.932,
                        carry_over: 2262.54,
                    },
                ],
                error: false,
                mtd_spent: 0,
            },
            december_2023: {
                budget: 3447.6800000000003,
                percentage: 16,
                allocations: [
                    {
                        id: '1',
                        name: 'Google Ads',
                        budget: 1723.84,
                        percentage: 50,
                        type: 'CHANNEL',
                        allocations: [
                            {
                                id: '1-SEARCH',
                                name: 'SEARCH',
                                budget: 861.92,
                                percentage: 50,
                                type: 'CAMPAIGN_TYPE',
                                allocations: [
                                    {
                                        id: '1-SEARCH-Products',
                                        name: 'Primo Market Test | Bakersfield',
                                        budget: 430.96,
                                        percentage: 50,
                                        goals: '',
                                        type: 'CAMPAIGN',
                                        allocations: [
                                            {
                                                id: '1-SEARCH-Products-Water',
                                                name: 'Mindful Morgan',
                                                budget: 215.48,
                                                percentage: 50,
                                                type: 'ADSET',
                                                bigquery_adset_id:
                                                    '142232761402',
                                                mtd_spent: 0,
                                                budget_remaining: 942.725,
                                                budget_spent: 0,
                                                month_elapsed: 0,
                                                adb: 30.41048387096774,
                                                adb_current: 'N/A',
                                                avg_daily_spent: 30.41048387096774,
                                                carry_over: 727.245,
                                            },
                                        ],
                                        bigquery_campaign_id: '18195521903',
                                        mtd_spent: 0,
                                        budget_remaining: 1885.45,
                                        budget_spent: 0,
                                        month_elapsed: 0,
                                        adb: 60.82096774193548,
                                        adb_current: 'N/A',
                                        avg_daily_spent: 60.82096774193548,
                                        carry_over: 1454.49,
                                    },
                                    {
                                        id: '1-SEARCH-Services',
                                        name: 'Primo Market Test | Lafayette',
                                        budget: 430.96,
                                        percentage: 50,
                                        goals: '',
                                        type: 'CAMPAIGN',
                                        allocations: [
                                            {
                                                id: '1-SEARCH-Services-Dispenser',
                                                name: 'Striving Selena',
                                                budget: 215.48,
                                                percentage: 50,
                                                type: 'ADSET',
                                                bigquery_adset_id:
                                                    '143495582551',
                                                mtd_spent: 0,
                                                budget_remaining: 942.725,
                                                budget_spent: 0,
                                                month_elapsed: 0,
                                                adb: 30.41048387096774,
                                                adb_current: 'N/A',
                                                avg_daily_spent: 30.41048387096774,
                                                carry_over: 727.245,
                                            },
                                        ],
                                        bigquery_campaign_id: '18197143856',
                                        mtd_spent: 0,
                                        budget_remaining: 1885.45,
                                        budget_spent: 0,
                                        month_elapsed: 0,
                                        adb: 60.82096774193548,
                                        adb_current: 'N/A',
                                        avg_daily_spent: 60.82096774193548,
                                        carry_over: 1454.49,
                                    },
                                ],
                                mtd_spent: 0,
                                budget_remaining: 3770.9,
                                budget_spent: 0,
                                month_elapsed: 0,
                                adb: 121.64193548387097,
                                adb_current: 'N/A',
                                avg_daily_spent: 121.64193548387097,
                                carry_over: 2908.98,
                            },
                            {
                                id: '1-SHOPPING',
                                name: 'SHOPPING',
                                budget: 861.92,
                                percentage: 50,
                                type: 'CAMPAIGN_TYPE',
                                allocations: [],
                                mtd_spent: 0,
                                budget_remaining: 3770.9,
                                budget_spent: 0,
                                month_elapsed: 0,
                                adb: 121.64193548387097,
                                adb_current: 'N/A',
                                avg_daily_spent: 121.64193548387097,
                                carry_over: 2908.98,
                            },
                        ],
                        error: false,
                        mtd_spent: 0,
                        budget_remaining: 7541.8,
                        budget_spent: 0,
                        month_elapsed: 0,
                        adb: 243.28387096774193,
                        adb_current: 'N/A',
                        avg_daily_spent: 243.28387096774193,
                        carry_over: 5817.96,
                    },
                    {
                        id: '2',
                        name: 'Amazon Advertising',
                        budget: 1723.84,
                        percentage: 50,
                        type: 'CHANNEL',
                        allocations: [
                            {
                                id: '2-Sponsored Display',
                                name: 'Sponsored Display',
                                budget: 861.92,
                                percentage: 50,
                                type: 'CAMPAIGN_TYPE',
                                allocations: [],
                                mtd_spent: 0,
                                budget_remaining: 3770.9,
                                budget_spent: 0,
                                month_elapsed: 0,
                                adb: 121.64193548387097,
                                adb_current: 'N/A',
                                avg_daily_spent: 121.64193548387097,
                                carry_over: 2908.98,
                            },
                            {
                                id: '2-Sponsored Products',
                                name: 'Sponsored Products',
                                budget: 861.92,
                                percentage: 50,
                                type: 'CAMPAIGN_TYPE',
                                allocations: [],
                                mtd_spent: 0,
                                budget_remaining: 3770.9,
                                budget_spent: 0,
                                month_elapsed: 0,
                                adb: 121.64193548387097,
                                adb_current: 'N/A',
                                avg_daily_spent: 121.64193548387097,
                                carry_over: 2908.98,
                            },
                        ],
                        error: false,
                        mtd_spent: 0,
                        budget_remaining: 7541.8,
                        budget_spent: 0,
                        month_elapsed: 0,
                        adb: 243.28387096774193,
                        adb_current: 'N/A',
                        avg_daily_spent: 243.28387096774193,
                        carry_over: 5817.96,
                    },
                ],
                error: false,
                mtd_spent: 0,
            },
            january_2024: {
                budget: 3232.2,
                percentage: '15',
                allocations: [
                    {
                        id: '1',
                        name: 'Google Ads',
                        budget: 1616.1,
                        percentage: 50,
                        type: 'CHANNEL',
                        allocations: [
                            {
                                id: '1-SEARCH',
                                name: 'SEARCH',
                                budget: 808.05,
                                percentage: 50,
                                type: 'CAMPAIGN_TYPE',
                                allocations: [
                                    {
                                        id: '1-SEARCH-Products',
                                        name: 'Primo Market Test | Bakersfield',
                                        budget: 404.025,
                                        percentage: 50,
                                        goals: '',
                                        type: 'CAMPAIGN',
                                        allocations: [
                                            {
                                                id: '1-SEARCH-Products-Water',
                                                name: 'Mindful Morgan',
                                                budget: 202.0125,
                                                percentage: 50,
                                                type: 'ADSET',
                                                bigquery_adset_id:
                                                    '142232761402',
                                                mtd_spent: 0,
                                                budget_remaining: 1144.7375,
                                                budget_spent: 0,
                                                month_elapsed: 0,
                                                adb: 36.92701612903225,
                                                adb_current: 'N/A',
                                                avg_daily_spent: 36.92701612903225,
                                                carry_over: 942.725,
                                            },
                                        ],
                                        bigquery_campaign_id: '18195521903',
                                        mtd_spent: 0,
                                        budget_remaining: 2289.475,
                                        budget_spent: 0,
                                        month_elapsed: 0,
                                        adb: 73.8540322580645,
                                        adb_current: 'N/A',
                                        avg_daily_spent: 73.8540322580645,
                                        carry_over: 1885.45,
                                    },
                                    {
                                        id: '1-SEARCH-Services',
                                        name: 'Primo Market Test | Lafayette',
                                        budget: 404.025,
                                        percentage: 50,
                                        goals: '',
                                        type: 'CAMPAIGN',
                                        allocations: [
                                            {
                                                id: '1-SEARCH-Services-Dispenser',
                                                name: 'Striving Selena',
                                                budget: 202.0125,
                                                percentage: 50,
                                                type: 'ADSET',
                                                bigquery_adset_id:
                                                    '143495582551',
                                                mtd_spent: 0,
                                                budget_remaining: 1144.7375,
                                                budget_spent: 0,
                                                month_elapsed: 0,
                                                adb: 36.92701612903225,
                                                adb_current: 'N/A',
                                                avg_daily_spent: 36.92701612903225,
                                                carry_over: 942.725,
                                            },
                                        ],
                                        bigquery_campaign_id: '18197143856',
                                        mtd_spent: 0,
                                        budget_remaining: 2289.475,
                                        budget_spent: 0,
                                        month_elapsed: 0,
                                        adb: 73.8540322580645,
                                        adb_current: 'N/A',
                                        avg_daily_spent: 73.8540322580645,
                                        carry_over: 1885.45,
                                    },
                                ],
                                mtd_spent: 0,
                                budget_remaining: 4578.95,
                                budget_spent: 0,
                                month_elapsed: 0,
                                adb: 147.708064516129,
                                adb_current: 'N/A',
                                avg_daily_spent: 147.708064516129,
                                carry_over: 3770.9,
                            },
                            {
                                id: '1-SHOPPING',
                                name: 'SHOPPING',
                                budget: 808.05,
                                percentage: 50,
                                type: 'CAMPAIGN_TYPE',
                                allocations: [],
                                mtd_spent: 0,
                                budget_remaining: 4578.95,
                                budget_spent: 0,
                                month_elapsed: 0,
                                adb: 147.708064516129,
                                adb_current: 'N/A',
                                avg_daily_spent: 147.708064516129,
                                carry_over: 3770.9,
                            },
                        ],
                        error: false,
                        mtd_spent: 0,
                        budget_remaining: 9157.9,
                        budget_spent: 0,
                        month_elapsed: 0,
                        adb: 295.416129032258,
                        adb_current: 'N/A',
                        avg_daily_spent: 295.416129032258,
                        carry_over: 7541.8,
                    },
                    {
                        id: '2',
                        name: 'Amazon Advertising',
                        budget: 1616.1,
                        percentage: 50,
                        type: 'CHANNEL',
                        allocations: [
                            {
                                id: '2-Sponsored Display',
                                name: 'Sponsored Display',
                                budget: 808.05,
                                percentage: 50,
                                type: 'CAMPAIGN_TYPE',
                                allocations: [],
                                mtd_spent: 0,
                                budget_remaining: 4578.95,
                                budget_spent: 0,
                                month_elapsed: 0,
                                adb: 147.708064516129,
                                adb_current: 'N/A',
                                avg_daily_spent: 147.708064516129,
                                carry_over: 3770.9,
                            },
                            {
                                id: '2-Sponsored Products',
                                name: 'Sponsored Products',
                                budget: 808.05,
                                percentage: 50,
                                type: 'CAMPAIGN_TYPE',
                                allocations: [],
                                mtd_spent: 0,
                                budget_remaining: 4578.95,
                                budget_spent: 0,
                                month_elapsed: 0,
                                adb: 147.708064516129,
                                adb_current: 'N/A',
                                avg_daily_spent: 147.708064516129,
                                carry_over: 3770.9,
                            },
                        ],
                        error: false,
                        mtd_spent: 0,
                        budget_remaining: 9157.9,
                        budget_spent: 0,
                        month_elapsed: 0,
                        adb: 295.416129032258,
                        adb_current: 'N/A',
                        avg_daily_spent: 295.416129032258,
                        carry_over: 7541.8,
                    },
                ],
                error: false,
                mtd_spent: 0,
            },
            february_2024: {
                budget: 3232.2,
                percentage: '15',
                allocations: [
                    {
                        id: '1',
                        name: 'Google Ads',
                        budget: 1616.1,
                        percentage: 50,
                        type: 'CHANNEL',
                        allocations: [
                            {
                                id: '1-SEARCH',
                                name: 'SEARCH',
                                budget: 808.05,
                                percentage: 50,
                                type: 'CAMPAIGN_TYPE',
                                allocations: [
                                    {
                                        id: '1-SEARCH-Products',
                                        name: 'Primo Market Test | Bakersfield',
                                        budget: 404.025,
                                        percentage: 50,
                                        goals: '',
                                        type: 'CAMPAIGN',
                                        allocations: [
                                            {
                                                id: '1-SEARCH-Products-Water',
                                                name: 'Mindful Morgan',
                                                budget: 202.0125,
                                                percentage: 50,
                                                type: 'ADSET',
                                                bigquery_adset_id:
                                                    '142232761402',
                                                mtd_spent: 0,
                                                budget_remaining: 1346.75,
                                                budget_spent: 0,
                                                month_elapsed: 0,
                                                adb: 46.439655172413794,
                                                adb_current: 'N/A',
                                                avg_daily_spent: 46.439655172413794,
                                                carry_over: 1144.7375,
                                            },
                                        ],
                                        bigquery_campaign_id: '18195521903',
                                        mtd_spent: 0,
                                        budget_remaining: 2693.5,
                                        budget_spent: 0,
                                        month_elapsed: 0,
                                        adb: 92.87931034482759,
                                        adb_current: 'N/A',
                                        avg_daily_spent: 92.87931034482759,
                                        carry_over: 2289.475,
                                    },
                                    {
                                        id: '1-SEARCH-Services',
                                        name: 'Primo Market Test | Lafayette',
                                        budget: 404.025,
                                        percentage: 50,
                                        goals: '',
                                        type: 'CAMPAIGN',
                                        allocations: [
                                            {
                                                id: '1-SEARCH-Services-Dispenser',
                                                name: 'Striving Selena',
                                                budget: 202.0125,
                                                percentage: 50,
                                                type: 'ADSET',
                                                bigquery_adset_id:
                                                    '143495582551',
                                                mtd_spent: 0,
                                                budget_remaining: 1346.75,
                                                budget_spent: 0,
                                                month_elapsed: 0,
                                                adb: 46.439655172413794,
                                                adb_current: 'N/A',
                                                avg_daily_spent: 46.439655172413794,
                                                carry_over: 1144.7375,
                                            },
                                        ],
                                        bigquery_campaign_id: '18197143856',
                                        mtd_spent: 0,
                                        budget_remaining: 2693.5,
                                        budget_spent: 0,
                                        month_elapsed: 0,
                                        adb: 92.87931034482759,
                                        adb_current: 'N/A',
                                        avg_daily_spent: 92.87931034482759,
                                        carry_over: 2289.475,
                                    },
                                ],
                                mtd_spent: 0,
                                budget_remaining: 5387,
                                budget_spent: 0,
                                month_elapsed: 0,
                                adb: 185.75862068965517,
                                adb_current: 'N/A',
                                avg_daily_spent: 185.75862068965517,
                                carry_over: 4578.95,
                            },
                            {
                                id: '1-SHOPPING',
                                name: 'SHOPPING',
                                budget: 808.05,
                                percentage: 50,
                                type: 'CAMPAIGN_TYPE',
                                allocations: [],
                                mtd_spent: 0,
                                budget_remaining: 5387,
                                budget_spent: 0,
                                month_elapsed: 0,
                                adb: 185.75862068965517,
                                adb_current: 'N/A',
                                avg_daily_spent: 185.75862068965517,
                                carry_over: 4578.95,
                            },
                        ],
                        error: false,
                        mtd_spent: 0,
                        budget_remaining: 10774,
                        budget_spent: 0,
                        month_elapsed: 0,
                        adb: 371.51724137931035,
                        adb_current: 'N/A',
                        avg_daily_spent: 371.51724137931035,
                        carry_over: 9157.9,
                    },
                    {
                        id: '2',
                        name: 'Amazon Advertising',
                        budget: 1616.1,
                        percentage: 50,
                        type: 'CHANNEL',
                        allocations: [
                            {
                                id: '2-Sponsored Display',
                                name: 'Sponsored Display',
                                budget: 808.05,
                                percentage: 50,
                                type: 'CAMPAIGN_TYPE',
                                allocations: [],
                                mtd_spent: 0,
                                budget_remaining: 5387,
                                budget_spent: 0,
                                month_elapsed: 0,
                                adb: 185.75862068965517,
                                adb_current: 'N/A',
                                avg_daily_spent: 185.75862068965517,
                                carry_over: 4578.95,
                            },
                            {
                                id: '2-Sponsored Products',
                                name: 'Sponsored Products',
                                budget: 808.05,
                                percentage: 50,
                                type: 'CAMPAIGN_TYPE',
                                allocations: [],
                                mtd_spent: 0,
                                budget_remaining: 5387,
                                budget_spent: 0,
                                month_elapsed: 0,
                                adb: 185.75862068965517,
                                adb_current: 'N/A',
                                avg_daily_spent: 185.75862068965517,
                                carry_over: 4578.95,
                            },
                        ],
                        error: false,
                        mtd_spent: 0,
                        budget_remaining: 10774,
                        budget_spent: 0,
                        month_elapsed: 0,
                        adb: 371.51724137931035,
                        adb_current: 'N/A',
                        avg_daily_spent: 371.51724137931035,
                        carry_over: 9157.9,
                    },
                ],
                error: false,
                mtd_spent: 0,
            },
        };
        const campaign = {
            id: 40,
            client_id: 2,
            name: 'asd',
            company_name: 'Primo Water',
            goals: 'asd',
            total_gross_budget: 123,
            margin: 0.12,
            channels: [
                { id: 1, name: 'Google Ads' },
                { id: 2, name: 'Amazon Advertising' },
            ],
            net_budget: 108.24,
            comments: null,
            change_reason_log: null,
            status: 'N/S',
            budgets: [
                {
                    periods: [
                        {
                            id: 'september_2023',
                            label: 'September 2023',
                            days: 30,
                        },
                        { id: 'october_2023', label: 'October 2023', days: 31 },
                        {
                            id: 'november_2023',
                            label: 'November 2023',
                            days: 30,
                        },
                        {
                            id: 'december_2023',
                            label: 'December 2023',
                            days: 31,
                        },
                        { id: 'january_2024', label: 'January 2024', days: 31 },
                        {
                            id: 'february_2024',
                            label: 'February 2024',
                            days: 29,
                        },
                    ],
                    allocations: {
                        september_2023: {
                            budget: 2154.8,
                            percentage: '10',
                            allocations: [
                                {
                                    id: '1',
                                    name: 'Google Ads',
                                    budget: 1077.4,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    allocations: [
                                        {
                                            id: '1-SEARCH',
                                            name: 'SEARCH',
                                            budget: 538.7,
                                            percentage: 50,
                                            type: 'CAMPAIGN_TYPE',
                                            allocations: [
                                                {
                                                    id: '1-SEARCH-Products',
                                                    name: 'Primo Market Test | Bakersfield',
                                                    budget: 269.35,
                                                    percentage: 50,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '1-SEARCH-Products-Water',
                                                            name: 'Mindful Morgan',
                                                            budget: 134.675,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                            bigquery_adset_id:
                                                                '142232761402',
                                                        },
                                                        {
                                                            id: '1-SEARCH-Products-Soda',
                                                            name: 'Soda',
                                                            budget: 134.675,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                    bigquery_campaign_id:
                                                        '18195521903',
                                                },
                                                {
                                                    id: '1-SEARCH-Services',
                                                    name: 'Primo Market Test | Lafayette',
                                                    budget: 269.35,
                                                    percentage: 50,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '1-SEARCH-Services-Dispenser',
                                                            name: 'Striving Selena',
                                                            budget: 134.675,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                            bigquery_adset_id:
                                                                '143495582551',
                                                        },
                                                        {
                                                            id: '1-SEARCH-Services-Delivery',
                                                            name: 'Delivery',
                                                            budget: 134.675,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                    bigquery_campaign_id:
                                                        '18197143856',
                                                },
                                            ],
                                        },
                                        {
                                            id: '1-SHOPPING',
                                            name: 'SHOPPING',
                                            budget: 538.7,
                                            percentage: 50,
                                            type: 'CAMPAIGN_TYPE',
                                            allocations: [
                                                {
                                                    id: '1-SHOPPING-Products',
                                                    name: 'Products',
                                                    budget: 134.675,
                                                    percentage: 25,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '1-SHOPPING-Products-Bottled',
                                                            name: 'Bottled',
                                                            budget: 134.675,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                        },
                                                        {
                                                            id: '1-SHOPPING-Products-Free Flow',
                                                            name: 'Free Flow',
                                                            budget: 134.675,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                                {
                                                    id: '1-SHOPPING-Services',
                                                    name: 'Services',
                                                    budget: 134.675,
                                                    percentage: 25,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '1-SHOPPING-Services-Frontline',
                                                            name: 'Frontline',
                                                            budget: 134.675,
                                                            percentage: 100,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                                {
                                                    id: '1-SHOPPING-Home',
                                                    name: 'Home',
                                                    budget: 134.675,
                                                    percentage: 25,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '1-SHOPPING-Home-Program',
                                                            name: 'Program',
                                                            budget: 134.675,
                                                            percentage: 100,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                                {
                                                    id: '1-SHOPPING-Office',
                                                    name: 'Office',
                                                    budget: 134.675,
                                                    percentage: 25,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '1-SHOPPING-Office-Required',
                                                            name: 'Required',
                                                            budget: 134.675,
                                                            percentage: 100,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                    error: false,
                                },
                                {
                                    id: '2',
                                    name: 'Amazon Advertising',
                                    budget: 1077.4,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    allocations: [
                                        {
                                            id: '2-Sponsored Display',
                                            name: 'Sponsored Display',
                                            budget: 538.7,
                                            percentage: 50,
                                            type: 'CAMPAIGN_TYPE',
                                            allocations: [
                                                {
                                                    id: '2-Sponsored Display-Services',
                                                    name: 'Services',
                                                    budget: 538.7,
                                                    percentage: 100,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '2-Sponsored Display-Services-Delivery',
                                                            name: 'Delivery',
                                                            budget: 269.35,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                        },
                                                        {
                                                            id: '2-Sponsored Display-Services-Repair',
                                                            name: 'Repair',
                                                            budget: 269.35,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                        {
                                            id: '2-Sponsored Products',
                                            name: 'Sponsored Products',
                                            budget: 538.7,
                                            percentage: 50,
                                            type: 'CAMPAIGN_TYPE',
                                            allocations: [
                                                {
                                                    id: '2-Sponsored Products-Sports Drinks',
                                                    name: 'Sports Drinks',
                                                    budget: 269.35,
                                                    percentage: 50,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '2-Sponsored Products-Sports Drinks-Gatorade',
                                                            name: 'Gatorade',
                                                            budget: 538.7,
                                                            percentage: 100,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                                {
                                                    id: '2-Sponsored Products-Energy Drinks',
                                                    name: 'Energy Drinks',
                                                    budget: 269.35,
                                                    percentage: 50,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '2-Sponsored Products-Energy Drinks-Monster',
                                                            name: 'Monster',
                                                            budget: 134.675,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                        },
                                                        {
                                                            id: '2-Sponsored Products-Energy Drinks-Red Bull',
                                                            name: 'Red Bull',
                                                            budget: 134.675,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                    error: false,
                                },
                            ],
                            error: false,
                        },
                        october_2023: {
                            budget: 2370.28,
                            percentage: '11',
                            allocations: [
                                {
                                    id: '1',
                                    name: 'Google Ads',
                                    budget: 1185.14,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    allocations: [
                                        {
                                            id: '1-SEARCH',
                                            name: 'SEARCH',
                                            budget: 592.57,
                                            percentage: 50,
                                            type: 'CAMPAIGN_TYPE',
                                            allocations: [
                                                {
                                                    id: '1-SEARCH-Products',
                                                    name: 'Primo Market Test | Bakersfield',
                                                    budget: 296.285,
                                                    percentage: 50,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '1-SEARCH-Products-Water',
                                                            name: 'Mindful Morgan',
                                                            budget: 148.1425,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                            bigquery_adset_id:
                                                                '142232761402',
                                                        },
                                                        {
                                                            id: '1-SEARCH-Products-Soda',
                                                            name: 'Soda',
                                                            budget: 148.1425,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                    bigquery_campaign_id:
                                                        '18195521903',
                                                },
                                                {
                                                    id: '1-SEARCH-Services',
                                                    name: 'Primo Market Test | Lafayette',
                                                    budget: 296.285,
                                                    percentage: 50,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '1-SEARCH-Services-Dispenser',
                                                            name: 'Striving Selena',
                                                            budget: 148.1425,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                            bigquery_adset_id:
                                                                '143495582551',
                                                        },
                                                        {
                                                            id: '1-SEARCH-Services-Delivery',
                                                            name: 'Delivery',
                                                            budget: 148.1425,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                    bigquery_campaign_id:
                                                        '18197143856',
                                                },
                                            ],
                                        },
                                        {
                                            id: '1-SHOPPING',
                                            name: 'SHOPPING',
                                            budget: 592.57,
                                            percentage: 50,
                                            type: 'CAMPAIGN_TYPE',
                                            allocations: [
                                                {
                                                    id: '1-SHOPPING-Products',
                                                    name: 'Products',
                                                    budget: 148.1425,
                                                    percentage: 25,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '1-SHOPPING-Products-Bottled',
                                                            name: 'Bottled',
                                                            budget: 148.1425,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                        },
                                                        {
                                                            id: '1-SHOPPING-Products-Free Flow',
                                                            name: 'Free Flow',
                                                            budget: 148.1425,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                                {
                                                    id: '1-SHOPPING-Services',
                                                    name: 'Services',
                                                    budget: 148.1425,
                                                    percentage: 25,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '1-SHOPPING-Services-Frontline',
                                                            name: 'Frontline',
                                                            budget: 148.1425,
                                                            percentage: 100,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                                {
                                                    id: '1-SHOPPING-Home',
                                                    name: 'Home',
                                                    budget: 148.1425,
                                                    percentage: 25,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '1-SHOPPING-Home-Program',
                                                            name: 'Program',
                                                            budget: 148.1425,
                                                            percentage: 100,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                                {
                                                    id: '1-SHOPPING-Office',
                                                    name: 'Office',
                                                    budget: 148.1425,
                                                    percentage: 25,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '1-SHOPPING-Office-Required',
                                                            name: 'Required',
                                                            budget: 148.1425,
                                                            percentage: 100,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                    error: false,
                                },
                                {
                                    id: '2',
                                    name: 'Amazon Advertising',
                                    budget: 1185.14,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    allocations: [
                                        {
                                            id: '2-Sponsored Display',
                                            name: 'Sponsored Display',
                                            budget: 592.57,
                                            percentage: 50,
                                            type: 'CAMPAIGN_TYPE',
                                            allocations: [
                                                {
                                                    id: '2-Sponsored Display-Services',
                                                    name: 'Services',
                                                    budget: 592.57,
                                                    percentage: 100,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '2-Sponsored Display-Services-Delivery',
                                                            name: 'Delivery',
                                                            budget: 296.285,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                        },
                                                        {
                                                            id: '2-Sponsored Display-Services-Repair',
                                                            name: 'Repair',
                                                            budget: 296.285,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                        {
                                            id: '2-Sponsored Products',
                                            name: 'Sponsored Products',
                                            budget: 592.57,
                                            percentage: 50,
                                            type: 'CAMPAIGN_TYPE',
                                            allocations: [
                                                {
                                                    id: '2-Sponsored Products-Sports Drinks',
                                                    name: 'Sports Drinks',
                                                    budget: 296.285,
                                                    percentage: 50,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '2-Sponsored Products-Sports Drinks-Gatorade',
                                                            name: 'Gatorade',
                                                            budget: 592.57,
                                                            percentage: 100,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                                {
                                                    id: '2-Sponsored Products-Energy Drinks',
                                                    name: 'Energy Drinks',
                                                    budget: 296.285,
                                                    percentage: 50,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '2-Sponsored Products-Energy Drinks-Monster',
                                                            name: 'Monster',
                                                            budget: 148.1425,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                        },
                                                        {
                                                            id: '2-Sponsored Products-Energy Drinks-Red Bull',
                                                            name: 'Red Bull',
                                                            budget: 148.1425,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                    error: false,
                                },
                            ],
                            error: false,
                        },
                        november_2023: {
                            budget: 7110.84,
                            percentage: '33',
                            allocations: [
                                {
                                    id: '1',
                                    name: 'Google Ads',
                                    budget: 3555.42,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    allocations: [
                                        {
                                            id: '1-SEARCH',
                                            name: 'SEARCH',
                                            budget: 1777.71,
                                            percentage: 50,
                                            type: 'CAMPAIGN_TYPE',
                                            allocations: [
                                                {
                                                    id: '1-SEARCH-Products',
                                                    name: 'Primo Market Test | Bakersfield',
                                                    budget: 888.855,
                                                    percentage: 50,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '1-SEARCH-Products-Water',
                                                            name: 'Mindful Morgan',
                                                            budget: 444.4275,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                            bigquery_adset_id:
                                                                '142232761402',
                                                        },
                                                        {
                                                            id: '1-SEARCH-Products-Soda',
                                                            name: 'Soda',
                                                            budget: 444.4275,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                    bigquery_campaign_id:
                                                        '18195521903',
                                                },
                                                {
                                                    id: '1-SEARCH-Services',
                                                    name: 'Primo Market Test | Lafayette',
                                                    budget: 888.855,
                                                    percentage: 50,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '1-SEARCH-Services-Dispenser',
                                                            name: 'Striving Selena',
                                                            budget: 444.4275,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                            bigquery_adset_id:
                                                                '143495582551',
                                                        },
                                                        {
                                                            id: '1-SEARCH-Services-Delivery',
                                                            name: 'Delivery',
                                                            budget: 444.4275,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                    bigquery_campaign_id:
                                                        '18197143856',
                                                },
                                            ],
                                        },
                                        {
                                            id: '1-SHOPPING',
                                            name: 'SHOPPING',
                                            budget: 1777.71,
                                            percentage: 50,
                                            type: 'CAMPAIGN_TYPE',
                                            allocations: [
                                                {
                                                    id: '1-SHOPPING-Products',
                                                    name: 'Products',
                                                    budget: 444.4275,
                                                    percentage: 25,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '1-SHOPPING-Products-Bottled',
                                                            name: 'Bottled',
                                                            budget: 444.4275,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                        },
                                                        {
                                                            id: '1-SHOPPING-Products-Free Flow',
                                                            name: 'Free Flow',
                                                            budget: 444.4275,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                                {
                                                    id: '1-SHOPPING-Services',
                                                    name: 'Services',
                                                    budget: 444.4275,
                                                    percentage: 25,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '1-SHOPPING-Services-Frontline',
                                                            name: 'Frontline',
                                                            budget: 444.4275,
                                                            percentage: 100,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                                {
                                                    id: '1-SHOPPING-Home',
                                                    name: 'Home',
                                                    budget: 444.4275,
                                                    percentage: 25,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '1-SHOPPING-Home-Program',
                                                            name: 'Program',
                                                            budget: 444.4275,
                                                            percentage: 100,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                                {
                                                    id: '1-SHOPPING-Office',
                                                    name: 'Office',
                                                    budget: 444.4275,
                                                    percentage: 25,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '1-SHOPPING-Office-Required',
                                                            name: 'Required',
                                                            budget: 444.4275,
                                                            percentage: 100,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                    error: false,
                                },
                                {
                                    id: '2',
                                    name: 'Amazon Advertising',
                                    budget: 3555.42,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    allocations: [
                                        {
                                            id: '2-Sponsored Display',
                                            name: 'Sponsored Display',
                                            budget: 1777.71,
                                            percentage: 50,
                                            type: 'CAMPAIGN_TYPE',
                                            allocations: [
                                                {
                                                    id: '2-Sponsored Display-Services',
                                                    name: 'Services',
                                                    budget: 1777.71,
                                                    percentage: 100,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '2-Sponsored Display-Services-Delivery',
                                                            name: 'Delivery',
                                                            budget: 888.855,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                        },
                                                        {
                                                            id: '2-Sponsored Display-Services-Repair',
                                                            name: 'Repair',
                                                            budget: 888.855,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                        {
                                            id: '2-Sponsored Products',
                                            name: 'Sponsored Products',
                                            budget: 1777.71,
                                            percentage: 50,
                                            type: 'CAMPAIGN_TYPE',
                                            allocations: [
                                                {
                                                    id: '2-Sponsored Products-Sports Drinks',
                                                    name: 'Sports Drinks',
                                                    budget: 888.855,
                                                    percentage: 50,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '2-Sponsored Products-Sports Drinks-Gatorade',
                                                            name: 'Gatorade',
                                                            budget: 1777.71,
                                                            percentage: 100,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                                {
                                                    id: '2-Sponsored Products-Energy Drinks',
                                                    name: 'Energy Drinks',
                                                    budget: 888.855,
                                                    percentage: 50,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '2-Sponsored Products-Energy Drinks-Monster',
                                                            name: 'Monster',
                                                            budget: 444.4275,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                        },
                                                        {
                                                            id: '2-Sponsored Products-Energy Drinks-Red Bull',
                                                            name: 'Red Bull',
                                                            budget: 444.4275,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                    error: false,
                                },
                            ],
                            error: false,
                        },
                        december_2023: {
                            budget: 3447.6800000000003,
                            percentage: 16,
                            allocations: [
                                {
                                    id: '1',
                                    name: 'Google Ads',
                                    budget: 1723.84,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    allocations: [
                                        {
                                            id: '1-SEARCH',
                                            name: 'SEARCH',
                                            budget: 861.92,
                                            percentage: 50,
                                            type: 'CAMPAIGN_TYPE',
                                            allocations: [
                                                {
                                                    id: '1-SEARCH-Products',
                                                    name: 'Primo Market Test | Bakersfield',
                                                    budget: 430.96,
                                                    percentage: 50,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '1-SEARCH-Products-Water',
                                                            name: 'Mindful Morgan',
                                                            budget: 215.48,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                            bigquery_adset_id:
                                                                '142232761402',
                                                        },
                                                        {
                                                            id: '1-SEARCH-Products-Soda',
                                                            name: 'Soda',
                                                            budget: 215.48,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                    bigquery_campaign_id:
                                                        '18195521903',
                                                },
                                                {
                                                    id: '1-SEARCH-Services',
                                                    name: 'Primo Market Test | Lafayette',
                                                    budget: 430.96,
                                                    percentage: 50,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '1-SEARCH-Services-Dispenser',
                                                            name: 'Striving Selena',
                                                            budget: 215.48,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                            bigquery_adset_id:
                                                                '143495582551',
                                                        },
                                                        {
                                                            id: '1-SEARCH-Services-Delivery',
                                                            name: 'Delivery',
                                                            budget: 215.48,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                    bigquery_campaign_id:
                                                        '18197143856',
                                                },
                                            ],
                                        },
                                        {
                                            id: '1-SHOPPING',
                                            name: 'SHOPPING',
                                            budget: 861.92,
                                            percentage: 50,
                                            type: 'CAMPAIGN_TYPE',
                                            allocations: [
                                                {
                                                    id: '1-SHOPPING-Products',
                                                    name: 'Products',
                                                    budget: 215.48,
                                                    percentage: 25,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '1-SHOPPING-Products-Bottled',
                                                            name: 'Bottled',
                                                            budget: 215.48,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                        },
                                                        {
                                                            id: '1-SHOPPING-Products-Free Flow',
                                                            name: 'Free Flow',
                                                            budget: 215.48,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                                {
                                                    id: '1-SHOPPING-Services',
                                                    name: 'Services',
                                                    budget: 215.48,
                                                    percentage: 25,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '1-SHOPPING-Services-Frontline',
                                                            name: 'Frontline',
                                                            budget: 215.48,
                                                            percentage: 100,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                                {
                                                    id: '1-SHOPPING-Home',
                                                    name: 'Home',
                                                    budget: 215.48,
                                                    percentage: 25,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '1-SHOPPING-Home-Program',
                                                            name: 'Program',
                                                            budget: 215.48,
                                                            percentage: 100,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                                {
                                                    id: '1-SHOPPING-Office',
                                                    name: 'Office',
                                                    budget: 215.48,
                                                    percentage: 25,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '1-SHOPPING-Office-Required',
                                                            name: 'Required',
                                                            budget: 215.48,
                                                            percentage: 100,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                    error: false,
                                },
                                {
                                    id: '2',
                                    name: 'Amazon Advertising',
                                    budget: 1723.84,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    allocations: [
                                        {
                                            id: '2-Sponsored Display',
                                            name: 'Sponsored Display',
                                            budget: 861.92,
                                            percentage: 50,
                                            type: 'CAMPAIGN_TYPE',
                                            allocations: [
                                                {
                                                    id: '2-Sponsored Display-Services',
                                                    name: 'Services',
                                                    budget: 861.92,
                                                    percentage: 100,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '2-Sponsored Display-Services-Delivery',
                                                            name: 'Delivery',
                                                            budget: 430.96,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                        },
                                                        {
                                                            id: '2-Sponsored Display-Services-Repair',
                                                            name: 'Repair',
                                                            budget: 430.96,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                        {
                                            id: '2-Sponsored Products',
                                            name: 'Sponsored Products',
                                            budget: 861.92,
                                            percentage: 50,
                                            type: 'CAMPAIGN_TYPE',
                                            allocations: [
                                                {
                                                    id: '2-Sponsored Products-Sports Drinks',
                                                    name: 'Sports Drinks',
                                                    budget: 430.96,
                                                    percentage: 50,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '2-Sponsored Products-Sports Drinks-Gatorade',
                                                            name: 'Gatorade',
                                                            budget: 861.92,
                                                            percentage: 100,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                                {
                                                    id: '2-Sponsored Products-Energy Drinks',
                                                    name: 'Energy Drinks',
                                                    budget: 430.96,
                                                    percentage: 50,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '2-Sponsored Products-Energy Drinks-Monster',
                                                            name: 'Monster',
                                                            budget: 215.48,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                        },
                                                        {
                                                            id: '2-Sponsored Products-Energy Drinks-Red Bull',
                                                            name: 'Red Bull',
                                                            budget: 215.48,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                    error: false,
                                },
                            ],
                            error: false,
                        },
                        january_2024: {
                            budget: 3232.2,
                            percentage: '15',
                            allocations: [
                                {
                                    id: '1',
                                    name: 'Google Ads',
                                    budget: 1616.1,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    allocations: [
                                        {
                                            id: '1-SEARCH',
                                            name: 'SEARCH',
                                            budget: 808.05,
                                            percentage: 50,
                                            type: 'CAMPAIGN_TYPE',
                                            allocations: [
                                                {
                                                    id: '1-SEARCH-Products',
                                                    name: 'Primo Market Test | Bakersfield',
                                                    budget: 404.025,
                                                    percentage: 50,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '1-SEARCH-Products-Water',
                                                            name: 'Mindful Morgan',
                                                            budget: 202.0125,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                            bigquery_adset_id:
                                                                '142232761402',
                                                        },
                                                        {
                                                            id: '1-SEARCH-Products-Soda',
                                                            name: 'Soda',
                                                            budget: 202.0125,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                    bigquery_campaign_id:
                                                        '18195521903',
                                                },
                                                {
                                                    id: '1-SEARCH-Services',
                                                    name: 'Primo Market Test | Lafayette',
                                                    budget: 404.025,
                                                    percentage: 50,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '1-SEARCH-Services-Dispenser',
                                                            name: 'Striving Selena',
                                                            budget: 202.0125,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                            bigquery_adset_id:
                                                                '143495582551',
                                                        },
                                                        {
                                                            id: '1-SEARCH-Services-Delivery',
                                                            name: 'Delivery',
                                                            budget: 202.0125,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                    bigquery_campaign_id:
                                                        '18197143856',
                                                },
                                            ],
                                        },
                                        {
                                            id: '1-SHOPPING',
                                            name: 'SHOPPING',
                                            budget: 808.05,
                                            percentage: 50,
                                            type: 'CAMPAIGN_TYPE',
                                            allocations: [
                                                {
                                                    id: '1-SHOPPING-Products',
                                                    name: 'Products',
                                                    budget: 202.0125,
                                                    percentage: 25,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '1-SHOPPING-Products-Bottled',
                                                            name: 'Bottled',
                                                            budget: 202.0125,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                        },
                                                        {
                                                            id: '1-SHOPPING-Products-Free Flow',
                                                            name: 'Free Flow',
                                                            budget: 202.0125,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                                {
                                                    id: '1-SHOPPING-Services',
                                                    name: 'Services',
                                                    budget: 202.0125,
                                                    percentage: 25,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '1-SHOPPING-Services-Frontline',
                                                            name: 'Frontline',
                                                            budget: 202.0125,
                                                            percentage: 100,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                                {
                                                    id: '1-SHOPPING-Home',
                                                    name: 'Home',
                                                    budget: 202.0125,
                                                    percentage: 25,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '1-SHOPPING-Home-Program',
                                                            name: 'Program',
                                                            budget: 202.0125,
                                                            percentage: 100,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                                {
                                                    id: '1-SHOPPING-Office',
                                                    name: 'Office',
                                                    budget: 202.0125,
                                                    percentage: 25,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '1-SHOPPING-Office-Required',
                                                            name: 'Required',
                                                            budget: 202.0125,
                                                            percentage: 100,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                    error: false,
                                },
                                {
                                    id: '2',
                                    name: 'Amazon Advertising',
                                    budget: 1616.1,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    allocations: [
                                        {
                                            id: '2-Sponsored Display',
                                            name: 'Sponsored Display',
                                            budget: 808.05,
                                            percentage: 50,
                                            type: 'CAMPAIGN_TYPE',
                                            allocations: [
                                                {
                                                    id: '2-Sponsored Display-Services',
                                                    name: 'Services',
                                                    budget: 808.05,
                                                    percentage: 100,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '2-Sponsored Display-Services-Delivery',
                                                            name: 'Delivery',
                                                            budget: 404.025,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                        },
                                                        {
                                                            id: '2-Sponsored Display-Services-Repair',
                                                            name: 'Repair',
                                                            budget: 404.025,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                        {
                                            id: '2-Sponsored Products',
                                            name: 'Sponsored Products',
                                            budget: 808.05,
                                            percentage: 50,
                                            type: 'CAMPAIGN_TYPE',
                                            allocations: [
                                                {
                                                    id: '2-Sponsored Products-Sports Drinks',
                                                    name: 'Sports Drinks',
                                                    budget: 404.025,
                                                    percentage: 50,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '2-Sponsored Products-Sports Drinks-Gatorade',
                                                            name: 'Gatorade',
                                                            budget: 808.05,
                                                            percentage: 100,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                                {
                                                    id: '2-Sponsored Products-Energy Drinks',
                                                    name: 'Energy Drinks',
                                                    budget: 404.025,
                                                    percentage: 50,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '2-Sponsored Products-Energy Drinks-Monster',
                                                            name: 'Monster',
                                                            budget: 202.0125,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                        },
                                                        {
                                                            id: '2-Sponsored Products-Energy Drinks-Red Bull',
                                                            name: 'Red Bull',
                                                            budget: 202.0125,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                    error: false,
                                },
                            ],
                            error: false,
                        },
                        february_2024: {
                            budget: 3232.2,
                            percentage: '15',
                            allocations: [
                                {
                                    id: '1',
                                    name: 'Google Ads',
                                    budget: 1616.1,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    allocations: [
                                        {
                                            id: '1-SEARCH',
                                            name: 'SEARCH',
                                            budget: 808.05,
                                            percentage: 50,
                                            type: 'CAMPAIGN_TYPE',
                                            allocations: [
                                                {
                                                    id: '1-SEARCH-Products',
                                                    name: 'Primo Market Test | Bakersfield',
                                                    budget: 404.025,
                                                    percentage: 50,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '1-SEARCH-Products-Water',
                                                            name: 'Mindful Morgan',
                                                            budget: 202.0125,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                            bigquery_adset_id:
                                                                '142232761402',
                                                        },
                                                        {
                                                            id: '1-SEARCH-Products-Soda',
                                                            name: 'Soda',
                                                            budget: 202.0125,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                    bigquery_campaign_id:
                                                        '18195521903',
                                                },
                                                {
                                                    id: '1-SEARCH-Services',
                                                    name: 'Primo Market Test | Lafayette',
                                                    budget: 404.025,
                                                    percentage: 50,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '1-SEARCH-Services-Dispenser',
                                                            name: 'Striving Selena',
                                                            budget: 202.0125,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                            bigquery_adset_id:
                                                                '143495582551',
                                                        },
                                                        {
                                                            id: '1-SEARCH-Services-Delivery',
                                                            name: 'Delivery',
                                                            budget: 202.0125,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                    bigquery_campaign_id:
                                                        '18197143856',
                                                },
                                            ],
                                        },
                                        {
                                            id: '1-SHOPPING',
                                            name: 'SHOPPING',
                                            budget: 808.05,
                                            percentage: 50,
                                            type: 'CAMPAIGN_TYPE',
                                            allocations: [
                                                {
                                                    id: '1-SHOPPING-Products',
                                                    name: 'Products',
                                                    budget: 202.0125,
                                                    percentage: 25,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '1-SHOPPING-Products-Bottled',
                                                            name: 'Bottled',
                                                            budget: 202.0125,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                        },
                                                        {
                                                            id: '1-SHOPPING-Products-Free Flow',
                                                            name: 'Free Flow',
                                                            budget: 202.0125,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                                {
                                                    id: '1-SHOPPING-Services',
                                                    name: 'Services',
                                                    budget: 202.0125,
                                                    percentage: 25,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '1-SHOPPING-Services-Frontline',
                                                            name: 'Frontline',
                                                            budget: 202.0125,
                                                            percentage: 100,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                                {
                                                    id: '1-SHOPPING-Home',
                                                    name: 'Home',
                                                    budget: 202.0125,
                                                    percentage: 25,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '1-SHOPPING-Home-Program',
                                                            name: 'Program',
                                                            budget: 202.0125,
                                                            percentage: 100,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                                {
                                                    id: '1-SHOPPING-Office',
                                                    name: 'Office',
                                                    budget: 202.0125,
                                                    percentage: 25,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '1-SHOPPING-Office-Required',
                                                            name: 'Required',
                                                            budget: 202.0125,
                                                            percentage: 100,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                    error: false,
                                },
                                {
                                    id: '2',
                                    name: 'Amazon Advertising',
                                    budget: 1616.1,
                                    percentage: 50,
                                    type: 'CHANNEL',
                                    allocations: [
                                        {
                                            id: '2-Sponsored Display',
                                            name: 'Sponsored Display',
                                            budget: 808.05,
                                            percentage: 50,
                                            type: 'CAMPAIGN_TYPE',
                                            allocations: [
                                                {
                                                    id: '2-Sponsored Display-Services',
                                                    name: 'Services',
                                                    budget: 808.05,
                                                    percentage: 100,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '2-Sponsored Display-Services-Delivery',
                                                            name: 'Delivery',
                                                            budget: 404.025,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                        },
                                                        {
                                                            id: '2-Sponsored Display-Services-Repair',
                                                            name: 'Repair',
                                                            budget: 404.025,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                        {
                                            id: '2-Sponsored Products',
                                            name: 'Sponsored Products',
                                            budget: 808.05,
                                            percentage: 50,
                                            type: 'CAMPAIGN_TYPE',
                                            allocations: [
                                                {
                                                    id: '2-Sponsored Products-Sports Drinks',
                                                    name: 'Sports Drinks',
                                                    budget: 404.025,
                                                    percentage: 50,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '2-Sponsored Products-Sports Drinks-Gatorade',
                                                            name: 'Gatorade',
                                                            budget: 808.05,
                                                            percentage: 100,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                                {
                                                    id: '2-Sponsored Products-Energy Drinks',
                                                    name: 'Energy Drinks',
                                                    budget: 404.025,
                                                    percentage: 50,
                                                    goals: '',
                                                    type: 'CAMPAIGN',
                                                    allocations: [
                                                        {
                                                            id: '2-Sponsored Products-Energy Drinks-Monster',
                                                            name: 'Monster',
                                                            budget: 202.0125,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                        },
                                                        {
                                                            id: '2-Sponsored Products-Energy Drinks-Red Bull',
                                                            name: 'Red Bull',
                                                            budget: 202.0125,
                                                            percentage: 50,
                                                            type: 'ADSET',
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                    error: false,
                                },
                            ],
                            error: false,
                        },
                    },
                },
            ],
        };

        const currentDate = new Date('Sep 20 2023');

        bigqueryClient.query.mockResolvedValue([
            [{ _date: '2023-09-20', spend: 0 }],
        ]);

        const { periods, allocations } = await computeAndStoreMetrics({
            campaign,
            currentDate,
        });

        expect(periods).toEqual(campaign.budgets[0].periods);
        expect(allocations).toEqual(expectedAllocations);
    });
});
describe('extractCampaignAndAdsetIds', () => {
    it('should extract bigquery_campaign_id and associated bigquery_adset_ids for each period', () => {
        const mockData = {
            periods: [{ id: 'period1' }],
            allocations: {
                period1: {
                    allocations: [
                        {
                            allocations: [
                                {
                                    allocations: [
                                        {
                                            bigquery_campaign_id: 'campaign1',
                                            allocations: [
                                                { bigquery_adset_id: 'adset1' },
                                                { bigquery_adset_id: 'adset2' },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            },
        };

        const result = extractCampaignAndAdsetIds(mockData);

        const expected = [
            {
                period: 'period1',
                bigquery_campaign_id: 'campaign1',
                bigquery_adset_ids: ['adset1', 'adset2'],
            },
        ];

        expect(result).toEqual(expected);
    });

    it('should handle multiple periods', () => {
        const mockData = {
            periods: [{ id: 'period1' }, { id: 'period2' }],
            allocations: {
                period1: {
                    allocations: [
                        {
                            allocations: [
                                {
                                    allocations: [
                                        {
                                            bigquery_campaign_id: 'campaign1',
                                            allocations: [
                                                { bigquery_adset_id: 'adset1' },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                period2: {
                    allocations: [
                        {
                            allocations: [
                                {
                                    allocations: [
                                        {
                                            bigquery_campaign_id: 'campaign2',
                                            allocations: [
                                                { bigquery_adset_id: 'adset2' },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            },
        };

        const result = extractCampaignAndAdsetIds(mockData);

        const expected = [
            {
                period: 'period1',
                bigquery_campaign_id: 'campaign1',
                bigquery_adset_ids: ['adset1'],
            },
            {
                period: 'period2',
                bigquery_campaign_id: 'campaign2',
                bigquery_adset_ids: ['adset2'],
            },
        ];

        expect(result).toEqual(expected);
    });
    it('should handle missing IDs', () => {
        const mockData = {
            periods: [{ id: 'period1' }],
            allocations: {
                period1: {
                    allocations: [
                        {
                            allocations: [
                                {
                                    allocations: [
                                        {
                                            allocations: [
                                                { bigquery_adset_id: 'adset1' },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            },
        };

        const result = extractCampaignAndAdsetIds(mockData);

        expect(result).toEqual([]); // Should return an empty array as there's no bigquery_campaign_id
    });
    it('should handle empty allocations', () => {
        const mockData = {
            periods: [{ id: 'period1' }],
            allocations: {
                period1: {},
            },
        };

        const result = extractCampaignAndAdsetIds(mockData);

        expect(result).toEqual([]); // Should return an empty array as there's no allocations to process
    });
});
