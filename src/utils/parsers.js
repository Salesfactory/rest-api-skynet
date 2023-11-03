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

module.exports = { groupCampaignAllocationsByType };
