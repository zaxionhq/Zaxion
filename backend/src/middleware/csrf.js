import crypto from 'crypto';

// CSRF token storage (in production, use Redis or database)
const csrfTokens = new Map();

// Generate CSRF token
export const generateCSRFToken = (req, res, next) => {
  // Use session-based ID if available, otherwise fallback to cookie-based ID
  // This is more secure than IP/UA as it survives network changes.
  let sessionId = req.cookies?.app_session_id;
  
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    // Set a session cookie if it doesn't exist
    res.cookie('app_session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 60 * 1000 // 30 mins
    });
  }
  
  // Check if a valid token already exists for this session
  const existingToken = csrfTokens.get(sessionId);
  let token;
  
  if (existingToken && existingToken.expires > Date.now()) {
    // Reuse existing token if it's still valid
    token = existingToken.token;
  } else {
    // Generate a new token
    token = crypto.randomBytes(32).toString('hex');
    
    // Store token with expiration (30 minutes)
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
    req.body?._csrf;
    
  // Use session-based ID from cookie
  const sessionId = req.cookies?.app_session_id;
  
  // For development debugging
  console.log(`[CSRF] Verifying token for ${req.method} ${req.path}`);
  console.log(`[CSRF] Session ID: ${sessionId || 'None'}`);
  console.log(`[CSRF] Token provided: ${token ? 'Yes' : 'No'}`);
  
  if (!sessionId || !token) {
    return res.status(403).json({
      code: 'CSRF_TOKEN_MISSING',
      message: 'CSRF token or session ID is required for this request.'
    });
  }
  
  const storedToken = csrfTokens.get(sessionId);
  
  if (!storedToken) {
    return res.status(403).json({
      code: 'CSRF_TOKEN_NOT_FOUND',
      message: 'CSRF token not found or expired.'
    });
  }
  
  // Check if token is expired
  if (Date.now() > storedToken.expires) {
    csrfTokens.delete(sessionId);
    return res.status(403).json({
      code: 'CSRF_TOKEN_EXPIRED',
      message: 'CSRF token has expired.'
    });
  }
  
  // Verify token matches using timing-safe comparison
  const providedTokenBuffer = Buffer.from(token);
  const storedTokenBuffer = Buffer.from(storedToken.token);
  
  if (providedTokenBuffer.length !== storedTokenBuffer.length || 
      !crypto.timingSafeEqual(providedTokenBuffer, storedTokenBuffer)) {
    return res.status(403).json({
      code: 'CSRF_TOKEN_INVALID',
      message: 'Invalid CSRF token.'
    });
  }
  
  // Token is valid!
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
