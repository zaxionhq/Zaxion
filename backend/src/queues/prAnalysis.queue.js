import { Queue } from "bullmq";
import env from "../config/env.js";
import * as logger from "../utils/logger.js";

// Ensure we have a Redis URL
const redisUrl = env.get("REDIS_URL");

let prAnalysisQueue = null;

if (!redisUrl || redisUrl.includes("localhost")) {
  logger.warn("⚠️ No production Redis URL found. PR Analysis background jobs will be disabled.");
} else {
  try {
    // Create the Queue
    const queue = new Queue("pr-analysis", {
      connection: {
        url: redisUrl,
        // Strict connection settings to avoid crash loops
        connectTimeout: 5000,
        maxRetriesPerRequest: 1,
        retryStrategy: function(times) {
          // If we fail, don't keep trying forever in production if it's not available
          if (times > 2) {
              logger.warn("Redis connection failed. Background queue is inactive.");
              return null; 
          }
          return 1000;
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
