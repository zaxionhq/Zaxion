import { jest } from '@jest/globals';

// Mock sequelize Op
jest.unstable_mockModule('sequelize', () => ({
  Op: {
    lte: Symbol('lte')
  }
}));

// Dynamic imports for ESM compatibility
const { PolicyResolverService } = await import('../../src/services/policyResolver.service.js');

describe('PolicyResolverService', () => {
  let dbMock;
  let service;

  beforeEach(() => {
    dbMock = {
      Policy: {
        findAll: jest.fn()
      }
    };
    service = new PolicyResolverService(dbMock);
    jest.clearAllMocks();
  });

  describe('Path Matching: _pathMatches', () => {
    test('should match wildcard', () => {
      expect(service._pathMatches('src/auth.js', '*')).toBe(true);
    });

    test('should match directory prefix', () => {
      expect(service._pathMatches('src/auth/login.js', 'src/auth/*')).toBe(true);
      expect(service._pathMatches('src/ui/button.js', 'src/auth/*')).toBe(false);
    });

    test('should match exact path', () => {
      expect(service._pathMatches('package.json', 'package.json')).toBe(true);
      expect(service._pathMatches('package-lock.json', 'package.json')).toBe(false);
    });
  });

  describe('Conflict Resolution: _resolveConflicts', () => {
    test('should prioritize Org over Repo', () => {
      const p1 = { policy_id: 'P1', scope: 'REPO', level: 'MANDATORY' };
      const p2 = { policy_id: 'P1', scope: 'ORG', level: 'ADVISORY' };
      const resolved = service._resolveConflicts([p1, p2]);
      expect(resolved).toHaveLength(1);
      expect(resolved[0].scope).toBe('ORG');
    });

    test('should prioritize MANDATORY over ADVISORY within same scope', () => {
      const p1 = { policy_id: 'P1', scope: 'ORG', level: 'ADVISORY' };
      const p2 = { policy_id: 'P1', scope: 'ORG', level: 'MANDATORY' };
      const resolved = service._resolveConflicts([p1, p2]);
      expect(resolved).toHaveLength(1);
      expect(resolved[0].level).toBe('MANDATORY');
    });

    test('should deduplicate by policy_id', () => {
      const p1 = { policy_id: 'P1', scope: 'ORG', level: 'MANDATORY', name: 'A' };
      const p2 = { policy_id: 'P1', scope: 'ORG', level: 'MANDATORY', name: 'B' };
      const resolved = service._resolveConflicts([p1, p2]);
      expect(resolved).toHaveLength(1);
    });
  });

  describe('Core Flow: resolve', () => {
    const orgId = 'org-123';
    const repoId = 'repo-456';
    const timestamp = new Date();
    const changedPaths = ['src/auth/login.js', 'README.md'];

    test('should resolve applicable policies deterministically', async () => {
      dbMock.Policy.findAll.mockImplementation(({ where }) => {
        if (where.scope === 'ORG') {
          return Promise.resolve([
            {
              id: 'pol-org-1',
              name: 'Global Security',
              scope: 'ORG',
              versions: [{
                id: 'ver-org-1',
                enforcement_level: 'MANDATORY',
                rules_logic: { include_paths: ['src/auth/*'] }
              }]
            }
          ]);
        }
        if (where.scope === 'REPO') {
          return Promise.resolve([
            {
              id: 'pol-repo-1',
              name: 'Repo README Check',
              scope: 'REPO',
              versions: [{
                id: 'ver-repo-1',
                enforcement_level: 'ADVISORY',
                rules_logic: { include_paths: ['README.md'] }
              }]
            }
          ]);
        }
        return Promise.resolve([]);
      });

      const result = await service.resolve(orgId, repoId, changedPaths, timestamp);

      expect(result).toHaveLength(2);
      expect(result.find(p => p.name === 'Global Security')).toBeDefined();
      expect(result.find(p => p.name === 'Repo README Check')).toBeDefined();
      
      const secPolicy = result.find(p => p.name === 'Global Security');
      expect(secPolicy.resolution_path).toBe('src/auth/login.js');
      expect(secPolicy.level).toBe('MANDATORY');
    });

    test('should respect exclude_paths', async () => {
      dbMock.Policy.findAll.mockResolvedValue([
        {
          id: 'pol-1',
          name: 'No Tests Policy',
          scope: 'ORG',
          versions: [{
            id: 'ver-1',
            enforcement_level: 'MANDATORY',
            rules_logic: { 
              include_paths: ['*'],
              exclude_paths: ['tests/*']
            }
          }]
        }
      ]);

      const result = await service.resolve(orgId, repoId, ['tests/auth.js'], timestamp);
      expect(result).toHaveLength(0);

      const result2 = await service.resolve(orgId, repoId, ['src/app.js'], timestamp);
      expect(result2).toHaveLength(1);
    });
  });
});
