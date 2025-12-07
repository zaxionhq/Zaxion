// src/middleware/auth.js
import { verifyToken } from "../utils/jwt.js";
import { decrypt } from "../utils/crypto.js";
// import db from "../models/index.js"; // Remove direct import

// const User = db.User; // Remove direct assignment

/**
 * Strict authentication - user must be logged in
 */
export async function authenticateJWT(req, res, next) {
  const db = req.app.locals.db; // Retrieve db from app.locals
  const User = db.User; // Access User model from db
  try {
    const token = req.cookies.app_jwt;
    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Token is stored encrypted in `accessToken`
    const githubToken = user.accessToken
      ? decrypt(user.accessToken)
      : null;

    req.user = user;
    req.githubToken = githubToken;
    console.log("authenticateJWT: req.githubToken =", req.githubToken); // Add this line

    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(401).json({ error: "Unauthorized" });
  }
}

/**
 * Soft authentication - attaches user if logged in,
 * otherwise continues as guest
 */
export async function requireLoginSoft(req, res, next) {
  const db = req.app.locals.db; // Retrieve db from app.locals
  const User = db.User; // Access User model from db
  try {
    const token = req.cookies.app_jwt;
    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      req.user = null;
      return next();
    }

    const user = await User.findByPk(decoded.id);
    if (!user) {
      req.user = null;
      return next();
    }

    const githubToken = user.accessToken
      ? decrypt(user.accessToken)
      : null;

    req.user = user;
    req.githubToken = githubToken;

    next();
  } catch (err) {
    console.error("Soft auth middleware error:", err);
    req.user = null;
    next();
  }
}
/**
 * Require GitHub-authenticated user (JWT + GitHub token)
 */
export async function requireGithub(req, res, next) {
  try {
    // Debug: Log cookies and headers
    console.log(`[requireGithub] Cookies:`, req.cookies);
    console.log(`[requireGithub] Origin:`, req.get('Origin'));
    console.log(`[requireGithub] Path:`, req.path);
    
    // First authenticate the JWT
    const token = req.cookies.app_jwt;
    if (!token) {
      console.log(`[requireGithub] No JWT token found in cookies`);
      return res.status(401).json({ error: "Not authenticated" });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const db = req.app.locals.db;
    const User = db.User;
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Get GitHub token
    const githubToken = user.accessToken ? decrypt(user.accessToken) : null;
    if (!githubToken) {
      return res.status(401).json({ error: "GitHub token missing" });
    }

    req.user = user;
    req.githubToken = githubToken;
    console.log("requireGithub: req.githubToken =", req.githubToken);
    next();
  } catch (err) {
    console.error("requireGithub middleware error:", err);
    return res.status(401).json({ error: "Unauthorized" });
  }
}
