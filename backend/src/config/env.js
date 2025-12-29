// src/config/env.js
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from repo root backend/.env (development convenience)
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Initialize environment: validate env. Kept simple and synchronous — secrets should be provided
// to the process via platform environment variables (Render/Vercel) or a local .env.
export function init() {
  // Validate env immediately. In production the process should be started with correct vars.
  const parsedNow = schema.safeParse(process.env);
  if (!parsedNow.success) {
    const errs = parsedNow.error.format();
    if ((process.env.NODE_ENV || "development") === "production") {
      console.error("Env validation failed:", errs);
      throw new Error("Missing or invalid environment variables");
    }
    console.warn("[config/env] Warning: env validation issues:", errs);
  }
}

const schema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.string().optional(),
  DB_NAME: z.string(),
  APP_DB_USER: z.string(),
  APP_DB_PASSWORD: z.string(),
  DB_HOST: z.string(),
  DB_PORT: z.string().optional(),
  DB_DIALECT: z.string().optional().default("postgres"),
  DATABASE_URL: z.string().optional(),
  FRONTEND_URL: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_REDIRECT_URI: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  JWT_SECRETS: z.string().optional(),
  JWT_REFRESH_TTL: z.string().optional().default("7d"),
  TOKEN_ENCRYPTION_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(), // Added Gemini API Key
  LOCAL_DB_HOST: z.string().optional(), // Added for local development
  GITHUB_WEBHOOK_SECRET: z.string().optional(), // Added for PR Gate
  REDIS_URL: z.string().optional().default("redis://localhost:6379"), // Added for BullMQ
  GITHUB_TOKEN: z.string().optional(), // Added for PR Gate
  GITHUB_APP_ID: z.string().optional(), // Phase 2: GitHub App
  GITHUB_PRIVATE_KEY: z.string().optional(), // Phase 2: GitHub App
  GITHUB_PRIVATE_KEY_PATH: z.string().optional(), // Phase 2: GitHub App (Cleaner approach)
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const errs = parsed.error.format();
  if ((process.env.NODE_ENV || "development") === "production") {
    console.error("Env validation failed:", errs);
    throw new Error("Missing or invalid environment variables");
  }
  console.warn("[config/env] Warning: env validation issues:", errs);
}

// Dynamically set DB_HOST based on NODE_ENV for local development
const effectiveDbHost = 
  (process.env.NODE_ENV || "development") === "development" && process.env.LOCAL_DB_HOST
    ? process.env.LOCAL_DB_HOST
    : process.env.DB_HOST;

const env = {
  NODE_ENV: (process.env.NODE_ENV || "development"),
  get: (k) => {
    if (k === "DB_HOST") {
      return effectiveDbHost;
    }
    // Special handling for DATABASE_URL for local development
    if (k === "DATABASE_URL") {
      // Construct DATABASE_URL using the effective DB_HOST and other DB vars
      const user = process.env.APP_DB_USER;
      const password = process.env.APP_DB_PASSWORD;
      const host = effectiveDbHost;
      const port = process.env.DB_PORT;
      const name = process.env.DB_NAME;
      if (!user || !password || !host || !port || !name) {
        return undefined; // Return undefined if any critical component is missing
      }
      return `postgres://${user}:${password}@${host}:${port}/${name}`;
    }
    return process.env[k];
  },
  all: process.env,
};

export default env;
