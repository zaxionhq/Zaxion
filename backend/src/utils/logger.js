// src/utils/logger.js
import winston from 'winston';

/**
 * Redacts sensitive fields from objects before logging
 * @param {any} data - The data to redact
 * @returns {any} - The redacted data
 */
export const redact = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const SENSITIVE_KEYS = [
    'access_token', 'token', 'client_secret', 'password', 
    'secret', 'key', 'githubToken', 'refreshToken', 'authorization'
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

// Winston custom format for redaction
const redactionFormat = winston.format((info) => {
  const { message, ...meta } = info;
  const redactedMeta = redact(meta);
  return { ...redactedMeta, message };
});

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    redactionFormat(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `[${timestamp}] ${level}: ${message}${metaStr}`;
        })
      ),
    }),
  ],
});

export const log = (msg, data = {}) => {
  logger.info(msg, data);
};

export const error = (msg, err = {}) => {
  logger.error(msg, err);
};

export const warn = (msg, data = {}) => {
  logger.warn(msg, data);
};

export const debug = (msg, data = {}) => {
  logger.debug(msg, data);
};

export default logger;

