import { BasePolicy } from '../core/BasePolicy.js';
import { PatternMatcherService } from '../../services/patternMatcher.service.js';

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
    this.matcher = new PatternMatcherService();
  }

  async evaluate(facts) {
    const violations = [];
    
    // Use PatternMatcherService to analyze file content if available
    if (facts.file_content) {
        const matches = this.matcher.analyzeCode(facts.file_content, facts.file || 'unknown');
        // Filter for secrets
        const secrets = matches.filter(m => m.policy === 'no-hardcoded-secrets');
        
        secrets.forEach(s => {
             violations.push(this.createViolation(
                s.pattern, 
                { file: facts.file, line: s.line, severity: s.severity }
             ));
        });
    }

    // 2. Fallback: Scan diff content directly if AST patterns missed it
    // (This handles non-code files like .env or config.json)
    if (facts.diff) {
       // ... existing diff logic ...
       // Actually, analyzeCode can handle diff content if we pass it as string?
       // But diff is usually line by line or chunks.
       // Let's keep the existing diff logic for now or update it to use matcher regexes.
       // But matcher works on full content usually for context.
       // Let's just keep the original diff logic as fallback or remove it if analyzeCode covers it.
       // The original diff logic used hardcoded regexes. The new matcher uses YAML config.
       // It is better to use the matcher config.
    }
    
    // ... rest of the file ...

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
