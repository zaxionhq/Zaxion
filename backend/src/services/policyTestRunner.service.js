import { EvaluationEngineService } from './evaluationEngine.service.js';
import logger from '../logger.js';

/**
 * Policy Test Runner
 * Executes policy tests against synthetic PR contexts and reports discrepancies.
 */
export class PolicyTestRunner {
  constructor(evaluationEngine = new EvaluationEngineService()) {
    this.evaluationEngine = evaluationEngine;
  }

  /**
   * Run a test scenario against a policy.
   * @param {object} policy - The policy object to test.
   * @param {object} syntheticContext - The synthetic PR context.
   * @param {string} expectedResult - 'PASS' or 'BLOCK'.
   * @returns {object} { status: 'PASS'|'FAIL', result: 'PASS'|'BLOCK', expected: 'PASS'|'BLOCK', violations: [] }
   */
  async runTest(policy, syntheticContext, expectedResult) {
    const logic = policy.rules_logic;
    
    // The EvaluationEngine.evaluate expects (factSnapshot, appliedPolicies[])
    // We wrap our synthetic context and policy to match this signature.
    const factSnapshot = { data: syntheticContext };
    
    // Ensure the policy object has the expected structure for the engine
    const normalizedPolicy = {
      ...policy,
      level: policy.level || 'MANDATORY',
      policy_version_id: policy.policy_version_id || 'test-version'
    };
    
    const appliedPolicies = [normalizedPolicy];

    const result = this.evaluationEngine.evaluate(factSnapshot, appliedPolicies);

    const isMatch = result.result === expectedResult;
    return {
      status: isMatch ? 'PASS' : 'FAIL',
      result: result.result,
      expected: expectedResult,
      violations: result.violations
    };
  }

  /**
   * Generate synthetic test contexts for a given policy type.
   * @param {object} logic - Policy rules logic.
   * @returns {object[]} Array of { context, expected }
   */
  generateTestScenarios(logic) {
    const scenarios = [];
    const type = logic.type;
    const id = logic.id;

    // Handle Core Policy mapping if it's a core_enforcement or has a known ID
    if (type === 'core_enforcement' || id === 'SEC-001') {
      scenarios.push({
        name: 'PR with secrets (SEC-001)',
        context: {
          totalChanges: 1,
          categories: { highRisk: [], tests: [], other: [] },
          files: [{ filename: 'app.js', content: 'const key = "sk-proj-12345678901234567890123456789012";' }],
          security: { secretsFound: [{ file: 'app.js', pattern: 'OpenAI' }] }
        },
        expected: 'BLOCK'
      });
      return scenarios;
    }

    switch (type) {
      case 'pr_size':
        scenarios.push({
          name: 'PR within size limit',
          context: { changes: { total_files: logic.max_files - 1 }, totalChanges: logic.max_files - 1, categories: { highRisk: [], tests: [], other: [] }, files: [] },
          expected: 'PASS'
        });
        scenarios.push({
          name: 'PR exceeding size limit',
          context: { changes: { total_files: logic.max_files + 1 }, totalChanges: logic.max_files + 1, categories: { highRisk: [], tests: [], other: [] }, files: [] },
          expected: 'WARN' // Engine returns WARN for pr_size
        });
        break;

      case 'coverage':
        scenarios.push({
          name: 'PR with tests',
          context: { 
            metadata: { test_files_changed_count: 1 },
            changes: { 
              high_risk_files: ['auth/login.js'], 
              test_files: ['auth/login.test.js'] 
            },
            totalChanges: 2, 
            categories: { highRisk: ['auth/login.js'], tests: ['auth/login.test.js'], other: [] }, 
            files: [] 
          },
          expected: 'PASS'
        });
        scenarios.push({
          name: 'PR without tests for high-risk files',
          context: { 
            metadata: { test_files_changed_count: 0 },
            changes: { 
              high_risk_files: ['auth/login.js'], 
              test_files: [] 
            },
            totalChanges: 1, 
            categories: { highRisk: ['auth/login.js'], tests: [], other: [] }, 
            files: [] 
          },
          expected: 'BLOCK'
        });
        break;

      case 'security_patterns':
        scenarios.push({
          name: 'PR with secrets',
          context: {
            totalChanges: 1,
            categories: { highRisk: [], tests: [], other: [] },
            files: [{ filename: 'app.js', content: 'const key = "sk-proj-12345678901234567890123456789012";' }],
            security: { secretsFound: [{ file: 'app.js', pattern: 'OpenAI' }] }
          },
          expected: 'BLOCK'
        });
        scenarios.push({
          name: 'Clean PR',
          context: {
            totalChanges: 1,
            categories: { highRisk: [], tests: [], other: [] },
            files: [{ filename: 'app.js', content: '"Hello World";' }],
            security: { secretsFound: [] }
          },
          expected: 'PASS'
        });
        break;
    }

    return scenarios;
  }
}
