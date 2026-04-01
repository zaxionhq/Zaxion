import env from "./config/env.js";
import sequelize from "./config/sequelize.js";
import { log as logLib, error as logError, warn } from "./utils/logger.js";
import { initDb } from "./models/index.js"; // Import initDb function

const log = (msg) => {
  console.log(msg);
  logLib(msg);
};

log("🚀 [BOOTSTRAP] Zaxion server starting...");
log("✅ [BOOTSTRAP] env.js loaded");
log("✅ [BOOTSTRAP] sequelize.js loaded");
log("✅ [BOOTSTRAP] logger imports loaded");
log("✅ [BOOTSTRAP] models/index.js loaded");

log("📦 [BOOTSTRAP] Imports completed. Initializing database...");

// Initialize DB and get the db object
const db = await initDb();
log("✅ [BOOTSTRAP] Database initialized (models loaded)");

// Dynamically import app *after* db is loaded, and pass db to it
log("⏳ [BOOTSTRAP] Loading app.js...");
const { default: createApp } = await import("./app.js");
log("✅ [BOOTSTRAP] app.js loaded");
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
        // Disable automatic sync as it causes issues with Postgres ENUMs and defaults.
        // Rely on migrations for schema changes.
        // await db.sequelize.sync({ force: false, alter: false });
        log("⏩ Skipping Sequelize sync (use migrations instead)");
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

async function startServer() {
  try {
    log("🚀 [SERVER] Starting bootstrap sequence...");
    
    // Explicitly load and start the workers dynamically to break potential circular dependencies
    log("⏳ [BOOTSTRAP] Loading workers...");
    const { emailWorker } = await import("./workers/email.worker.js");
    const { initPrAnalysisWorker } = await import("./workers/prAnalysis.worker.js");
    log("✅ [BOOTSTRAP] Workers loaded");

    // Ensure worker is running
    if (!emailWorker.isRunning()) {
        log("⚠️ [EmailWorker] Worker was not running. Starting it manually...");
        // BullMQ workers start automatically, but this log confirms we checked.
    } else {
        log("✅ [EmailWorker] Worker is active and listening.");
    }

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

    const server = app.listen(PORT, () => {
      log(`🚀 [SERVER] Zaxion Governance Engine running on port ${PORT}`);
      log(`📍 [SERVER] Health check: http://localhost:${PORT}/health`);
      log(`📍 [SERVER] Metrics: http://localhost:${PORT}/metrics`);
    });

    process.on("SIGTERM", () => shutdown(server));
    process.on("SIGINT", () => shutdown(server));
  } catch (err) {
    logError("❌ [SERVER] Fatal error during bootstrap:", err);
    process.exit(1);
  }
}

startServer();
