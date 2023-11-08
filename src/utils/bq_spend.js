const { bigqueryClient } = require('../config/bigquery');
const cloneDeep = require('lodash/cloneDeep');

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

const fetchAllBigQuerySpendingsForCampaign = async ({
    bigqueryIds,
    periods,
}) => {
    const periodLabels = periods.map(period => period.label);
    const campaignIds = [
        ...new Set(bigqueryIds.map(item => item.bigquery_campaign_id)),
    ];
    const adsetIds = [
        ...new Set(bigqueryIds.map(item => item.bigquery_adset_ids).flat()),
    ];

    let params = [campaignIds, adsetIds, periodLabels];

    let sqlQuery = `SELECT FORMAT_DATE('%B %Y', cs.date) as _date, cs.campaign_id, cs.adset_id, cs.campaign_name, cs.adset_name, SUM(cs.spend) as spend 
        FROM \`agency_6133.cs_paid_ads__basic_performance\` as cs
        WHERE cs.campaign_id IN UNNEST(?) AND cs.adset_id IN UNNEST(?)
        AND FORMAT_DATE('%B %Y', cs.date) IN UNNEST(?)
        GROUP BY cs.campaign_id, cs.adset_id, _date, cs.campaign_name, cs.adset_name
        ORDER BY PARSE_DATE('%B %Y', _date) ASC
        `;

    const options = {
        query: sqlQuery,
        params,
    };

    return bigqueryClient.query(options);
};

const parseMonthYearToIndexAndYear = monthYear => {
    const [monthStr, yearStr] = monthYear.split(' ');
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

    const monthIndex = monthNames.findIndex(
        month => month.toLowerCase() === monthStr.toLowerCase()
    );

    const year = parseInt(yearStr, 10);

    if (isNaN(year)) {
        return { monthIndex, year: null };
    }

    return { monthIndex, year };
};

