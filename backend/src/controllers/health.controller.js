import axios from "axios";
import { prAnalysisQueue } from "../queues/prAnalysis.queue.js";

/**
 * Helper to wrap a promise with a timeout
 * @param {Promise} promise 
 * @param {number} ms 
 * @param {string} label 
 */
const withTimeout = (promise, ms, label) => {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout: ${label} check took longer than ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
};

/**
 * Liveness probe
 * /health -> always 200 if process is alive
 */
export const health = (req, res) => {
  res.status(200).json({
    status: "UP",
    timestamp: new Date().toISOString(),
  });
};

/**
 * Readiness probe
 * /ready -> checks DB, Redis, GitHub (with timeouts)
 */
export const ready = async (req, res) => {
  const db = req.app.locals.db;
  const READY_TIMEOUT = 3000; // 3 seconds max for each check

  const results = {
    status: "UP",
    timestamp: new Date().toISOString(),
    details: {},
  };

  const checks = {
    database: false,
    redis: false,
    github: false,
  };

  // 1. Database Check (Critical)
  try {
    await withTimeout(db.sequelize.authenticate(), READY_TIMEOUT, "Database");
    checks.database = true;
    results.details.database = { status: "OK" };
  } catch (err) {
    results.details.database = { status: "DOWN", error: err.message };
  }

  // 2. Redis Check (Critical)
  try {
    if (prAnalysisQueue) {
      const client = await prAnalysisQueue.client;
      await withTimeout(
        new Promise((resolve, reject) => {
          if (client.status === "ready" || client.status === "connect") resolve();
          else reject(new Error(`Redis client status: ${client.status}`));
        }),
        READY_TIMEOUT,
        "Redis"
      );
      checks.redis = true;
      results.details.redis = { status: "OK" };
    } else {
      results.details.redis = { status: "DOWN", reason: "Queue not initialized" };
    }
  } catch (err) {
    results.details.redis = { status: "DOWN", error: err.message };
  }

  // 3. GitHub Check (Soft Gate - Option A)
  try {
    // Ping GitHub API root
    const response = await axios.get("https://api.github.com", { timeout: READY_TIMEOUT });
    if (response.status === 200) {
      checks.github = true;
      results.details.github = { status: "OK" };
    } else {
      results.details.github = { status: "DEGRADED", code: response.status };
    }
  } catch (err) {
    // Soft failure for GitHub - mark as DEGRADED but don't fail the whole probe
    results.details.github = { status: "DEGRADED", error: err.message };
    checks.github = true; // Mark as "passed" for the final status check
  }

  // Aggregate Status (Only DB and Redis are hard gates)
  if (!checks.database || !checks.redis) {
    results.status = "DOWN";
    return res.status(503).json(results);
  }

  // If GitHub is degraded, we still return 200 but keep results.status as "DEGRADED" if preferred, 
  // but usually "UP" with details is better for load balancers.
  if (results.details.github.status === "DEGRADED") {
    results.status = "DEGRADED";
  }

  res.status(200).json(results);
};
