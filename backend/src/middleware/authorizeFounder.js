// backend/src/middleware/authorizeFounder.js
import env from "../config/env.js";
import logger from "../utils/logger.js";

/**
 * Middleware to authorize the Founder/Superuser.
 * Checks if the authenticated user's role is 'admin' AND their GitHub username matches the founder's username.
 */
export function authorizeFounder(req, res, next) {
  const user = req.user;
  const founderUsername = env.FOUNDER_GITHUB_USERNAME || "Kaandizz";

  if (!user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  // Double check: must be admin role AND match the specific username
  const isFounder = user.role === 'admin' && user.username === founderUsername;

  if (!isFounder) {
    logger.warn(`Unauthorized access attempt to Founder Console by user: ${user.username} (Role: ${user.role})`);
    return res.status(403).json({ 
      error: "Forbidden", 
      message: "This area is restricted to the Zaxion Founder." 
    });
  }

  logger.info(`Founder access granted: ${user.username}`);
  next();
}
