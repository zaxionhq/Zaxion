/**
 * Thin wrapper for policy path applicability — shared by live engine and simulation.
 */
import {
  evaluatePolicyApplicability,
  filterFilesByScope,
  getReasonForSkip,
  pathInScope,
} from '../utils/pathScope.utils.js';

export { evaluatePolicyApplicability, filterFilesByScope, getReasonForSkip, pathInScope };

/**
 * @param {object} rules
 * @param {string[]} changedPaths
 */
export function resolvePolicyPathApplicability(rules, changedPaths) {
  return evaluatePolicyApplicability({ rules, changedPaths });
}
