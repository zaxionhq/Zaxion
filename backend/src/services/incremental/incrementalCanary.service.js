/**
 * Canary targeting for INCR_ENFORCEMENT rollout (Phase 5).
 */
import { incrementalFlags } from './incrementalFeatureFlags.service.js';

function parseList(raw) {
  if (!raw || typeof raw !== 'string') return [];
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

function envGet(key) {
  return process.env[key];
}

/**
 * @param {{ owner?: string, repo?: string, org?: string }} context
 */
export function isCanaryTarget(context = {}) {
  if (!incrementalFlags.isEnforcementEnabled()) {
    return false;
  }

  const orgs = parseList(envGet('INCR_CANARY_ORGS'));
  const repos = parseList(envGet('INCR_CANARY_REPOS'));
  const percent = Number(envGet('INCR_CANARY_PERCENT') || 0);

  if (orgs.length === 0 && repos.length === 0 && percent <= 0) {
    return true;
  }

  const owner = context.owner || context.org || '';
  const repoFull = context.repo?.includes('/')
    ? context.repo
    : owner && context.repo
      ? `${owner}/${context.repo}`
      : '';

  if (orgs.length > 0 && orgs.includes(owner)) return true;
  if (repos.length > 0 && repos.includes(repoFull)) return true;

  if (percent > 0 && repoFull) {
    const bucket = Math.abs(hashString(repoFull)) % 100;
    return bucket < percent;
  }

  return false;
}

function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return h;
}

/**
 * Incremental authority active (per-file gates, deep confirmation on verdicts).
 */
export function isIncrementalAuthorityActive(context = {}) {
  if (incrementalFlags.isForcedLegacy()) return false;
  if (!incrementalFlags.isEnforcementEnabled()) {
    return false;
  }
  return isCanaryTarget(context);
}

export class IncrementalCanaryService {
  isTarget(context) {
    return isCanaryTarget(context);
  }

  isAuthorityActive(context) {
    return isIncrementalAuthorityActive(context);
  }
}
