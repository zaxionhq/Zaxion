/**
 * Minimal frontend logger utility.
 * In production, this can be hooked up to an error tracking service like Sentry.
 */

const isProd = import.meta.env.PROD;

export const log = (message: string, ...args: unknown[]) => {
  if (!isProd) {
    console.log(`[LOG] ${message}`, ...args);
  }
};

export const warn = (message: string, ...args: unknown[]) => {
  if (!isProd) {
    console.warn(`[WARN] ${message}`, ...args);
  }
};

export const error = (message: string, ...args: unknown[]) => {
  // Always log errors, but maybe differently in production
  console.error(`[ERROR] ${message}`, ...args);
};

export const debug = (message: string, ...args: unknown[]) => {
  if (!isProd) {
    console.debug(`[DEBUG] ${message}`, ...args);
  }
};

export default { log, warn, error, debug };
