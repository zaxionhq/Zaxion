import { Worker } from "bullmq";
import env from "../config/env.js";
import { PrAnalysisService } from "../services/prAnalysis.service.js";

// Ensure Redis URL is available
const redisUrl = env.get("REDIS_URL");

const analysisService = new PrAnalysisService();

/**
 * Process a PR Analysis Job
 */
async function analyzePullRequest(data) {
  await analysisService.execute(data);
}

export const initPrAnalysisWorker = () => {
  try {
    const worker = new Worker(
      "pr-analysis",
      async (job) => {
        await analyzePullRequest(job.data);
      },
      {
        connection: {
          url: redisUrl,
        },
        concurrency: 5, // Process up to 5 PRs concurrently
      }
    );

    worker.on("completed", (job) => {
      console.log(`[Worker] Job ${job.id} completed`);
    });

    worker.on("failed", (job, err) => {
      console.error(`[Worker] Job ${job.id} failed: ${err.message}`);
    });
    
    return worker;
  } catch (err) {
    console.error("Failed to create PR Analysis Worker (likely Redis missing). PR Gate will not function via Queue.", err.message);
    // Don't throw, just log. This allows app to start even if Worker fails.
    return null; 
  }
};
