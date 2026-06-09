/**
 * Routes policies to shallow / selective_deep / fallback / skip paths.
 */
import { getApplicabilityDefaults } from './policyApplicability.service.js';
import { isPolicyApplicableToChangeSet } from './policyApplicability.service.js';
import { incrementalFlags } from './incrementalFeatureFlags.service.js';
import { incrementalMetrics } from './incrementalMetrics.service.js';

/**
 * @param {object} params
 * @param {string} params.policyType
 * @param {Array<{ path?: string }>} params.files
 * @param {object} [params.metadata]
 */
export function routePolicy({ policyType, files, metadata = {} }) {
  if (!incrementalFlags.isRouterEnabled()) {
    return { path: 'legacy', skip_reason: null };
  }

  const defaults = getApplicabilityDefaults(policyType);
  const merged = { ...defaults, ...metadata };

  const applicability = isPolicyApplicableToChangeSet(policyType, files, merged);
  if (!applicability.applicable) {
    const skipReason = applicability.skip_reason || 'inapplicable_change_set';
    incrementalMetrics.recordSkip(skipReason, policyType);
    incrementalMetrics.recordRouterPath('skip', policyType);
    return { path: 'skip', skip_reason: skipReason };
  }

  const depth = merged.required_depth || 'full_fallback';
  let path = 'shallow';
  if (depth === 'full_fallback') path = 'fallback';
  else if (depth === 'selective_deep') path = 'selective_deep';
  incrementalMetrics.recordRouterPath(path, policyType);
  return { path, skip_reason: null };
}

export class PolicyRouterService {
  route(params) {
    return routePolicy(params);
  }

  /**
   * Build skip map for report UI: rule_type → skipped
   * @param {Array<{ rules_logic?: { type?: string } }>} policies
   * @param {Array<{ path?: string }>} files
   */
  buildSkippedRuleTypes(policies, files) {
    const skipped = {};
    if (!incrementalFlags.isRouterEnabled()) return skipped;

    for (const p of policies || []) {
      const type = p.rules_logic?.type;
      if (!type) continue;
      const r = routePolicy({ policyType: type, files });
      if (r.path === 'skip') {
        skipped[type] = true;
      }
    }
    return skipped;
  }
}
