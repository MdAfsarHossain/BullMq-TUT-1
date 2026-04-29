const { Worker } = require('bullmq');
const { connection } = require('../queues/queueConfig.js');
require('dotenv').config();

// console.log(connection);
// console.log(process.env.EMAIL_QUEUE);

// Debug logs
console.log('Connection type:', typeof connection);
console.log('Is Redis instance?', connection && connection.status);
console.log('Email Queue Name:', process.env.EMAIL_QUEUE);

// Email sending simulation function
const sendEmail = async (emailData) => {
    console.log(`📧 Simulation Email is sending...`);
    console.log(`   → To: ${emailData.to}`);
    console.log(`   → Subject: ${emailData.subject}`);
    console.log(`   → Body: ${emailData.body}`);
  
    // Simulating 2-3 seconds delay for email sending
    await new Promise(resolve => setTimeout(resolve, 2000));
  
    // Randomly failing for testing purposes
    if (Math.random() < 0.2) { // 20% failure rate
        throw new Error('SMTP connection failed!');
    }
  
    console.log(`✅ Email successfully sent to: ${emailData.to}`);
    return { messageId: `msg_${Date.now()}`, status: 'sent' };
}

// Create Email Worker
const emailWorker = new Worker(
  process.env.EMAIL_QUEUE,
  async (job) => {
    console.log(`\n🚀 Email Worker Job Processing Started: ${job.id}`);
    console.log(`Job Data:`, job.data);
    
    const result = await sendEmail(job.data);
    return result;
  },
  { 
    connection,
    concurrency: 3, // Can process 3 jobs at a time
    limiter: {
      max: 5, // Maximum 5 jobs per second
      duration: 1000,
    }
  }
);

// Event Listeners
emailWorker.on('completed', (job, result) => {
  console.log(`✅ Job ${job.id} completed! Result:`, result);
});

emailWorker.on('failed', (job, error) => {
  console.error(`❌ Job ${job.id} failed! Error:`, error.message);
  if (job.attemptsMade < job.opts.attempts) {
    console.log(`🔄 Retrying (${job.attemptsMade}/${job.opts.attempts})`);
  }
});

emailWorker.on('error', (error) => {
  console.error('Worker Error:', error);
});

emailWorker.on('active', (job) => {
  console.log(`🔄 Job ${job.id} is now active`);
});

emailWorker.on('stalled', (job) => {
  console.log(`⚠️ Job ${job.id} stalled`);
});

emailWorker.on('drained', () => {
  console.log('📧 Email queue drained (no active jobs)');
});

// Start worker
console.log('📧 Email Worker started...');

// Graceful shutdown
const closeWorker = async () => {
  await emailWorker.close();
  if (connection && connection.quit) {
    await connection.quit();
  }
  console.log('📧 Email Worker closed');
};

process.on('SIGTERM', closeWorker);
process.on('SIGINT', closeWorker);