import crypto from 'crypto';
import * as logger from '../utils/logger.js';

// Stateless Double Submit Cookie Pattern
// No server-side storage required, works across restarts and multiple instances.

// Generate CSRF token
export const generateCSRFToken = (req, res, next) => {
  // Check if a CSRF cookie already exists
  let token = req.cookies?.csrf_token;
  
  if (!token) {
    // Generate a new random token
    token = crypto.randomBytes(32).toString('hex');
    
    // Set it as a cookie (NOT httpOnly, so frontend can read it if needed, 
    // but usually we want httpOnly and provide an endpoint to get it)
    // For Double Submit, the cookie can be httpOnly if we have an endpoint to return the value.
    res.cookie('csrf_token', token, {
      httpOnly: true, // Secure: Frontend gets value via API, not reading cookie directly
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 60 * 1000 // 30 mins
    });
  }
  
  // Also set the token in the response header so the frontend can read it from the initial request
  // or the explicit /csrf-token endpoint
  res.setHeader('X-CSRF-Token', token);
  
  next();
};

// Verify CSRF token
export const verifyCSRFToken = (req, res, next) => {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Get token from header
  const headerToken = 
    req.headers['x-csrf-token'] || 
    req.headers['X-CSRF-Token'] || 
    req.body?._csrf;
    
  // Get token from cookie
  const cookieToken = req.cookies?.csrf_token;
  
  // For development debugging
  logger.debug(`[CSRF] Verifying token for ${req.method} ${req.path}`);
  logger.debug(`[CSRF] Cookie Token: ${cookieToken ? 'Present' : 'Missing'}`);
  logger.debug(`[CSRF] Header Token: ${headerToken ? 'Present' : 'Missing'}`);
  
  if (!cookieToken || !headerToken) {
    return res.status(403).json({
      code: 'CSRF_TOKEN_MISSING',
      message: 'CSRF token is required (cookie or header missing).'
    });
  }
  
  // Verify tokens match using timing-safe comparison
  const headerTokenBuffer = Buffer.from(headerToken);
  const cookieTokenBuffer = Buffer.from(cookieToken);
  
  if (headerTokenBuffer.length !== cookieTokenBuffer.length || 
      !crypto.timingSafeEqual(headerTokenBuffer, cookieTokenBuffer)) {
    return res.status(403).json({
      code: 'CSRF_TOKEN_INVALID',
      message: 'CSRF token mismatch.'
    });
  }
  
  next();
};
