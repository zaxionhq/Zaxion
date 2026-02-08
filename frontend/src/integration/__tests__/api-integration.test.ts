import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api } from '@/lib/api';
import logger from '@/lib/logger';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Frontend-Backend API Integration', () => {
  beforeEach(() => {
    logger.debug('beforeEach starting');
    mockFetch.mockClear();
    
    // Implementation that handles CSRF token and other requests by URL
    mockFetch.mockImplementation(async (url) => {
      const urlString = url.toString();
      logger.debug('Default mockFetch called with', { url: urlString });
      
      if (urlString.endsWith('/csrf-token')) {
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ csrfToken: 'test-token' }),
        };
      }
      
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({}),
      };
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication Flow', () => {
    it('should handle GitHub OAuth login redirect', () => {
      const url = api.buildUrl('/v1/auth/github');
      expect(url).toBe('http://localhost:5000/api/v1/auth/github');
    });

    it('should handle OAuth callback', () => {
      const url = api.buildUrl('/v1/auth/github/callback?code=abc123&state=xyz789');
      expect(url).toBe('http://localhost:5000/api/v1/auth/github/callback?code=abc123&state=xyz789');
    });

    it('should get current user session', async () => {
      const mockUser = {
        user: {
          id: 1,
          githubId: '123',
          username: 'testuser',
          displayName: 'Test User',
          email: 'test@example.com',
          provider: 'github'
        }
      };

      mockFetch.mockImplementation(async (url) => {
        if (url.toString().endsWith('/csrf-token')) {
          return {
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: () => Promise.resolve({ csrfToken: 'test-token' }),
          };
        }
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockUser),
        };
      });

      const result = await api.get('/v1/auth/me');
      expect(result).toEqual(mockUser);
    });

    it('should handle logout', async () => {
      mockFetch.mockImplementation(async (url) => {
        if (url.toString().endsWith('/csrf-token')) {
          return {
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: () => Promise.resolve({ csrfToken: 'test-token' }),
          };
        }
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ success: true }),
        };
      });

      await api.post('/v1/auth/logout');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/v1/auth/logout',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        })
      );
    });
  });

  describe('GitHub Integration', () => {
    it('should list user repositories', async () => {
      const mockRepos = [
        {
          id: 1,
          name: 'test-repo',
          full_name: 'testuser/test-repo',
          owner: { login: 'testuser' },
          private: false,
          description: 'Test repository'
        }
      ];

      mockFetch.mockImplementation(async (url) => {
        if (url.toString().endsWith('/csrf-token')) {
          return {
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: () => Promise.resolve({ csrfToken: 'test-token' }),
          };
        }
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockRepos),
        };
      });

      const result = await api.get('/v1/github/repos');
      expect(result).toEqual(mockRepos);
    });

    it('should list repository files', async () => {
      mockFetch.mockImplementation(async (url) => {
        if (url.toString().endsWith('/csrf-token')) {
          return {
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: () => Promise.resolve({ csrfToken: 'test-token' }),
          };
        }
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve([]),
        };
      });

      const result = await api.get('/v1/github/repos/testuser/test-repo/files?path=');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/v1/github/repos/testuser/test-repo/files?path=',
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
        })
      );
    });

    it('should create pull request', async () => {
      const mockPR = {
        url: 'https://github.com/testuser/test-repo/pull/1',
        number: 1
      };

      const prData = {
        branchName: 'feature/add-tests',
        title: 'Add AI-generated test cases',
        body: 'This PR adds comprehensive test cases generated by our AI testing assistant.',
        files: [{
          path: 'tests/index.test.js',
          content: 'describe("test", () => { it("should work", () => { expect(true).toBe(true); }); });'
        }],
        baseBranch: 'main'
      };

      mockFetch.mockImplementation(async (url) => {
        if (url.toString().endsWith('/csrf-token')) {
          return {
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: () => Promise.resolve({ csrfToken: 'test-token' }),
          };
        }
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockPR),
        };
      });

      const result = await api.post('/v1/github/repos/testuser/test-repo/pr', prData);
      expect(result).toEqual(mockPR);
    });
  });

  describe('Test Case Generation', () => {
    it('should generate test summaries', async () => {
      const mockSummaries = [
        {
          id: 'summary-1',
          fileName: 'index.js',
          filePath: 'src/index.js',
          language: 'JavaScript',
          summary: 'Test user authentication and profile management',
          testTypes: ['Unit Tests', 'Integration Tests'],
          complexity: 'medium',
          estimatedTests: 8
        }
      ];

      const requestData = {
        files: [
          { path: 'src/index.js', language: 'JavaScript' }
        ],
        repo: {
          owner: 'testuser',
          repo: 'test-repo'
        }
      };

      mockFetch.mockImplementation(async (url) => {
        if (url.toString().endsWith('/csrf-token')) {
          return {
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: () => Promise.resolve({ csrfToken: 'test-token' }),
          };
        }
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockSummaries),
        };
      });

      const result = await api.post('/v1/testcases/generate/summaries', requestData);
      expect(result).toEqual(mockSummaries);
    });

    it('should generate test code', async () => {
      const mockCode = {
        code: 'describe("UserService", () => { it("should authenticate user", () => { expect(true).toBe(true); }); });',
        language: 'javascript'
      };

      const requestData = {
        summaryId: 'summary-1',
        files: [
          { path: 'src/index.js', language: 'JavaScript' }
        ],
        framework: 'jest'
      };

      mockFetch.mockImplementation(async (url) => {
        if (url.toString().endsWith('/csrf-token')) {
          return {
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: () => Promise.resolve({ csrfToken: 'test-token' }),
          };
        }
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockCode),
        };
      });

      const result = await api.post('/v1/testcases/generate/code', requestData);
      expect(result).toEqual(mockCode);
    });

    it('should execute tests in sandbox', async () => {
      const mockResult = {
        success: true,
        results: [
          { test: 'should authenticate user', status: 'passed' }
        ],
        coverage: 85.5
      };

      const requestData = {
        testCode: 'describe("test", () => { it("should work", () => { expect(true).toBe(true); }); });',
        sourceCode: 'function test() { return true; }',
        language: 'javascript',
        framework: 'jest'
      };

      mockFetch.mockImplementation(async (url) => {
        if (url.toString().endsWith('/csrf-token')) {
          return {
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: () => Promise.resolve({ csrfToken: 'test-token' }),
          };
        }
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockResult),
        };
      });

      const result = await api.post('/v1/testcases/execute', requestData);
      expect(result).toEqual(mockResult);
    });
  });

  describe('Chatbot Integration', () => {
    it('should chat with AI assistant', async () => {
      const mockResponse = {
        message: 'I can help you improve your test cases. Here are some suggestions...',
        suggestedCode: 'describe("improved test", () => { it("should be better", () => { expect(true).toBe(true); }); });',
        recommendations: ['Add more edge cases', 'Improve test coverage']
      };

      const requestData = {
        message: 'How can I improve my test cases?',
        currentCode: 'describe("test", () => { it("should work", () => { expect(true).toBe(true); }); });',
        language: 'javascript'
      };

      mockFetch.mockImplementation(async (url) => {
        if (url.toString().endsWith('/csrf-token')) {
          return {
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: () => Promise.resolve({ csrfToken: 'test-token' }),
          };
        }
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockResponse),
        };
      });

      const result = await api.post('/v1/chatbot/chat', requestData);
      expect(result).toEqual(mockResponse);
    });

    it('should analyze test coverage', async () => {
      const mockAnalysis = {
        coverage: 75.5,
        uncoveredLines: [15, 23, 45],
        suggestions: ['Add tests for edge cases', 'Improve error handling tests']
      };

      const requestData = {
        testCode: 'describe("test", () => { it("should work", () => { expect(true).toBe(true); }); });',
        sourceCode: 'function test() { return true; }',
        language: 'javascript'
      };

      mockFetch.mockImplementation(async (url) => {
        if (url.toString().endsWith('/csrf-token')) {
          return {
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: () => Promise.resolve({ csrfToken: 'test-token' }),
          };
        }
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockAnalysis),
        };
      });

      const result = await api.post('/v1/chatbot/coverage', requestData);
      expect(result).toEqual(mockAnalysis);
    });
  });

  describe('Error Handling', () => {
    it('should handle 401 authentication errors', async () => {
      mockFetch.mockImplementation(async () => {
        return {
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          headers: {
            get: (name: string) => name.toLowerCase() === 'content-type' ? 'application/json' : null,
          },
          json: () => Promise.resolve({ message: 'Unauthorized' }),
          text: () => Promise.resolve(JSON.stringify({ message: 'Unauthorized' })),
        };
      });

      await expect(api.get('/v1/auth/me')).rejects.toThrow('Unauthorized');
    }, 15000);

    it('should handle 500 server errors with retry', async () => {
      vi.useFakeTimers();

      // First two calls fail, third succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ message: 'Internal Server Error' }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ message: 'Internal Server Error' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ success: true }),
        });

      const promise = api.get('/v1/github/repos');

      // Advance timers to trigger retries
      await vi.runAllTimersAsync();

      const result = await promise;
      expect(result).toEqual({ success: true });
      expect(mockFetch).toHaveBeenCalledTimes(3);

      vi.useRealTimers();
    });
  });
});

