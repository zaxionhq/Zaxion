import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, ApiError } from '../api';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('API Client', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    // Default implementation to handle CSRF token and other requests
    mockFetch.mockImplementation(async (url) => {
      const urlString = url.toString();
      if (urlString.endsWith('/csrf-token')) {
        return new Response(JSON.stringify({ csrfToken: 'test-token' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });
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
      mockFetch.mockImplementation(async (url) => {
        const urlString = url.toString();
        if (urlString.includes('/v1/auth/me')) {
          return new Response(JSON.stringify(mockError), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return new Response(JSON.stringify({ csrfToken: 'test-token' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      });

      await expect(api.get('/v1/auth/me')).rejects.toThrow('Unauthorized');
    });

    it('should handle network error', async () => {
      mockFetch.mockImplementation(async (url) => {
        if (url.toString().includes('/v1/auth/me')) {
          // Simulate a real fetch network error which usually has 'fetch' in the message
          throw new TypeError('Failed to fetch');
        }
        return new Response(JSON.stringify({ csrfToken: 'test-token' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      });

      await expect(api.get('/v1/auth/me')).rejects.toThrow('Backend not available - using demo mode');
    });

    it('should retry on 500 error', async () => {
      const mockError = { message: 'Internal Server Error' };
      let attempts = 0;
      
      mockFetch.mockImplementation(async (url) => {
        const urlString = url.toString();
        if (urlString.endsWith('/csrf-token')) {
          return new Response(JSON.stringify({ csrfToken: 'test-token' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        
        attempts++;
        if (attempts < 3) {
          return new Response(JSON.stringify(mockError), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      });

      const result = await api.get('/v1/auth/me');
      expect(result).toEqual({ success: true });
      expect(attempts).toBe(3);
    });
  });

  describe('POST requests', () => {
    it('should make successful POST request', async () => {
      const requestBody = { email: 'test@example.com', password: 'password' };
      const mockResponse = { token: 'jwt-token' };
      
      mockFetch.mockImplementation(async (url) => {
        const urlString = url.toString();
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
          json: () => Promise.resolve(mockResponse),
        };
      });

      const result = await api.post('/v1/auth/login', requestBody);
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/auth/login'),
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(requestBody),
        })
      );
    });

    it('should handle validation error', async () => {
      const mockError = { 
        message: 'Validation failed', 
        errors: [{ field: 'email', message: 'Invalid email' }] 
      };
      
      mockFetch.mockImplementation(async (url) => {
        const urlString = url.toString();
        if (urlString.endsWith('/csrf-token')) {
          return new Response(JSON.stringify({ csrfToken: 'test-token' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        if (urlString.includes('/v1/auth/login')) {
          return new Response(JSON.stringify(mockError), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return new Response(JSON.stringify({}), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      });

      await expect(api.post('/v1/auth/login', {})).rejects.toThrow('Validation failed');
    });
  });

  describe('Error handling', () => {
    it('should create proper ApiError with retryable flag', async () => {
      const mockError = { message: 'Server Error' };
      mockFetch.mockImplementation(async (url) => {
        if (url.toString().endsWith('/csrf-token')) {
          return new Response(JSON.stringify({ csrfToken: 'test-token' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return new Response(JSON.stringify(mockError), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
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
      let attempts = 0;
      mockFetch.mockImplementation(async (url) => {
        const urlString = url.toString();
        if (urlString.endsWith('/csrf-token')) {
          return new Response(JSON.stringify({ csrfToken: 'test-token' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        
        attempts++;
        return new Response(JSON.stringify(mockError), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      });

      await expect(api.get('/v1/test')).rejects.toThrow('Bad Request');
      expect(attempts).toBe(1);
    });

    it('should handle timeout', async () => {
      mockFetch.mockImplementation(async (url) => {
        if (url.toString().endsWith('/csrf-token')) {
          return new Response(JSON.stringify({ csrfToken: 'test-token' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        throw new DOMException('The operation was aborted', 'AbortError');
      });

      await expect(api.get('/v1/test')).rejects.toThrow('Request timeout');
    });
  });
});

