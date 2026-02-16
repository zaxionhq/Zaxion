// src/server.js
log("🚀 [BOOTSTRAP] Zaxion server starting...");

import env from "./config/env.js";
import sequelize from "./config/sequelize.js";
import { log, error as logError, warn } from "./utils/logger.js";
import { initDb } from "./models/index.js"; // Import initDb function

log("📦 [BOOTSTRAP] Imports completed. Initializing database...");

// Initialize DB and get the db object
const db = await initDb();
log("✅ [BOOTSTRAP] Database initialized (models loaded)");

// Dynamically import app *after* db is loaded, and pass db to it
const { default: createApp } = await import("./app.js");
const app = createApp(db); // Pass the initialized db to the app factory
log("✅ [BOOTSTRAP] Express application created");

// Parse command line arguments for port
const args = process.argv.slice(2);
let portArg;
for (let i = 0; i < args.length; i++) {
  if (args.at(i) === '--port' && i + 1 < args.length) {
    portArg = parseInt(args.at(i + 1), 10);
    break;
  }
}

const PORT = portArg || env.PORT || 5001;
const NODE_ENV = env.NODE_ENV;

// Minimal, non-sensitive env check
const pwd = env.get("DB_PASSWORD") ? `set (len=${env.get("DB_PASSWORD").length})` : "not set";
log(`[ENV CHECK] PORT: ${env.get("PORT")}, NODE_ENV: ${env.NODE_ENV}, DB_USER: ${env.get("DB_USER")}, DB_PASSWORD: ${pwd}, DB_NAME: ${env.get("DB_NAME")}, DB_HOST: ${env.get("DB_HOST")}, DB_PORT: ${env.get("DB_PORT")}, DB_DIALECT: ${env.get("DB_DIALECT")}`);

// Removed telemetry initialization
// initTelemetry();

async function assertDatabaseConnectionOk() {
  log("🔍 [DB] Checking connection...");
  // Guard DB bootstrap in CI mode
  if (env.APP_MODE === "ci") {
    log("⏩ CI mode detected: Skipping DB authentication check");
    return;
  }

  const MAX_RETRIES = 5;
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      // Test DB connection
      await db.sequelize.authenticate();
      log("✅ DB connection authenticated");
      
      // In dev only, sync models for convenience. In production, use migrations.
      if (NODE_ENV !== "production") {
        await db.sequelize.sync({ force: false, alter: false });
        log("✅ Sequelize sync completed (dev mode)");
      }
      return; // Success!
    } catch (err) {
      retries++;
      warn(`⚠️ DB connection attempt ${retries}/${MAX_RETRIES} failed. Retrying in 5s...`, { error: err.message });
      if (retries >= MAX_RETRIES) {
        logError("❌ Unable to connect to the database after maximum retries:", err);
        process.exit(1);
      }
      // Wait 5 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

function shutdown(server) {
  log("Shutting down gracefully...");
  server.close(async (err) => {
    if (err) {
      logError("Error during server shutdown", err);
      process.exit(1);
    }
    log("HTTP server closed.");
    try {
      await db.sequelize.close(); 
      log("Database connection closed.");
      process.exit(0);
    } catch (dbError) {
      logError("Error closing database connection", dbError);
      process.exit(1);
    }
  });
}

import { initPrAnalysisWorker } from "./workers/prAnalysis.worker.js";
import "./workers/email.worker.js"; // Start email worker

async function startServer() {
  log("🚀 [SERVER] Starting bootstrap sequence...");
  await assertDatabaseConnectionOk();

  // Initialize PR Analysis Worker (PR Gate)
  log("⚙️ [WORKER] Initializing PR Analysis Worker...");
  try {
    initPrAnalysisWorker();
    log("✅ [WORKER] PR Analysis Worker initialized");
  } catch (err) {
    logError("❌ [WORKER] Failed to initialize PR Analysis Worker", err);
    // We don't exit process here, as API should still work even if worker fails (though Gate is down)
  }

  log(`🌐 [SERVER] Starting HTTP listener on port: ${PORT}`);
  const server = app.listen(PORT, () => {
    log(`🚀 [SERVER] Zaxion Protocol LIVE on http://localhost:${PORT} (env: ${NODE_ENV})`);
  });

  process.on("SIGTERM", () => shutdown(server));
  process.on("SIGINT", () => shutdown(server));
}

startServer();
