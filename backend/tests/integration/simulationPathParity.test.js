import { EvaluationEngineService } from '../../src/services/evaluationEngine.service.js';
import { PolicyEngineService } from '../../src/services/policyEngine.service.js';
import { PolicySimulationService } from '../../src/services/policySimulation.service.js';
import { mapCorePolicyToRules } from '../../src/utils/policyMapper.js';

describe('simulation path parity', () => {
  const engine = new EvaluationEngineService();

  const fixture = {
    data: {
      changes: {
        files: [
          { path: 'scripts/foo.mjs', content: "console.log('x');\n" },
          { path: 'src/app.ts', content: "console.log('y');\n" },
        ],
      },
      metadata: {},
    },
  };

  const rules = {
    type: 'code_quality',
    exclude_paths: ['scripts/**'],
    include_paths: ['*'],
  };

  const mockPolicy = {
    policy_id: 'test-policy',
    policy_version_id: 'v1',
    level: 'MANDATORY',
    rules_logic: rules,
  };

  it('evaluationEngine excludes scripts via exclude_paths', () => {
    const result = engine.evaluate(fixture, [mockPolicy]);
    const files = (result.violations || []).map((v) => v.file);
    expect(files).not.toContain('scripts/foo.mjs');
  });

  it('evaluatePolicyApplicability matches simulation skip for scripts-only', async () => {
    const { evaluatePolicyApplicability } = await import('../../src/services/policyPathScope.service.js');
    const scriptsOnly = evaluatePolicyApplicability({
      rules,
      changedPaths: ['scripts/foo.mjs'],
    });
    expect(scriptsOnly.applicable).toBe(false);
    expect(scriptsOnly.skipReasons[0].matchedPattern).toBe('scripts/**');
  });

  it('mapCorePolicyToRules COD-002 still runs on src console', () => {
    const coreRules = mapCorePolicyToRules('COD-002', 'WARN');
    const srcOnly = {
      data: {
        changes: { files: [{ path: 'src/app.ts', content: "console.log('z');\n" }] },
        metadata: {},
      },
    };
    const result = engine.evaluate(srcOnly, [{
      policy_id: 'COD-002',
      policy_version_id: 'core-COD-002-v1',
      level: 'MANDATORY',
      rules_logic: coreRules,
    }]);
    expect((result.violations || []).length).toBeGreaterThan(0);
  });

  it('core COD-002 excludes scripts but flags src console.log', () => {
    const coreRules = mapCorePolicyToRules('COD-002', 'WARN');
    const result = engine.evaluate(fixture, [{
      policy_id: 'COD-002',
      policy_version_id: 'core-COD-002-v1',
      level: 'MANDATORY',
      rules_logic: coreRules,
    }]);
    const files = (result.violations || []).map((v) => v.file);
    expect(files).not.toContain('scripts/foo.mjs');
    expect(files).toContain('src/app.ts');
  });
});
