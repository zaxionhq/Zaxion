import crypto from 'crypto';
import * as logger from '../utils/logger.js';
import env from '../config/env.js';

// Stateless Signed Token Pattern (No Cookies)
// This is the most robust solution for cross-domain API setups (Vercel Frontend -> Railway Backend).
// It relies on the fact that only the legitimate frontend (via CORS) can read the token
// from the GET /api/csrf-token endpoint.
// The token is cryptographically signed by the server so it cannot be forged.

const CSRF_SECRET = env.JWT_SECRET || 'zaxion-fallback-secret-key-change-in-prod';

// Generate a signed token
const signToken = (token) => {
  const hmac = crypto.createHmac('sha256', CSRF_SECRET);
  hmac.update(token);
  return `${token}.${hmac.digest('hex')}`;
};

// Verify a signed token
const verifyTokenSignature = (signedToken) => {
  if (!signedToken || typeof signedToken !== 'string') return false;
  
  const [token, signature] = signedToken.split('.');
  if (!token || !signature) return false;
  
  const hmac = crypto.createHmac('sha256', CSRF_SECRET);
  hmac.update(token);
  const expectedSignature = hmac.digest('hex');
  
  // Timing safe comparison
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  
  if (signatureBuffer.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
};

// Generate CSRF token
export const generateCSRFToken = (req, res, next) => {
  // Generate a new random token
  const rawToken = crypto.randomBytes(32).toString('hex');
  const signedToken = signToken(rawToken);
  
  // Set the token in the response header
  res.setHeader('X-CSRF-Token', signedToken);
  
  // Attach to request/response for easier access in route handlers
  req.csrfToken = signedToken;
  res.locals.csrfToken = signedToken;
  
  next();
};

// Verify CSRF token
export const verifyCSRFToken = (req, res, next) => {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Get token from header ONLY (cookies are unreliable cross-domain)
  const headerToken = 
    req.headers['x-csrf-token'] || 
    req.headers['X-CSRF-Token'] || 
    req.body?._csrf;
    
  // For development debugging - Log EVERYTHING
  logger.debug(`[CSRF] Verifying token for ${req.method} ${req.path}`);
  logger.debug(`[CSRF] Header Token: ${headerToken ? 'Present' : 'Missing'}`);
  
  if (process.env.NODE_ENV !== 'production' && headerToken) {
    logger.debug(`[CSRF] Header: ${headerToken.substring(0, 10)}...`);
  }
  
  if (!headerToken) {
    logger.error(`[CSRF] Failed: Missing token in header.`);
    return res.status(403).json({
      code: 'CSRF_TOKEN_MISSING',
      message: 'CSRF token is required in headers.'
    });
  }
  
  // Verify token signature
  if (!verifyTokenSignature(headerToken)) {
    logger.error(`[CSRF] Failed: Invalid token signature.`);
    return res.status(403).json({
      code: 'CSRF_TOKEN_INVALID',
      message: 'Invalid CSRF token signature.'
    });
  }
  
  next();
};
