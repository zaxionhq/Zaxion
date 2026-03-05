import { BasePolicy } from '../core/BasePolicy.js';

export class TestCoveragePolicy extends BasePolicy {
  constructor(config = {}) {
    super({
      id: 'QA-001',
      name: 'Test Coverage Policy',
      severity: 'HIGH',
      description: 'Ensures all critical code changes have corresponding tests.',
      remediation: {
        steps: [
          'Add a unit test file for the modified code.',
          'Ensure all branches and lines are covered.',
          'Run coverage locally before pushing.'
        ],
        docs: 'https://zaxion.dev/docs/quality/coverage'
      },
      ...config
    });
    this.threshold = config.threshold || 80; // Default 80%
  }

  async evaluate(facts) {
    const violations = [];
    
    // 1. Check if the file is a source file (not a test file itself)
    if (facts.file.endsWith('.test.js') || facts.file.endsWith('.spec.ts')) {
      return { status: 'PASS', violations: [] };
    }

    // 2. Check if coverage data is available in facts
    // In a real system, this would come from a coverage report parser (e.g., lcov)
    if (facts.coverage) {
      const fileCoverage = facts.coverage[facts.file];
      
      if (fileCoverage && fileCoverage.lines < this.threshold) {
        violations.push(this.createViolation(
          `Insufficient test coverage: ${fileCoverage.lines}% (Required: ${this.threshold}%)`,
          { 
            file: facts.file, 
            actual: fileCoverage.lines, 
            required: this.threshold 
          }
        ));
      }
    } else {
      // If coverage data is missing entirely for a modified file, WARN
      // (Unless it's a configuration file or non-code)
      if (facts.file.endsWith('.js') || facts.file.endsWith('.ts')) {
        violations.push(this.createViolation(
          'No coverage data found for modified source file',
          { file: facts.file }
        ));
      }
    }

    return {
      status: violations.length > 0 ? 'BLOCK' : 'PASS',
      violations
    };
  }
}
