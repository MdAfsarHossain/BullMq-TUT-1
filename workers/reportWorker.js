const { Worker } = require('bullmq');
const { connection } = require('../queues/queueConfig');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Report generating simulation
const generateReport = async (reportData) => {
  console.log(`📊 Report generating: ${reportData.reportType}`);
  
  // Heavy processing simulation (5 seconds)
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const reportContent = {
    reportId: `rpt_${Date.now()}`,
    type: reportData.reportType,
    generatedAt: new Date().toISOString(),
    data: {
      totalUsers: Math.floor(Math.random() * 1000),
      activeUsers: Math.floor(Math.random() * 800),
      revenue: Math.floor(Math.random() * 50000),
    },
    requestedBy: reportData.userId
  };
  
  // Saving to file (example)
  const fileName = `report_${reportContent.reportId}.json`;
  const filePath = path.join(__dirname, '../reports', fileName);
  await fs.writeFile(filePath, JSON.stringify(reportContent, null, 2));
  
  console.log(`✅ Report generated: ${fileName}`);
  return reportContent;
};

// Creating Worker
const reportWorker = new Worker(
  process.env.REPORT_QUEUE,
  async (job) => {
    console.log(`\n📈 Report Worker Job Processing Started: ${job.id}`);
    console.log(`Priority: ${job.opts.priority || 'Normal'}`);
    
    const result = await generateReport(job.data);
    return result;
  },
  { 
    connection,
    concurrency: 2,
  }
);

// Event Listeners
reportWorker.on('completed', (job, result) => {
  console.log(`✅ Report job ${job.id} completed!`);
});

reportWorker.on('failed', (job, err) => {
  console.log(`❌ Report job ${job.id} failed!`);
});

console.log('📊 Report Worker started...');