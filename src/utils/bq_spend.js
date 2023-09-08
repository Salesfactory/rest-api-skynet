const { bigqueryClient } = require('../config/bigquery');

const getBigquerySpending = ({ campaignId, adsetId, period }) => {
    let params = [campaignId, adsetId];
    let sqlQuery = `SELECT FORMAT_DATE('%B %Y', cs.date) as _date, SUM(cs.spend) as spend 
        FROM \`agency_6133.cs_paid_ads__basic_performance\` as cs
        WHERE cs.campaign_id = ? AND cs.adset_id = ? 
        `;

    if (period) {
        sqlQuery += `AND FORMAT_DATE('%B %Y', cs.date) = ? `;
        params.push(period);
    }

    sqlQuery += `GROUP BY cs.campaign_id, cs.adset_id, _date 
        ORDER BY PARSE_DATE('%B %Y', _date) ASC
        `;

    const options = {
        query: sqlQuery,
        params,
    };

    return bigqueryClient.query(options);
};

const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

const calculatePercentageMonthElapsed = monthYear => {
    const [monthStr, yearStr] = monthYear.split(' ');

    const monthIndex = monthNames.findIndex(
        month => month.toLowerCase() === monthStr.toLowerCase()
    );

    const year = parseInt(yearStr, 10);

    if (isNaN(monthIndex) || isNaN(year)) {
        return -1;
    }

    const currentDate = new Date();

    if (
        currentDate.getFullYear() > year ||
        (currentDate.getFullYear() === year &&
            currentDate.getMonth() > monthIndex)
    ) {
        return 100;
    }

    if (
        currentDate.getFullYear() === year &&
        currentDate.getMonth() === monthIndex
    ) {
        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
        const daysElapsed = currentDate.getDate();
        return (daysElapsed / daysInMonth) * 100;
    }

    return 0;
};

const calculateDaysInMonth = monthYear => {
    const [monthStr, yearStr] = monthYear.split(' ');

    const monthIndex = monthNames.findIndex(
        month => month.toLowerCase() === monthStr.toLowerCase()
    );

    const year = parseInt(yearStr, 10);

    if (isNaN(monthIndex) || isNaN(year)) {
        return -1;
    }

    return new Date(year, monthIndex + 1, 0).getDate();
};

const calculateRemainingDaysInMonth = monthYear => {
    const [monthStr, yearStr] = monthYear.split(' ');

    const monthIndex = monthNames.findIndex(
        month => month.toLowerCase() === monthStr.toLowerCase()
    );

    const year = parseInt(yearStr, 10);

    if (isNaN(monthIndex) || isNaN(year)) {
        return -1;
    }

    const currentDate = new Date();

    if (
        currentDate.getFullYear() > year ||
        (currentDate.getFullYear() === year &&
            currentDate.getMonth() > monthIndex)
    ) {
        return 0;
    }

    if (
        currentDate.getFullYear() === year &&
        currentDate.getMonth() === monthIndex
    ) {
        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
        const daysElapsed = currentDate.getDate();
        return daysInMonth - daysElapsed;
    }

    return new Date(year, monthIndex + 1, 0).getDate();
};

const calculateDaysElapsedInMonth = monthYear => {
    const [monthStr, yearStr] = monthYear.split(' ');

    const monthIndex = monthNames.findIndex(
        month => month.toLowerCase() === monthStr.toLowerCase()
    );

    const year = parseInt(yearStr, 10);

    if (isNaN(monthIndex) || isNaN(year)) {
        return -1;
    }

    const periodDate = new Date(year, monthIndex);
    const currentDate = new Date();

    if (
        periodDate.getFullYear() === currentDate.getFullYear() &&
        periodDate.getMonth() === currentDate.getMonth()
    ) {
        const elapsedDays = currentDate.getDate() - 1; // Subtract 1 to include the current day
        return elapsedDays;
    }

    if (
        periodDate.getFullYear() < currentDate.getFullYear() ||
        (periodDate.getMonth() < currentDate.getMonth() &&
            periodDate.getFullYear() === currentDate.getFullYear())
    ) {
        return new Date(year, monthIndex + 1, 0).getDate();
    }

    return 0;
};

const getMetrics = ({ period, periodBudget, spending }) => {
    // to avoid division by zero
    if (periodBudget === 0) periodBudget = NaN;

    const MTDSpend = spending.length > 0 ? spending[0].spend : 0;
    const remainingBudget = periodBudget - MTDSpend;
    const percentageBudgetSpent = (remainingBudget / periodBudget) * 100;
    const percentageMonthElapsed = calculatePercentageMonthElapsed(period);
    const monthDays = calculateDaysInMonth(period);
    const remainingDays = calculateRemainingDaysInMonth(period);
    const adb = periodBudget / monthDays;
    const currentAdb =
        remainingDays > 0 ? remainingBudget / remainingDays : 'N/A';
    const elapsedDays = calculateDaysElapsedInMonth(period);
    const avgDailySpent = elapsedDays > 0 ? MTDSpend / elapsedDays : 'N/A';

    return {
        mtd_spent: MTDSpend,
        budget_remaining: remainingBudget,
        budget_spent: percentageBudgetSpent,
        month_elapsed: percentageMonthElapsed,
        adb: adb,
        adb_current: currentAdb,
        avg_daily_spent: avgDailySpent,
    };
};

module.exports = {
    getBigquerySpending,
    getMetrics,
};
