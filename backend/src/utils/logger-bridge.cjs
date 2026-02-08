// backend/src/utils/logger-bridge.cjs
/**
 * A simple structured logger bridge for CommonJS files (like migrations)
 * that provides a consistent interface with the main Winston logger.
 */

const log = (message, meta = {}) => {
  const timestamp = new Date().toISOString();
  console.log(JSON.stringify({ timestamp, level: 'info', message, ...meta }));
};

const error = (message, err = {}) => {
  const timestamp = new Date().toISOString();
  const errorMeta = err instanceof Error ? { error: err.message, stack: err.stack } : err;
  console.error(JSON.stringify({ timestamp, level: 'error', message, ...errorMeta }));
};

const warn = (message, meta = {}) => {
  const timestamp = new Date().toISOString();
  console.warn(JSON.stringify({ timestamp, level: 'warn', message, ...meta }));
};

const debug = (message, meta = {}) => {
  if (process.env.NODE_ENV !== 'production') {
    const timestamp = new Date().toISOString();
    console.debug(JSON.stringify({ timestamp, level: 'debug', message, ...meta }));
  }
};

module.exports = {
  log,
  error,
  warn,
  debug,
  // Add camelCase aliases for consistency with winston
  info: log
};
