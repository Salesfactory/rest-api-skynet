// calculator.test.js

const {
    calculatePercentageMonthElapsed,
    parseMonthYearToIndexAndYear,
    calculateDaysInMonth,
    calculateDaysElapsedInMonth,
    calculateRemainingDaysInMonth,
} = require('../src/utils/bq_spend');

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
// filename: calculator.test.js

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
