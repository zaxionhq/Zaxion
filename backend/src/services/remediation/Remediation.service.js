/**
 * Service to generate remediation advice
 */
export class RemediationService {
  constructor(aiAdvisor) {
    this.aiAdvisor = aiAdvisor;
    this.templates = {
      'SEC-001': (context) => ({
        title: 'Hardcoded Secret Detected',
        steps: [
          `Remove the secret from ${context.file} at line ${context.line}.`,
          'Revoke the exposed credential immediately.',
          'Use process.env or a secrets manager.'
        ],
        docs: '/docs/remediation/secrets'
      }),
      'SEC-002': (context) => ({
        title: 'Vulnerable Dependency',
        steps: [
          `Upgrade ${context.pkg} to version ${context.required}.`,
          'Run npm audit to verify safety.'
        ],
        docs: '/docs/remediation/dependencies'
      })
    };
  }

  /**
   * Generate advice for a violation
   * @param {object} violation - The violation record
   * @returns {Promise<object>} Advice object
   */
  async getAdvice(violation) {
    const template = this.templates[violation.policyId];
    
    // 1. Static Template (Fast, Deterministic)
    const baseAdvice = template 
      ? template(violation.context)
      : { title: 'Policy Violation', steps: ['Check the policy documentation.'], docs: '/docs' };

    // 2. AI Enhancement (Optional, Async)
    let aiSuggestion = null;
    if (this.aiAdvisor) {
      try {
        aiSuggestion = await this.aiAdvisor.suggestFix(violation);
      } catch (err) {
        console.warn('AI Advisor failed, falling back to static template', err);
      }
    }

    return {
      ...baseAdvice,
      aiSuggestion
    };
  }
}
