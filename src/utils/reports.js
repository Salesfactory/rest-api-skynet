const xl = require('excel4node');

const ordercategories = (timePeriod, allocations) => {
    const campaingInfo = [],
        budgetInfo = [];

    timePeriod.forEach((element, col) => {
        const elementName = element.id;
        if (allocations[elementName].allocations) {
            allocations[elementName].allocations.forEach((channel, row) => {
                if (channel.allocations) {
                    const channelName = channel.name;
                    channel.allocations.forEach((type, index) => {
                        if (type.allocations) {
                            const typeName = type.name;
                            type.allocations.forEach((campaing, index) => {
                                if (campaing.allocations) {
                                    const campaingName = campaing.name;
                                    const campaingGoals = campaing.goals;
                                    campaing.allocations.forEach(
                                        (ADSET, index) => {
                                            const ADSETName = ADSET.name;
                                            const long = campaingInfo.length;
                                            let indice = 0;
                                            let exist = false;
                                            for (
                                                let index = 0;
                                                index < long && !exist;
                                                index++
                                            ) {
                                                if (
                                                    campaingInfo[index]
                                                        .channelName ==
                                                        channelName &&
                                                    campaingInfo[index]
                                                        .typeName == typeName &&
                                                    campaingInfo[index]
                                                        .campaingName ==
                                                        campaingName &&
                                                    campaingInfo[index]
                                                        .ADSETName == ADSETName
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
                                                });
                                                budgetInfo.push({
                                                    index: long,
                                                    month: elementName,
                                                    budget: ADSET.budget,
                                                });
                                            } else {
                                                budgetInfo.push({
                                                    index: indice,
                                                    month: elementName,
                                                    budget: ADSET.budget,
                                                });
                                            }
                                        }
                                    );
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
        const monts = [];
        if (campaingInfo.length) {
            timePeriod.forEach((element, col) => {
                ws.column(col + 6).setWidth(20);
                ws.cell(1, col + 6)
                    .string(element.label)
                    .style(cellTitleStyle);
                monts[element.id] = col;
            });
            ws.column(6 + timePeriod.length).setWidth(25);
            ws.cell(1, 6 + timePeriod.length)
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
                        ws.cell(2 + i, 6 + monts[budget.month])
                            .number(budget.budget)
                            .style({ numberFormat: '$###,##0.00;' });
                    }
                });

                ws.cell(2 + i, 6 + timePeriod.length)
                    .formula(
                        `SUM(${xl.getExcelCellRef(
                            2 + i,
                            6
                        )}:${xl.getExcelCellRef(2 + i, 5 + timePeriod.length)})`
                    )
                    .style(cellStyle);
            });
        }
        resolve(wb);
    });

module.exports = {
    createSheet: async (timePeriod, allocations) =>
        createSheet(timePeriod, allocations),
};
