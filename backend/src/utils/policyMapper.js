// backend/src/utils/policyMapper.js

/**
 * Maps static Core Policy IDs (e.g. SEC-001) to the structured rule logic 
 * that the EvaluationEngine understands.
 */
export function mapCorePolicyToRules(policyId, severity = 'BLOCK') {
  const policyMap = {
    'SEC-001': { type: 'security_patterns', patterns: ['no-hardcoded-secrets'] },
    'SEC-002': { type: 'security_patterns', patterns: ['no-hardcoded-configuration'] },
    'SEC-003': { type: 'security_patterns', patterns: ['no-magic-numbers'] },
    'SEC-004': { type: 'dependency_scan' },
    'SEC-005': { type: 'security_patterns', patterns: ['no-eval'] },
    'SEC-006': { type: 'security_patterns', patterns: ['no-unsafe-regex'] },
    'SEC-007': { type: 'security_patterns', patterns: ['no-sql-injection'] },
    'SEC-008': { type: 'security_patterns', patterns: ['no-xss'] },
    'REL-001': { type: 'reliability' },
    'COD-001': { type: 'code_quality' },
    'COD-002': { type: 'documentation' },
    'GOV-001': { type: 'pr_size', max_files: 20 },
    'GOV-002': { type: 'coverage', min_coverage_ratio: 0.8 },
    'GOV-003': { type: 'mandatory_review', min_approvals: 1 },
  };

  const rules = policyMap[policyId];
  if (!rules) {
    return { type: 'core_enforcement', id: policyId, severity };
  }

  return {
    ...rules,
    id: policyId,
    severity: severity || 'BLOCK'
  };
}
