const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const { amzQueue } = require('./queue');

// Assuming the Redis connection configuration is the same as used for the queue
const redisConfig = {
    host: process.env.REDIS_HOST, // Set these in the Elastic Beanstalk environment
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD, // If your ElastiCache Redis has a password
};

const connection = new IORedis(redisConfig);

async function jobProcessor(job) {
    console.log(`Processing job ${job.id} with data`, job.data);
    // Job processing logic here
    await delay(30000);
    return 'processed'; // Return value for testing
}

const worker = new Worker('AmzQueue', jobProcessor, { connection });

worker.on('completed', job => {
    console.log(`Job ${job.id} has completed!`);
});

worker.on('failed', (job, err) => {
    console.log(`Job ${job.id} has failed with error ${err.message}`);
});

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
