// src/utils/logger.js
export const log = (msg, data = null) => {
  console.log(`[${new Date().toISOString()}] ${msg}`, data ?? '');
};
