/**
 * Path scope defaults for shipped core policies.
 * Rule-type defaults with policy-ID overrides where semantics differ.
 */
import {
  STANDARD_TOOLING_EXCLUDE_PATHS,
  STANDARD_TEST_EXCLUDE_PATHS,
} from '../utils/pathScope.utils.js';

/** @typedef {{ pattern: string, reason: string }} PathExclusion */

/** Reusable exclusion catalog keyed by category. */
export const PATH_EXCLUSION_CATALOG = {
  tooling: {
    patterns: ['scripts/**', 'bin/**', 'tools/**', 'cmd/**'],
    reason:
      'CLI and build tooling legitimately uses console output, debug flags, and relaxed style rules',
  },
  docs: {
    patterns: ['docs/**', '**/*.md', '**/*.html'],
    reason: 'Documentation is not production runtime code',
  },
  tests: {
    patterns: [
      '**/test/**',
      '**/tests/**',
      '**/__tests__/**',
      '**/*.test.*',
      '**/*.spec.*',
      '**/mock/**',
      '**/e2e/**',
    ],
    reason: 'Tests intentionally use debug output, mocks, and atypical patterns',
  },
  config_only: {
    patterns: ['**/*.yml', '**/*.yaml'],
    reason: 'Config files are evaluated by manifest/workflow rules, not source-code heuristics',
  },
  source_app: {
    patterns: ['src/**', 'lib/**'],
    reason: 'Supply chain rules target CI/CD and manifest artifacts, not application source code',
  },
};

const SOURCE_INCLUDE_PATHS = ['src/**', 'lib/**', 'app/**', 'packages/*/src/**'];

const MANIFEST_INCLUDE_PATHS = [
  'package.json',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'requirements.txt',
  'Pipfile',
  'poetry.lock',
  'go.mod',
  'Cargo.toml',
];

const SUPPLY_CHAIN_INCLUDE_PATHS = [
  '.github/workflows/**',
  '**/Dockerfile*',
  'docker-compose*.yml',
  'package.json',
  'package-lock.json',
];

/** Rule-type → scope definition (catalog keys or explicit patterns). */
export const RULE_TYPE_PATH_SCOPE = {
  code_quality: {
    include_paths: SOURCE_INCLUDE_PATHS,
    exclude_keys: ['tooling', 'tests', 'docs', 'config_only'],
  },
  complexity_metrics: {
    include_paths: SOURCE_INCLUDE_PATHS,
    exclude_keys: ['tooling', 'tests', 'docs', 'config_only'],
  },
  institutional_style: {
    include_paths: SOURCE_INCLUDE_PATHS,
    exclude_keys: ['tooling', 'tests', 'docs', 'config_only'],
  },
  documentation: {
    include_paths: SOURCE_INCLUDE_PATHS,
    exclude_keys: ['tooling', 'tests', 'docs', 'config_only'],
  },
  no_hardcoded_secrets: {
    include_paths: ['*'],
    exclude_keys: ['tests', 'docs'],
  },
  no_sql_injection: {
    include_paths: ['*'],
    exclude_keys: ['tests', 'docs'],
  },
  no_xss: {
    include_paths: ['*'],
    exclude_keys: ['tests', 'docs'],
  },
  no_eval: {
    include_paths: ['*'],
    exclude_keys: ['tests', 'docs'],
  },
  no_unsafe_regex: {
    include_paths: ['*'],
    exclude_keys: ['tests', 'docs'],
  },
  reliability: {
    include_paths: ['*'],
    exclude_keys: ['tests', 'docs'],
  },
  architecture: {
    include_paths: ['*'],
    exclude_keys: ['tests', 'docs'],
  },
  architectural_integrity: {
    include_paths: ['*'],
    exclude_keys: ['tests', 'docs'],
  },
  api: {
    include_paths: ['*'],
    exclude_keys: ['tests', 'docs'],
  },
  performance: {
    include_paths: ['*'],
    exclude_keys: ['tests', 'docs'],
  },
  coverage: {
    include_paths: ['*'],
    exclude_keys: ['tooling', 'docs'],
  },
  testing_best_practices: {
    include_paths: ['*'],
    exclude_keys: ['tooling', 'docs'],
  },
  dependency_scan: {
    include_paths: MANIFEST_INCLUDE_PATHS,
    exclude_keys: [],
  },
  supply_chain_integrity: {
    include_paths: SUPPLY_CHAIN_INCLUDE_PATHS,
    exclude_keys: ['source_app', 'tests', 'tooling'],
  },
  pr_size: null,
  mandatory_review: null,
  core_enforcement: null,
};

/** Policy-ID overrides when rule-type default is insufficient. */
export const CORE_POLICY_PATH_OVERRIDES = {
  'SEC-004': 'dependency_scan',
  'OPS-001': 'supply_chain_integrity',
  'TST-001': 'coverage',
  'TST-002': 'testing_best_practices',
  'TST-003': 'testing_best_practices',
  'TST-004': 'performance',
};

/**
 * Expand catalog keys into path_exclusions array.
 * @param {string[]} keys
 * @returns {PathExclusion[]}
 */
export function expandExclusionKeys(keys = []) {
  /** @type {PathExclusion[]} */
  const out = [];
  for (const key of keys) {
    const entry = PATH_EXCLUSION_CATALOG[key];
    if (!entry) continue;
    for (const pattern of entry.patterns) {
      out.push({ pattern, reason: entry.reason });
    }
  }
  return out;
}

/**
 * Build resolved scope from a rule-type definition.
 * @param {object|null} scopeDef
 * @returns {{ include_paths: string[], exclude_paths: string[], path_exclusions: PathExclusion[] }|null}
 */
export function buildPathScopeFromDef(scopeDef) {
  if (!scopeDef) return null;

  const path_exclusions = expandExclusionKeys(scopeDef.exclude_keys || []);
  const exclude_paths = path_exclusions.map((e) => e.pattern);

  return {
    include_paths: scopeDef.include_paths || ['*'],
    exclude_paths,
    path_exclusions,
  };
}

/**
 * Resolve path scope for a core policy at evaluation time.
 * @param {string} policyId
 * @param {string} ruleType
 * @returns {{ include_paths: string[], exclude_paths: string[], path_exclusions: PathExclusion[] }|null}
 */
export function resolveCorePolicyPathScope(policyId, ruleType) {
  const overrideType = CORE_POLICY_PATH_OVERRIDES[policyId];
  const effectiveType = overrideType || ruleType;
  const scopeDef = RULE_TYPE_PATH_SCOPE[effectiveType];
  return buildPathScopeFromDef(scopeDef);
}

/** Substrings used in security_patterns.yml for tests + docs (secrets rules keep scripts in scope). */
export const YAML_TESTS_DOCS_EXCLUDE_SUBSTRINGS = [
  '/test/',
  '/tests/',
  '/__tests__/',
  '.test.',
  '.spec.',
  '/mock/',
  '/docs/',
];

/** All exclude_path_substrings from code_quality YAML rules should be covered by this scope. */
export function getCodeQualityPathScopeForDriftCheck() {
  return buildPathScopeFromDef(RULE_TYPE_PATH_SCOPE.code_quality);
}

export { STANDARD_TOOLING_EXCLUDE_PATHS, STANDARD_TEST_EXCLUDE_PATHS };
