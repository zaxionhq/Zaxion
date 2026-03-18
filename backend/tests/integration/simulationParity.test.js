
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PolicySimulationService } from '../../src/services/policySimulation.service.js';
import { EvaluationEngineService } from '../../src/services/evaluationEngine.service.js';
import * as codeAnalysis from '../../src/services/codeAnalysis.service.js';

describe('Simulation Parity Check', () => {
  let db;
  let evaluationEngine;
  let simulationService;

  const mockFileContent = `
    const AWS_ACCESS_KEY_ID = "AKIA1234567890123456"; // Leak
  `;
  
  const mockRepo = 'owner/repo';
  const mockPrNumber = 5;

  // 1. Data for FactSnapshot (DB)
  const mockSnapshotData = {
    ingestion_status: { complete: true },
    provenance: { source: 'github' },
    pull_request: { title: 'Leak PR', base_branch: 'main' },
    changes: {
      total_files: 1,
      files: [
        { path: 'auth.js', content: mockFileContent, extension: '.js', additions: 1, deletions: 0 }
      ]
    },
    metadata: { test_files_changed_count: 0 }
  };

  // Mock Sequelize Model
  const mockFactSnapshot = {
    id: 'snap-1',
    repo_full_name: mockRepo,
    pr_number: mockPrNumber,
    data: mockSnapshotData,
    ingested_at: new Date(),
    toJSON: () => ({
      id: 'snap-1',
      repo_full_name: mockRepo,
      pr_number: mockPrNumber,
      data: mockSnapshotData,
      ingested_at: new Date()
    })
  };

  beforeEach(() => {
    db = {
      FactSnapshot: {
        findAll: jest.fn().mockResolvedValue([mockFactSnapshot])
      },
      Decision: {
        findOne: jest.fn().mockResolvedValue(null)
      },
      Policy: {
        findByPk: jest.fn()
      },
      PolicyVersion: {
        findOne: jest.fn()
      },
      PolicySimulation: {
        create: jest.fn().mockImplementation((data) => ({
          ...data,
          id: 'sim-1',
          update: jest.fn(),
          toJSON: () => data
        }))
      },
      sequelize: {
        transaction: (cb) => cb({ commit: jest.fn(), rollback: jest.fn() })
      }
    };
    evaluationEngine = new EvaluationEngineService();
    simulationService = new PolicySimulationService(db, evaluationEngine);
  });

  it('should produce identical verdicts for DB Snapshot and Synthetic Snapshot', async () => {
    const draftRules = { type: 'security_patterns' };

    // 1. Run via PolicySimulationService (DB Path)
    const simResult = await simulationService.runSimulation({
      policy_id: 'SEC-001', // Core policy ID
      draft_rules: draftRules,
      sample_strategy: 'REPO_BASED',
      sample_size: 1,
      target_repo_full_name: mockRepo,
      is_sandbox: true
    });

    const dbVerdict = simResult.results.per_pr_results[0].verdict;
    const dbViolations = simResult.results.per_pr_results[0].violations;

    expect(dbVerdict).toBe('BLOCK');
    expect(dbViolations.length).toBeGreaterThan(0);
    expect(dbViolations[0].message).toContain('AWS Access Key');

    // 2. Run via CodeAnalysis (URL Path)
    const syntheticSnapshot = codeAnalysis.buildSyntheticSnapshot({
      content: mockFileContent,
      fileName: 'auth.js'
    });
    // Mimic GitHub PR metadata enrichment done in controller
    syntheticSnapshot.repo_full_name = mockRepo;
    syntheticSnapshot.pr_number = mockPrNumber;

    const urlResult = codeAnalysis.runCodeAnalysis(syntheticSnapshot, draftRules, evaluationEngine);

    const urlVerdict = urlResult.result;
    const urlViolations = urlResult.violations;

    expect(urlVerdict).toBe('BLOCK');
    expect(urlViolations.length).toBeGreaterThan(0);

    // 3. Assert Parity
    expect(dbVerdict).toBe(urlVerdict);
    expect(dbViolations[0].rule_id).toBe(urlViolations[0].rule_id);
  });
});
