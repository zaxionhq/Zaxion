/**
 * Centralized incremental architecture feature flags.
 * All default false — legacy pipeline unchanged when flags are off.
 */
const TRUTHY = new Set(['1', 'true', 'yes', 'on']);

function envBool(key) {
  // INCR_* flags: only process.env counts; unset = false (safe default + test isolation).
  const raw = process.env[key];
  if (raw === undefined || raw === null || raw === '') return false;
  return TRUTHY.has(String(raw).toLowerCase());
}

export const INCREMENTAL_FLAGS = {
  PARSE: 'INCR_PARSE_ENABLED',
  MERKLE: 'INCR_MERKLE_ENABLED',
  ROUTER: 'INCR_POLICY_ROUTER_ENABLED',
  DEEP_AST: 'INCR_DEEP_AST_ENABLED',
  SHADOW: 'INCR_SHADOW_COMPARE_ENABLED',
  ENFORCEMENT: 'INCR_ENFORCEMENT_ENABLED',
  SCAN_PROGRESS_UI: 'INCR_SCAN_PROGRESS_UI_ENABLED',
  FORCE_LEGACY: 'INCR_FORCE_LEGACY',
};

export class IncrementalFeatureFlagsService {
  isForcedLegacy() {
    return envBool(INCREMENTAL_FLAGS.FORCE_LEGACY);
  }

  isEnabled(flagName) {
    if (this.isForcedLegacy()) return false;
    return envBool(flagName);
  }

  isParseEnabled() {
    return this.isEnabled(INCREMENTAL_FLAGS.PARSE);
  }

  isMerkleEnabled() {
    return this.isEnabled(INCREMENTAL_FLAGS.MERKLE);
  }

  isRouterEnabled() {
    return this.isEnabled(INCREMENTAL_FLAGS.ROUTER);
  }

  isDeepAstEnabled() {
    return this.isEnabled(INCREMENTAL_FLAGS.DEEP_AST);
  }

  isShadowCompareEnabled() {
    return this.isEnabled(INCREMENTAL_FLAGS.SHADOW);
  }

  isEnforcementEnabled() {
    return this.isEnabled(INCREMENTAL_FLAGS.ENFORCEMENT);
  }

  isScanProgressUiEnabled() {
    return this.isEnabled(INCREMENTAL_FLAGS.SCAN_PROGRESS_UI);
  }

  /** Snapshot for metadata.incremental */
  getActiveFlags() {
    return {
      forced_legacy: this.isForcedLegacy(),
      parse: this.isParseEnabled(),
      merkle: this.isMerkleEnabled(),
      router: this.isRouterEnabled(),
      deep_ast: this.isDeepAstEnabled(),
      shadow_compare: this.isShadowCompareEnabled(),
      enforcement: this.isEnforcementEnabled(),
      scan_progress_ui: this.isScanProgressUiEnabled(),
    };
  }
}

export const incrementalFlags = new IncrementalFeatureFlagsService();
