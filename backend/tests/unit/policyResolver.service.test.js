import { jest } from '@jest/globals';

jest.unstable_mockModule('sequelize', () => ({
  Op: { lte: Symbol('lte') },
}));

const { PolicyResolverService } = await import('../../src/services/policyResolver.service.js');

describe('PolicyResolverService', () => {
  let dbMock;
  let service;

  beforeEach(() => {
    dbMock = { Policy: { findAll: jest.fn() } };
    service = new PolicyResolverService(dbMock);
    jest.clearAllMocks();
  });

  describe('Path Matching: _pathMatches', () => {
    test('should match wildcard', () => {
      expect(service._pathMatches('src/auth.js', '*')).toBe(true);
    });

    test('should match directory glob', () => {
      expect(service._pathMatches('src/auth/login.js', 'src/auth/**')).toBe(true);
      expect(service._pathMatches('src/ui/button.js', 'src/auth/**')).toBe(false);
    });

    test('should match exact path', () => {
      expect(service._pathMatches('package.json', 'package.json')).toBe(true);
    });
  });

  describe('Path Normalization: _normalizePath', () => {
    test('should normalize windows paths', () => {
      expect(service._normalizePath('src\\auth\\login.js')).toBe('src/auth/login.js');
    });
  });

  describe('Conflict Resolution: _resolveConflicts', () => {
    test('should prioritize Org over Repo', () => {
      const p1 = { policy_id: 'P1', scope: 'REPO', level: 'MANDATORY' };
      const p2 = { policy_id: 'P1', scope: 'ORG', level: 'ADVISORY' };
      const resolved = service._resolveConflicts([p1, p2]);
      expect(resolved[0].scope).toBe('ORG');
    });
  });

  describe('Core Flow: resolve', () => {
    const owner = 'org-123';
    const repo = 'org-123/my-repo';
    const timestamp = new Date();

    test('should resolve applicable policies with minimatch paths', async () => {
      dbMock.Policy.findAll.mockImplementation(({ where }) => {
        if (where.target_id === 'GLOBAL') return Promise.resolve([]);
        if (where.scope === 'ORG' && where.target_id === owner) {
          return Promise.resolve([{
            id: 'pol-org-1',
            name: 'Global Security',
            scope: 'ORG',
            versions: [{
              id: 'ver-org-1',
              enforcement_level: 'MANDATORY',
              rules_logic: { include_paths: ['src/**'], type: 'code_quality' },
            }],
          }]);
        }
        if (where.scope === 'REPO' && where.target_id === repo) {
          return Promise.resolve([{
            id: 'pol-repo-1',
            name: 'Repo README Check',
            scope: 'REPO',
            versions: [{
              id: 'ver-repo-1',
              enforcement_level: 'ADVISORY',
              rules_logic: { include_paths: ['readme.md'], type: 'file_extension', allowed_extensions: ['.md'] },
            }],
          }]);
        }
        return Promise.resolve([]);
      });

      const result = await service.resolve({
        owner,
        repo,
        changedPaths: ['src/auth/login.js', 'README.md'],
        timestamp,
      });

      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result.find((p) => p.name === 'Global Security')).toBeDefined();
    });

    test('should respect exclude_paths', async () => {
      dbMock.Policy.findAll.mockResolvedValue([{
        id: 'pol-1',
        name: 'No Scripts Policy',
        scope: 'ORG',
        versions: [{
          id: 'ver-1',
          enforcement_level: 'MANDATORY',
          rules_logic: {
            include_paths: ['*'],
            exclude_paths: ['scripts/**'],
            type: 'code_quality',
          },
        }],
      }]);

      const blocked = await service.resolve({
        owner,
        repo,
        changedPaths: ['scripts/auth.js'],
        timestamp,
      });
      expect(blocked).toHaveLength(0);

      const allowed = await service.resolve({
        owner,
        repo,
        changedPaths: ['src/app.js'],
        timestamp,
      });
      expect(allowed).toHaveLength(1);
    });
  });
});
