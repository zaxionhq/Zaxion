// backend/src/middleware/authorize.js

import logger from "../logger.js";
import { logAuthorizationEvent } from "../services/audit.service.js";

/**
 * Middleware to enforce role-based access control.
 * @param {string[]} allowedRoles - An array of roles that are allowed to access the route.
 */
export function authorize(allowedRoles) {
  return (req, res, next) => {
    const userId = req.user ? req.user.id : null;
    const userRole = req.user ? req.user.role : 'guest';
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    // Ensure user is authenticated first (e.g., via authenticateJWT middleware)
    if (!req.user) {
      logger.warn("Authorization attempt without authenticated user.");
      logAuthorizationEvent(userId, userRole, allowedRoles, 'DENIED', { reason: 'Authentication required', ipAddress, userAgent });
      return res.status(401).json({ error: "Authentication required" });
    }

    // Check if the user's role is in the list of allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`User ${req.user.id} with role ${req.user.role} attempted to access restricted resource. Required roles: ${allowedRoles.join(', ')}`);
      logAuthorizationEvent(userId, userRole, allowedRoles, 'DENIED', { reason: 'Insufficient permissions', ipAddress, userAgent });
      return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
    }

    // User is authorized, proceed to the next middleware/route handler
    logAuthorizationEvent(userId, userRole, allowedRoles, 'GRANTED', { ipAddress, userAgent });
    next();
  };
}
