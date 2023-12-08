const jobs = require('../../__mocks__/jobs');
const { emailAmzTemplate } = require('../templates/amzEmail');
const { send } = require('../utils/email');

const sendAdsetCreationResultsToOwners = async owners => {
    const emailPromises = owners.map(owner => {
        const emailBody = emailAmzTemplate({
            owner,
            campaigns: owner.campaigns,
            campaignGroup: owner.campaignGroup,
        });
        return send({
            to: owner.email,
            subject: 'Amazon adsets report',
            message: 'Amazon test report',
            html: emailBody,
        });
    });

    await Promise.all(emailPromises);
};

const sendEmails = async jobs => {
    // Todo parse the data to send emails
    // Todo get data from database
    return null;
};

module.exports = {
    sendAdsetCreationResultsToOwners,
    sendEmails,
};
