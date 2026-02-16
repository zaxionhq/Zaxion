import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import env from '../config/env.js';
import { emailService } from '../services/email.service.js';
import { log, warn, error } from '../utils/logger.js';

// Reuse the Redis connection string
const connection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null, // Required by BullMQ
});

// Define the worker
export const emailWorker = new Worker('email-queue', async (job) => {
  const { email } = job.data;
  const startTime = Date.now();

  log(`[EmailWorker] Processing job ${job.id}: ${email}`);

  try {
    // Call the email service (which handles SMTP timeouts)
    await emailService.sendWaitlistWelcome(email);

    const duration = Date.now() - startTime;
    log(`[EmailWorker] Job completed ${job.id}: ${email} in ${duration}ms`);
    return { success: true, duration };
  } catch (err) {
    const duration = Date.now() - startTime;
    error(`[EmailWorker] Job failed ${job.id}: ${email} in ${duration}ms`, err);
    throw err; // Re-throw to trigger BullMQ retry logic
  }
}, { connection });

// Global event listeners for monitoring
emailWorker.on('completed', (job) => {
  log(`[EmailWorker:Event] Job ${job.id} has completed!`);
});

emailWorker.on('failed', (job, err) => {
  warn(`[EmailWorker:Event] Job ${job.id} has failed with ${err.message}`);
});
