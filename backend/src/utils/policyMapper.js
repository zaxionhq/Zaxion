// backend/src/utils/policyMapper.js

/**
 * Maps static Core Policy IDs (e.g. SEC-001) to the structured rule logic 
 * that the EvaluationEngine understands.
 */
export function mapCorePolicyToRules(policyId, severity = 'BLOCK') {
  const policyMap = {
    'SEC-001': { type: 'no_hardcoded_secrets' }, // Semantic Engine
    'SEC-002': { type: 'hardcoded_urls' }, // Semantic Engine
    'SEC-003': { type: 'no_magic_numbers' }, // Semantic Engine
    'SEC-004': { type: 'dependency_scan' },
    'SEC-005': { type: 'no_eval' }, // Semantic Engine
    'SEC-006': { type: 'no_unsafe_regex' }, // Semantic Engine
    'SEC-007': { type: 'no_sql_injection' }, // Semantic Engine
    'SEC-008': { type: 'no_xss' }, // Semantic Engine
    'REL-001': { type: 'reliability' },
    'COD-001': { type: 'code_quality' },
    'COD-002': { type: 'documentation' },
    'GOV-001': { type: 'pr_size', max_files: 20 },
    'GOV-002': { type: 'coverage', min_coverage_ratio: 0.8 },
    'GOV-003': { type: 'mandatory_review', min_approvals: 1 },
  };

  if (!Object.prototype.hasOwnProperty.call(policyMap, policyId)) {
    return { type: 'core_enforcement', id: policyId, severity };
  }

  
  const rules = policyMap[policyId]; // eslint-disable-line security/detect-object-injection

  return {
    ...rules,
    id: policyId,
    severity: severity || 'BLOCK'
  };
}
