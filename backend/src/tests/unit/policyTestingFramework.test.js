import { jest } from '@jest/globals';
import { PolicyTestingFramework } from '../../services/policyTestingFramework.service.js';
import { CORE_POLICIES } from '../../policies/corePolicies.js';

describe('PolicyTestingFramework', () => {
  let db;
  let framework;

  beforeEach(() => {
    db = {}; // Mock db
    framework = new PolicyTestingFramework(db);
  });

  describe('testCorePolicies', () => {
    it('should generate a report for all core policies', async () => {
      const report = await framework.testCorePolicies();
      expect(report.summary.total).toBe(CORE_POLICIES.length);
      expect(report.results.length).toBe(CORE_POLICIES.length);
    });

    it('should find SEC-001 (Secrets) and run test scenarios', async () => {
      const report = await framework.testCorePolicies();
      const sec001 = report.results.find(r => r.id === 'SEC-001');
      expect(sec001).toBeDefined();
      expect(sec001.validation).toBe('VALID');
      // SEC-001 is mapped to security_patterns in PolicyTestRunner for testing
      // Actually, we need to ensure the ID mapping is correct in the test runner
    });
  });

  describe('validateNewPolicy', () => {
    it('should validate a correct pr_size policy', async () => {
      const policy = {
        rules_logic: {
          type: 'pr_size',
          max_files: 20
        },
        description: 'Limit PR to 20 files'
      };

      const report = await framework.validateNewPolicy(policy);
      expect(report.isValid).toBe(true);
      expect(report.testResults.length).toBeGreaterThan(0);
      expect(report.testResults.every(r => r.status === 'PASS')).toBe(true);
    });

    it('should fail an invalid policy', async () => {
      const policy = {
        rules_logic: {
          type: 'pr_size',
          max_files: -5
        }
      };

      const report = await framework.validateNewPolicy(policy);
      expect(report.isValid).toBe(false);
      expect(report.errors).toContain('pr_size: max_files must be a positive number.');
    });

    it('should warn about inconsistent descriptions', async () => {
      const policy = {
        rules_logic: {
          type: 'pr_size',
          max_files: 20
        },
        description: 'Limit PR to 50 files'
      };

      const report = await framework.validateNewPolicy(policy);
      expect(report.isConsistent).toBe(false);
      expect(report.warning).toContain('max_files limit of 20');
    });
  });
});
