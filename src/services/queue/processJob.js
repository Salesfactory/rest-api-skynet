const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const { amzQueue } = require('./queue');

// Assuming the Redis connection configuration is the same as used for the queue
// const redisConfig = {
//     host: process.env.REDIS_HOST, // Set these in the Elastic Beanstalk environment
//     port: process.env.REDIS_PORT,
//     password: process.env.REDIS_PASSWORD, // If your ElastiCache Redis has a password
//     maxRetriesPerRequest: null,
// };

// const connection = new IORedis(redisConfig);

// async function storeResultinRedis(job) {
//     const result = `Processed job with data: ${JSON.stringify(job.data)}`;
//     await connection.set(`jobResult:${job.id}`, result);
//     return result;
// }

function jobProcessor(jobProcessingLogic) {
    return async function (job) {
        console.log(`Processing job ${job.id} with data`, job.data);
        await jobProcessingLogic(job);
        await delay(300);
        return 'processed'; // Return value for testing
    };
}

// const _jobProcessor = jobProcessor(storeResultinRedis);

// const worker = new Worker('AmzQueue', _jobProcessor, { connection });

// worker.on('completed', job => {
//     console.log(`Job ${job.id} has completed!`);
// });

// worker.on('failed', (job, err) => {
//     console.log(`Job ${job.id} has failed with error ${err.message}`);
// });

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const processNextJob = async jobProcessingLogic => {
    const worker = new Worker('AmzQueue', async job => {
        console.log(`Processing job ${job.id} with data`, job.data);
        await jobProcessingLogic(job);
    });

    worker.on('completed', job => {
        console.log(`Job ${job.id} has completed!`);
    });

    worker.on('failed', (job, err) => {
        console.log(`Job ${job.id} has failed with error ${err.message}`);
    });
};

module.exports = { jobProcessor, processNextJob };
