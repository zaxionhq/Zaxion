/**
 * User-facing PR governance report sections and check rows.
 * Maps internal rule types to collapsed checklist lines (GitHub + app UI).
 */

/** @typedef {'pending'|'running'|'passed'|'warn'|'failed'|'skipped'} ReportRowState */

/**
 * @type {Array<{ id: string, label: string, order: number, checks: Array<{ id: string, label: string, rule_types: string[] }> }>}
 */
export const REPORT_SECTIONS = [
  {
    id: 'security',
    label: 'Security',
    order: 1,
    checks: [
      { id: 'hardcoded_secrets', label: 'Hardcoded secrets scan', rule_types: ['no_hardcoded_secrets'] },
      { id: 'sql_patterns', label: 'Risky SQL patterns scan', rule_types: ['no_sql_injection'] },
      { id: 'security_patterns', label: 'Security patterns scan', rule_types: ['security_patterns', 'no_eval', 'no_xss', 'no_unsafe_regex'] },
      { id: 'supply_chain', label: 'Dependency & supply chain', rule_types: ['dependency_scan', 'supply_chain_integrity'] },
    ],
  },
  {
    id: 'architecture',
    label: 'Architecture',
    order: 2,
    checks: [
      { id: 'architecture', label: 'Architecture & dependencies', rule_types: ['architecture', 'architectural_integrity', 'api'] },
    ],
  },
  {
    id: 'reliability',
    label: 'Reliability',
    order: 3,
    checks: [
      { id: 'reliability', label: 'Error handling & reliability', rule_types: ['reliability'] },
    ],
  },
  {
    id: 'code_quality',
    label: 'Code quality',
    order: 4,
    checks: [
      { id: 'code_quality', label: 'Code quality & style', rule_types: ['code_quality', 'complexity_metrics', 'institutional_style', 'documentation', 'no_magic_numbers'] },
    ],
  },
  {
    id: 'testing',
    label: 'Testing',
    order: 5,
    checks: [
      { id: 'testing', label: 'Testing & coverage', rule_types: ['coverage', 'testing_best_practices'] },
    ],
  },
  {
    id: 'governance',
    label: 'Governance',
    order: 6,
    checks: [
      { id: 'governance', label: 'Deterministic governance rules', rule_types: ['pr_size', 'mandatory_review', 'core_enforcement'] },
      { id: 'protocol_compliance', label: 'Protocol level compliance', rule_types: ['performance', 'hardcoded_urls'] },
    ],
  },
];

/** Rule type → applicability metadata (incremental router) */
export const POLICY_APPLICABILITY_DEFAULTS = {
  no_hardcoded_secrets: { supported_languages: ['javascript', 'typescript'], supported_file_kinds: ['source'], required_depth: 'selective_deep' },
  no_sql_injection: { supported_languages: ['javascript', 'typescript'], supported_file_kinds: ['source'], required_depth: 'selective_deep' },
  security_patterns: { supported_languages: ['javascript', 'typescript'], supported_file_kinds: ['source'], required_depth: 'selective_deep' },
  supply_chain_integrity: { supported_languages: ['*'], supported_file_kinds: ['manifest', 'workflow', 'infrastructure'], required_depth: 'shallow' },
  dependency_scan: { supported_languages: ['*'], supported_file_kinds: ['manifest', 'lockfile'], required_depth: 'shallow' },
  reliability: { supported_languages: ['javascript', 'typescript'], supported_file_kinds: ['source'], required_depth: 'full_fallback' },
  code_quality: { supported_languages: ['javascript', 'typescript'], supported_file_kinds: ['source'], required_depth: 'shallow' },
  complexity_metrics: { supported_languages: ['javascript', 'typescript'], supported_file_kinds: ['source'], required_depth: 'shallow' },
  documentation: { supported_languages: ['javascript', 'typescript'], supported_file_kinds: ['source'], required_depth: 'shallow' },
  architecture: { supported_languages: ['javascript', 'typescript'], supported_file_kinds: ['source'], required_depth: 'shallow' },
  coverage: { supported_languages: ['javascript', 'typescript'], supported_file_kinds: ['source', 'test'], required_depth: 'shallow' },
  testing_best_practices: { supported_languages: ['javascript', 'typescript'], supported_file_kinds: ['source', 'test'], required_depth: 'shallow' },
  pr_size: { supported_languages: ['*'], supported_file_kinds: ['*'], required_depth: 'shallow' },
  mandatory_review: { supported_languages: ['*'], supported_file_kinds: ['*'], required_depth: 'shallow' },
};
