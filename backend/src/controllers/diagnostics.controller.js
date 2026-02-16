import { emailService } from "../services/email.service.js";
import { emailWorker } from "../workers/email.worker.js";
import { Queue } from "bullmq";
import IORedis from "ioredis";
import env from "../config/env.js";

// Re-create queue instance to inspect it (since we didn't export it from worker)
const emailQueue = new Queue('email-queue', {
  connection: new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null })
});

export const getQueueStatus = async (req, res) => {
  try {
    const counts = await emailQueue.getJobCounts(
      'wait', 
      'active', 
      'completed', 
      'failed', 
      'delayed'
    );
    
    // Get failed jobs to see the error reason
    const failedJobs = await emailQueue.getFailed(0, 5);
    const failedReasons = failedJobs.map(job => ({
      id: job.id,
      failedReason: job.failedReason,
      stacktrace: job.stacktrace
    }));

    return res.json({
      success: true,
      counts,
      workerStatus: emailWorker.isRunning() ? 'Running' : 'Stopped',
      failedJobs: failedReasons
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const sendTestEmail = async (req, res) => {
  const { to } = req.query;
  if (!to) return res.status(400).json({ error: "Missing 'to' query parameter" });

  try {
    await emailService.sendWaitlistWelcome(to);
    return res.json({ success: true, message: `Test email sent to ${to}` });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: error.stack 
    });
  }
};
