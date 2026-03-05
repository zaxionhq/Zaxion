import { BasePolicy } from '../core/BasePolicy.js';

export class DependencyRiskPolicy extends BasePolicy {
  constructor(config = {}) {
    super({
      id: 'SEC-002',
      name: 'Dependency Risk Policy',
      severity: 'HIGH',
      description: 'Prevents installation of vulnerable or malicious packages.',
      remediation: {
        steps: [
          'Upgrade the package to a safe version.',
          'Remove the dependency if unused.',
          'Check the CVE database for details.'
        ],
        docs: 'https://zaxion.dev/docs/security/dependencies'
      },
      ...config
    });
    
    // In a real system, this would come from a DB or external API
    this.vulnerablePackages = new Map([
      ['lodash', ['<4.17.21']],
      ['axios', ['<0.21.2']],
      ['moment', ['<2.29.2']],
    ]);
  }

  async evaluate(facts) {
    const violations = [];

    // Only check if package.json or similar files changed
    if (!facts.file.endsWith('package.json')) {
      return { status: 'PASS', violations: [] };
    }

    // Parse the new content to find added dependencies
    // Simplification: identifying added lines that match "package": "version"
    if (facts.diff) {
      for (const change of facts.diff) {
        if (change.type === 'ADDED') {
          // Regex to extract "package": "version"
          const match = change.content.match(/"([^"]+)":\s*"([^"]+)"/);
          if (match) {
            const pkg = match[1];
            const version = match[2].replace(/[\^~]/g, '');

            const ranges = this.vulnerablePackages.get(pkg);
            if (ranges) {
              const vulnerableRange = Array.isArray(ranges) && ranges.length ? ranges[0] : null;
              const isKnownUnsafe = vulnerableRange ? vulnerableRange.startsWith('<') && version.localeCompare(vulnerableRange.slice(1), undefined, { numeric: true }) < 0 : false;
              if (isKnownUnsafe) {
                violations.push(this.createViolation(
                  `Vulnerable dependency detected: ${pkg}@${version}`,
                  { file: facts.file, line: change.line, required: '>= Safe Version' }
                ));
              }
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
