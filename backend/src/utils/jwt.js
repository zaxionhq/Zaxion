// src/utils/jwt.js
import jwt from "jsonwebtoken";
import logger from "../logger.js";
import env from "../config/env.js";

// Support multiple JWT secrets for rotation. JWT_SECRETS can be comma-separated
// The first secret is used for signing; all secrets are used for verification.
const JWT_SECRETS = (env.get("JWT_SECRETS") || env.get("JWT_SECRET") || "").split(",").map(s => s.trim()).filter(Boolean);
const JWT_TTL = env.get("JWT_TTL") || "2h";
const JWT_REFRESH_TTL = env.get("JWT_REFRESH_TTL") || "7d";

if (!JWT_SECRETS || JWT_SECRETS.length === 0) {
  logger.warn("⚠️ No JWT secrets configured. Set JWT_SECRETS or JWT_SECRET in your environment for production.");
}

export function generateToken(payload, opts = {}) {
  const secret = JWT_SECRETS[0] || "";
  return jwt.sign(payload, secret, { expiresIn: opts.expiresIn || JWT_TTL });
}

export function generateRefreshToken(payload, opts = {}) {
  const secret = JWT_SECRETS[0] || "";
  return jwt.sign(payload, secret, { expiresIn: opts.expiresIn || JWT_REFRESH_TTL });
}

export function verifyToken(token) {
  for (const s of JWT_SECRETS) {
    try {
      return jwt.verify(token, s);
    } catch (err) {
      // try next
    }
  }
  return null;
}

export { JWT_TTL, JWT_REFRESH_TTL };
