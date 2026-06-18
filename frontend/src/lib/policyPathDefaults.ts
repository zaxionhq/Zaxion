/**
 * Mirror of backend STANDARD_* path defaults for policy creation UI.
 * Keep in sync with backend/src/utils/pathScope.utils.js
 */
export const STANDARD_TOOLING_EXCLUDE_PATHS = [
  'scripts/**',
  'bin/**',
  'tools/**',
  'cmd/**',
  'docs/**',
  '**/*.md',
  '**/*.html',
  '**/*.yml',
  '**/*.yaml',
];

export const STANDARD_TEST_EXCLUDE_PATHS = [
  '**/test/**',
  '**/tests/**',
  '**/__tests__/**',
  '**/*.test.*',
  '**/*.spec.*',
  '**/mock/**',
  '**/e2e/**',
];

export const STANDARD_SECURITY_EXCLUDE_PATHS = [
  ...STANDARD_TOOLING_EXCLUDE_PATHS,
  ...STANDARD_TEST_EXCLUDE_PATHS,
];

export const POLICY_TEMPLATE_DEFAULTS: Record<string, { include_paths?: string[]; exclude_paths?: string[] }> = {
  security_patterns: {
    include_paths: ['src/**', 'lib/**', 'app/**'],
    exclude_paths: [...STANDARD_SECURITY_EXCLUDE_PATHS],
  },
  security_path: {
    include_paths: ['*'],
    exclude_paths: [...STANDARD_TOOLING_EXCLUDE_PATHS],
  },
  code_quality: {
    include_paths: ['src/**', 'lib/**', 'packages/*/src/**'],
    exclude_paths: [...STANDARD_SECURITY_EXCLUDE_PATHS],
  },
  coverage: {
    include_paths: ['*'],
    exclude_paths: [...STANDARD_TOOLING_EXCLUDE_PATHS],
  },
};

export function applyTemplatePathDefaults(
  rulesType: string,
  rules: Record<string, unknown>,
  pathScopeTouched: boolean
): Record<string, unknown> {
  if (pathScopeTouched) return rules;
  const defaults = POLICY_TEMPLATE_DEFAULTS[rulesType];
  if (!defaults) return rules;
  return {
    ...rules,
    include_paths: rules.include_paths ?? defaults.include_paths,
    exclude_paths: rules.exclude_paths ?? defaults.exclude_paths,
  };
}
