import { jest } from '@jest/globals';

// Mock axios for ESM support
jest.unstable_mockModule('axios', () => ({
  default: {
    get: jest.fn(),
    post: jest.fn()
  }
}));

// Dynamic imports for ESM compatibility with Jest
const { FactIngestorService } = await import('../../src/services/factIngestor.service.js');
const { default: mockedAxios } = await import('axios');

describe('FactIngestorService', () => {
  let dbMock;
  let service;
  const token = 'fake-token';

  beforeEach(() => {
    dbMock = {
      FactSnapshot: {
        findOne: jest.fn(),
        create: jest.fn()
      }
    };
    service = new FactIngestorService(dbMock, token);
    jest.clearAllMocks();
  });

  describe('Deterministic Logic: _isTestFile', () => {
    test('should identify test files in various structures', () => {
      const testCases = [
        { path: 'src/auth/login.test.js', expected: true },
        { path: 'tests/unit/auth.js', expected: true },
        { path: 'src/auth/__tests__/login.js', expected: true },
        { path: 'src/auth/login.spec.ts', expected: true },
        { path: 'src/auth/test_login.py', expected: true },
        { path: 'src/auth/login_test.py', expected: true },
        { path: 'src/auth/login.js', expected: false },
        { path: 'package.json', expected: false },
        { path: 'README.md', expected: false }
      ];

      testCases.forEach(({ path, expected }) => {
        expect(service._isTestFile(path)).toBe(expected);
      });
    });
  });

  describe('Deterministic Logic: _extractPathPrefixes', () => {
    test('should extract unique path prefixes and sort them', () => {
      const files = [
        { path: 'src/auth/login.ts' },
        { path: 'src/auth/utils/crypto.ts' },
        { path: 'src/ui/components/Button.tsx' },
        { path: 'root-file.js' }
      ];
      const prefixes = service._extractPathPrefixes(files);
      
      expect(prefixes).toEqual([
        'src', 
        'src/auth', 
        'src/auth/utils', 
        'src/ui', 
        'src/ui/components'
      ]);
    });

    test('should handle empty or single level paths', () => {
      const files = [{ path: 'README.md' }];
      expect(service._extractPathPrefixes(files)).toEqual([]);
    });
  });

  describe('Core Flow: ingest', () => {
    const repo = 'owner/repo';
    const pr = 123;
    const sha = 'abcdef123456';

    test('should deduplicate: return existing snapshot if SHA matches', async () => {
      const existing = { 
        id: 'uuid-123', 
        repo_full_name: repo, 
        commit_sha: sha,
        data: { some: 'facts' }
      };
      dbMock.FactSnapshot.findOne.mockResolvedValue(existing);

      const result = await service.ingest(repo, pr, sha);

      expect(dbMock.FactSnapshot.findOne).toHaveBeenCalledWith({
        where: { repo_full_name: repo, commit_sha: sha }
      });
      expect(result).toEqual(existing);
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    test('should ingest and snapshot: fetch from GitHub and save to DB', async () => {
      dbMock.FactSnapshot.findOne.mockResolvedValue(null);
      dbMock.FactSnapshot.create.mockImplementation(data => Promise.resolve({ 
        id: 'new-uuid', 
        ...data 
      }));

      // Mock GitHub API responses with headers
      mockedAxios.get.mockImplementation((url) => {
        const headers = { 'x-ratelimit-remaining': '4999' };
        if (url.includes('/pulls/123/files')) {
          return Promise.resolve({
            data: [
              { filename: 'src/auth/login.ts', status: 'modified', additions: 10, deletions: 2 },
              { filename: 'tests/auth.test.ts', status: 'added', additions: 50, deletions: 0 }
            ],
            headers
          });
        }
        if (url.includes('/pulls/123')) {
          return Promise.resolve({
            data: {
              title: 'Fix login',
              user: { id: 1, login: 'dev' },
              base: { ref: 'main' },
              labels: [{ name: 'bug' }],
              draft: false
            },
            headers
          });
        }
        return Promise.reject(new Error('Unexpected URL'));
      });

      const result = await service.ingest(repo, pr, sha);

      // Verify results
      expect(result.id).toBe('new-uuid');
      expect(result.repo_full_name).toBe(repo);
      expect(result.commit_sha).toBe(sha);
      
      // Verify fact data structure (Pillar 5.1 Schema)
      const data = result.data;
      expect(data.pull_request.title).toBe('Fix login');
      expect(data.changes.total_files).toBe(2);
      expect(data.changes.additions).toBe(60);
      expect(data.metadata.test_files_changed_count).toBe(1);
      expect(data.metadata.path_prefixes).toContain('src');
      expect(data.metadata.path_prefixes).toContain('tests');
      
      // Verify new schema fields
      expect(data.provenance.rate_limit_remaining).toBe(4999);
      expect(data.provenance.ingestion_method).toBe('api');
      
      expect(dbMock.FactSnapshot.create).toHaveBeenCalled();
    });

    test('should handle GitHub API errors gracefully', async () => {
      dbMock.FactSnapshot.findOne.mockResolvedValue(null);
      mockedAxios.get.mockRejectedValue(new Error('GitHub API down'));

      await expect(service.ingest(repo, pr, sha))
        .rejects.toThrow('Fact ingestion failed: GitHub API down');
    });
  });
});
