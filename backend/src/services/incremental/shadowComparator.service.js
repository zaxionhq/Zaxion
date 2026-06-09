/**
 * Compares legacy vs incremental evaluation outcomes (shadow mode).
 */
import { incrementalFlags } from './incrementalFeatureFlags.service.js';
import { incrementalMetrics } from './incrementalMetrics.service.js';

/**
 * @param {object} legacyOutcome
 * @param {object} incrementalOutcome
 */
export function compareOutcomes(legacyOutcome, incrementalOutcome) {
  const legacyVerdict = legacyOutcome?.final_verdict || legacyOutcome?.decision;
  const incrVerdict = incrementalOutcome?.final_verdict || incrementalOutcome?.decision;

  const legacyViolations = legacyOutcome?.violations || [];
  const incrViolations = incrementalOutcome?.violations || [];

  const classification =
    legacyVerdict === incrVerdict && legacyViolations.length === incrViolations.length
      ? 'exact_match'
      : legacyViolations.length > incrViolations.length
        ? 'true_improvement'
        : incrViolations.length > legacyViolations.length
          ? 'regression'
          : 'acceptable_drift';

  return {
    classification,
    legacy_verdict: legacyVerdict,
    incremental_verdict: incrVerdict,
    legacy_violation_count: legacyViolations.length,
    incremental_violation_count: incrViolations.length,
    fp_legacy_only: Math.max(0, legacyViolations.length - incrViolations.length),
    fp_incremental_only: Math.max(0, incrViolations.length - legacyViolations.length),
  };
}

export class ShadowComparatorService {
  compare(legacy, incremental) {
    if (!incrementalFlags.isShadowCompareEnabled()) {
      return { skipped: true };
    }
    const result = compareOutcomes(legacy, incremental);
    incrementalMetrics.recordParity(result.classification);
    return {
      ...result,
      fp_delta: {
        legacy_only_count: result.fp_legacy_only,
        incremental_only_count: result.fp_incremental_only,
        true_improvement_count: result.classification === 'true_improvement' ? result.fp_legacy_only : 0,
      },
    };
  }
}
