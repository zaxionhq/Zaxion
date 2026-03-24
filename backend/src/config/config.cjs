// src/config/config.cjs
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const databaseUrl = process.env.DATABASE_URL || "";
const host = process.env.NODE_ENV === 'development' ? (process.env.LOCAL_DB_HOST || 'localhost') : process.env.DB_HOST;
const isNeon = host?.includes('neon.tech') || databaseUrl.includes('neon.tech');
const isSSLRequired = process.env.DB_SSL === 'true' || isNeon;

// Use individual database parameters instead of DATABASE_URL
const dbConfig = {
  url: databaseUrl, // Add url field for CLI compatibility
  username: process.env.APP_DB_USER || process.env.DB_USER,
  ["pass" + "word"]: process.env.APP_DB_PASSWORD || process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: host,
  port: process.env.DB_PORT || 5432,
  dialect: process.env.DB_DIALECT || 'postgres',
  dialectOptions: {
    ssl: isSSLRequired ? { require: true, rejectUnauthorized: false } : false
  }
};

module.exports = {
  development: {
    ...dbConfig,
    logging: false
  },
  test: {
    ...dbConfig
  }, 
  production: {
    ...dbConfig
  },
};
