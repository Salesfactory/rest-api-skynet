const xl = require('excel4node');

const ordercategories = (timePeriod, allocations) => {
    const campaingInfo = [],
        budgetInfo = [];

    timePeriod.forEach((element, col) => {
        const periodName = element.id;
        if (allocations[periodName].allocations) {
            allocations[periodName].allocations.forEach((channel, row) => {
                if (channel.allocations) {
                    const channelName = channel.name;
                    channel.allocations.forEach((type, index) => {
                        if (type.allocations) {
                            const typeName = type.name;
                            type.allocations.forEach((campaing, index) => {
                                const campaingName = campaing.name;
                                const campaingGoals = campaing.goals;

                                const insertBudget = ({
                                    channelName,
                                    typeName,
                                    campaingName,
                                    ADSETName,
                                    budget,
                                    hasAllocations,
                                }) => {
                                    const cmplength = campaingInfo.length;
                                    let indice = 0;
                                    let exist = false;

                                    for (
                                        let index = 0;
                                        index < cmplength && !exist;
                                        index++
                                    ) {
                                        if (
                                            campaingInfo[index].channelName ==
                                                channelName &&
                                            campaingInfo[index].typeName ==
                                                typeName &&
                                            campaingInfo[index].campaingName ==
                                                campaingName &&
                                            // if campaign has allocations or not
                                            ((campaingInfo[index].ADSETName ==
                                                ADSETName &&
                                                hasAllocations) ||
                                                !hasAllocations)
                                        ) {
                                            exist = true;
                                            indice = index;
                                        }
                                    }

                                    if (!exist) {
                                        campaingInfo.push({
                                            channelName,
                                            typeName,
                                            campaingName,
                                            campaingGoals,
                                            ADSETName,
                                            month: periodName,
                                        });
                                    }
                                    budgetInfo.push({
                                        index: !exist ? cmplength : indice,
                                        month: periodName,
                                        budget: budget,
                                    });
                                };

                                if (
                                    Array.isArray(campaing.allocations) &&
                                    campaing.allocations.length > 0
                                ) {
                                    campaing.allocations.forEach(
                                        (ADSET, index) => {
                                            insertBudget({
                                                channelName,
                                                typeName,
                                                campaingName,
                                                ADSETName: ADSET.name,
                                                budget: ADSET.budget,
                                                hasAllocations: true,
                                            });
                                        }
                                    );
                                } else {
                                    insertBudget({
                                        channelName,
                                        typeName,
                                        campaingName,
                                        ADSETName: '',
                                        budget: campaing.budget,
                                        hasAllocations: false,
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
    return { campaingInfo, budgetInfo };
};

const createSheet = (timePeriod, allocations) =>
    new Promise(resolve => {
        const wb = new xl.Workbook({
            dateFormat: 'dd/mm/yyyy',
        });
        const cellTitleStyle = wb.createStyle({
            font: {
                bold: true,
                underline: true,
            },
            alignment: {
                horizontal: 'center',
                vertical: 'center',
                wrapText: true,
            },
        });
        const cellStyle = wb.createStyle({
            alignment: { horizontal: 'center' },
            numberFormat: '$#,##0.00; ($#,##0.00); -',
        });

        const ws = wb.addWorksheet('Monthly-Budget-Allocation');
        ws.column(1).setWidth(30);
        ws.column(2).setWidth(30);
        ws.column(3).setWidth(50);
        ws.column(4).setWidth(30);
        ws.column(5).setWidth(30);

        // Add a title's row
        ws.cell(1, 1).string('Channel').style(cellTitleStyle);
        ws.cell(1, 2).string('Campaign Type/Tactic').style(cellTitleStyle);
        ws.cell(1, 3).string('Campain name').style(cellTitleStyle);
        ws.cell(1, 4).string('Campaign Goal').style(cellTitleStyle);
        ws.cell(1, 5).string('Adset Name').style(cellTitleStyle);

        const { campaingInfo, budgetInfo } = ordercategories(
            timePeriod,
            allocations
        );
        const months = [];
        if (campaingInfo.length) {
            timePeriod.forEach((element, index) => {
                const col = index * 2;
                ws.column(col + 6).setWidth(20);
                ws.cell(1, col + 6)
                    .string(element.label)
                    .style(cellTitleStyle);
                ws.cell(1, col + 7)
                    .string(element.label + ' ADB')
                    .style(cellTitleStyle);
                months[element.id] = {
                    col,
                    days: element.days,
                };
            });
            ws.column(6 + timePeriod.length * 2).setWidth(25);
            ws.cell(1, 6 + timePeriod.length * 2)
                .string('Total Amount')
                .style(cellTitleStyle);
            campaingInfo.forEach((element, i) => {
                ws.cell(2 + i, 1)
                    .string(element.channelName)
                    .style(cellStyle);
                ws.cell(2 + i, 2)
                    .string(element.typeName)
                    .style(cellStyle);
                ws.cell(2 + i, 3)
                    .string(element.campaingName)
                    .style(cellStyle);
                ws.cell(2 + i, 4)
                    .string(element.campaingGoals)
                    .style(cellStyle);
                ws.cell(2 + i, 5)
                    .string(element.ADSETName)
                    .style(cellStyle);
                budgetInfo.forEach(budget => {
                    if (budget.index == i) {
                        ws.cell(2 + i, 6 + months[budget.month].col)
                            .number(budget.budget)
                            .style({ numberFormat: '$###,##0.00;' });
                        ws.cell(2 + i, 7 + months[budget.month].col)
                            .number(
                                budget.budget / (months[budget.month].days ?? 1)
                            )
                            .style({ numberFormat: '$###,##0.00;' });
                    }
                });

                ws.cell(2 + i, 6 + timePeriod.length * 2)
                    .formula(
                        `SUM(${xl.getExcelCellRef(
                            2 + i,
                            6
                        )}:${xl.getExcelCellRef(2 + i, 5 + timePeriod.length)})`
                    )
                    .style(cellStyle);
            });

            ws.cell(campaingInfo.length + 2, 5)
                .string('Total')
                .style(cellStyle);

            for (const month in months) {
                const { col } = months[month];

                ws.cell(campaingInfo.length + 2, 6 + col)
                    .formula(
                        `SUM(${xl.getExcelCellRef(
                            2,
                            6 + col
                        )}:${xl.getExcelCellRef(
                            campaingInfo.length + 1,
                            6 + col
                        )})`
                    )
                    .style({ numberFormat: '$###,##0.00;' });
                ws.cell(campaingInfo.length + 2, 7 + col)
                    .formula(
                        `SUM(${xl.getExcelCellRef(
                            2,
                            7 + col
                        )}:${xl.getExcelCellRef(
                            campaingInfo.length + 1,
                            7 + col
                        )})`
                    )
                    .style({ numberFormat: '$###,##0.00;' });
            }

            ws.cell(campaingInfo.length + 2, 6 + timePeriod.length * 2)
                .formula(
                    `SUM(${xl.getExcelCellRef(
                        2,
                        6 + timePeriod.length * 2
                    )}:${xl.getExcelCellRef(
                        campaingInfo.length + 1,
                        6 + timePeriod.length * 2
                    )})`
                )
                .style(cellStyle);
        }
        resolve(wb);
    });

const getPacingRows = ({ items, rows }) => {
    for (const item of items) {
        rows.push({
            name: item.name,
            carry_over: item.carry_over,
            budget: item.budget,
            adb: item.adb,
            adb_current: item.adb_current,
            mtd_spent: item.mtd_spent,
            budget_remaining: item.budget_remaining,
            budget_spent: item.budget_spent,
            month_elapsed: item.month_elapsed,
            avg_daily_spent: item.avg_daily_spent,
        });
        if (Array.isArray(item.allocations) && item.allocations.length > 0) {
            getPacingRows({ items: item.allocations, rows });
        }
    }
};

const createPacingsSheet = ({ timePeriods, periodAllocations }) =>
    new Promise(resolve => {
        const wb = new xl.Workbook({
            dateFormat: 'dd/mm/yyyy',
        });
        const cellTitleStyle = wb.createStyle({
            font: {
                bold: true,
                underline: true,
            },
            alignment: {
                horizontal: 'center',
                vertical: 'center',
                wrapText: true,
            },
        });
        const cellStyle = wb.createStyle({
            alignment: { horizontal: 'center' },
            numberFormat: '$#,##0.00; ($#,##0.00); -',
        });

        timePeriods.forEach((timePeriod, col) => {
            const periodLabel = timePeriod.label;
            const channelAllocations =
                periodAllocations[timePeriod.id].allocations;

            const ws = wb.addWorksheet(periodLabel);
            ws.column(2).setWidth(30);
            ws.column(3).setWidth(50);
            ws.column(4).setWidth(30);
            ws.column(5).setWidth(30);
            ws.column(6).setWidth(30);
            ws.column(7).setWidth(30);
            ws.column(8).setWidth(30);
            ws.column(9).setWidth(30);
            ws.column(10).setWidth(30);

            // Add a title's row
            ws.cell(1, 2).string('Carry over').style(cellTitleStyle);
            ws.cell(1, 3).string('Budget (Net)').style(cellTitleStyle);
            ws.cell(1, 4).string('ADB').style(cellTitleStyle);
            ws.cell(1, 5).string('ADB Current').style(cellTitleStyle);
            ws.cell(1, 6).string('MTD Spent (Net)').style(cellTitleStyle);
            ws.cell(1, 7)
                .string('Budget remaining (Net)')
                .style(cellTitleStyle);
            ws.cell(1, 8).string('Budget spent (%)').style(cellTitleStyle);
            ws.cell(1, 9).string('Month elapsed (%)').style(cellTitleStyle);
            ws.cell(1, 10)
                .string('Avg. Daily spend to reach goal')
                .style(cellTitleStyle);

            const rows = [];

            if (
                Array.isArray(channelAllocations) &&
                channelAllocations.length > 0
            ) {
                getPacingRows({ items: channelAllocations, rows });
            }

            rows.forEach((row, index) => {
                ws.cell(2 + index, 1)
                    .string(row.name)
                    .style(cellStyle);
                ws.cell(2 + index, 2)
                    .number(parseFloat(row.carry_over) || 0)
                    .style(cellStyle);
                ws.cell(2 + index, 3)
                    .number(parseFloat(row.budget) || 0)
                    .style(cellStyle);
                ws.cell(2 + index, 4)
                    .number(parseFloat(row.adb) || 0)
                    .style(cellStyle);
                ws.cell(2 + index, 5)
                    .number(parseFloat(row.adb_current) || 0)
                    .style(cellStyle);
                ws.cell(2 + index, 6)
                    .number(parseFloat(row.mtd_spent) || 0)
                    .style(cellStyle);
                ws.cell(2 + index, 7)
                    .number(parseFloat(row.budget_remaining) || 0)
                    .style(cellStyle);
                ws.cell(2 + index, 8)
                    .number(parseFloat(row.budget_spent) || 0)
                    .style(cellStyle);
                ws.cell(2 + index, 9)
                    .number(parseFloat(row.month_elapsed) || 0)
                    .style(cellStyle);
                ws.cell(2 + index, 10)
                    .number(parseFloat(row.avg_daily_spent) || 0)
                    .style(cellStyle);
            });
        });

        resolve(wb);
    });

module.exports = {
    createSheet: async (timePeriod, allocations) =>
        createSheet(timePeriod, allocations),
    createPacingsSheet: async ({ timePeriods, periodAllocations }) =>
        createPacingsSheet({ timePeriods, periodAllocations }),
};
