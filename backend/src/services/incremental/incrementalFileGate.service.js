/**
 * Per-file policy applicability gates (router + enforcement).
 */
import { classifyFileKind, detectLanguageFromPath } from './fileKindClassifier.service.js';
import { getApplicabilityDefaults } from './policyApplicability.service.js';
import { isIncrementalAuthorityActive } from './incrementalCanary.service.js';
import { incrementalFlags } from './incrementalFeatureFlags.service.js';

/**
 * @param {string} filePath
 * @param {string} policyType
 * @param {object} [rules]
 * @param {object} [context] owner, repo
 */
export function shouldScanFileForPolicy(filePath, policyType, rules = {}, context = {}) {
  const routerOn = incrementalFlags.isRouterEnabled();
  const authorityOn = isIncrementalAuthorityActive(context);
  if (!routerOn && !authorityOn) return true;

  const defaults = getApplicabilityDefaults(policyType);
  const kinds = rules.supported_file_kinds || defaults?.supported_file_kinds || ['*'];
  const langs = rules.supported_languages || defaults?.supported_languages || ['*'];
  const kind = classifyFileKind(filePath);
  const lang = detectLanguageFromPath(filePath);

  if (!kinds.includes('*') && !kinds.includes(kind)) return false;
  if (!langs.includes('*') && !langs.includes(lang)) return false;
  return true;
}

/**
 * @param {Array<{ path?: string, filePath?: string }>} files
 */
export function filterFilesForPolicy(files, policyType, rules = {}, context = {}) {
  return (files || []).filter((f) => {
    const p = f.path || f.filePath;
    return p && shouldScanFileForPolicy(p, policyType, rules, context);
  });
}
