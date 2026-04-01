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
  APP_MODE: z.enum(["ci", "dev", "prod", "production"]).default("dev"),
  PORT: z.coerce.number().default(5000),

  // --- Database ---
  DB_NAME: z.string().optional(),
  DB_USER: z.string().optional(),
  DB_PASSWORD: z.string().optional(),
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
  
  // LLM Providers
  LLM_PROVIDER: z.enum(["gemini", "claude", "nvidia", "openrouter"]).default("gemini"),
  GEMINI_API_KEY: z.string().optional(),
  CLAUDE_API_KEY: z.string().optional(),
  NVIDIA_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),

  // LLM Model Names
  GEMINI_MODEL: z.string().default("gemini-1.5-flash"),
  CLAUDE_MODEL: z.string().default("claude-3-5-sonnet-20240620"),
  NVIDIA_MODEL: z.string().default("meta/llama-3.1-405b-instruct"),
  
  REDIS_URL: z.string().default("redis://localhost:6379"),

  // --- GitHub App ---
  GITHUB_APP_ID: z.string().optional(),
  GITHUB_PRIVATE_KEY: z.string().optional(),
  GITHUB_PRIVATE_KEY_PATH: z.string().optional(),
  GITHUB_WEBHOOK_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_REDIRECT_URI: z.string().optional(),
  GITHUB_API_URL: z.string().default("https://api.github.com"),
  GITHUB_CHECK_NAME: z.string().default("Zaxion Governance"),

  // --- Resend Email Configuration ---
  RESEND_API_KEY: z.string().optional(),
  // Default to Resend's testing domain if no custom domain is configured
  EMAIL_FROM: z.string().default("founder@zaxion.dev"),

  // --- Founder / Admin ---
  FOUNDER_GITHUB_USERNAME: z.string().default("Kaandizz"),
})
.superRefine((env, ctx) => {
  // DB is required only in non-test environments
  if (env.NODE_ENV !== "test") {
    // If DATABASE_URL is not provided, we must have individual fields
    if (!env.DATABASE_URL) {
      const dbUser = env.APP_DB_USER || env.DB_USER;
      const dbPass = env.APP_DB_PASSWORD || env.DB_PASSWORD;
      if (!env.DB_NAME) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["DB_NAME"], message: "Required if DATABASE_URL is missing" });
      if (!dbUser) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["APP_DB_USER"], message: "Required if DATABASE_URL is missing" });
      if (!dbPass) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["APP_DB_PASSWORD"], message: "Required if DATABASE_URL is missing" });
      if (!env.DB_HOST) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["DB_HOST"], message: "Required if DATABASE_URL is missing" });
    }
  }
})
.transform((env) => {
  const isDev = env.NODE_ENV === "development";
  const effectiveDbHost = (isDev && env.LOCAL_DB_HOST) ? env.LOCAL_DB_HOST : env.DB_HOST;
  const effectiveDbUser = env.APP_DB_USER || env.DB_USER;
  const effectiveDbPass = env.APP_DB_PASSWORD || env.DB_PASSWORD;
  
  return {
    ...env,
    DB_HOST: effectiveDbHost,
    DB_USER: effectiveDbUser,
    DB_PASSWORD: effectiveDbPass,
    DATABASE_URL: env.DATABASE_URL ?? (
      (effectiveDbUser && effectiveDbPass && effectiveDbHost && env.DB_NAME) 
        ? `postgres://${effectiveDbUser}:${effectiveDbPass}@${effectiveDbHost}:${env.DB_PORT}/${env.DB_NAME}`
        : undefined
    )
  };
});

// 1. Parse and Validate
const parsed = schema.safeParse(process.env);

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
    return data[k] || process.env[k];
  },
};

export default env;
