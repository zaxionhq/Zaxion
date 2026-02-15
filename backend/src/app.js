// src/app.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import env from "./config/env.js";
import cookieParser from "cookie-parser";
import routesFactory from "./routes/index.js"; // This will now be a factory
import * as healthController from "./controllers/health.controller.js";
import path from "path";
import { fileURLToPath } from "url";
import logger from "./logger.js";
import { log, error, warn } from "./utils/logger.js";
// import pinoHttp from "pino-http"; // Import pino-http
import crypto from "crypto"; // Import crypto for random UUID generation
import { Registry, Counter, Histogram } from 'prom-client';
import { register, httpRequestCounter, httpRequestDurationSeconds } from './utils/metrics.js';
import { generateCSRFToken, verifyCSRFToken } from './middleware/csrf.js';

export default function createApp(db) {
  const app = express();

  // Trust proxy - Essential for Railway/Vercel to get the real user IP
  // This must be set BEFORE any rate limiters are applied
  app.set('trust proxy', 1);

  // Make db accessible globally via app.locals for middlewares/routes
  app.locals.db = db;

  const FRONTEND_ORIGIN = env.FRONTEND_ORIGIN || env.FRONTEND_URL;
  const NODE_ENV = env.NODE_ENV || "development";
  const isProd = NODE_ENV === "production";

  // Security headers
  app.use(helmet());

  // CORS configuration
  app.use(cors({
    origin: function(origin, callback) {
      // Allow requests with no origin (like mobile apps, curl requests)
      if(!origin) return callback(null, true);
      
      // Check if the origin is allowed
      const allowedOrigins = [FRONTEND_ORIGIN, process.env.FRONTEND_URL, 'http://localhost:5000', 'http://localhost:8080'];
      if(allowedOrigins.indexOf(origin) !== -1 || !isProd) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token', 'x-csrf-token'],
    exposedHeaders: ['X-CSRF-Token', 'x-csrf-token'],
  }));

  // Debug CORS origin
  log(`[CORS] Frontend origin: ${FRONTEND_ORIGIN}`);

  // Global rate limiter (low frequency to avoid accidental DoS in dev)
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isProd ? 200 : 1000, // production lower, dev higher
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(globalLimiter);

  // Stricter limiter for auth-related and GitHub endpoints
  const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: isProd ? 20 : 1000,
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Very strict limiter for expensive endpoints (test execution, chatbot)
  const expensiveLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isProd ? 30 : 200, // allow more in dev
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // CSRF Protection - Generate token for all routes
  app.use(generateCSRFToken);
  
  // Only verify CSRF token for API routes that modify data
  // Exclude test generation endpoints from CSRF verification temporarily
  app.use('/api', (req, res, next) => {
    // Skip CSRF verification for test generation endpoints and webhooks
    if (req.path.includes('/testcases/generate') || req.path.includes('/webhooks')) {
      return next();
    }
    return verifyCSRFToken(req, res, next);
  });

  // Add pino-http middleware for request logging
  // Temporarily disabled due to compatibility issues
  // app.use(pinoHttp({
  //   logger: logger, // Use our existing logger instance
  //   genReqId: (req) => req.headers["x-request-id"] || crypto.randomUUID(), // Use existing X-Request-ID or generate new
  //   serializers: {
  //     req: (req) => ({ method: req.method, url: req.url, id: req.id }),
  //     res: (res) => ({ statusCode: res.statusCode }),
  //   },
  //   customProps: (req, res) => ({
  //     // Attach user information to logs if authenticated
  //     userId: req.user?.id,
  //   }),
  // }));

  // Prometheus metrics middleware
  app.use((req, res, next) => {
    const end = httpRequestDurationSeconds.startTimer();
    res.on('finish', () => {
      const route = req.route ? req.route.path : req.path; // Get route path, falling back to full path
      httpRequestCounter.inc({ method: req.method, route, status_code: res.statusCode });
      end({ method: req.method, route, status_code: res.statusCode });
    });
    next();
  });

  // Mount everything under /api
  // apply authLimiter to auth and github subroutes
  app.use("/api/v1/auth", authLimiter);
  app.use("/api/v1/github", authLimiter);

  // Apply strict limiter to expensive routes
  app.use("/api/v1/testcases/execute", expensiveLimiter);
  app.use("/api/v1/chatbot", expensiveLimiter);

  // Initialize routes with the db object
  app.use("/api", routesFactory(db)); // Pass db to the routes factory

  // Serve OpenAPI spec (read-only)
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  app.get("/api/docs.json", (_req, res) => {
    res.sendFile(path.join(__dirname, "./docs/openapi.json"));
  });

  // Prometheus metrics endpoint
  app.get('/metrics', async (_req, res) => {
    try {
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    } catch (ex) {
      res.status(500).end(ex);
    }
  });

  // Liveness check (always 200)
  app.get("/health", healthController.health);

  // Readiness check (checks deps)
  app.get("/ready", healthController.ready);

  // CSRF token endpoint
  app.get("/api/csrf-token", (_req, res) => {
    res.json({ 
      csrfToken: res.getHeader('X-CSRF-Token'),
      message: 'CSRF token generated successfully'
    });
  });

  // Catch-all 404
  app.use((req, res) => res.status(404).json({ error: "Not Found", path: req.originalUrl }));

  // Central error handler with standardized envelope
  app.use((err, _req, res, _next) => {
    logger.error({ err }, "API Error");
    const status = err.status || 500;
    const payload = {
      code: err.code || (status === 500 ? "INTERNAL_ERROR" : "REQUEST_FAILED"),
      message: err.message || "Internal Server Error",
      details: err.details || undefined,
      traceId: undefined,
    };
    if (NODE_ENV !== "production") payload.stack = err.stack;
    res.status(status).json(payload);
  });

  return app;
}
