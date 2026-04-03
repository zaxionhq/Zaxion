import { jest } from '@jest/globals';
import { PolicySimulationService } from '../../services/policySimulation.service.js';
import { EvaluationEngineService } from '../../services/evaluationEngine.service.js';

describe('PolicySimulationService Consistency Test', () => {
  let db;
  let evaluationEngine;
  let service;

  const sampleUuid = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    db = {
      Decision: {
        findOne: jest.fn().mockResolvedValue(null)
      },
      Policy: {
        findByPk: jest.fn().mockResolvedValue({ id: sampleUuid })
      },
      PolicyVersion: {
        findOne: jest.fn().mockResolvedValue({
          rules_logic: { type: 'no_hardcoded_secrets' }
        })
      },
      PolicySimulation: {
        create: jest.fn().mockImplementation((data) => {
          const state = { ...data };
          return {
            ...state,
            update: jest.fn(async (updates) => {
              Object.assign(state, updates);
            }),
            toJSON: () => ({ ...state })
          };
        })
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

  it('UUID policy with draft_rules uses client rules and blocks same snapshot', async () => {
    const payload = {
      policy_id: sampleUuid,
      draft_rules: { type: 'no_hardcoded_secrets' },
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

  it('Repository mode with core_enforcement placeholder matches SEC-001 mapping (parity with PR URL analyze)', async () => {
    const payload = {
      policy_id: 'SEC-001',
      draft_rules: { type: 'core_enforcement', severity: 'BLOCK', category: 'security' },
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
