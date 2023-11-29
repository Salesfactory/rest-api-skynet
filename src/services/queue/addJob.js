const { amzQueue } = require('./queue');

const addJobToQueue = async jobData => {
    try {
        const job = await amzQueue.add('myJob', jobData);
        console.log(`Job added with ID: ${job.id}`);
        return job.id;
    } catch (err) {
        console.error('Error adding job to the queue:', err);
        throw new Error(err);
    }
};
module.exports = { addJobToQueue };
