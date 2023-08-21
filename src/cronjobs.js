const cron = require('node-cron');
const { Channel } = require('./models');
const { channelController } = require('./controllers');

const formattedTime = time => {
    return (
        time.getHours().toString().padStart(2, '0') +
        ':' +
        time.getMinutes().toString().padStart(2, '0') +
        ':' +
        time.getSeconds().toString().padStart(2, '0')
    );
};

const logMessage = message => {
    console.log(`[${formattedTime(new Date())}] ${message}`);
};

const start = () => {
    // ignore cron job run on tests
    if (process.env.NODE_ENV !== 'test') {
        console.log('Starting cron jobs');

        // every day at 0 hours 0 minutes check if there are new channels to be inserted in the database
        cron.schedule('0 0 * * *', async () => {
            logMessage('Starting daily check for new channels');
            const bqChannels =
                await channelController.getProtectedBigqueryChannels();
            const channels = await Channel.findAll();

            // iterate over all channels from bigquery and check if they are already in the database
            for (const bqChannel of bqChannels) {
                const channel = channels.find(
                    channel => channel.name === bqChannel.channel
                );

                // if channel is not in the database, insert it
                if (!channel) {
                    logMessage(
                        `Channel ${bqChannel.channel} not found in the database. Inserting it now.`
                    );
                    await Channel.create({
                        name: bqChannel.channel,
                    });
                }
            }

            logMessage('Finished daily check for new channels');
        });
    }
};

module.exports = { start };
