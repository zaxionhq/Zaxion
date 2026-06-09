import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { EvaluationEngineService } from '../../src/services/evaluationEngine.service.js';
import { mapCorePolicyToRules } from '../../src/utils/policyMapper.js';
import {
  clearIncrementalEnv,
  restoreIncrementalEnv,
  snapshotIncrementalEnv,
} from '../helpers/incrementalEnv.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = path.join(__dirname, '../fixtures/incremental-fp');

const POLICY_ID_BY_TYPE = {
  supply_chain_integrity: 'OPS-001',
  reliability: 'REL-001',
  code_quality: 'COD-002',
  security_patterns: 'SEC-005',
};

function loadFixtures() {
  const dirs = fs.readdirSync(FIXTURE_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  return dirs.map((dir) => {
    const raw = fs.readFileSync(path.join(FIXTURE_ROOT, dir, 'fact.json'), 'utf8');
    return JSON.parse(raw);
  });
}

function buildSnapshot(fixture) {
  return {
    id: `fixture-${fixture.name}`,
    data: {
      changes: { files: fixture.files },
      metadata: {},
    },
    evaluation_mode: 'BEST_EFFORT',
  };
}

function buildPolicy(fixture) {
  const policyId = POLICY_ID_BY_TYPE[fixture.policy_type] || 'COD-002';
  const rules = mapCorePolicyToRules(policyId, 'BLOCK');
  return {
    policy_id: policyId,
    policy_version_id: `core-${policyId}-v1`,
    level: 'MANDATORY',
    rules_logic: rules,
  };
}

function violationCount(result) {
  return (result.violations || []).length;
}

function setEnv(key, value) {
  if (value === undefined || value === null || value === '') delete process.env[key];
  else process.env[key] = value;
}

describe('incremental-fp regression suite', () => {
  const engine = new EvaluationEngineService();
  const fixtures = loadFixtures();
  let savedEnv;

  beforeEach(() => {
    savedEnv = snapshotIncrementalEnv();
    clearIncrementalEnv();
  });

  afterEach(() => {
    restoreIncrementalEnv(savedEnv);
  });

  for (const fixture of fixtures) {
    it(`${fixture.name}: incremental FP <= legacy`, () => {
      const snapshot = buildSnapshot(fixture);
      const policy = buildPolicy(fixture);

      setEnv('INCR_FORCE_LEGACY', '');
      setEnv('INCR_POLICY_ROUTER_ENABLED', '');
      setEnv('INCR_ENFORCEMENT_ENABLED', '');
      const legacy = engine.evaluate(snapshot, [policy]);

      setEnv('INCR_POLICY_ROUTER_ENABLED', 'true');
      setEnv('INCR_PARSE_ENABLED', 'true');
      const incremental = engine.evaluate(snapshot, [policy], {
        incrementalContext: { owner: 'acme', repo: 'demo' },
      });

      expect(violationCount(incremental)).toBeLessThanOrEqual(violationCount(legacy));

      if (fixture.expected_verdict) {
        expect(incremental.final_verdict).toBe(fixture.expected_verdict);
      }
    });
  }

  it('mixed-pr: each file only scanned by applicable policies', () => {
    const snapshot = {
      id: 'mixed',
      data: {
        changes: {
          files: [
            { path: 'src/app.ts', content: 'console.log("x");\n' },
            { path: 'src/util.py', content: 'print("y")\n' },
            { path: 'src/main.rs', content: 'fn main() { println!("z"); }\n' },
          ],
        },
        metadata: { evaluation_context: { owner: 'acme', repo: 'demo' } },
      },
    };
    const policy = buildPolicy({ policy_type: 'code_quality' });

    setEnv('INCR_POLICY_ROUTER_ENABLED', 'true');
    const result = engine.evaluate(snapshot, [policy]);
    const filesWithViolations = new Set((result.violations || []).map((v) => v.file));
    expect(filesWithViolations.has('package.json')).toBe(false);
    expect(filesWithViolations.has('src/util.py')).toBe(false);
    expect(filesWithViolations.has('src/main.rs')).toBe(false);
  });
});
