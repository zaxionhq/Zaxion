import { describe, it, expect } from 'vitest';
import { ShadowRunnerService } from './ShadowRunner.service.js';
import { SecretDetectionPolicy } from '../../policies/canonical/SecretDetectionPolicy.js';

describe('Pillar 8: Simulation Engine', () => {
  const runner = new ShadowRunnerService();
  const policy = new SecretDetectionPolicy();

  // Mock Historical Data (FactSnapshots)
  const history = [
    { prId: 101, repo: 'repo-a', file: 'safe.js', patterns: [] },
    { prId: 102, repo: 'repo-a', file: 'config.js', patterns: [{ id: 'HARDCODED_SECRET', line: 5 }] },
    { prId: 103, repo: 'repo-b', file: 'utils.js', patterns: [] }
  ];

  it('should calculate block rate correctly', async () => {
    const report = await runner.simulate(policy, history);
    
    expect(report.totalScanned).toBe(3);
    expect(report.blocks).toBe(1); // Only PR 102 has a secret
    expect(report.passes).toBe(2);
    expect(report.blockRate).toBeCloseTo(33.33, 1);
  });

  it('should return violation details for blocked PRs', async () => {
    const report = await runner.simulate(policy, history);
    
    expect(report.violations).toHaveLength(1);
    expect(report.violations[0].prId).toBe(102);
    expect(report.violations[0].violations[0].message).toContain('Hardcoded secret');
  });

  it('should handle "Too Strict" scenario (100% block)', async () => {
    // Mock a policy that blocks everything
    const strictPolicy = {
      id: 'STRICT',
      evaluate: async () => ({ status: 'BLOCK', violations: [{ message: 'No' }] })
    };

    const report = await runner.simulate(strictPolicy, history);
    expect(report.blockRate).toBe(100);
  });

  it('should be performant (Bulk Simulation)', async () => {
    // Generate 100 mock PRs
    const bulkHistory = Array(100).fill(null).map((_, i) => ({
      prId: i,
      repo: 'repo-perf',
      file: 'test.js',
      patterns: []
    }));

    const start = performance.now();
    await runner.simulate(policy, bulkHistory);
    const end = performance.now();
    
    expect(end - start).toBeLessThan(5000); // 5s budget
    console.log(`Simulated 100 PRs in ${(end - start).toFixed(2)}ms`);
  });
});
