import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import { mapCorePolicyToRules } from '../../src/utils/policyMapper.js';
import { CORE_POLICIES } from '../../src/policies/corePolicies.js';
import {
  resolveCorePolicyPathScope,
  getCodeQualityPathScopeForDriftCheck,
  YAML_TESTS_DOCS_EXCLUDE_SUBSTRINGS,
} from '../../src/config/corePolicyPathScope.js';
import { getReasonForSkip } from '../../src/utils/pathScope.utils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const YAML_PATH = path.join(__dirname, '../../src/config/policies/security_patterns.yml');

const CODE_QUALITY_YAML_POLICIES = [
  'no-console-logs-production',
  'no-magic-numbers',
  'no-debug-mode-production',
  'no-deprecated-apis',
];

/** Sample paths that contain a given YAML exclude_path_substring. */
const SUBSTRING_SAMPLE_PATHS = {
  '/scripts/': 'scripts/deploy.mjs',
  '/bin/': 'bin/run.sh',
  '/tools/': 'tools/helper.js',
  '/test/': 'src/test/helper.js',
  '/tests/': 'src/tests/helper.js',
  '/__tests__/': 'src/__tests__/helper.js',
  '.test.': 'src/foo.test.ts',
  '.spec.': 'src/foo.spec.ts',
  '/mock/': 'src/mock/data.js',
  '/docs/': 'docs/guide.md',
  'e2e/': 'e2e/smoke.spec.ts',
};

function collectYamlExcludeSubstrings(policies, policyNames) {
  const subs = new Set();
  for (const name of policyNames) {
    const policy = policies[name];
    if (!policy) continue;
    for (const sub of policy.exclude_path_substrings || []) {
      subs.add(sub);
    }
    for (const pattern of policy.patterns || []) {
      for (const sub of pattern.exclude_path_substrings || []) {
        subs.add(sub);
      }
    }
  }
  return [...subs];
}

describe('corePolicyPathScope', () => {
  it('resolves path scope for every shipped core policy except PR-level types', () => {
    const prLevelTypes = new Set(['pr_size', 'mandatory_review', 'core_enforcement']);
    for (const policy of CORE_POLICIES) {
      const rules = mapCorePolicyToRules(policy.id, policy.severity);
      if (prLevelTypes.has(rules.type)) {
        expect(rules.exclude_paths).toBeUndefined();
        continue;
      }
      const hasExcludeScope = (rules.exclude_paths?.length ?? 0) > 0;
      const hasIncludeScope =
        Array.isArray(rules.include_paths) &&
        rules.include_paths.length > 0 &&
        !rules.include_paths.includes('*');
      expect(hasExcludeScope || hasIncludeScope).toBe(true);
      if (rules.path_exclusions?.length) {
        expect(rules.path_exclusions.every((e) => e.pattern && e.reason)).toBe(true);
      }
    }
  });

  it('COD-002 excludes scripts with human-readable reason', () => {
    const rules = mapCorePolicyToRules('COD-002');
    expect(rules.exclude_paths).toContain('scripts/**');
    const skip = getReasonForSkip('scripts/foo.mjs', rules);
    expect(skip.inScope).toBe(false);
    expect(skip.reason).toContain('CLI and build tooling');
  });

  it('OPS-001 excludes src/** and includes workflow paths', () => {
    const rules = mapCorePolicyToRules('OPS-001');
    expect(rules.exclude_paths).toContain('src/**');
    expect(rules.include_paths).toContain('.github/workflows/**');
    expect(getReasonForSkip('src/app.ts', rules).inScope).toBe(false);
    expect(getReasonForSkip('.github/workflows/ci.yml', rules).inScope).toBe(true);
  });

  it('SEC-004 scopes to manifest paths only', () => {
    const rules = mapCorePolicyToRules('SEC-004');
    expect(rules.include_paths).toContain('package.json');
    expect(getReasonForSkip('package.json', rules).inScope).toBe(true);
    expect(getReasonForSkip('src/app.ts', rules).inScope).toBe(false);
  });

  it('security YAML tests/docs substrings match core no_hardcoded_secrets exclusions', () => {
    for (const sub of YAML_TESTS_DOCS_EXCLUDE_SUBSTRINGS) {
      const sample = SUBSTRING_SAMPLE_PATHS[sub] || `src/foo${sub}bar.ts`;
      const scope = resolveCorePolicyPathScope('SEC-001', 'no_hardcoded_secrets');
      expect(getReasonForSkip(sample, scope).inScope).toBe(false);
    }
  });

  it('code-quality YAML exclude_path_substrings are covered by core code_quality scope', () => {
    const raw = fs.readFileSync(YAML_PATH, 'utf8');
    const loaded = yaml.load(raw);
    const policies = loaded.policies || {};
    const yamlSubs = collectYamlExcludeSubstrings(policies, CODE_QUALITY_YAML_POLICIES);
    const coreScope = getCodeQualityPathScopeForDriftCheck();

    for (const sub of yamlSubs) {
      const sample = SUBSTRING_SAMPLE_PATHS[sub];
      expect(sample).toBeDefined();
      const skip = getReasonForSkip(sample, coreScope);
      expect(skip.inScope).toBe(false);
    }
  });
});
