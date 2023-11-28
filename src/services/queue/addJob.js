const { amzQueue } = require('./queue');

const addJobToQueue = async jobData => {
    try {
        const job = await amzQueue.add('myJob', jobData);
        console.log(`Job added with ID: ${job.id}`);
    } catch (err) {
        console.error('Error adding job to the queue:', err);
    }
};
addJobToQueue({ text: 'Hello BullMQ!' });
module.exports = { addJobToQueue };
