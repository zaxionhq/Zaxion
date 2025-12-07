import React from 'react';
import { toast } from 'sonner';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api';

interface ErrorToastProps {
  error: ApiError;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const showErrorToast = (error: ApiError, onRetry?: () => void) => {
  const isRetryable = error.retryable && onRetry;
  
  toast.error(error.message, {
    description: getErrorDescription(error),
    duration: isRetryable ? 10000 : 5000, // Longer duration if retryable
    action: isRetryable ? (
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          onRetry();
          toast.dismiss();
        }}
        className="ml-2"
      >
        <RefreshCw className="h-3 w-3 mr-1" />
        Retry
      </Button>
    ) : undefined,
  });
};

export const showSuccessToast = (message: string, description?: string) => {
  toast.success(message, {
    description,
    duration: 3000,
  });
};

export const showInfoToast = (message: string, description?: string) => {
  toast.info(message, {
    description,
    duration: 4000,
  });
};

export const showWarningToast = (message: string, description?: string) => {
  toast.warning(message, {
    description,
    duration: 5000,
  });
};

function getErrorDescription(error: ApiError): string {
  if (error.status === 401) {
    return 'Please log in again to continue.';
  }
  
  if (error.status === 403) {
    return 'You do not have permission to perform this action.';
  }
  
  if (error.status === 404) {
    return 'The requested resource was not found.';
  }
  
  if (error.status === 429) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  
  if (error.status >= 500) {
    return 'Server error. Please try again later.';
  }
  
  if (error.status === 408) {
    return 'Request timed out. Please check your connection.';
  }
  
  if (!error.status) {
    return 'Network error. Please check your internet connection.';
  }
  
  return error.details?.message || 'An unexpected error occurred.';
}

// Hook for handling API errors with automatic toast display
export const useApiErrorHandler = () => {
  const handleError = React.useCallback((error: ApiError, onRetry?: () => void) => {
    showErrorToast(error, onRetry);
  }, []);

  const handleSuccess = React.useCallback((message: string, description?: string) => {
    showSuccessToast(message, description);
  }, []);

  const handleInfo = React.useCallback((message: string, description?: string) => {
    showInfoToast(message, description);
  }, []);

  const handleWarning = React.useCallback((message: string, description?: string) => {
    showWarningToast(message, description);
  }, []);

  return {
    handleError,
    handleSuccess,
    handleInfo,
    handleWarning,
  };
};

