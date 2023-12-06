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
                                campaignData.set(campaign.id, {
                                    channel: channel.name,
                                    name: campaign.name,
                                    type: campaignType.name,
                                    budget:
                                        (
                                            campaignData.get(campaign.id) || {
                                                budget: 0,
                                            }
                                        ).budget + parseFloat(campaign.budget),

                                    // amazon dsp specific fields
                                    advertiserId: campaign.advertiserId,
                                    recurrenceTimePeriod:
                                        campaign.recurrenceTimePeriod,
                                    frequencyCapType: campaign.frequencyCapType,
                                    frequencyCapMaxImpressions:
                                        campaign.frequencyCapMaxImpressions,
                                    frequencyCapTimeUnitCount:
                                        campaign.frequencyCapTimeUnitCount,
                                    frequencyCapTimeUnit:
                                        campaign.frequencyCapTimeUnit,
                                    productLocation: campaign.productLocation,
                                    biddingStrategy: campaign.biddingStrategy,
                                    goal: campaign.orderGoal,
                                    goalKpi: campaign.orderGoalKpi,
                                    adsets: campaign.allocations,
                                });
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
                        const campaignData = {
                            objective: campaign.objective,
                            specialAdCategories: campaign.specialAdCategories,
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

module.exports = {
    groupCampaignAllocationsByType,
    transformBudgetData,
    generateCampaignsWithTimePeriodsAndAdsets,
    convertToCents,
};
