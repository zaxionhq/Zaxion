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

export const checkNetwork = async (req, res) => {
  const host = env.SMTP_HOST || 'smtp.gmail.com';
  const port = 465; // Checking the SSL port
  
  const results = {
    target: { host, port },
    dns: null,
    tcp: null,
    env: {
      SMTP_HOST: env.SMTP_HOST,
      SMTP_USER_CONFIGURED: !!env.SMTP_USER,
      SMTP_PASS_CONFIGURED: !!env.SMTP_PASS ? 'YES (Length: ' + env.SMTP_PASS.length + ')' : 'NO'
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
    
    // 2. TCP Connection Test
    if (addresses && addresses.length > 0) {
      const ip = addresses[0];
      const start = Date.now();
      
      await new Promise((resolve, reject) => {
        const socket = new net.Socket();
        socket.setTimeout(5000); // 5s timeout for raw TCP
        
        socket.on('connect', () => {
          const time = Date.now() - start;
          results.tcp = { success: true, ip, time: `${time}ms`, message: 'Port is OPEN' };
          socket.destroy();
          resolve();
        });
        
        socket.on('timeout', () => {
          socket.destroy();
          reject(new Error('TCP Connection Timeout (5000ms)'));
        });
        
        socket.on('error', (err) => {
          socket.destroy();
          reject(err);
        });
        
        socket.connect(port, ip);
      });
    }
  } catch (error) {
    if (!results.dns) results.dns = { success: false, error: error.message };
    else if (!results.tcp) results.tcp = { success: false, error: error.message };
  }
  
  res.json(results);
};
