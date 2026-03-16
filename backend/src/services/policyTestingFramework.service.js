import { PolicyValidatorService } from './policyValidator.service.js';
import { PolicyTestRunner } from './policyTestRunner.service.js';
import { CORE_POLICIES } from '../policies/corePolicies.js';
import logger from '../logger.js';

/**
 * Policy Testing Framework
 * Main interface for validating and testing existing and new policies.
 */
export class PolicyTestingFramework {
  constructor(db) {
    this.db = db;
    this.validator = new PolicyValidatorService();
    this.testRunner = new PolicyTestRunner();
  }

  /**
   * Validate and test all core policies.
   * @returns {Promise<object>} Detailed report.
   */
  async testCorePolicies() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: CORE_POLICIES.length,
        passed: 0,
        failed: 0,
        warnings: 0
      },
      results: []
    };

    for (const corePolicy of CORE_POLICIES) {
      const policyObj = { id: corePolicy.id, rules_logic: corePolicy, description: corePolicy.description };
      const validation = this.validator.validate(policyObj);
      const consistency = this.validator.checkConsistency(corePolicy.description, corePolicy);
      
      const result = {
        id: corePolicy.id,
        name: corePolicy.name,
        validation: validation.isValid ? 'VALID' : 'INVALID',
        consistency: consistency.isConsistent ? 'CONSISTENT' : 'INCONSISTENT',
        testScenarios: []
      };

      if (!validation.isValid) {
        report.summary.failed++;
        result.errors = validation.errors;
      } else {
        // Run synthetic test scenarios
        const scenarios = this.testRunner.generateTestScenarios(corePolicy);
        for (const scenario of scenarios) {
          const testResult = await this.testRunner.runTest(policyObj, scenario.context, scenario.expected);
          result.testScenarios.push({
            name: scenario.name,
            status: testResult.status,
            actual: testResult.result,
            expected: testResult.expected,
            violations: testResult.violations
          });

          if (testResult.status === 'FAIL') {
            report.summary.failed++;
          } else {
            report.summary.passed++;
          }
        }
      }

      if (!consistency.isConsistent) {
        report.summary.warnings++;
        result.warning = consistency.warning;
      }

      report.results.push(result);
    }

    return report;
  }

  /**
   * Validate a newly created policy before it's approved.
   * @param {object} policy - The policy object from DB.
   * @returns {Promise<object>} Validation report.
   */
  async validateNewPolicy(policy) {
    const validation = this.validator.validate(policy);
    const consistency = this.validator.checkConsistency(policy.description, policy.rules_logic);
    
    const scenarios = this.testRunner.generateTestScenarios(policy.rules_logic);
    const testResults = [];

    for (const scenario of scenarios) {
      const testResult = await this.testRunner.runTest(policy, scenario.context, scenario.expected);
      testResults.push({
        name: scenario.name,
        status: testResult.status,
        actual: testResult.result,
        expected: testResult.expected,
        violations: testResult.violations
      });
    }

    return {
      isValid: validation.isValid,
      errors: validation.errors,
      isConsistent: consistency.isConsistent,
      warning: consistency.warning,
      testResults
    };
  }
}
