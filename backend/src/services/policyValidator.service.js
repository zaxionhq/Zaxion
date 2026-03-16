import logger from '../logger.js';

/**
 * Policy Validator Service
 * Validates policy JSON against schemas and ensures semantic correctness.
 */
export class PolicyValidatorService {
  constructor() {
    this.VALID_TYPES = [
      'pr_size', 'coverage', 'security_path', 'file_extension', 
      'code_quality', 'documentation', 'architecture', 'reliability', 
      'performance', 'api', 'security_patterns', 'mandatory_review',
      'core_enforcement'
    ];
  }

  /**
   * Validate a policy's JSON structure and rules logic.
   * @param {object} policy - The policy object containing rules_logic.
   * @returns {object} { isValid: boolean, errors: string[] }
   */
  validate(policy) {
    const errors = [];
    const logic = policy.rules_logic;

    if (!logic) {
      errors.push('Policy rules_logic is missing.');
      return { isValid: false, errors };
    }

    // Allow core policies with ID instead of type
    if (policy.id && !logic.type) {
      return { isValid: true, errors: [] };
    }

    if (!logic.type || !this.VALID_TYPES.includes(logic.type)) {
      errors.push(`Invalid or missing policy type: ${logic.type}`);
    }

    // Type-specific validation
    switch (logic.type) {
      case 'pr_size':
        if (logic.max_files !== undefined && (typeof logic.max_files !== 'number' || logic.max_files <= 0)) {
          errors.push('pr_size: max_files must be a positive number.');
        }
        break;
      case 'coverage':
        if (logic.min_coverage_ratio !== undefined && (typeof logic.min_coverage_ratio !== 'number' || logic.min_coverage_ratio < 0 || logic.min_coverage_ratio > 1)) {
          errors.push('coverage: min_coverage_ratio must be between 0 and 1.');
        }
        break;
      case 'security_path':
        if (!Array.isArray(logic.security_paths) || logic.security_paths.length === 0) {
          errors.push('security_path: security_paths must be a non-empty array.');
        }
        break;
      case 'file_extension':
        if (!Array.isArray(logic.allowed_extensions) || logic.allowed_extensions.length === 0) {
          errors.push('file_extension: allowed_extensions must be a non-empty array.');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if the policy description matches its logical intent.
   * @param {string} description 
   * @param {object} logic 
   * @returns {object} { isConsistent: boolean, warning: string }
   */
  checkConsistency(description, logic) {
    if (!description) return { isConsistent: true };
    
    const desc = description.toLowerCase();
    let isConsistent = true;
    let warning = '';

    if (logic.type === 'pr_size' && logic.max_files && !desc.includes(logic.max_files.toString())) {
      warning = `Description might not reflect max_files limit of ${logic.max_files}.`;
      isConsistent = false;
    }

    if (logic.type === 'coverage' && logic.min_coverage_ratio && !desc.includes((logic.min_coverage_ratio * 100).toString())) {
      warning = `Description might not reflect min_coverage of ${logic.min_coverage_ratio * 100}%.`;
      isConsistent = false;
    }

    return { isConsistent, warning };
  }
}
