// backend/src/services/audit.service.js

import { auditLogger } from '../logger.js';

/**
 * Logs an authentication-related event.
 * @param {string} userId - The ID of the user (or null if not authenticated).
 * @param {string} eventType - The type of authentication event (e.g., 'LOGIN', 'LOGOUT', 'REFRESH_TOKEN').
 * @param {string} outcome - The outcome of the event (e.g., 'SUCCESS', 'FAILURE').
 * @param {object} [details={}] - Additional details relevant to the event (e.g., 'ipAddress', 'userAgent').
 */
export function logAuthEvent(userId, eventType, outcome, details = {}) {
  auditLogger.info({
    category: 'auth',
    userId,
    eventType,
    outcome,
    ...details,
  }, `Auth Event: ${eventType} - ${outcome} for user ${userId || 'N/A'}`);
}

/**
 * Logs an authorization decision event.
 * @param {string} userId - The ID of the user.
 * @param {string} role - The role of the user.
 * @param {string[]} requiredRoles - The roles required for access.
 * @param {string} outcome - The outcome of the authorization (e.g., 'GRANTED', 'DENIED').
 * @param {object} [details={}] - Additional details relevant to the event.
 */
export function logAuthorizationEvent(userId, role, requiredRoles, outcome, details = {}) {
  auditLogger.info({
    category: 'authorization',
    userId,
    userRole: role,
    requiredRoles,
    outcome,
    ...details,
  }, `Authorization Event: User ${userId} with role ${role} ${outcome} access to resource (required: ${requiredRoles.join(', ')})`);
}

/**
 * Logs a resource-related event (e.g., CRUD operations).
 * @param {string} userId - The ID of the user who performed the action.
 * @param {string} eventType - The type of resource event (e.g., 'CREATE', 'READ', 'UPDATE', 'DELETE').
 * @param {string} resourceType - The type of resource affected (e.g., 'TestCase', 'User').
 * @param {string} resourceId - The ID of the resource affected (if applicable).
 * @param {string} outcome - The outcome of the event (e.g., 'SUCCESS', 'FAILURE').
 * @param {object} [details={}] - Additional details (e.g., old values, new values).
 */
export function logResourceEvent(userId, eventType, resourceType, resourceId = null, outcome, details = {}) {
  auditLogger.info({
    category: 'resource',
    userId,
    eventType,
    resourceType,
    resourceId,
    outcome,
    ...details,
  }, `Resource Event: ${eventType} ${resourceType} ${resourceId || 'N/A'} - ${outcome} by user ${userId}`);
}

