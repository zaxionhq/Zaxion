import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { toast } from 'sonner';
import { showErrorToast, showSuccessToast, showInfoToast, showWarningToast, useApiErrorHandler } from '../ErrorToast';
import { ApiError } from '@/lib/api';

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    dismiss: vi.fn(),
  },
}));

describe('ErrorToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('showErrorToast', () => {
    it('should show error toast with retry button for retryable errors', () => {
      const onRetry = vi.fn();
      const error: ApiError = {
        name: 'ApiError',
        message: 'Server error',
        status: 500,
        retryable: true,
      };

      showErrorToast(error, onRetry);

      expect(toast.error).toHaveBeenCalledWith('Server error', {
        description: 'Server error. Please try again later.',
        duration: 10000,
        action: expect.any(Object),
      });
    });

    it('should show error toast without retry button for non-retryable errors', () => {
      const error: ApiError = {
        name: 'ApiError',
        message: 'Bad request',
        status: 400,
        retryable: false,
      };

      showErrorToast(error);

      expect(toast.error).toHaveBeenCalledWith('Bad request', {
        description: 'An unexpected error occurred.',
        duration: 5000,
        action: undefined,
      });
    });

    it('should show appropriate descriptions for different error types', () => {
      // 401 error
      const authError: ApiError = {
        name: 'ApiError',
        message: 'Unauthorized',
        status: 401,
        retryable: false,
      };
      showErrorToast(authError);
      expect(toast.error).toHaveBeenCalledWith('Unauthorized', {
        description: 'Please log in again to continue.',
        duration: 5000,
        action: undefined,
      });

      // 403 error
      const forbiddenError: ApiError = {
        name: 'ApiError',
        message: 'Forbidden',
        status: 403,
        retryable: false,
      };
      showErrorToast(forbiddenError);
      expect(toast.error).toHaveBeenCalledWith('Forbidden', {
        description: 'You do not have permission to perform this action.',
        duration: 5000,
        action: undefined,
      });

      // 404 error
      const notFoundError: ApiError = {
        name: 'ApiError',
        message: 'Not found',
        status: 404,
        retryable: false,
      };
      showErrorToast(notFoundError);
      expect(toast.error).toHaveBeenCalledWith('Not found', {
        description: 'The requested resource was not found.',
        duration: 5000,
        action: undefined,
      });

      // 429 error
      const rateLimitError: ApiError = {
        name: 'ApiError',
        message: 'Too many requests',
        status: 429,
        retryable: true,
      };
      showErrorToast(rateLimitError, () => {});
      expect(toast.error).toHaveBeenCalledWith('Too many requests', {
        description: 'Too many requests. Please wait a moment and try again.',
        duration: 10000,
        action: expect.any(Object),
      });

      // Network error
      const networkError: ApiError = {
        name: 'ApiError',
        message: 'Network error',
        retryable: true,
      };
      showErrorToast(networkError, () => {});
      expect(toast.error).toHaveBeenCalledWith('Network error', {
        description: 'Network error. Please check your internet connection.',
        duration: 10000,
        action: expect.any(Object),
      });
    });
  });

  describe('showSuccessToast', () => {
    it('should show success toast', () => {
      showSuccessToast('Operation successful', 'The operation completed successfully');
      
      expect(toast.success).toHaveBeenCalledWith('Operation successful', {
        description: 'The operation completed successfully',
        duration: 3000,
      });
    });

    it('should show success toast without description', () => {
      showSuccessToast('Operation successful');
      
      expect(toast.success).toHaveBeenCalledWith('Operation successful', {
        description: undefined,
        duration: 3000,
      });
    });
  });

  describe('showInfoToast', () => {
    it('should show info toast', () => {
      showInfoToast('Information', 'Here is some information');
      
      expect(toast.info).toHaveBeenCalledWith('Information', {
        description: 'Here is some information',
        duration: 4000,
      });
    });
  });

  describe('showWarningToast', () => {
    it('should show warning toast', () => {
      showWarningToast('Warning', 'This is a warning message');
      
      expect(toast.warning).toHaveBeenCalledWith('Warning', {
        description: 'This is a warning message',
        duration: 5000,
      });
    });
  });

  describe('useApiErrorHandler', () => {
    it('should provide error handling functions', () => {
      const { result } = renderHook(() => useApiErrorHandler());
      
      expect(result.current.handleError).toBeInstanceOf(Function);
      expect(result.current.handleSuccess).toBeInstanceOf(Function);
      expect(result.current.handleInfo).toBeInstanceOf(Function);
      expect(result.current.handleWarning).toBeInstanceOf(Function);
    });

    it('should handle errors with retry callback', () => {
      const { result } = renderHook(() => useApiErrorHandler());
      const onRetry = vi.fn();
      const error: ApiError = {
        name: 'ApiError',
        message: 'Test error',
        status: 500,
        retryable: true,
      };

      result.current.handleError(error, onRetry);

      expect(toast.error).toHaveBeenCalledWith('Test error', {
        description: 'Server error. Please try again later.',
        duration: 10000,
        action: expect.any(Object),
      });
    });

    it('should handle success messages', () => {
      const { result } = renderHook(() => useApiErrorHandler());

      result.current.handleSuccess('Success!', 'Operation completed');

      expect(toast.success).toHaveBeenCalledWith('Success!', {
        description: 'Operation completed',
        duration: 3000,
      });
    });

    it('should handle info messages', () => {
      const { result } = renderHook(() => useApiErrorHandler());

      result.current.handleInfo('Info', 'Here is some info');

      expect(toast.info).toHaveBeenCalledWith('Info', {
        description: 'Here is some info',
        duration: 4000,
      });
    });

    it('should handle warning messages', () => {
      const { result } = renderHook(() => useApiErrorHandler());

      result.current.handleWarning('Warning', 'This is a warning');

      expect(toast.warning).toHaveBeenCalledWith('Warning', {
        description: 'This is a warning',
        duration: 5000,
      });
    });
  });
});

