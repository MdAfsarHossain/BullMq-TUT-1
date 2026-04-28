const {Queue} = require('bullmq')
const Redis = require('ioredis');
require('dotenv').config();

// Redis connection
const connection  = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    maxRetriesPerRequest: null,
})

// Email Queue
const emailQueue = new Queue(process.env.EMAIL_QUEUE, {
    connection,
    defaultJobOptions: {
        attempts: 3, // If failed, try 3 times
        backoff: {
            type: "exponential", // slowly increase delay between attempts
            delay: 1000, // 1 second
        },
        removeOnComplete: 100, // Remove job after completion (100 jobs)
        removeOnFail: 500, // Remove job after failure (500 jobs)
    }
});

// Report Queue
const reportQueue = new Queue(process.env.REPORT_QUEUE, {
    connection,
    defaultJobOptions: {
    attempts: 2,
    backoff: 2000
    } 
});

// export const QueueConfig = {
//     emailQueue,
//     reportQueue
// }

module.exports = {emailQueue, reportQueue};