// src/server.js
import env from "./config/env.js";
import sequelize from "./config/sequelize.js";
import logger from "./logger.js";
import { initDb } from "./models/index.js"; // Import initDb function

// Initialize DB and get the db object
const db = await initDb();
// console.log('server.js: db object initialized. db.User:', db.User ? 'defined' : 'undefined', 'db.RefreshToken:', db.RefreshToken ? 'defined' : 'undefined');

// Dynamically import app *after* db is loaded, and pass db to it
const { default: createApp } = await import("./app.js");
const app = createApp(db); // Pass the initialized db to the app factory

// Parse command line arguments for port
const args = process.argv.slice(2);
let portArg;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port' && i + 1 < args.length) {
    portArg = parseInt(args[i + 1], 10);
    break;
  }
}

const PORT = portArg || env.PORT || 5001;
const NODE_ENV = env.NODE_ENV;

// Minimal, non-sensitive env check
const pwd = env.get("DB_PASSWORD") ? `set (len=${env.get("DB_PASSWORD").length})` : "not set";
logger.info({ env: { PORT: env.get("PORT"), NODE_ENV: env.NODE_ENV, DB_USER: env.get("DB_USER"), DB_PASSWORD: pwd, DB_NAME: env.get("DB_NAME"), DB_HOST: env.get("DB_HOST"), DB_PORT: env.get("DB_PORT"), DB_DIALECT: env.get("DB_DIALECT") } }, "ENV CHECK");

// Removed telemetry initialization
// initTelemetry();

async function assertDatabaseConnectionOk() {
  // Guard DB bootstrap in CI mode
  if (env.APP_MODE === "ci") {
    console.log("⏩ CI mode detected: Skipping DB authentication check");
    return;
  }

  try {
    // Test DB connection
    await db.sequelize.authenticate();
    console.log("✅ DB connection authenticated");

    // In dev only, sync models for convenience. In production, use migrations.
    if (NODE_ENV !== "production") {
      // In development, we allow schema alterations to match model changes.
      await db.sequelize.sync({ force: false, alter: true });
      console.log("✅ Sequelize sync completed (dev mode with alter:true)");
    }
  } catch (error) {
    logger.error({ error }, "Unable to connect to the database:");
    process.exit(1);
  }
  // console.log("✅ Database connection check (temporarily skipped)");
}

function shutdown(server) {
  logger.info("Shutting down gracefully...");
  server.close(async (err) => {
    if (err) {
      logger.error({ err }, "Error during server shutdown");
      process.exit(1);
    }
    logger.info("HTTP server closed.");
    try {
      await db.sequelize.close(); 
      logger.info("Database connection closed.");
      process.exit(0);
    } catch (dbError) {
      logger.error({ dbError }, "Error closing database connection");
      process.exit(1);
    }
  });
}

import { initPrAnalysisWorker } from "./workers/prAnalysis.worker.js";

async function startServer() {
  await assertDatabaseConnectionOk();

  // Initialize PR Analysis Worker (PR Gate)
  try {
    initPrAnalysisWorker();
    console.log("✅ PR Analysis Worker initialized");
  } catch (err) {
    logger.error({ err }, "Failed to initialize PR Analysis Worker");
    // We don't exit process here, as API should still work even if worker fails (though Gate is down)
  }

  const server = app.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT} (env: ${NODE_ENV})`);
  });

  process.on("SIGTERM", () => shutdown(server));
  process.on("SIGINT", () => shutdown(server));
}

startServer();
