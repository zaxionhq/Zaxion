/**
 * Base class for all Governance Policies
 */
export class BasePolicy {
  constructor(config = {}) {
    this.id = config.id || 'UNKNOWN_POLICY';
    this.name = config.name || 'Unknown Policy';
    this.severity = config.severity || 'MEDIUM';
    this.enabled = config.enabled !== false;
    this.description = config.description || '';
    this.remediation = config.remediation || {};
  }

  /**
   * Evaluate the policy against a FactSnapshot
   * @param {object} facts - The FactSnapshot from Pillar 4
   * @returns {object} { status: 'PASS' | 'BLOCK' | 'WARN', violations: [] }
   */
  async evaluate(facts) {
    throw new Error('evaluate() must be implemented by subclass');
  }

  /**
   * Create a violation record
   * @param {string} message - Description of the violation
   * @param {object} context - Additional context (file, line, etc.)
   */
  createViolation(message, context = {}) {
    return {
      policyId: this.id,
      severity: this.severity,
      message,
      context,
      remediation: this.remediation
    };
  }
}
