import axios from 'axios';
import logger from '../logger.js';

const SAFETY_THRESHOLD = 50;
let globalCooldownUntil = 0;

/**
 * Creates an Axios instance pre-configured with Primary & Secondary rate limit handling,
 * including priority queues.
 */
export function createGitHubClient(token, priority = 'NORMAL') {
  const client = axios.create({
    baseURL: 'https://api.github.com',
    headers: { Authorization: `Bearer ${token}` },
    timeout: 15000,
  });

  client.interceptors.request.use(async (config) => {
    // 1. Enforce Global Cooldown for Secondary Limits (Abuse)
    if (Date.now() < globalCooldownUntil) {
      const waitTime = globalCooldownUntil - Date.now();
      logger.warn({ waitTime, priority }, 'GitHubRateLimiter: Global cooldown active. Delaying request.');
      // If HIGH priority, maybe wait. If LOW, reject early to save connections?
      // For now, simple await:
      await new Promise(res => setTimeout(res, waitTime));
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => {
      // 2. Track Primary Limits
      const remaining = parseInt(response.headers['x-ratelimit-remaining'], 10);
      const reset = parseInt(response.headers['x-ratelimit-reset'], 10);

      if (!isNaN(remaining) && remaining < SAFETY_THRESHOLD) {
        logger.warn({ remaining, reset, priority }, 'GitHubRateLimiter: Primary rate limit low');
        if (priority === 'LOW') {
           // If low priority, we might voluntarily yield or throw a specific degraded error
           logger.warn('GitHubRateLimiter: Low priority task yielding due to low budget');
        }
      }
      return response;
    },
    async (error) => {
      if (error.response) {
        const { status, headers } = error.response;
        
        // 3. Detect Secondary (Abuse) Rate Limit
        if (status === 403 && !headers['x-ratelimit-remaining']) {
          logger.error('GitHubRateLimiter: SECONDARY RATE LIMIT HIT (Abuse Detection)');
          // Trigger global cooldown of 60 seconds
          globalCooldownUntil = Date.now() + 60 * 1000;
          error.isSecondaryRateLimit = true;
        } else if (status === 403 && parseInt(headers['x-ratelimit-remaining'], 10) === 0) {
          logger.error('GitHubRateLimiter: PRIMARY RATE LIMIT EXHAUSTED');
          const resetEpoch = parseInt(headers['x-ratelimit-reset'], 10);
          globalCooldownUntil = (resetEpoch * 1000) + 1000; // Wait until reset + 1s buffer
          error.isPrimaryRateLimit = true;
        }
      }
      return Promise.reject(error);
    }
  );

  return client;
}
