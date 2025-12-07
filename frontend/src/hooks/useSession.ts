import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '@/lib/api';
import { useApiErrorHandler } from '@/components/ErrorToast';

interface User {
  id: number;
  githubId: string;
  username: string;
  displayName?: string;
  email?: string;
  provider: string;
}

interface SessionState {
  user: User | null;
  loading: boolean;
  error: string | null;
  retryCount: number;
}

export const useSession = () => {
  const [session, setSession] = useState<SessionState>({
    user: null,
    loading: true,
    error: null,
    retryCount: 0,
  });

  const { handleError, handleSuccess } = useApiErrorHandler();

  const checkSession = useCallback(async (isRetry = false) => {
    try {
      setSession(prev => ({ 
        ...prev, 
        loading: true, 
        error: null,
        retryCount: isRetry ? prev.retryCount + 1 : 0
      }));
      
      // Check if we have auth success in URL params (from OAuth callback)
      const urlParams = new URLSearchParams(window.location.search);
      const authSuccess = urlParams.get('auth');
      
      if (authSuccess === 'success') {
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
        handleSuccess('Successfully signed in!');
        
        // Delay the event dispatch slightly to ensure listeners are set up
        setTimeout(() => {
          // If this was a GitHub repository connection (not just a sign-in),
          // we need to ensure the UI reflects that we're ready to select repositories
          console.log('Dispatching github-connected event');
          const connectEvent = new CustomEvent('github-connected');
          window.dispatchEvent(connectEvent);
        }, 500); // 500ms delay to ensure event listeners are set up
      }

      // Try to get current user from backend
      const response = await api.get<{ user: User }>('/v1/auth/me');
      
      setSession({
        user: response.user,
        loading: false,
        error: null,
        retryCount: 0,
      });
    } catch (error: unknown) {
      const apiError = error as ApiError;
      
      // If 401, user is not authenticated - this is normal
      if (apiError.status === 401) {
        setSession({
          user: null,
          loading: false,
          error: null,
          retryCount: 0,
        });
      } else if (apiError.status === 0 || apiError.message?.includes('Backend not available')) {
        // Backend is not available, but don't treat this as an error in demo mode
        setSession({
          user: null,
          loading: false,
          error: null,
          retryCount: 0,
        });
        console.info('Backend not available, running in demo mode');
      } else {
        const errorMessage = apiError.message || 'Failed to check session';
        setSession({
          user: null,
          loading: false,
          error: errorMessage,
          retryCount: session.retryCount,
        });
        
        // Only show error toast if it's not a retry attempt and not a backend unavailability issue
        if (!isRetry && apiError.status !== 0) {
          handleError(apiError, () => checkSession(true));
        }
      }
    }
  }, [handleError, handleSuccess, session.retryCount]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const logout = useCallback(async () => {
    try {
      console.log('Starting logout process...');
      setSession(prev => ({ ...prev, loading: true }));
      
      console.log('Calling logout API...');
      await api.post('/v1/auth/logout');
      console.log('Logout API call successful');
      
      setSession({
        user: null,
        loading: false,
        error: null,
        retryCount: 0,
      });
      
      // Clear any cached data
      localStorage.removeItem('user');
      sessionStorage.clear();
      
      console.log('Clearing session data and redirecting...');
      // Redirect to home page
      window.location.href = '/';
      
      handleSuccess('Successfully signed out');
    } catch (error: unknown) {
      console.error('Logout error:', error);
      
      // Even if logout fails on backend, clear local session
      setSession({
        user: null,
        loading: false,
        error: null,
        retryCount: 0,
      });
      
      // Clear any cached data
      localStorage.removeItem('user');
      sessionStorage.clear();
      
      console.log('Logout failed, but clearing local session and redirecting...');
      // Redirect to home page
      window.location.href = '/';
      
      // Show warning instead of error for logout failures
      handleError(error as ApiError);
    }
  }, [handleError, handleSuccess]);

  const retrySession = useCallback(() => {
    checkSession(true);
  }, [checkSession]);

  return {
    user: session.user,
    loading: session.loading,
    error: session.error,
    retryCount: session.retryCount,
    logout,
    retrySession,
  };
};
