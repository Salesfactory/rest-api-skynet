const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');

// Configuration for connecting to ElastiCache Redis

function createQueue() {
    const redisConfig = {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD || undefined, // If your ElastiCache Redis has a password
        maxRetriesPerRequest: null,
    };
    console.log(JSON.stringify(redisConfig, null, 2));
    const connection = new IORedis(redisConfig);
    const amzQueue = new Queue('AmzQueue', connection);

    return {
        addJobToQueue: async jobData => {
            try {
                const job = await amzQueue.add('myJob', jobData);
                console.log(`Job added with ID: ${job.id}`);
                return job.id;
            } catch (err) {
                console.error('Error adding job to the queue:', err);
                throw new Error(err);
            }
        },
        startProcessingtJobs: async jobProcessingLogic => {
            const worker = new Worker('AmzQueue', async job => {
                console.log(`Processing job ${job.id} with data`, job.data);
                await jobProcessingLogic(job);
            });

            worker.on('completed', job => {
                console.log(`Job ${job.id} has completed!`);
            });

            worker.on('failed', (job, err) => {
                console.log(
                    `Job ${job.id} has failed with error ${err.message}`
                );
            });
        },
    };
}

// Initialize Queue

module.exports = { createQueue };
