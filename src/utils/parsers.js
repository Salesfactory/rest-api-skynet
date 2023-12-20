function groupCampaignAllocationsByType({
    channelsWithApiEnabled,
    allocations,
    flight_time_start,
    flight_time_end,
}) {
    const campaignData = new Map();
    const channelNames = channelsWithApiEnabled.map(channel => channel.name);
    if (!allocations) {
        return {};
    }
    for (const [index, key] of Object.keys(allocations).entries()) {
        const periodAllocations = allocations[key].allocations;
        for (const channel of periodAllocations) {
            if (channelNames.includes(channel.name)) {
                if (Array.isArray(channel.allocations)) {
                    for (const campaignType of channel.allocations) {
                        if (Array.isArray(campaignType.allocations)) {
                            for (const campaign of campaignType.allocations) {
                                if (channel.name === 'Amazon Advertising DSP') {
                                    campaignData.set(campaign.id, {
                                        channel: channel.name,
                                        name: campaign.name,
                                        type: campaignType.name,
                                        budget:
                                            (
                                                campaignData.get(
                                                    campaign.id
                                                ) || {
                                                    budget: 0,
                                                }
                                            ).budget +
                                            parseFloat(campaign.budget),

                                        // amazon dsp specific fields
                                        advertiserId: campaign.advertiserId,
                                        recurrenceTimePeriod:
                                            campaign.recurrenceTimePeriod,
                                        frequencyCapType:
                                            campaign.frequencyCapType,
                                        frequencyCapMaxImpressions:
                                            campaign.frequencyCapMaxImpressions,
                                        frequencyCapTimeUnitCount:
                                            campaign.frequencyCapTimeUnitCount,
                                        frequencyCapTimeUnit:
                                            campaign.frequencyCapTimeUnit,
                                        productLocation:
                                            campaign.productLocation,
                                        biddingStrategy:
                                            campaign.biddingStrategy,
                                        goal: campaign.orderGoal,
                                        goalKpi: campaign.orderGoalKpi,
                                        adsets: campaign.allocations,
                                    });
                                } else if (channel.name === 'Facebook') {
                                    campaignData.set(campaign.id, {
                                        adsets: campaign.allocations,
                                        channel: channel.name,
                                        name: campaign.name,
                                        type: campaignType.name,
                                        budget:
                                            (
                                                campaignData.get(
                                                    campaign.id
                                                ) || {
                                                    budget: 0,
                                                }
                                            ).budget +
                                            parseFloat(campaign.budget),

                                        objective: campaign.objective,
                                        specialAdCategories:
                                            campaign.specialAdCategories,
                                        campaignObjective:
                                            campaign.campaignObjective,
                                        id: campaign.id,
                                        goals: campaign.goals,
                                        campaignType: campaignType.name,
                                        timePeriods: [],
                                        buyingType: campaign.buyingType,
                                        country: campaign.country,
                                    });
                                } else {
                                    campaignData.set(campaign.id, {
                                        adsets: campaign.allocations,
                                        channel: channel.name,
                                        name: campaign.name,
                                        type: campaignType.name,
                                        budget:
                                            (
                                                campaignData.get(
                                                    campaign.id
                                                ) || {
                                                    budget: 0,
                                                }
                                            ).budget +
                                            parseFloat(campaign.budget),
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    const parsedStartDate = new Date(flight_time_start)
        .toISOString()
        .substring(0, 10);
    const parsedEndDate = new Date(flight_time_end)
        .toISOString()
        .substring(0, 10);

    const campaignArray = Array.from(campaignData, ([key, value]) => ({
        id: key,
        ...value,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
    }));

    // const campaignDataByType = campaignArray.reduce((acc, campaign) => {
    //     const { type, ...rest } = campaign;
    //     if (!acc[type]) {
    //         acc[type] = [];
    //     }
    //     acc[type].push(rest);
    //     return acc;
    // }, {});

    const campaignDataByChannel = campaignArray.reduce((acc, campaign) => {
        const { channel, ...rest } = campaign;
        if (!acc[channel]) {
            acc[channel] = {};
        }
        if (!acc[channel][campaign.type]) {
            acc[channel][campaign.type] = [];
        }
        acc[channel][campaign.type].push(rest);
        return acc;
    }, {});

    return campaignDataByChannel;
}

function transformBudgetData({ allocations, periods }) {
    const result = [];

    for (const monthKey in allocations) {
        if (allocations.hasOwnProperty(monthKey)) {
            const monthData = {
                ...allocations[monthKey],
                ...periods.find(period => period.id === monthKey),
            };

            for (const channelKey in monthData.allocations) {
                if (monthData.allocations.hasOwnProperty(channelKey)) {
                    const channelData = monthData.allocations[channelKey];
                    const timePeriod = {
                        id: monthKey,
                        label: monthData.label,
                        days: monthData.days,
                        campaigns: [],
                    };

                    for (const campaignTypeKey in channelData.allocations) {
                        if (
                            channelData.allocations.hasOwnProperty(
                                campaignTypeKey
                            )
                        ) {
                            const campaignTypeData =
                                channelData.allocations[campaignTypeKey];

                            for (const campaignKey in campaignTypeData.allocations) {
                                if (
                                    campaignTypeData.allocations.hasOwnProperty(
                                        campaignKey
                                    )
                                ) {
                                    const campaignData =
                                        campaignTypeData.allocations[
                                            campaignKey
                                        ];
                                    const campaign = {
                                        id: campaignData.id,
                                        name: campaignData.name,
                                        budget: campaignData.budget,
                                        percentage: campaignData.percentage,
                                        type: campaignData.type,
                                        campaignType: campaignTypeData.name,
                                        adsets: [...campaignData.allocations],
                                    };
                                    timePeriod.campaigns.push(campaign);
                                }
                            }
                        }
                    }

                    const existingChannel = result.find(
                        ch => ch.id === channelData.id
                    );
                    if (existingChannel) {
                        existingChannel.timePeriods.push(timePeriod);
                    } else {
                        const channel = {
                            id: channelData.id,
                            name: channelData.name,
                            isApiEnabled: channelData.isApiEnabled,
                            timePeriods: [timePeriod],
                        };
                        result.push(channel);
                    }
                }
            }
        }
    }

    // console.log(JSON.stringify(result, null, 2));

    return result;
}

function generateCampaignsWithTimePeriodsAndAdsets(inputData) {
    const result = [];

    for (const channel of inputData.channels) {
        const channelData = {
            ...channel,
            type: 'CHANNEL',
            campaigns: [],
        };

        for (const period of inputData.periods) {
            const periodData = {
                ...period,
                adsets: [],
            };

            for (const allocation of inputData.allocations[period.id]
                .allocations) {
                for (const campaignType of allocation.allocations) {
                    for (const campaign of campaignType.allocations) {
                        if (channel.name === allocation.name) {
                            const campaignData = {
                                objective: campaign.objective,
                                specialAdCategories:
                                    campaign.specialAdCategories,
                                campaignObjective: campaign.campaignObjective,
                                id: campaign.id,
                                name: campaign.name,
                                goals: campaign.goals,
                                type: 'CAMPAIGN',
                                campaignType: campaignType.name,
                                timePeriods: [],
                                buyingType: campaign.buyingType,
                                country: campaign.country,
                            };

                            let adsets = [];
                            if (Array.isArray(campaign.allocations)) {
                                adsets = [...campaign.allocations];
                            }
                            const existingCampaign = channelData.campaigns.find(
                                campaign => campaign.id === campaignData.id
                            );

                            const timePeriodWithAdsets = {
                                ...periodData,
                                adsets,
                            };
                            if (existingCampaign) {
                                // If the id exists, push data to the timePeriods array
                                existingCampaign.timePeriods.push({
                                    ...timePeriodWithAdsets,
                                });
                            } else {
                                // If the id doesn't exist, create a new object and add it to the array
                                campaignData.timePeriods.push({
                                    ...timePeriodWithAdsets,
                                });
                                channelData.campaigns.push({ ...campaignData });
                            }
                        }
                    }
                }
            }
        }

        // Push channelData to the result
        result.push(channelData);
    }

    return result;
}

function convertToCents(dollars) {
    let dollarsAsNumber;

    if (typeof dollars === 'string') {
        dollarsAsNumber = parseFloat(dollars);
    } else if (typeof dollars === 'number') {
        dollarsAsNumber = dollars;
    }

    // Use Math.round to handle floating point precision issues
    const cents = Math.round(dollarsAsNumber * 100);
    return cents;
}

// ambos son arrays en la db, y como solo estamos creando campañas nuevas
// no hay que preocuparse por actualizar campañas existentes ¡AÚN!
const concatMissingCampaigns = async (prevCampaigns, newCampaigns) => {
    if (Array.isArray(prevCampaigns)) {
        return [...prevCampaigns, ...newCampaigns];
    } else {
        return newCampaigns;
    }
};

/* esta funcion reemplaza el jobId con el objeto adset luego de haber sido procesado por la cola
   ----------------------------------
   ejemplo de datos que recibe
   amazonCampaigns : [{"name":"8-Responsive eCommerce-b","data":{"orderId":"587878912348263615"},"adsets":[{"jobId":6,"adset":null}]}]
   jobId : 6
   adset : {"lineitem":"123456789"}
   ----------------------------------
   ejemplo de datos que retorna
   [{"name":"8-Responsive eCommerce-b","data":{"orderId":"587878912348263615"},"adsets":[{"lineitem":"123456789"}]}]
*/
const replaceJobIdWithAdsetInAmazonData = async ({
    amazonCampaigns,
    jobId,
    adset,
}) => {
    if (!Array.isArray(amazonCampaigns)) {
        return [];
    }
    const amazonCampaignsUpdated = amazonCampaigns.map(campaign => {
        const { adsets } = campaign;
        const adsetsUpdated = adsets.map(_adset => {
            if (_adset.jobId == jobId) {
                return adset;
            }
            return _adset;
        });
        return {
            ...campaign,
            adsets: adsetsUpdated,
        };
    });
    return amazonCampaignsUpdated;
};

module.exports = {
    groupCampaignAllocationsByType,
    transformBudgetData,
    generateCampaignsWithTimePeriodsAndAdsets,
    convertToCents,
    concatMissingCampaigns,
    replaceJobIdWithAdsetInAmazonData,
};
