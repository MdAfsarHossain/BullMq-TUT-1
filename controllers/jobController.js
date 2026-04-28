const { emailQueue, reportQueue } = require("../queues/queueConfig");
const { v4: uuidv4 } = require("uuid");

// Email job add function
const addEmailJob = async (req, res) => {
  try {
    const { to, subject, body, priority = 3 } = req.body;

    // Validation
    if (!to || !subject || !body) {
      return res.status(400).json({
        success: false,
        message: "to, subject, body all fields are required",
      });
    }

    // Job options configuration
    const jobOptions = {
      priority: priority, // 1 = highest, 5 = lowest
      delay: req.body.delay || 0, // delay in milliseconds
      jobId: uuidv4(), // unique id
    };

    // Add job to queue
    const job = await emailQueue.add(
      "send-email",
      {
        to,
        subject,
        body,
        userId: req.ip,
        timestamp: new Date().toISOString(),
      },
      jobOptions,
    );

    res.status(201).json({
      success: true,
      message: "Email job added to queue",
      jobId: job.id,
      status: "pending",
    });
  } catch (error) {
    console.error("Failed to add job:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Report job add function
const addReportJob = async (req, res) => {
  try {
    const { reportType, userId, priority = 2 } = req.body;

    if (!reportType || !userId) {
      return res.status(400).json({
        success: false,
        message: "reportType and userId required",
      });
    }

    const jobOptions = {
      priority: priority,
      delay: req.body.delay || 0,
    };

    const job = await reportQueue.add(
      "generate-report",
      {
        reportType,
        userId,
        parameters: req.body.parameters || {},
        timestamp: new Date().toISOString(),
      },
      jobOptions,
    );

    res.status(201).json({
      success: true,
      message: "Report job added to queue",
      jobId: job.id,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Job status check function
const getJobStatus = async (req, res) => {
  try {
    const { queueName, jobId } = req.params;
    const queue = queueName === "email" ? emailQueue : reportQueue;

    const job = await queue.getJob(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    const state = await job.getState();
    const progress = job.progress;
    const result = job.returnvalue;
    const failedReason = job.failedReason;

    res.json({
      success: true,
      jobId: job.id,
      state: state, // waiting, active, completed, failed
      progress: progress,
      result: result,
      failedReason: failedReason,
      attemptsMade: job.attemptsMade,
      timestamp: job.timestamp,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// All jobs list function
const getAllJobs = async (req, res) => {
  try {
    const { queueName, status = "waiting" } = req.params;
    console.log(req.params);
    
    const queue = queueName === "email" ? emailQueue : reportQueue;

    let jobs;
    switch (status) {
      case "waiting":
        jobs = await queue.getWaiting();
        break;
      case "active":
        jobs = await queue.getActive();
        break;
      case "completed":
        jobs = await queue.getCompleted();
        break;
      case "failed":
        jobs = await queue.getFailed();
        break;
      default:
        jobs = await queue.getWaiting();
    }

    const jobSummaries = jobs.map((job) => ({
      id: job.id,
      name: job.name,
      data: job.data,
      state: status,
      timestamp: job.timestamp,
      attemptsMade: job.attemptsMade,
    }));

    res.json({
      success: true,
      count: jobSummaries.length,
      jobs: jobSummaries,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Queue clean function
const cleanQueue = async (req, res) => {
  try {
    const { queueName } = req.params;
    const queue = queueName === "email" ? emailQueue : reportQueue;

    await queue.clean(0, 0, "completed"); // Remove all completed jobs
    await queue.clean(0, 0, "failed"); // Remove all failed jobs

    res.json({
      success: true,
      message: `${queueName} queue cleaned`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// export const JobController = {
//   addEmailJob,
//   addReportJob,
//   getJobStatus,
//   getAllJobs,
//   cleanQueue,
// };


module.exports = {
  addEmailJob,
  addReportJob,
  getJobStatus,
  getAllJobs,
  cleanQueue
};