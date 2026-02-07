// src/utils/logger.js

/**
 * Redacts sensitive fields from objects before logging
 * @param {any} data - The data to redact
 * @returns {any} - The redacted data
 */
export const redact = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const SENSITIVE_KEYS = [
    'access_token', 'token', 'client_secret', 'password', 
    'secret', 'key', 'githubToken', 'refreshToken'
  ];
  
  if (Array.isArray(data)) {
    return data.map(redact);
  }
  
  const redacted = { ...data };
  for (const key in redacted) {
    if (SENSITIVE_KEYS.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
      redacted[key] = '[REDACTED]';
    } else if (typeof redacted[key] === 'object') {
      redacted[key] = redact(redacted[key]);
    }
  }
  return redacted;
};

export const log = (msg, data = null) => {
  const sanitizedData = data ? redact(data) : '';
  console.log(`[${new Date().toISOString()}] ${msg}`, sanitizedData);
};

export const error = (msg, err = null) => {
  const sanitizedErr = err ? redact(err) : '';
  console.error(`[${new Date().toISOString()}] ERROR: ${msg}`, sanitizedErr);
};

export const warn = (msg, data = null) => {
  const sanitizedData = data ? redact(data) : '';
  console.warn(`[${new Date().toISOString()}] WARN: ${msg}`, sanitizedData);
};

