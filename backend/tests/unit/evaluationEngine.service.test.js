import { jest } from '@jest/globals';
import { EvaluationEngineService } from '../../src/services/evaluationEngine.service.js';

describe('EvaluationEngineService', () => {
  let engine;

  beforeEach(() => {
    engine = new EvaluationEngineService();
  });

  const mockFacts = {
    id: 'fact-123',
    data: {
      changes: {
        total_files: 5,
        files: [
          { path: 'src/auth/login.js', extension: '.js' },
          { path: 'tests/auth.test.js', extension: '.js', is_test_file: true }
        ]
      },
      metadata: {
        test_files_changed_count: 1,
        path_prefixes: ['src/auth', 'tests']
      }
    }
  };

  describe('Core Logic: Determinism and Aggregation', () => {
    test('should PASS if all policies pass', () => {
      const policies = [
        {
          policy_version_id: 'v1',
          level: 'MANDATORY',
          rules_logic: { type: 'coverage', min_tests: 1 }
        }
      ];

      const outcome = engine.evaluate(mockFacts, policies);
      expect(outcome.result).toBe('PASS');
      expect(outcome.rationale).toContain('All policies passed');
    });

    test('should BLOCK if a MANDATORY policy fails', () => {
      const policies = [
        {
          policy_version_id: 'v1',
          level: 'MANDATORY',
          rules_logic: { type: 'coverage', min_tests: 2 }
        }
      ];

      const outcome = engine.evaluate(mockFacts, policies);
      expect(outcome.result).toBe('BLOCK');
      expect(outcome.violated_policies).toHaveLength(1);
      expect(outcome.violated_policies[0].expected).toBe('>= 2');
    });

    test('should WARN if only ADVISORY/OVERRIDABLE policies fail with WARN', () => {
      const policies = [
        {
          policy_version_id: 'v1',
          level: 'ADVISORY',
          rules_logic: { type: 'pr_size', max_files: 2 }
        }
      ];

      const outcome = engine.evaluate(mockFacts, policies);
      expect(outcome.result).toBe('WARN');
    });

    test('should be deterministic: identical inputs produce identical hash', () => {
      const policies = [
        {
          policy_version_id: 'v1',
          level: 'MANDATORY',
          rules_logic: { type: 'coverage', min_tests: 1 }
        }
      ];

      const res1 = engine.evaluate(mockFacts, policies);
      const res2 = engine.evaluate(mockFacts, policies);
      
      expect(res1.evaluation_hash).toBe(res2.evaluation_hash);
      expect(res1.evaluation_hash).toBeDefined();
    });
  });

  describe('Checkers', () => {
    test('SecurityPathChecker: should block unauthorized path changes', () => {
      const policies = [
        {
          policy_version_id: 'v-sec',
          level: 'MANDATORY',
          rules_logic: { type: 'security_path', security_paths: ['src/auth/'] }
        }
      ];

      const outcome = engine.evaluate(mockFacts, policies);
      expect(outcome.result).toBe('BLOCK');
      expect(outcome.rationale).toContain('Unauthorized changes to security-sensitive paths');
    });

    test('FileExtensionChecker: should block forbidden extensions', () => {
      const policies = [
        {
          policy_version_id: 'v-ext',
          level: 'MANDATORY',
          rules_logic: { type: 'file_extension', allowed_extensions: ['.ts'] }
        }
      ];

      const outcome = engine.evaluate(mockFacts, policies);
      expect(outcome.result).toBe('BLOCK');
      expect(outcome.violated_policies[0].actual).toBe('.js');
    });

    test('PRSizeChecker: should warn on large PRs', () => {
      const policies = [
        {
          policy_version_id: 'v-size',
          level: 'ADVISORY',
          rules_logic: { type: 'pr_size', max_files: 2 }
        }
      ];

      const outcome = engine.evaluate(mockFacts, policies);
      expect(outcome.result).toBe('WARN');
      expect(outcome.violated_policies[0].actual).toBe('5');
    });
  });
});
