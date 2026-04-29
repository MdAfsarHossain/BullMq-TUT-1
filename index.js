const express = require('express');
const cors = require('cors');
require('dotenv').config();

const {
  addEmailJob,
  addReportJob,
  getJobStatus,
  getAllJobs,
  cleanQueue
} = require('./controllers/jobController');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging Middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Home Route
app.get('/', (req, res) => {
  res.json({
    name: 'BullMQ Testing API',
    version: '1.0.0',
    endpoints: {
      'POST /api/email/send': 'Add email sending job',
      'POST /api/report/generate': 'Add report generating job',
      'GET /api/job/:queueName/:jobId': 'Check job status',
      'GET /api/jobs/:queueName/:status': 'Check all jobs in queue (waiting/active/completed/failed)',
      'DELETE /api/queue/:queueName/clean': 'Clean queue',
      'GET /api/health': 'Health check'
    },
    examples: {
      send_email: {
        method: 'POST',
        url: '/api/email/send',
        body: {
          to: 'user@example.com',
          subject: 'Welcome',
          body: 'Thank you for being with us!',
          priority: 1
        }
      },
      generate_report: {
        method: 'POST',
        url: '/api/report/generate',
        body: {
          reportType: 'sales_report',
          userId: 'user_123',
          priority: 2
        }
      }
    }
  });
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    redis: 'Connected',
    bullmq: 'Running'
  });
});


// Email endpoint
app.post('/api/email/send', addEmailJob);

// Report endpoint
app.post('/api/report/generate', addReportJob);

// Job status endpoint
app.get('/api/job/:queueName/:jobId', getJobStatus);

// All jobs
// app.get('/api/jobs/:queueName/:status?', getAllJobs);
app.get('/api/jobs/:queueName/:status', getAllJobs);

// Queue clean
app.delete('/api/queue/:queueName/clean', cleanQueue);


// 404 Handler
// app.use('*', (req, res) => {
//   res.status(404).json({
//     success: false,
//     message: 'Endpoint not found'
//   });
// });

// Error Handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Server Error!',
    error: err.message
  });
});

// Server Start
app.listen(PORT, () => {
  console.log(`
  ═══════════════════════════════════════════════
  🚀 BullMQ Server Running
  📡 Port: ${PORT}
  🌐 URL: http://localhost:${PORT}
  
  📧 Email Worker: npm run worker:email
  📊 Report Worker: npm run worker:report
  
  🧪 Test Example:
  curl -X POST http://localhost:${PORT}/api/email/send \
    -H "Content-Type: application/json" \
    -d '{"to":"test@example.com","subject":"Test","body":"Hello"}'
  ═══════════════════════════════════════════════
  `);
});

// afsarhossain@afsarhossain-MS-7D48:~/AfsarHossain/Dec25/bullMQ-tut-1$ npm run worker:email