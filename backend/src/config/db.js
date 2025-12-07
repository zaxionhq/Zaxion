// config/db.js
import env from "./env.js";

export default {
  username: env.get("APP_DB_USER"),
  password: env.get("APP_DB_PASSWORD"),
  database: env.get("DB_NAME"),
  host: env.get("DB_HOST"),
  port: env.get("DB_PORT") || 5432,
  dialect: "postgres",
  logging: env.get("NODE_ENV") === "development" ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};
