const { CampaignGroup, Job, User } = require('../models');
const { emailAmzTemplate } = require('../templates/amzEmail');
const { send } = require('../utils/email');

const sendEmails = async currentBatchId => {
    const { campaignGroupName, user } = await getUserByCampaignGroupId(
        currentBatchId
    );

    const jobs = await getJobsByBatchId(currentBatchId);

    if (!user || !jobs || jobs.length === 0) {
        console.error('No user or jobs found for batch ID:', currentBatchId);
        return; // or throw an error, based on your use case
    }

    const campaigns = {};

    jobs.forEach(({ dataValues: item }) => {
        const campaignId = item.data.campaignId;
        const adset = item.data.adset;

        // Step 3: Process Each Object
        if (!campaigns[campaignId]) {
            campaigns[campaignId] = [];
        }
        campaigns[campaignId].push({ ...adset, status: item.status });
    });

    const emailBody = emailAmzTemplate({
        user,
        campaigns,
        campaignGroupName,
    });

    try {
        await send({
            to: user.email,
            subject: 'Amazon adsets report',
            message: 'Amazon test report',
            html: emailBody,
        });
    } catch (error) {
        console.error('Error sending emails:', error);
        // Handle error appropriately
    }
};

async function getUserByCampaignGroupId(campaignGroupId) {
    try {
        const campaignGroup = await CampaignGroup.findOne({
            where: { id: campaignGroupId },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: [
                        'id',
                        'name',
                        'email',
                        'avatar',
                        'description',
                        'contact',
                        'active',
                        'roleId',
                    ],
                },
            ],
            attributes: ['name'],
        });

        if (campaignGroup) {
            return {
                campaignGroupName: campaignGroup.name,
                user: campaignGroup.user,
            };
        } else {
            return { name: '', user: null }; // No CampaignGroup found with the provided ID
        }
    } catch (error) {
        console.error('Error fetching user by CampaignGroup ID:', error);
        throw error;
    }
}
async function getJobsByBatchId(batchId) {
    try {
        const jobs = await Job.findAll({
            where: { batchId: batchId },
        });

        return jobs; // This will be an array of Job instances with the specified batchId
    } catch (error) {
        console.error('Error fetching jobs by batch ID:', error);
        throw error;
    }
}
module.exports = {
    sendEmails,
};
