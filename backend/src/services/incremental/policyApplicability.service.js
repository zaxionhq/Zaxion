/**
 * Determines whether a policy should run for a given file language/kind.
 */
import { POLICY_APPLICABILITY_DEFAULTS } from '../../config/policyReportSections.js';
import { classifyFileKind, detectLanguageFromPath } from './fileKindClassifier.service.js';

/**
 * @param {string} policyType
 * @returns {object}
 */
export function getApplicabilityDefaults(policyType) {
  return POLICY_APPLICABILITY_DEFAULTS[policyType] || {
    supported_languages: ['javascript', 'typescript'],
    supported_file_kinds: ['source'],
    required_depth: 'full_fallback',
    fallback_behavior: 'run_legacy',
  };
}

function matchesList(value, list) {
  if (!list || !Array.isArray(list) || list.length === 0) return true;
  if (list.includes('*')) return true;
  return list.includes(value);
}

/**
 * @param {object} params
 * @param {string} params.policyType
 * @param {string} [params.filePath]
 * @param {object} [params.metadata] - optional policy metadata overrides
 * @returns {{ action: 'run'|'skip'|'fallback', skip_reason?: string }}
 */
export function resolveApplicability({ policyType, filePath, metadata = {} }) {
  const defaults = getApplicabilityDefaults(policyType);
  const langs = metadata.supported_languages || defaults.supported_languages;
  const kinds = metadata.supported_file_kinds || defaults.supported_file_kinds;

  if (!filePath) {
    return { action: 'run' };
  }

  const language = detectLanguageFromPath(filePath);
  const fileKind = classifyFileKind(filePath);

  if (!matchesList(language, langs)) {
    return { action: 'skip', skip_reason: 'inapplicable_language' };
  }
  if (!matchesList(fileKind, kinds)) {
    return { action: 'skip', skip_reason: 'inapplicable_file_kind' };
  }

  const depth = metadata.required_depth || defaults.required_depth;
  if (depth === 'full_fallback') {
    return { action: 'fallback' };
  }
  return { action: 'run' };
}

/**
 * Whether policy should run for ANY file in the change set (PR-level gate).
 * @param {string} policyType
 * @param {Array<{ path?: string }>} files
 * @param {object} [metadata]
 */
export function isPolicyApplicableToChangeSet(policyType, files, metadata = {}) {
  const active = (files || []).filter((f) => f?.path);
  if (active.length === 0) return { applicable: true };

  for (const f of active) {
    const r = resolveApplicability({ policyType, filePath: f.path, metadata });
    if (r.action === 'run' || r.action === 'fallback') {
      return { applicable: true };
    }
  }

  return { applicable: false, skip_reason: 'inapplicable_change_set' };
}

export class PolicyApplicabilityService {
  resolve(params) {
    return resolveApplicability(params);
  }

  isApplicableToChangeSet(policyType, files, metadata) {
    return isPolicyApplicableToChangeSet(policyType, files, metadata);
  }
}
