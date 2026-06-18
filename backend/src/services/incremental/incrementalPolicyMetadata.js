/**
 * Merges applicability metadata into policy rules from policyMapper output.
 */
import { POLICY_APPLICABILITY_DEFAULTS } from '../../config/policyReportSections.js';
import { resolveCorePolicyPathScope } from '../../config/corePolicyPathScope.js';

/**
 * @param {object} rules from mapCorePolicyToRules
 * @returns {object}
 */
export function enrichRulesWithApplicability(rules) {
  const type = rules?.type;
  if (!type) return rules;

  const defaults = POLICY_APPLICABILITY_DEFAULTS[type];
  const enriched = defaults
    ? {
        ...rules,
        supported_languages: rules.supported_languages || defaults.supported_languages,
        supported_file_kinds: rules.supported_file_kinds || defaults.supported_file_kinds,
        required_depth: rules.required_depth || defaults.required_depth,
        fallback_behavior: rules.fallback_behavior || 'run_legacy',
      }
    : { ...rules };

  const pathScope = resolveCorePolicyPathScope(rules.id, type);
  if (!pathScope) return enriched;

  return {
    ...enriched,
    include_paths: rules.include_paths ?? pathScope.include_paths,
    exclude_paths: rules.exclude_paths ?? pathScope.exclude_paths,
    path_exclusions: pathScope.path_exclusions,
  };
}
