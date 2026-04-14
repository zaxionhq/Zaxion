import logger from '../logger.js';

export class DependencyScannerService {
  constructor() {
    this.vulnerabilityCache = new Map();
    // In a real scenario, this would point to a real advisory API.
    // For this implementation, we will simulate the check or use a public registry if available without auth.
    // GitHub's GraphQL API requires auth, so we might need to mock it or use npm audit internally.
    // We'll implement the structure to be ready for integration.
    this.githubAdvisoryUrl = 'https://api.github.com/graphql';
  }

  /**
   * Scan package.json content for vulnerabilities
   * @param {string} packageJsonContent - Content of package.json
   * @param {string} filePath - Path to the file
   */
  scanPackageJson(packageJsonContent, filePath) {
    try {
      const packageJson = JSON.parse(packageJsonContent);
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
        ...packageJson.optionalDependencies
      };

      const violations = [];
      
      // In a real implementation, we would batch these or check against a local DB
      // For this wave, let's implement a check against known bad versions of popular packages
      // to demonstrate the capability without needing live external API calls which might fail in dev.
      
      for (const [packageName, version] of Object.entries(allDeps)) {
        const vulns = this.checkPackageVulnerabilities(packageName, version);
        if (vulns.length > 0) {
            vulns.forEach(v => {
                violations.push({
                    policy: 'no-dependency-vulnerabilities',
                    severity: v.severity || 'HIGH',
                    message: `Vulnerable dependency detected: ${packageName}@${version} - ${v.description}`,
                    remediation: `Update to version ${v.patchedVersion || 'latest'}`,
                    line: 1, // Ideally we find the line number in package.json
                    file: filePath,
                    code: `"${packageName}": "${version}"`
                });
            });
        }
      }

      return violations;
    } catch (err) {
      logger.error('DependencyScanner: Failed to parse package.json', { error: err.message, file: filePath });
      return [];
    }
  }

  checkPackageVulnerabilities(packageName, version) {
    // SIMULATED DATABASE OF VULNERABILITIES for demonstration
    // In production, this would query OSV or GitHub Advisory Database
    const KNOWN_VULNERABILITIES = new Map();
    KNOWN_VULNERABILITIES.set('lodash', new Map([
        ['4.17.15', { severity: 'HIGH', description: 'Prototype Pollution', patchedVersion: '4.17.19' }],
        ['<4.17.19', { severity: 'HIGH', description: 'Prototype Pollution', patchedVersion: '4.17.19' }]
    ]));
    KNOWN_VULNERABILITIES.set('axios', new Map([
        ['0.21.0', { severity: 'MEDIUM', description: 'SSRF', patchedVersion: '0.21.1' }]
    ]));
    KNOWN_VULNERABILITIES.set('express', new Map([
        ['4.16.0', { severity: 'LOW', description: 'Regular Expression Denial of Service', patchedVersion: '4.17.0' }]
    ]));

    if (!KNOWN_VULNERABILITIES.has(packageName)) return [];
    const pkgVulns = KNOWN_VULNERABILITIES.get(packageName);

    const found = [];
    
    // Simple exact match check
    if (pkgVulns.has(version)) {
        found.push(pkgVulns.get(version));
    } else {
        // Only do range check if exact match didn't find anything (or allow both if intended)
        // For simulation, avoid duplicate reporting if version matches both keys (e.g. 4.17.15 matches exact and <4.17.19)
        
        // Simple range check simulation (very basic)
        if (pkgVulns.has('<4.17.19') && packageName === 'lodash') {
             // Assume version is simple semver
             if (version.startsWith('4.17.') && parseInt(version.split('.')[2]) < 19) {
                 found.push(pkgVulns.get('<4.17.19'));
             }
        }
    }

    return found;
  }
}
