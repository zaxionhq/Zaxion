import { jest } from '@jest/globals';
import { PolicySimulationService } from '../../services/policySimulation.service.js';
import { EvaluationEngineService } from '../../services/evaluationEngine.service.js';

describe('PolicySimulationService Consistency Test', () => {
  let db;
  let evaluationEngine;
  let service;

  beforeEach(() => {
    db = {
      Decision: {
        findOne: jest.fn().mockResolvedValue(null)
      },
      PolicySimulation: {
        create: jest.fn().mockImplementation((data) => ({
          ...data,
          toJSON: () => data,
          update: jest.fn()
        }))
      }
    };
    evaluationEngine = new EvaluationEngineService();
    service = new PolicySimulationService(db, evaluationEngine);
  });

  it('Hardcore Policy Mode (SEC-001) should block secrets in synthetic snapshots', async () => {
    // SEC-001 simulation uses static core policy mapping
    const payload = {
      policy_id: 'SEC-001',
      sample_strategy: 'TIME_BASED',
      sample_size: 1,
      is_sandbox: true
    };

    // Mock snapshot collection
    service._collectSnapshots = jest.fn().mockResolvedValue([{
      id: 'snapshot-1',
      pr_number: 4,
      repo_full_name: 'owner/repo',
      data: {
        changes: {
          files: [
            { path: 'src/auth.js', content: 'const token = "ghp_123456789012345678901234567890123456";', extension: 'js' }
          ]
        }
      }
    }]);

    const result = await service.runSimulation(payload);
    
    // Check results structure
    expect(result.results.summary.total_blocked_count).toBe(1);
    expect(result.results.summary.policy_would_block).toBe(true);
    expect(result.results.per_pr_results[0].verdict).toBe('BLOCK');
    expect(result.results.per_pr_results[0].rationale).toContain('Hardcoded secrets detected');
  });

  it('URL Mode Simulation should block same input data', async () => {
    // In URL mode, the rules are usually fetched from the policy or provided
    const payload = {
      policy_id: 'any-uuid',
      draft_rules: { type: 'security_patterns' }, // Matching SEC-001 behavior
      sample_strategy: 'TIME_BASED',
      sample_size: 1,
      is_sandbox: true
    };

    service._collectSnapshots = jest.fn().mockResolvedValue([{
      id: 'snapshot-1',
      pr_number: 4,
      repo_full_name: 'owner/repo',
      data: {
        changes: {
          files: [
            { path: 'src/auth.js', content: 'const token = "ghp_123456789012345678901234567890123456";', extension: 'js' }
          ]
        }
      }
    }]);

    const result = await service.runSimulation(payload);
    
    expect(result.results.summary.total_blocked_count).toBe(1);
    expect(result.results.summary.policy_would_block).toBe(true);
    expect(result.results.per_pr_results[0].verdict).toBe('BLOCK');
  });
});
