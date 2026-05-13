import { describe, it, expect } from '@jest/globals';
import { mapCorePolicyToRules } from '../../src/utils/policyMapper.js';
import { EvaluationEngineService } from '../../src/services/evaluationEngine.service.js';
import {
  evaluateSupplyChainIntegrity,
  findUnpinnedUses,
  analyzeWorkflowPermissions,
  findDockerFromWithoutDigest,
  checkLockfileHygiene,
  isPrivilegedWorkflow,
  packageJsonDependencyTouchedInPatch,
} from '../../src/utils/supplyChainIntegrity.js';

describe('supplyChainIntegrity helpers', () => {
  it('findUnpinnedUses flags @main', () => {
    const yml = `jobs:\n  x:\n    steps:\n      - uses: actions/checkout@main\n`;
    const u = findUnpinnedUses(yml, '.github/workflows/x.yml');
    expect(u.length).toBeGreaterThan(0);
    expect(u[0].kind).toBe('branch');
  });

  it('findUnpinnedUses passes full SHA', () => {
    const yml =
      'jobs:\n  x:\n    steps:\n      - uses: actions/checkout@82545a16c511843fcb00e6fe6cd3b015f50420be\n';
    expect(findUnpinnedUses(yml, 'w.yml')).toHaveLength(0);
  });

  it('analyzeWorkflowPermissions detects write-all', () => {
    const perm = analyzeWorkflowPermissions('permissions: write-all\n');
    expect(perm.risk).toBe('high');
  });

  it('findDockerFromWithoutDigest flags tag-only FROM', () => {
    const d = findDockerFromWithoutDigest('FROM node:20-alpine\n', 'Dockerfile');
    expect(d.length).toBe(1);
  });

  it('checkLockfileHygiene warns when package.json without lockfile in change set', () => {
    const files = [{ path: 'package.json', status: 'modified' }];
    const pathSet = new Set(['package.json']);
    const v = checkLockfileHygiene(files, pathSet);
    expect(v.length).toBe(1);
    expect(v[0].severity).toBe('WARN');
  });

  it('checkLockfileHygiene passes when lockfile present', () => {
    const files = [{ path: 'package.json', status: 'modified' }];
    const pathSet = new Set(['package.json', 'package-lock.json']);
    expect(checkLockfileHygiene(files, pathSet)).toHaveLength(0);
  });

  it('checkLockfileHygiene skips package.json when only scripts change (patch)', () => {
    const patch = `@@ -10,6 +10,8 @@
       "format": "prettier --write .",
+      "test": "node --test $(find docs/scripts -name '*.test.js' -print)",
+      "test:coverage": "node --test --experimental-test-coverage $(find docs/scripts -name '*.test.js' -print)",
       "verify": "npm run format"
`;
    const files = [{ path: 'package.json', status: 'modified', patch }];
    const pathSet = new Set(['package.json']);
    expect(checkLockfileHygiene(files, pathSet)).toHaveLength(0);
  });

  it('checkLockfileHygiene warns package.json when dependency version changes in patch', () => {
    const patch = `@@ -20,7 +20,7 @@
   "dependencies": {
-    "lodash": "^4.17.20"
+    "lodash": "^4.17.21"
   }
`;
    const files = [{ path: 'package.json', status: 'modified', patch }];
    const pathSet = new Set(['package.json']);
    const v = checkLockfileHygiene(files, pathSet);
    expect(v.length).toBe(1);
    expect(v[0].severity).toBe('WARN');
  });

  it('checkLockfileHygiene skips package.json when content present but no patch (cannot prove dep churn)', () => {
    const files = [
      {
        path: 'package.json',
        status: 'modified',
        content: '{"scripts":{"test":"node --test"},"dependencies":{"x":"1.0.0"}}',
      },
    ];
    const pathSet = new Set(['package.json']);
    expect(checkLockfileHygiene(files, pathSet)).toHaveLength(0);
  });

  it('packageJsonDependencyTouchedInPatch detects devDependencies block', () => {
    const patch = '+  "devDependencies": {\n+    "vitest": "^1.0.0"\n+  }';
    expect(packageJsonDependencyTouchedInPatch(patch)).toBe(true);
  });

  it('packageJsonDependencyTouchedInPatch is false for scripts-only diff', () => {
    const patch = '+    "test": "node --test $(find . -name \'*.js\' -print)"';
    expect(packageJsonDependencyTouchedInPatch(patch)).toBe(false);
  });

  it('isPrivilegedWorkflow detects deploy in path', () => {
    expect(isPrivilegedWorkflow('.github/workflows/deploy-prod.yml', '')).toBe(true);
  });
});

describe('evaluateSupplyChainIntegrity', () => {
  it('returns PASS when no relevant files', () => {
    const r = evaluateSupplyChainIntegrity([{ path: 'README.md', content: '# hi' }], mapCorePolicyToRules('OPS-001'));
    expect(r.verdict).toBe('PASS');
  });

  it('BLOCK on privileged workflow with broad permissions and mutable action ref', () => {
    const wf = `name: deploy-prod
on:
  push:
    branches: [main]
permissions: write-all
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@main
`;
    const r = evaluateSupplyChainIntegrity(
      [{ path: '.github/workflows/deploy-prod.yml', content: wf, status: 'modified' }],
      mapCorePolicyToRules('OPS-001')
    );
    expect(r.verdict).toBe('BLOCK');
    expect(r.details.violations.some((v) => v.severity === 'BLOCK')).toBe(true);
  });

  it('WARN on Dockerfile without digest', () => {
    const r = evaluateSupplyChainIntegrity(
      [{ path: 'Dockerfile', content: 'FROM python:3.12-slim\n', status: 'added' }],
      mapCorePolicyToRules('OPS-001')
    );
    expect(r.verdict).toBe('WARN');
  });
});

describe('OPS-001 EvaluationEngine integration', () => {
  it('runs supply_chain_integrity checker via evaluate()', () => {
    const engine = new EvaluationEngineService();
    const wf = `name: ci
on: push
jobs:
  x:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
`;
    const snapshot = {
      id: 'test',
      data: {
        changes: {
          files: [{ path: '.github/workflows/ci.yml', content: wf }],
        },
      },
    };
    const rules = mapCorePolicyToRules('OPS-001');
    const out = engine.evaluate(snapshot, [
      {
        policy_id: 'OPS-001',
        policy_version_id: 'core-OPS-001-v1',
        level: 'ADVISORY',
        rules_logic: rules,
      },
    ]);
    expect(['WARN', 'BLOCK', 'PASS']).toContain(out.final_verdict);
    expect(out.policy_results.some((p) => p.policy_type === 'supply_chain_integrity')).toBe(true);
    expect(out.final_verdict).not.toBe('PASS');
  });
});
