
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import env from '../src/config/env.js';
import { log, error } from '../src/utils/logger.js';

async function cleanQueue() {
  log("🧹 [CleanQueue] Connecting to Redis...");
  
  if (!env.REDIS_URL) {
    error("❌ REDIS_URL is missing in environment variables.");
    process.exit(1);
  }

  const connection = new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
  });

  const emailQueue = new Queue('email-queue', { connection });

  try {
    log("🔥 [CleanQueue] Obliterating 'email-queue'...");
    await emailQueue.obliterate({ force: true });
    log("✅ [CleanQueue] Queue successfully cleared! All jobs removed.");
  } catch (err) {
    error("❌ [CleanQueue] Failed to clear queue:", err);
  } finally {
    await emailQueue.close();
    await connection.quit();
    log("👋 [CleanQueue] Disconnected.");
  }
}

cleanQueue();
