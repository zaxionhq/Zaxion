/**
 * Merges applicability metadata into policy rules from policyMapper output.
 */
import { POLICY_APPLICABILITY_DEFAULTS } from '../../config/policyReportSections.js';

/**
 * @param {object} rules from mapCorePolicyToRules
 * @returns {object}
 */
export function enrichRulesWithApplicability(rules) {
  const type = rules?.type;
  if (!type) return rules;

  const defaults = POLICY_APPLICABILITY_DEFAULTS[type];
  if (!defaults) return rules;

  return {
    ...rules,
    supported_languages: rules.supported_languages || defaults.supported_languages,
    supported_file_kinds: rules.supported_file_kinds || defaults.supported_file_kinds,
    required_depth: rules.required_depth || defaults.required_depth,
    fallback_behavior: rules.fallback_behavior || 'run_legacy',
  };
}
