// src/config/env.js
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { z } from "zod";
import * as logger from "../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from repo root backend/.env (development convenience)
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

/**
 * Environment Variables Schema
 * Uses Zod for validation, type coercion, and deterministic transformations.
 */
const schema = z.object({
  // --- Core ---
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_MODE: z.enum(["ci", "dev", "prod"]).default("dev"),
  PORT: z.coerce.number().default(5000),

  // --- Database ---
  DB_NAME: z.string().optional(),
  APP_DB_USER: z.string().optional(),
  APP_DB_PASSWORD: z.string().optional(),
  DB_HOST: z.string().optional(),
  DB_PORT: z.coerce.number().default(5432),
  DB_DIALECT: z.string().default("postgres"),
  LOCAL_DB_HOST: z.string().optional(),
  DATABASE_URL: z.string().optional(),

  // --- App Secrets ---
  JWT_SECRET: z.string().optional(),
  JWT_SECRETS: z.string().optional(),
  JWT_REFRESH_TTL: z.string().default("7d"),
  TOKEN_ENCRYPTION_KEY: z.string().optional(),

  // --- External Integrations ---
  FRONTEND_URL: z.string().default("http://localhost:8080"),
  FRONTEND_ORIGIN: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  REDIS_URL: z.string().default("redis://localhost:6379"),

  // --- GitHub App ---
  GITHUB_APP_ID: z.string().optional(),
  GITHUB_PRIVATE_KEY: z.string().optional(),
  GITHUB_PRIVATE_KEY_PATH: z.string().optional(),
  GITHUB_WEBHOOK_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_REDIRECT_URI: z.string().optional(),
  GITHUB_TOKEN: z.string().optional(),

  // --- SMTP Configuration ---
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(465),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default("Zaxion Protocol <governance@zaxion.ai>"),
})
.superRefine((env, ctx) => {
  // DB is required only in non-test environments
  if (env.NODE_ENV !== "test") {
    // If DATABASE_URL is not provided, we must have individual fields
    if (!env.DATABASE_URL) {
      if (!env.DB_NAME) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["DB_NAME"], message: "Required in non-test environment if DATABASE_URL is missing" });
      if (!env.APP_DB_USER) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["APP_DB_USER"], message: "Required in non-test environment if DATABASE_URL is missing" });
      if (!env.APP_DB_PASSWORD) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["APP_DB_PASSWORD"], message: "Required in non-test environment if DATABASE_URL is missing" });
      if (!env.DB_HOST) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["DB_HOST"], message: "Required in non-test environment if DATABASE_URL is missing" });
    }
  }
})
.transform((env) => {
  const isDev = env.NODE_ENV === "development";
  const effectiveDbHost = (isDev && env.LOCAL_DB_HOST) ? env.LOCAL_DB_HOST : env.DB_HOST;
  
  return {
    ...env,
    DB_HOST: effectiveDbHost,
    DATABASE_URL: env.DATABASE_URL ?? (
      (env.APP_DB_USER && env.APP_DB_PASSWORD && effectiveDbHost && env.DB_NAME) 
        ? `postgres://${env.APP_DB_USER}:${env.APP_DB_PASSWORD}@${effectiveDbHost}:${env.DB_PORT}/${env.DB_NAME}`
        : undefined
    )
  };
});

// 1. Parse and Validate
const parsed = schema.safeParse(process.env);

// DEBUG LOG: Let's see what keys are actually present in process.env
const foundKeys = Object.keys(process.env).filter(k => !k.includes("PASS") && !k.includes("SECRET") && !k.includes("KEY"));
logger.info(`[ENV DEBUG] process.env contains ${Object.keys(process.env).length} keys. Non-sensitive keys found: ${foundKeys.join(", ")}`);

if (!parsed.success) {
  const errs = parsed.error.format();
  if ((process.env.NODE_ENV || "development") === "production") {
    logger.error("Critical: Env validation failed in production:", JSON.stringify(errs, null, 2));
    throw new Error("Missing or invalid environment variables");
  }
  logger.warn("Env validation issues found (Development):", JSON.stringify(errs, null, 2));
}

// 2. Extract Data (No partial recovery with error objects)
const data = parsed.success ? parsed.data : process.env;
const dataMap = new Map(Object.entries(data));

/**
 * Enterprise Config Export
 * Pure, deterministic, and type-safe.
 */
const env = {
  ...data,
  
  /**
   * Getter for individual keys (legacy support)
   */
  get: (k) => {
    return dataMap.get(k);
  },
};

export default env;
