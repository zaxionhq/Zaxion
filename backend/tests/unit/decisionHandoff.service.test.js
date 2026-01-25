import { jest } from '@jest/globals';
import { DecisionHandoffService } from '../../src/services/decisionHandoff.service.js';

describe('DecisionHandoffService', () => {
  let service;
  let mockDb;
  let mockGovernanceMemory;
  let mockGithubReporter;

  beforeEach(() => {
    mockDb = {};
    mockGovernanceMemory = {
      recordDecision: jest.fn()
    };
    mockGithubReporter = {
      reportStatus: jest.fn()
    };
    service = new DecisionHandoffService(mockDb, mockGovernanceMemory, mockGithubReporter);
  });

  const mockEvalResult = {
    fact_snapshot_id: 'snapshot-123',
    result: 'BLOCK',
    rationale: 'Missing tests for high-risk files.',
    applied_policies: [{ policy_version_id: 'pv-1' }],
    engine_version: '1.0.0',
    evaluation_hash: 'hash-xyz',
    violated_policies: []
  };

  const mockGithubContext = {
    owner: 'owner',
    repo: 'repo',
    sha: 'sha-abc',
    prNumber: 1
  };

  test('should record decision first then report to GitHub', async () => {
    mockGovernanceMemory.recordDecision.mockResolvedValue({ id: 'decision-456' });
    mockGithubReporter.reportStatus.mockResolvedValue({});

    const result = await service.handoff({
      evaluation_result: mockEvalResult,
      override_id: null,
      github_context: mockGithubContext
    });

    expect(mockGovernanceMemory.recordDecision).toHaveBeenCalled();
    expect(mockGithubReporter.reportStatus).toHaveBeenCalled();
    expect(result.final_status).toBe('FAILURE');
  });

  test('should report SUCCESS if a BLOCK result has an override_id', async () => {
    mockGovernanceMemory.recordDecision.mockResolvedValue({ id: 'decision-456' });
    
    const result = await service.handoff({
      evaluation_result: mockEvalResult,
      override_id: 'override-789',
      github_context: mockGithubContext
    });

    expect(result.final_status).toBe('SUCCESS');
    expect(mockGithubReporter.reportStatus).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.any(String),
      expect.objectContaining({ decision: 'SUCCESS' })
    );
  });

  test('Invariant 3: should NOT report to GitHub if Pillar 3 recording fails', async () => {
    mockGovernanceMemory.recordDecision.mockRejectedValue(new Error('DB Error'));

    await expect(service.handoff({
      evaluation_result: mockEvalResult,
      override_id: null,
      github_context: mockGithubContext
    })).rejects.toThrow('Causal Decision Publication Failure');

    expect(mockGithubReporter.reportStatus).not.toHaveBeenCalled();
  });

  test('should handle GitHub reporting failure gracefully if recording succeeded', async () => {
    mockGovernanceMemory.recordDecision.mockResolvedValue({ id: 'decision-456' });
    mockGithubReporter.reportStatus.mockRejectedValue(new Error('GitHub API Down'));

    const result = await service.handoff({
      evaluation_result: mockEvalResult,
      override_id: null,
      github_context: mockGithubContext
    });

    expect(result.id).toBe('decision-456');
    expect(mockGithubReporter.reportStatus).toHaveBeenCalled();
  });

  test('should map PASS result to SUCCESS', async () => {
    mockGovernanceMemory.recordDecision.mockResolvedValue({ id: 'decision-456' });
    
    const result = await service.handoff({
      evaluation_result: { ...mockEvalResult, result: 'PASS' },
      override_id: null,
      github_context: mockGithubContext
    });

    expect(result.final_status).toBe('SUCCESS');
  });

  test('should map WARN result to NEUTRAL', async () => {
    mockGovernanceMemory.recordDecision.mockResolvedValue({ id: 'decision-456' });
    
    const result = await service.handoff({
      evaluation_result: { ...mockEvalResult, result: 'WARN' },
      override_id: null,
      github_context: mockGithubContext
    });

    expect(result.final_status).toBe('NEUTRAL');
  });
});
