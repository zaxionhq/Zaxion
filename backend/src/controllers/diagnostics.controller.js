import { emailService } from "../services/email.service.js";
import { emailWorker } from "../workers/email.worker.js";
import { Queue } from "bullmq";
import IORedis from "ioredis";
import env from "../config/env.js";
import dns from "node:dns";
import net from "node:net";

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

    // Get completed jobs to verify success
    const completedJobs = await emailQueue.getCompleted(0, 5);
    const completedList = completedJobs.map(job => ({
      id: job.id,
      finishedOn: job.finishedOn,
      returnvalue: job.returnvalue
    }));

    return res.json({
      success: true,
      counts,
      workerStatus: emailWorker.isRunning() ? 'Running' : 'Stopped',
      failedJobs: failedReasons,
      completedJobs: completedList
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

export const cleanQueue = async (req, res) => {
  try {
    await emailQueue.obliterate({ force: true });
    return res.json({ success: true, message: "Queue obliterated. All jobs removed." });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const checkNetwork = async (req, res) => {
  // Check connectivity to Resend API
  const host = 'api.resend.com';
  
  const results = {
    target: host,
    dns: null,
    tcp: {
      port443: null, // HTTPS
    },
    env: {
      RESEND_API_KEY_CONFIGURED: env.RESEND_API_KEY ? 'YES' : 'NO'
    }
  };

  try {
    // 1. DNS Lookup
    const addresses = await new Promise((resolve, reject) => {
      dns.resolve4(host, (err, addresses) => {
        if (err) reject(err);
        else resolve(addresses);
      });
    });
    results.dns = { success: true, addresses };
    
    // Helper function to test TCP connection
    const testPort = (port, ip) => {
      return new Promise((resolve) => {
        const start = Date.now();
        const socket = new net.Socket();
        socket.setTimeout(5000); // 5s timeout
        
        socket.on('connect', () => {
          const time = Date.now() - start;
          socket.destroy();
          resolve({ success: true, time: `${time}ms`, message: 'OPEN' });
        });
        
        socket.on('timeout', () => {
          socket.destroy();
          resolve({ success: false, error: 'TIMEOUT' });
        });
        
        socket.on('error', (err) => {
          socket.destroy();
          resolve({ success: false, error: err.message });
        });
        
        socket.connect(port, ip);
      });
    };

    // 2. TCP Connection Tests
    if (addresses && addresses.length > 0) {
      const ip = addresses[0];
      
      // Test Port 443 (HTTPS) - Critical for Resend
      results.tcp.port443 = await testPort(443, ip);
    }
  } catch (error) {
    if (!results.dns) results.dns = { success: false, error: error.message };
  }
  
  return res.json(results);
};
