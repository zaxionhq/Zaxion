import { describe, it, expect } from 'vitest';
import { SecretDetectionPolicy } from './SecretDetectionPolicy.js';
import { DependencyRiskPolicy } from './DependencyRiskPolicy.js';
import { TestCoveragePolicy } from './TestCoveragePolicy.js';

describe('Pillar 6: Canonical Policies', () => {
  
  describe('SecretDetectionPolicy', () => {
    const policy = new SecretDetectionPolicy();

    it('should block if Pattern Engine found a secret', async () => {
      const facts = {
        file: 'config.js',
        patterns: [{ id: 'HARDCODED_SECRET', line: 10 }]
      };
      const result = await policy.evaluate(facts);
      expect(result.status).toBe('BLOCK');
      expect(result.violations[0].message).toContain('Hardcoded secret');
    });

    it('should block if diff contains AWS Key pattern', async () => {
      const facts = {
        file: '.env',
        diff: [{ type: 'ADDED', content: 'AWS_SECRET=AKIAIOSFODNN7EXAMPLE', line: 5 }]
      };
      const result = await policy.evaluate(facts);
      // Note: My regex implementation in the policy might need tweaking if this fails
      // The regex was /AKIA[0-9A-Z]{16}/
      // AKIAIOSFODNN7EXAMPLE is 20 chars total (AKIA + 16 chars). Perfect match.
      expect(result.status).toBe('BLOCK');
    });

    it('should pass if no secrets found', async () => {
      const facts = {
        file: 'safe.js',
        diff: [{ type: 'ADDED', content: 'const x = "safe"', line: 1 }]
      };
      const result = await policy.evaluate(facts);
      expect(result.status).toBe('PASS');
    });
  });

  describe('DependencyRiskPolicy', () => {
    const policy = new DependencyRiskPolicy();

    it('should block vulnerable lodash version', async () => {
      const facts = {
        file: 'package.json',
        diff: [{ type: 'ADDED', content: '"lodash": "3.10.1"', line: 12 }]
      };
      const result = await policy.evaluate(facts);
      expect(result.status).toBe('BLOCK');
      expect(result.violations[0].message).toContain('Vulnerable dependency');
    });

    it('should pass safe lodash version', async () => {
      const facts = {
        file: 'package.json',
        diff: [{ type: 'ADDED', content: '"lodash": "4.17.21"', line: 12 }]
      };
      const result = await policy.evaluate(facts);
      expect(result.status).toBe('PASS');
    });
  });

  describe('TestCoveragePolicy', () => {
    const policy = new TestCoveragePolicy({ threshold: 80 });

    it('should block if coverage is below 80%', async () => {
      const facts = {
        file: 'src/logic.js',
        coverage: { 'src/logic.js': { lines: 50 } }
      };
      const result = await policy.evaluate(facts);
      expect(result.status).toBe('BLOCK');
      expect(result.violations[0].context.actual).toBe(50);
    });

    it('should pass if coverage is above 80%', async () => {
      const facts = {
        file: 'src/logic.js',
        coverage: { 'src/logic.js': { lines: 90 } }
      };
      const result = await policy.evaluate(facts);
      expect(result.status).toBe('PASS');
    });

    it('should ignore test files', async () => {
      const facts = {
        file: 'src/logic.test.js',
        coverage: {} // Missing coverage for test file is fine
      };
      const result = await policy.evaluate(facts);
      expect(result.status).toBe('PASS');
    });
  });

});
