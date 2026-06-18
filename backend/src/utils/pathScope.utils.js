/**
 * Shared path scoping for policy evaluation, simulation, and pattern matching.
 * Single source of truth — live PR gating and simulation must use these helpers.
 */
import { minimatch } from 'minimatch';

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

const CLI_PATH_RE = /(^|\/)(scripts|bin|tools|cmd)(\/|$)/i;
const TEST_PATH_RE =
  /\/__tests__\/|\/tests?\/|\.(test|spec)\.|_test\.(py|go|rs)$|^test_.*\.py$/i;

/**
 * @param {string} p
 * @returns {string}
 */
export function normalizePath(p) {
  if (!p || typeof p !== 'string') return '';
  let normalized = p.trim().replace(/\\/g, '/');
  if (normalized.startsWith('./')) normalized = normalized.slice(2);
  return normalized.toLowerCase();
}

/**
 * @param {string} filePath
 * @param {string} pattern
 * @returns {boolean}
 */
export function pathMatchesGlob(filePath, pattern) {
  if (!pattern || typeof pattern !== 'string') return false;
  const norm = normalizePath(filePath);
  const pat = pattern.trim().replace(/\\/g, '/');
  if (pat === '*') return true;
  return minimatch(norm, pat.toLowerCase(), { matchBase: true, dot: true });
}

/**
 * @param {string} filePath
 * @param {string[]} patterns
 * @returns {boolean}
 */
export function pathMatchesAny(filePath, patterns) {
  if (!patterns || !Array.isArray(patterns) || patterns.length === 0) return false;
  return patterns.some((p) => pathMatchesGlob(filePath, p));
}

/**
 * @param {string} filePath
 * @returns {boolean}
 */
export function isToolingPath(filePath) {
  const norm = (filePath || '').replace(/\\/g, '/');
  return CLI_PATH_RE.test(norm) || /\/docs\//i.test(norm);
}

/**
 * @param {string} filePath
 * @returns {boolean}
 */
export function isTestOrMockPath(filePath) {
  const norm = (filePath || '').replace(/\\/g, '/').toLowerCase();
  return TEST_PATH_RE.test(norm) || /\/mock\//i.test(norm) || /\/e2e\//i.test(norm);
}

/**
 * @param {object} scopeRules
 * @returns {{ include_paths: string[], exclude_paths: string[] }}
 */
export function resolveScopeRules(scopeRules = {}) {
  const include = scopeRules.include_paths;
  const exclude = scopeRules.exclude_paths;
  return {
    include_paths: Array.isArray(include) && include.length > 0 ? include : ['*'],
    exclude_paths: Array.isArray(exclude) ? exclude : [],
  };
}

/**
 * Whether a YAML/policy path scope includes this file (exclude wins).
 * @param {string} filePath
 * @param {object} scopeRules
 * @returns {boolean}
 */
export function pathInScope(filePath, scopeRules = {}) {
  return getReasonForSkip(filePath, scopeRules).inScope;
}

/**
 * Negative-match transparency: why a path was skipped or included.
 * @param {string} filePath
 * @param {object} scopeRules
 * @param {object} [context]
 * @returns {{ inScope: boolean, reason: string, matchedPattern?: string, matchType?: string }}
 */
export function getReasonForSkip(filePath, scopeRules = {}, context = {}) {
  const norm = normalizePath(filePath);
  if (!norm) {
    return { inScope: false, reason: 'Empty or invalid path', matchType: 'invalid' };
  }

  const { include_paths, exclude_paths } = resolveScopeRules(scopeRules);

  for (const pat of exclude_paths) {
    if (pat != null && String(pat).length > 0 && pathMatchesGlob(norm, String(pat))) {
      const patStr = String(pat);
      const pathExclusions = scopeRules.path_exclusions;
      const entry =
        Array.isArray(pathExclusions) &&
        pathExclusions.find((e) => e?.pattern && pathMatchesGlob(norm, String(e.pattern)));
      return {
        inScope: false,
        reason: entry?.reason ?? 'Excluded by exclude_paths',
        matchedPattern: patStr,
        matchType: 'exclude',
      };
    }
  }

  const includeList = include_paths.filter((p) => p !== '*');
  if (includeList.length > 0) {
    const matched = includeList.find((p) => pathMatchesGlob(norm, p));
    if (!matched) {
      return {
        inScope: false,
        reason: 'Not in include_paths',
        matchedPattern: includeList[0],
        matchType: 'include',
      };
    }
  }

  const excludeSubstrings =
    scopeRules.exclude_path_substrings ||
    scopeRules.exclude_path_patterns ||
    context.exclude_path_substrings;
  if (excludeSubstrings && Array.isArray(excludeSubstrings)) {
    for (const sub of excludeSubstrings) {
      if (sub != null && String(sub).length > 0 && norm.includes(String(sub).toLowerCase())) {
        return {
          inScope: false,
          reason: 'Excluded by exclude_path_substrings',
          matchedPattern: String(sub),
          matchType: 'extension',
        };
      }
    }
  }

  const includeExt = scopeRules.include_extensions || context.include_extensions;
  if (includeExt && Array.isArray(includeExt) && includeExt.length > 0) {
    const extList = includeExt.map((e) => {
      const s = String(e).toLowerCase();
      return s.startsWith('.') ? s : `.${s}`;
    });
    const matches = extList.some((ext) => norm.endsWith(ext));
    if (!matches) {
      return {
        inScope: false,
        reason: 'Extension not in include_extensions',
        matchedPattern: extList.join(', '),
        matchType: 'extension',
      };
    }
  }

  if (context.unsupported_file_kind) {
    return {
      inScope: false,
      reason: `File kind ${context.unsupported_file_kind} not supported for this policy`,
      matchType: 'file_kind',
    };
  }

  return { inScope: true, reason: 'In scope', matchType: 'in_scope' };
}

/**
 * @param {Array<{ path?: string, filePath?: string }>} files
 * @param {object} scopeRules
 * @returns {{ files: object[], skipReasons: Array<{ path: string, reason: string, matchedPattern?: string, matchType?: string }> }}
 */
export function filterFilesByScope(files, scopeRules = {}) {
  const hasCustomScope =
    (Array.isArray(scopeRules.include_paths) && scopeRules.include_paths.length > 0 && scopeRules.include_paths[0] !== '*') ||
    (Array.isArray(scopeRules.exclude_paths) && scopeRules.exclude_paths.length > 0);

  if (!hasCustomScope) {
    return { files: files || [], skipReasons: [] };
  }

  const kept = [];
  const skipReasons = [];

  for (const f of files || []) {
    const p = f.path || f.filePath;
    if (!p) continue;
    const skip = getReasonForSkip(p, scopeRules);
    if (skip.inScope) {
      kept.push(f);
    } else {
      skipReasons.push({ path: p, ...skip });
    }
  }

  return { files: kept, skipReasons };
}

/**
 * PR-level policy applicability from changed paths.
 * @param {{ rules: object, changedPaths: string[] }}
 */
export function evaluatePolicyApplicability({ rules = {}, changedPaths = [] }) {
  const paths = (changedPaths || []).filter(Boolean);
  if (paths.length === 0) {
    return { applicable: false, skipReasons: [], triggerPath: null };
  }

  const skipReasons = [];
  let triggerPath = null;

  for (const p of paths) {
    const skip = getReasonForSkip(p, rules);
    if (skip.inScope) {
      triggerPath = p;
      return { applicable: true, skipReasons, triggerPath };
    }
    skipReasons.push({ path: p, ...skip });
  }

  return { applicable: false, skipReasons, triggerPath: null };
}
