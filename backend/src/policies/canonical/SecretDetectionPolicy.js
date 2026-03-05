import { BasePolicy } from '../core/BasePolicy.js';
import { PatternMatchingEngine } from '../../services/patterns/patternMatcher.service.js';

export class SecretDetectionPolicy extends BasePolicy {
  constructor(config = {}) {
    super({
      id: 'SEC-001',
      name: 'Secret Detection Policy',
      severity: 'CRITICAL',
      description: 'Detects hardcoded secrets (API keys, tokens, passwords) in code.',
      remediation: {
        steps: [
          'Remove the hardcoded secret immediately.',
          'Rotate the compromised credential.',
          'Use environment variables (process.env) instead.'
        ],
        docs: 'https://zaxion.dev/docs/security/secrets'
      },
      ...config
    });
    this.engine = new PatternMatchingEngine();
  }

  async evaluate(facts) {
    const violations = [];
    
    // 1. Check for Pattern Engine findings (Pillar 4)
    // Assuming facts.patterns contains pre-scanned patterns from AST analysis
    if (facts.patterns && facts.patterns.length > 0) {
      for (const pattern of facts.patterns) {
        if (pattern.id === 'HARDCODED_SECRET') {
          violations.push(this.createViolation(
            'Hardcoded secret detected', 
            { file: facts.file, line: pattern.line }
          ));
        }
      }
    }

    // 2. Fallback: Scan diff content directly if AST patterns missed it
    // (This handles non-code files like .env or config.json)
    if (facts.diff) {
      const secretPatterns = [
        /AKIA[0-9A-Z]{16}/, // AWS Access Key
        /SK[0-9a-fA-F]{32}/, // Stripe Secret Key
        /ghp_[a-zA-Z0-9]{36}/ // GitHub Personal Access Token
      ];

      for (const change of facts.diff) {
        if (change.type === 'ADDED') {
          for (const regex of secretPatterns) {
            if (regex.test(change.content)) {
              violations.push(this.createViolation(
                'Potential secret pattern detected in diff',
                { line: change.line, content: change.content.substring(0, 10) + '...' } // Redact content
              ));
            }
          }
        }
      }
    }

    return {
      status: violations.length > 0 ? 'BLOCK' : 'PASS',
      violations
    };
  }
}
