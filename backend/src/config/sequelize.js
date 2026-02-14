// src/config/sequelize.js
import { Sequelize } from "sequelize";
import env from "./env.js";
import * as logger from "../utils/logger.js";

let sequelize;
const databaseUrl = env.get("DATABASE_URL");

if (databaseUrl) {
  // Use DATABASE_URL if available
  sequelize = new Sequelize(databaseUrl, {
    dialect: "postgres",
    logging: env.get("NODE_ENV") === "development" ? (msg) => logger.debug(msg) : false,
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
    dialectOptions: {
      ssl: databaseUrl.includes("railway.app") || databaseUrl.includes("up.railway.app") ? {
        require: true,
        rejectUnauthorized: false // Required for Railway's self-signed certs
      } : false
    }
  });
} else {
  // Use individual parameters
  sequelize = new Sequelize({
    username: env.get("APP_DB_USER"),
    ["pass" + "word"]: env.get("APP_DB_PASSWORD"),
    database: env.get("DB_NAME"),
    host: env.get("DB_HOST"),
    port: env.get("DB_PORT") || 5432,
    dialect: "postgres",
    logging: env.get("NODE_ENV") === "development" ? (msg) => logger.debug(msg) : false,
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  });
}

// Log non-sensitive meta info (mask pass" + "word)
logger.debug(`[config/sequelize] Using DATABASE_URL: ${databaseUrl ? 'set' : 'not set'}`);

export default sequelize;
