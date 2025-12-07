import crypto from 'crypto';

// CSRF token storage (in production, use Redis or database)
const csrfTokens = new Map();

// Generate CSRF token
export const generateCSRFToken = (req, res, next) => {
  // Use IP + User-Agent as session identifier since we don't have session middleware
  const sessionId = `${req.ip}-${req.get('User-Agent') || 'unknown'}`;
  
  // Check if a valid token already exists for this session
  const existingToken = csrfTokens.get(sessionId);
  let token;
  
  if (existingToken && existingToken.expires > Date.now()) {
    // Reuse existing token if it's still valid
    token = existingToken.token;
  } else {
    // Generate a new token
    token = crypto.randomBytes(32).toString('hex');
    
    // Store token with expiration (30 minutes instead of 5)
    csrfTokens.set(sessionId, {
      token,
      expires: Date.now() + 30 * 60 * 1000
    });
  }
  
  // Set token in response header
  res.setHeader('X-CSRF-Token', token);
  
  next();
};

// Verify CSRF token
export const verifyCSRFToken = (req, res, next) => {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Check for token in headers (case-insensitive) or body
  const token = 
    req.headers['x-csrf-token'] || 
    req.headers['X-CSRF-Token'] || 
    req.body._csrf;
    
  // Use IP + User-Agent as session identifier since we don't have session middleware
  const sessionId = `${req.ip}-${req.get('User-Agent') || 'unknown'}`;
  
  // For development debugging
  console.log(`[CSRF] Verifying token for ${req.method} ${req.path}`);
  console.log(`[CSRF] Session ID: ${sessionId}`);
  console.log(`[CSRF] Token provided: ${token ? 'Yes' : 'No'}`);
  
  if (!token) {
    // Generate a new token for the client to use
    const newToken = crypto.randomBytes(32).toString('hex');
    csrfTokens.set(sessionId, {
      token: newToken,
      expires: Date.now() + 30 * 60 * 1000
    });
    
    // Include the new token in the error response
    res.setHeader('X-CSRF-Token', newToken);
    
    return res.status(403).json({
      code: 'CSRF_TOKEN_MISSING',
      message: 'CSRF token is required for this request. A new token has been provided in the X-CSRF-Token header.'
    });
  }
  
  const storedToken = csrfTokens.get(sessionId);
  
  if (!storedToken) {
    // No token found for this session, generate a new one
    const newToken = crypto.randomBytes(32).toString('hex');
    csrfTokens.set(sessionId, {
      token: newToken,
      expires: Date.now() + 30 * 60 * 1000
    });
    
    // Include the new token in the error response
    res.setHeader('X-CSRF-Token', newToken);
    
    return res.status(403).json({
      code: 'CSRF_TOKEN_NOT_FOUND',
      message: 'CSRF token not found or expired. A new token has been provided in the X-CSRF-Token header.'
    });
  }
  
  // Check if token is expired
  if (Date.now() > storedToken.expires) {
    // Token expired, generate a new one
    const newToken = crypto.randomBytes(32).toString('hex');
    csrfTokens.set(sessionId, {
      token: newToken,
      expires: Date.now() + 30 * 60 * 1000
    });
    
    // Include the new token in the error response
    res.setHeader('X-CSRF-Token', newToken);
    
    return res.status(403).json({
      code: 'CSRF_TOKEN_EXPIRED',
      message: 'CSRF token has expired. A new token has been provided in the X-CSRF-Token header.'
    });
  }
  
  // Verify token
  if (token !== storedToken.token) {
    console.log(`[CSRF] Token mismatch. Provided: ${token}, Stored: ${storedToken.token}`);
    
    return res.status(403).json({
      code: 'CSRF_TOKEN_INVALID',
      message: 'Invalid CSRF token'
    });
  }
  
  // Token is valid, refresh its expiration time
  csrfTokens.set(sessionId, {
    token: storedToken.token,
    expires: Date.now() + 30 * 60 * 1000
  });
  
  // Token is valid, continue
  next();
};

// Cleanup expired tokens (run periodically)
export const cleanupExpiredTokens = () => {
  const now = Date.now();
  for (const [sessionId, tokenData] of csrfTokens.entries()) {
    if (now > tokenData.expires) {
      csrfTokens.delete(sessionId);
    }
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupExpiredTokens, 5 * 60 * 1000);
