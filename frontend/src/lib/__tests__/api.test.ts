import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, ApiError } from '../api';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('API Client', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('buildUrl', () => {
    it('should build correct URL with base path', () => {
      const url = api.buildUrl('/v1/auth/me');
      expect(url).toBe('http://localhost:5000/api/v1/auth/me');
    });

    it('should handle paths without leading slash', () => {
      const url = api.buildUrl('v1/auth/me');
      expect(url).toBe('http://localhost:5000/api/v1/auth/me');
    });

    it('should handle full URLs', () => {
      const url = api.buildUrl('https://api.github.com/user');
      expect(url).toBe('https://api.github.com/user');
    });
  });

  describe('GET requests', () => {
    it('should make successful GET request', async () => {
      const mockResponse = { user: { id: 1, name: 'Test User' } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.get('/v1/auth/me');
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/v1/auth/me',
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should handle 401 error', async () => {
      const mockError = { message: 'Unauthorized', code: 'UNAUTHORIZED' };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve(mockError),
      });

      await expect(api.get('/v1/auth/me')).rejects.toThrow('Unauthorized');
    });

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Network error'));

      await expect(api.get('/v1/auth/me')).rejects.toThrow('Network error - please check your connection');
    });

    it('should retry on 500 error', async () => {
      const mockError = { message: 'Internal Server Error' };
      
      // First two calls fail, third succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockError),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockError),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ success: true }),
        });

      const result = await api.get('/v1/auth/me');
      expect(result).toEqual({ success: true });
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('POST requests', () => {
    it('should make successful POST request', async () => {
      const requestBody = { email: 'test@example.com', password: 'password' };
      const mockResponse = { token: 'jwt-token' };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.post('/v1/auth/login', requestBody);
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/v1/auth/login',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        })
      );
    });

    it('should handle validation error', async () => {
      const mockError = { 
        message: 'Validation failed', 
        errors: [{ field: 'email', message: 'Invalid email' }] 
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve(mockError),
      });

      await expect(api.post('/v1/auth/login', {})).rejects.toThrow('Validation failed');
    });
  });

  describe('Error handling', () => {
    it('should create proper ApiError with retryable flag', async () => {
      const mockError = { message: 'Server Error' };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve(mockError),
      });

      try {
        await api.get('/v1/test');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as ApiError).status).toBe(500);
        expect((error as ApiError).retryable).toBe(true);
        expect((error as ApiError).message).toBe('Server Error');
      }
    });

    it('should not retry on 400 error', async () => {
      const mockError = { message: 'Bad Request' };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve(mockError),
      });

      await expect(api.get('/v1/test')).rejects.toThrow('Bad Request');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle timeout', async () => {
      // Mock AbortController
      const mockAbort = vi.fn();
      const mockAbortController = {
        abort: mockAbort,
        signal: {},
      };
      global.AbortController = vi.fn(() => mockAbortController) as unknown as typeof AbortController;
      global.setTimeout = vi.fn((callback) => {
        callback();
        return 1 as unknown as NodeJS.Timeout;
      }) as unknown as typeof setTimeout;

      mockFetch.mockRejectedValueOnce(new DOMException('The operation was aborted', 'AbortError'));

      await expect(api.get('/v1/test')).rejects.toThrow('Request timeout');
    });
  });

  describe('Request timeout', () => {
    it('should timeout after 30 seconds', async () => {
      const mockAbort = vi.fn();
      const mockAbortController = {
        abort: mockAbort,
        signal: {},
      };
      global.AbortController = vi.fn(() => mockAbortController) as unknown as typeof AbortController;
      global.setTimeout = vi.fn((callback) => {
        // Don't execute callback immediately to simulate timeout
        return 1 as unknown as NodeJS.Timeout;
      }) as unknown as typeof setTimeout;

      mockFetch.mockRejectedValueOnce(new DOMException('The operation was aborted', 'AbortError'));

      await expect(api.get('/v1/test')).rejects.toThrow('Request timeout');
      expect(mockAbort).toHaveBeenCalled();
    });
  });
});

