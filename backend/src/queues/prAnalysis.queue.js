import { Queue } from "bullmq";
import env from "../config/env.js";
import * as logger from "../utils/logger.js";

// Ensure we have a Redis URL
const redisUrl = env.get("REDIS_URL");

let prAnalysisQueue = null;

try {
  // Create the Queue
  // We use a small retry strategy for the initial connection check
  const queue = new Queue("pr-analysis", {
    connection: {
      url: redisUrl,
      retryStrategy: function(times) {
        // If we fail more than 3 times, stop trying to connect to avoid spamming logs
        if (times > 3) {
            logger.warn("Redis connection failed too many times. Disabling Queue.");
            return null; // Stop retrying
        }
        return Math.min(times * 50, 2000);
      }
    },
    defaultJobOptions: {
      attempts: 3, 
      backoff: {
        type: "exponential",
        delay: 1000 
      },
      removeOnComplete: true, 
      removeOnFail: false 
    }
  });

  queue.on('error', (err) => {
      // Log only once or nicely
  });
  
  prAnalysisQueue = queue;
  
} catch (err) {
  logger.error("Failed to initialize BullMQ Queue:", err.message);
}

export { prAnalysisQueue };

/**
 * Add a job to the PR Analysis queue
 * @param {object} data - The PR context data
 */
export async function addPrAnalysisJob(data) {
  if (!prAnalysisQueue) {
    throw new Error("Queue not initialized (Redis missing?)");
  }
  // Check if queue client is ready
  try {
      return await prAnalysisQueue.add("analyze-pr", data);
  } catch (err) {
      // If adding fails (e.g. connection closed), throw so controller falls back
      throw err;
  }
}