const calculatePercentageMonthElapsed = ({ currentDate, monthIndex, year }) => {
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

const calculateDaysInMonth = ({ monthIndex, year }) => {
    return new Date(year, monthIndex + 1, 0).getDate();
};

const calculateRemainingDaysInMonth = ({ currentDate, monthIndex, year }) => {
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

const calculateDaysElapsedInMonth = ({ currentDate, monthIndex, year }) => {
    const periodDate = new Date(year, monthIndex);

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

const getMetrics = ({
    period,
    periodBudget,
    spending,
    carryOver,
    currentDate,
}) => {
    // to avoid division by zero
    if (periodBudget === 0) periodBudget = NaN;
    const { monthIndex, year } = parseMonthYearToIndexAndYear(period);
    // if (isNaN(monthIndex) || isNaN(year)) {
    //     return -1;
    // }
    const MTDSpend = spending.length > 0 ? spending[0].spend : 0;
    const remainingBudget = periodBudget + carryOver - MTDSpend;
    const percentageBudgetSpent = (MTDSpend / (periodBudget + carryOver)) * 100;
    const percentageMonthElapsed = calculatePercentageMonthElapsed({
        currentDate,
        monthIndex,
        year,
    });
    const monthDays = calculateDaysInMonth({
        monthIndex,
        year,
    });
    const remainingDays = calculateRemainingDaysInMonth({
        currentDate,
        monthIndex,
        year,
    });
    const adb = (periodBudget + carryOver) / monthDays;
    const elapsedDays = calculateDaysElapsedInMonth({
        currentDate,
        monthIndex,
        year,
    });
    // we insert data from the previous day so we make calculations based on the previous day
    const elapsedDaysMinusOne = elapsedDays - 1;
    const currentAdb = elapsedDaysMinusOne > 0 ? MTDSpend / elapsedDaysMinusOne : 'N/A';
    const avgDailySpent =
        remainingDays > 0 ? remainingBudget / remainingDays : 'N/A';

    return {
        mtd_spent: MTDSpend,
        budget_remaining: remainingBudget,
        budget_spent: percentageBudgetSpent,
        month_elapsed: percentageMonthElapsed,
        adb: adb,
        adb_current: currentAdb,
        avg_daily_spent: avgDailySpent,
        carry_over: carryOver,
    };
};

const setSpending = (allocation, metric) => {
    allocation.mtd_spent = metric.mtd_spent;
    allocation.budget_remaining = metric.budget_remaining;
    allocation.budget_spent = metric.budget_spent;
    allocation.month_elapsed = metric.month_elapsed;
    allocation.adb = metric.adb;
    allocation.adb_current = metric.adb_current;
    allocation.avg_daily_spent = metric.avg_daily_spent;
    allocation.carry_over = metric.carry_over;
};

const extractCampaignAndAdsetIds = ({ periods, allocations }) => {
    const bigQueryIds = [];

    for (const [index, period] of periods.entries()) {
        const periodAllocations = allocations[period.id];

        if (!Array.isArray(periodAllocations.allocations)) continue;

        for (const channel of periodAllocations.allocations) {
            if (!Array.isArray(channel.allocations)) continue;

            for (const campaignType of channel.allocations) {
                if (!Array.isArray(campaignType.allocations)) continue;

                for (const {
                    bigquery_campaign_id,
                    allocations: campaignAllocations,
                } of campaignType.allocations) {
                    if (!Array.isArray(campaignAllocations)) continue;

                    const bigqueryAdsetIds = campaignAllocations.reduce(
                        (acc, adset) => {
                            if (adset.bigquery_adset_id) {
                                acc.push(adset.bigquery_adset_id);
                            }
                            return acc;
                        },
                        []
                    );

                    if (bigquery_campaign_id && bigqueryAdsetIds.length) {
                        bigQueryIds.push({
                            period: period.id,
                            bigquery_campaign_id,
                            bigquery_adset_ids: bigqueryAdsetIds,
                        });
                    }
                }
            }
        }
    }
    return bigQueryIds;
};

/**
 * Compute and store metrics for a campaign
 * @param { campaign, currentDate }
 * @returns { periods, allocations }
 */
async function computeAndStoreMetrics({ campaign, currentDate }) {
    const budget = campaign.budgets[0];
    const { periods, allocations } = budget || { periods: [], allocations: {} };

    let allocationsCopy = cloneDeep(allocations);
    let carryOverMap = new Map();

    // get bigquery ids for the first period
    const bigqueryIds = extractCampaignAndAdsetIds({
        periods,
        allocations,
    });

    // get spendings for all bigquery ids
    let spendings = [];
    if (bigqueryIds.length > 0) {
        spendings = (
            await fetchAllBigQuerySpendingsForCampaign({
                bigqueryIds,
                periods,
            })
        )[0];
    }

    for (const [index, period] of periods.entries()) {
        // using the copy of allocations object
        const periodAllocations = allocationsCopy[period.id];
        let periodSpendings = 0;

        // channels
        for (const channel of periodAllocations.allocations) {
            const { budget: channelBudget } = channel;
            let channelSpendings = 0;

            if (Array.isArray(channel.allocations)) {
                // campaign types
                for (const campaignType of channel.allocations) {
                    const { budget: typeBudget } = campaignType;
                    let typeSpendings = 0;

                    if (Array.isArray(campaignType.allocations)) {
                        // fiter campaigns only with bigquery id
                        // and replace allocations with filtered array
                        // so we don't iterate over the allocations that don't have bigquery id
                        campaignType.allocations =
                            campaignType.allocations.filter(
                                campaign => campaign.bigquery_campaign_id
                            );

                        // campaigns
                        for (const campaign of campaignType.allocations) {
                            const {
                                budget: campaignBudget,
                                bigquery_campaign_id,
                            } = campaign;
                            let campaignSpendings = 0;

                            if (Array.isArray(campaign.allocations)) {
                                if (bigquery_campaign_id) {
                                    // fiter adsets only with bigquery id
                                    // and replace allocations with filtered array
                                    // so we don't iterate over the allocations that don't have bigquery id
                                    campaign.allocations =
                                        campaign.allocations.filter(
                                            adset => adset.bigquery_adset_id
                                        );

                                    // adsets
                                    for (const adset of campaign.allocations) {
                                        const {
                                            bigquery_adset_id,
                                            budget: adsetBudget,
                                        } = adset;

                                        if (bigquery_adset_id) {
                                            // get spending by period
                                            const spending =
                                                spendings.filter(
                                                    item =>
                                                        item.campaign_id ===
                                                            bigquery_campaign_id &&
                                                        item.adset_id ===
                                                            bigquery_adset_id &&
                                                        item._date ===
                                                            period.label
                                                ) || [];

                                            const adsetCarryOver =
                                                carryOverMap.get(adset.id) || 0;

                                            const adsetMetrics = getMetrics({
                                                period: period.label,
                                                periodBudget: adsetBudget,
                                                spending,
                                                carryOver: adsetCarryOver,
                                                currentDate,
                                            });

                                            campaignSpendings +=
                                                adsetMetrics.mtd_spent;

                                            setSpending(adset, adsetMetrics);

                                            carryOverMap.set(
                                                adset.id,
                                                adsetMetrics.budget_remaining
                                            );
                                        }
                                    }
                                }

                                const campaignCarryOver =
                                    carryOverMap.get(campaign.id) || 0;

                                const campaignMetrics = getMetrics({
                                    period: period.label,
                                    periodBudget: campaignBudget,
                                    spending: [{ spend: campaignSpendings }],
                                    carryOver: campaignCarryOver,
                                    currentDate,
                                });

                                typeSpendings += campaignMetrics.mtd_spent;

                                setSpending(campaign, campaignMetrics);
                                carryOverMap.set(
                                    campaign.id,
                                    campaignMetrics.budget_remaining
                                );
                            }
                        }

                        const typeCarryOver =
                            carryOverMap.get(campaignType.id) || 0;

                        const typeMetrics = getMetrics({
                            period: period.label,
                            periodBudget: typeBudget,
                            spending: [{ spend: typeSpendings }],
                            carryOver: typeCarryOver,
                            currentDate,
                        });

                        channelSpendings += typeMetrics.mtd_spent;

                        setSpending(campaignType, typeMetrics);

                        carryOverMap.set(
                            campaignType.id,
                            typeMetrics.budget_remaining
                        );
                    }
                }

                const channelCarryOver = carryOverMap.get(channel.id) || 0;

                const channelMetrics = getMetrics({
                    period: period.label,
                    periodBudget: channelBudget,
                    spending: [{ spend: channelSpendings }],
                    carryOver: channelCarryOver,
                    currentDate,
                });

                periodSpendings += channelMetrics.mtd_spent;

                setSpending(channel, channelMetrics);
                carryOverMap.set(channel.id, channelMetrics.budget_remaining);
            }
        }

        allocationsCopy[period.id].mtd_spent = periodSpendings;
    }

    return {
        periods,
        allocations: allocationsCopy,
    };
}

module.exports = {
    fetchAllBigQuerySpendingsForCampaign,
    getBigquerySpending,
    getMetrics,
    calculatePercentageMonthElapsed,
    parseMonthYearToIndexAndYear,
    calculateDaysInMonth,
    calculateDaysElapsedInMonth,
    calculateRemainingDaysInMonth,
    computeAndStoreMetrics,
    extractCampaignAndAdsetIds,
};
