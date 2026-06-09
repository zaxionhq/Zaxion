export const INCR_ENV_KEYS = [
  'INCR_PARSE_ENABLED',
  'INCR_MERKLE_ENABLED',
  'INCR_POLICY_ROUTER_ENABLED',
  'INCR_DEEP_AST_ENABLED',
  'INCR_SHADOW_COMPARE_ENABLED',
  'INCR_ENFORCEMENT_ENABLED',
  'INCR_SCAN_PROGRESS_UI_ENABLED',
  'INCR_FORCE_LEGACY',
  'INCR_CANARY_ORGS',
  'INCR_CANARY_REPOS',
  'INCR_CANARY_PERCENT',
];

/** Clear all incremental flags (legacy pipeline). */
export function clearIncrementalEnv() {
  for (const key of INCR_ENV_KEYS) {
    delete process.env[key];
  }
}

/** Snapshot incremental env for afterEach restore. */
export function snapshotIncrementalEnv() {
  return Object.fromEntries(INCR_ENV_KEYS.map((k) => [k, process.env[k]]));
}

export function restoreIncrementalEnv(snapshot) {
  for (const key of INCR_ENV_KEYS) {
    if (snapshot[key] === undefined) delete process.env[key];
    else process.env[key] = snapshot[key];
  }
}
