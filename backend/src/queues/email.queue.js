import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import env from '../config/env.js';
import { log, error } from '../utils/logger.js';

// Reuse the Redis connection string
const connection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null, // Required by BullMQ
});

export const emailQueue = new Queue('email-queue', { connection });

/**
 * Add a welcome email job to the queue
 * @param {string} email - The user's email address
 */
export const addWelcomeEmailJob = async (email) => {
  const jobId = `waitlist-welcome-${email.toLowerCase()}`;
  
  try {
    await emailQueue.add(
      'send-welcome-email', 
      { email },
      {
        jobId, // Idempotency: prevents duplicate jobs for same email
        attempts: 3, // Retry 3 times
        backoff: {
          type: 'exponential',
          delay: 1000, // 1s, 2s, 4s
        },
        removeOnComplete: true, // Keep Redis clean
        removeOnFail: false, // Keep failed jobs for inspection
      }
    );
    log(`[EmailQueue] Job added: ${jobId}`);
  } catch (err) {
    error(`[EmailQueue] Failed to add job ${jobId}:`, err);
    // Fallback: If queue fails, maybe log critical alert (but don't crash request)
  }
};
