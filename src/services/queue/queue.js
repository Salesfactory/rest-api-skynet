const { Queue } = require('bullmq');
// const IORedis = require('ioredis');

// Configuration for connecting to ElastiCache Redis
const redisConfig = {
    host: process.env.REDIS_HOST || '127.0.0.1', // Set these in the Elastic Beanstalk environment
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined, // If your ElastiCache Redis has a password
};

// const connection = new IORedis(redisConfig);

// Initialize Queue
const amzQueue = new Queue('AmzQueue', { connection: { ...redisConfig } });

module.exports = { amzQueue };
