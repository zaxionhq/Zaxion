import { describe, it, expect } from 'vitest';
import { ModeResolverService } from './ModeResolver.service.js';
import { CircuitBreaker } from './CircuitBreaker.js';

describe('Pillar 1: Progressive Adoption', () => {
  
  describe('ModeResolverService', () => {
    const mockDb = { getRepoMode: async () => 'WARN_ONLY' };
    const resolver = new ModeResolverService(mockDb);

    it('should convert BLOCK to NEUTRAL in WARN_ONLY mode', () => {
      const result = resolver.resolveVerdict('BLOCK', 'WARN_ONLY');
      expect(result.status).toBe('neutral');
      expect(result.description).toContain('Warning Mode');
    });

    it('should convert BLOCK to SUCCESS in OBSERVE_ONLY mode', () => {
      const result = resolver.resolveVerdict('BLOCK', 'OBSERVE_ONLY');
      expect(result.status).toBe('success');
      expect(result.description).toContain('Observe Mode');
    });

    it('should keep BLOCK as FAILURE in ENFORCE mode', () => {
      const result = resolver.resolveVerdict('BLOCK', 'ENFORCE');
      expect(result.status).toBe('failure');
    });

    it('should fail-safe to OBSERVE_ONLY if DB fails', async () => {
      const brokenDb = { getRepoMode: async () => { throw new Error('DB Down'); } };
      const safeResolver = new ModeResolverService(brokenDb);
      
      const mode = await safeResolver.getMode('repo-1');
      expect(mode).toBe('OBSERVE_ONLY');
    });
  });

  describe('CircuitBreaker', () => {
    it('should execute operation successfully', async () => {
      const breaker = new CircuitBreaker();
      const result = await breaker.execute(async () => 'OK');
      expect(result).toBe('OK');
    });

    it('should fail-open (return success) when operation throws', async () => {
      const breaker = new CircuitBreaker();
      const result = await breaker.execute(async () => { throw new Error('Crash'); });
      
      expect(result.status).toBe('success');
      expect(result.description).toContain('Zaxion skipped');
    });

    it('should open circuit after threshold failures', async () => {
      const breaker = new CircuitBreaker();
      breaker.threshold = 2;

      await breaker.execute(async () => { throw new Error('1'); });
      await breaker.execute(async () => { throw new Error('2'); });
      
      expect(breaker.isOpen).toBe(true);
    });
  });

});
