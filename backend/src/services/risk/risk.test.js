import { describe, it, expect, vi } from 'vitest';
import { RiskCalculatorService } from './RiskCalculator.service.js';
import { ImmutableArchiveService } from './ImmutableArchive.service.js';

describe('Pillar 7: Risk Intelligence', () => {
  const mockDb = { insertRecord: vi.fn(), query: vi.fn() };
  const archive = new ImmutableArchiveService(mockDb);
  const calculator = new RiskCalculatorService(archive);

  describe('ImmutableArchiveService', () => {
    it('should sanitize secrets before archiving', async () => {
      const decision = {
        repo: 'repo-1',
        violation: {
          policyId: 'SEC-001',
          context: { content: 'AKIA_REAL_SECRET' }
        }
      };

      await archive.archive(decision);
      
      const storedRecord = mockDb.insertRecord.mock.calls[0][0];
      expect(storedRecord.violation.context.content).toBe('[REDACTED]');
    });
  });

  describe('RiskCalculatorService', () => {
    it('should calculate HIGH risk for many critical violations', async () => {
      // Mock history: 10 PRs, 5 Critical Blocks
      const history = Array(10).fill(null).map((_, i) => ({
        status: i < 5 ? 'BLOCK' : 'PASS',
        severity: 'CRITICAL',
        archivedAt: new Date().toISOString()
      }));
      
      mockDb.query.mockResolvedValue(history);

      const result = await calculator.calculateRisk('repo-high');
      
      // 5 blocks * 10 weight = 50. 
      // (50 / 10 total) * 10 factor = 50 score.
      expect(result.score).toBe(50);
      expect(result.level).toBe('HIGH');
    });

    it('should detect IMPROVING trend', async () => {
      // Newest (index 0-4): All PASS
      // Oldest (index 5-9): All BLOCK
      const history = Array(10).fill(null).map((_, i) => ({
        status: i >= 5 ? 'BLOCK' : 'PASS',
        severity: 'HIGH',
        archivedAt: new Date().toISOString()
      }));

      mockDb.query.mockResolvedValue(history);

      const result = await calculator.calculateRisk('repo-improving');
      expect(result.trend).toBe('IMPROVING');
    });

    it('should return SAFE for empty history', async () => {
      mockDb.query.mockResolvedValue([]);
      const result = await calculator.calculateRisk('repo-new');
      expect(result.score).toBe(0);
      expect(result.level).toBe('SAFE');
    });
  });
});
