/**
 * Prometheus metrics for incremental architecture (Phase 0 instrumentation).
 */
import { Counter, Histogram } from 'prom-client';
import { register } from '../../utils/metrics.js';

const incrParseMs = new Histogram({
  name: 'incr_parse_ms',
  help: 'Incremental parse duration in milliseconds',
  labelNames: ['parser_engine', 'language', 'status'],
  buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2000],
});
register.registerMetric(incrParseMs);

const incrCacheHitRatio = new Counter({
  name: 'incr_cache_hit_total',
  help: 'Incremental cache hits by layer',
  labelNames: ['layer', 'hit'],
});
register.registerMetric(incrCacheHitRatio);

const incrRouterPathCount = new Counter({
  name: 'incr_router_path_count',
  help: 'Policy router path distribution',
  labelNames: ['path', 'policy_type'],
});
register.registerMetric(incrRouterPathCount);

const incrParityMismatchCount = new Counter({
  name: 'incr_parity_mismatch_count',
  help: 'Shadow parity mismatches',
  labelNames: ['classification'],
});
register.registerMetric(incrParityMismatchCount);

const incrFallbackCount = new Counter({
  name: 'incr_fallback_count',
  help: 'Incremental fallback to legacy path',
  labelNames: ['reason'],
});
register.registerMetric(incrFallbackCount);

const incrInapplicableSkipCount = new Counter({
  name: 'incr_inapplicable_skip_count',
  help: 'Policies skipped due to language/file-kind',
  labelNames: ['skip_reason', 'policy_type'],
});
register.registerMetric(incrInapplicableSkipCount);

const incrFpLegacyOnly = new Counter({
  name: 'incr_fp_legacy_only',
  help: 'False positives removed by incremental (legacy-only violations)',
});
register.registerMetric(incrFpLegacyOnly);

const incrFpIncrementalOnly = new Counter({
  name: 'incr_fp_incremental_only',
  help: 'Incremental-only false positive regressions',
});
register.registerMetric(incrFpIncrementalOnly);

const incrScanProgressUpdateCount = new Counter({
  name: 'scan_progress_update_count',
  help: 'PR scan progress UI updates',
  labelNames: ['surface'],
});
register.registerMetric(incrScanProgressUpdateCount);

export const incrementalMetrics = {
  recordParse({ parser_engine, language, status, durationMs }) {
    incrParseMs.observe({ parser_engine, language, status }, durationMs);
  },

  recordCacheHit(layer, hit) {
    incrCacheHitRatio.inc({ layer, hit: hit ? 'true' : 'false' });
  },

  recordRouterPath(path, policyType) {
    incrRouterPathCount.inc({ path, policy_type: policyType });
  },

  recordParity(classification) {
    if (classification && classification !== 'exact_match') {
      incrParityMismatchCount.inc({ classification });
    }
    if (classification === 'true_improvement') {
      incrFpLegacyOnly.inc();
    }
    if (classification === 'regression') {
      incrFpIncrementalOnly.inc();
    }
  },

  recordFallback(reason) {
    incrFallbackCount.inc({ reason: reason || 'unknown' });
  },

  recordSkip(skipReason, policyType) {
    incrInapplicableSkipCount.inc({
      skip_reason: skipReason || 'unknown',
      policy_type: policyType || 'unknown',
    });
  },

  recordScanProgress(surface) {
    incrScanProgressUpdateCount.inc({ surface: surface || 'unknown' });
  },
};
