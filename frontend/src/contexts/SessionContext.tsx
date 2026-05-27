import React, { createContext, useContext, useCallback, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import logger from '@/lib/logger';
import { useApiErrorHandler } from '@/components/ErrorToast';

export interface SessionUser {
  id: number;
  githubId: string;
  username: string;
  login?: string;
  avatar_url?: string;
  displayName?: string;
  email?: string;
  provider: string;
  role?: string;
  is_founder?: boolean;
}

interface SessionContextValue {
  user: SessionUser | null;
  loading: boolean;
  error: string | null;
  logout: () => Promise<void>;
  retrySession: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

async function fetchSessionUser(): Promise<SessionUser | null> {
  const urlParams = new URLSearchParams(window.location.search);
  const authSuccess = urlParams.get('auth');

  if (authSuccess === 'success') {
    const newParams = new URLSearchParams(window.location.search);
    newParams.delete('auth');
    const search = newParams.toString();
    const newUrl = `${window.location.pathname}${search ? `?${search}` : ''}`;
    window.history.replaceState({}, document.title, newUrl);
    window.dispatchEvent(new CustomEvent('github-connected'));
  }

  try {
    const response = await api.get<{ user: SessionUser }>('/v1/auth/me');
    return response.user;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    if (apiError.status === 401 || apiError.status === 0) {
      return null;
    }
    throw error;
  }
}

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const { handleError, handleSuccess } = useApiErrorHandler();
  const authHandledRef = useRef(false);

  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ['session'],
    queryFn: fetchSessionUser,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, err) => {
      const status = (err as ApiError)?.status;
      if (status === 401 || status === 403) return false;
      return failureCount < 1;
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === 'success' && !authHandledRef.current) {
      authHandledRef.current = true;
      handleSuccess('Successfully signed in!');
    }
  }, [handleSuccess]);

  const logout = useCallback(async () => {
    try {
      await api.post('/v1/auth/logout');
      queryClient.setQueryData(['session'], null);
      localStorage.removeItem('user');
      sessionStorage.clear();
      window.location.href = '/';
      handleSuccess('Successfully signed out');
    } catch (err) {
      queryClient.setQueryData(['session'], null);
      localStorage.removeItem('user');
      sessionStorage.clear();
      window.location.href = '/';
      handleError(err as ApiError);
    }
  }, [queryClient, handleError, handleSuccess]);

  const retrySession = useCallback(() => {
    refetch();
  }, [refetch]);

  const value: SessionContextValue = {
    user: user ?? null,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    logout,
    retrySession,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return ctx;
}
