import { jest } from '@jest/globals';
import { mapCorePolicyToRules } from '../../src/utils/policyMapper.js';

describe('PolicyMapper', () => {
  test('should map SEC-001 to no_hardcoded_secrets', () => {
    const rules = mapCorePolicyToRules('SEC-001');
    expect(rules.type).toBe('no_hardcoded_secrets');
  });

  test('should map SEC-002 to no_sql_injection', () => {
    const rules = mapCorePolicyToRules('SEC-002');
    expect(rules.type).toBe('no_sql_injection');
  });

  test('should map SEC-003 to no_xss', () => {
    const rules = mapCorePolicyToRules('SEC-003');
    expect(rules.type).toBe('no_xss');
  });

  test('should map GOV-001 to pr_size with max_files: 20', () => {
    const rules = mapCorePolicyToRules('GOV-001');
    expect(rules.type).toBe('pr_size');
    expect(rules.max_files).toBe(20);
  });

  test('should map GOV-002 to coverage with min_coverage_ratio: 0.8', () => {
    const rules = mapCorePolicyToRules('GOV-002');
    expect(rules.type).toBe('coverage');
    expect(rules.min_coverage_ratio).toBe(0.8);
  });

  test('should return core_enforcement for unknown IDs', () => {
    const rules = mapCorePolicyToRules('UNKNOWN-001', 'WARN');
    expect(rules.type).toBe('core_enforcement');
    expect(rules.id).toBe('UNKNOWN-001');
    expect(rules.severity).toBe('WARN');
  });

  test('should allow overriding severity', () => {
    const rules = mapCorePolicyToRules('SEC-001', 'WARN');
    expect(rules.severity).toBe('WARN');
  });
});
