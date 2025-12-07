import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSession } from '../useSession';
import { api } from '@/lib/api';

// Mock the API client
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock the error handler
vi.mock('@/components/ErrorToast', () => ({
  useApiErrorHandler: () => ({
    handleError: vi.fn(),
    handleSuccess: vi.fn(),
  }),
}));

interface MockApi {
  get: Mock;
  post: Mock;
}

interface ApiError extends Error {
  status?: number;
}

describe('useSession', () => {
  const mockApi = api as unknown as MockApi;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset URL search params
    Object.defineProperty(window, 'location', {
      value: {
        search: '',
        pathname: '/',
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useSession());
    
    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('should load user successfully', async () => {
    const mockUser = {
      id: 1,
      githubId: '123',
      username: 'testuser',
      displayName: 'Test User',
      email: 'test@example.com',
      provider: 'github',
    };

    mockApi.get.mockResolvedValueOnce({ user: mockUser });

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.error).toBe(null);
    expect(mockApi.get).toHaveBeenCalledWith('/v1/auth/me');
  });

  it('should handle 401 error gracefully', async () => {
    const mockError = new Error('Unauthorized') as ApiError;
    mockError.status = 401;
    mockApi.get.mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBe(null);
    expect(result.current.error).toBe(null); // 401 is handled gracefully
  });

  it('should handle other errors', async () => {
    const mockError = new Error('Network error') as ApiError;
    mockError.status = 500;
    mockApi.get.mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBe(null);
    expect(result.current.error).toBe('Network error');
  });

  it('should handle auth success in URL params', async () => {
    Object.defineProperty(window, 'location', {
      value: {
        search: '?auth=success',
        pathname: '/',
      },
      writable: true,
    });

    const mockUser = {
      id: 1,
      githubId: '123',
      username: 'testuser',
      displayName: 'Test User',
      email: 'test@example.com',
      provider: 'github',
    };

    mockApi.get.mockResolvedValueOnce({ user: mockUser });

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(window.history.replaceState).toHaveBeenCalled();
  });

  it('should logout successfully', async () => {
    const mockUser = {
      id: 1,
      githubId: '123',
      username: 'testuser',
      displayName: 'Test User',
      email: 'test@example.com',
      provider: 'github',
    };

    // First load user
    mockApi.get.mockResolvedValueOnce({ user: mockUser });
    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
    });

    // Then logout
    mockApi.post.mockResolvedValueOnce({ ok: true });
    await result.current.logout();

    expect(result.current.user).toBe(null);
    expect(result.current.error).toBe(null);
    expect(mockApi.post).toHaveBeenCalledWith('/v1/auth/logout');
  });

  it('should handle logout error gracefully', async () => {
    const mockUser = {
      id: 1,
      githubId: '123',
      username: 'testuser',
      displayName: 'Test User',
      email: 'test@example.com',
      provider: 'github',
    };

    // First load user
    mockApi.get.mockResolvedValueOnce({ user: mockUser });
    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
    });

    // Then logout with error
    const mockError = new Error('Logout failed');
    mockApi.post.mockRejectedValueOnce(mockError);
    await result.current.logout();

    // Should still clear local session even if backend fails
    expect(result.current.user).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('should retry session check', async () => {
    const mockUser = {
      id: 1,
      githubId: '123',
      username: 'testuser',
      displayName: 'Test User',
      email: 'test@example.com',
      provider: 'github',
    };

    // First call fails, retry succeeds
    const mockError = new Error('Network error') as ApiError;
    mockError.status = 500;
    mockApi.get
      .mockRejectedValueOnce(mockError)
      .mockResolvedValueOnce({ user: mockUser });

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.retryCount).toBe(0);
  });
});

