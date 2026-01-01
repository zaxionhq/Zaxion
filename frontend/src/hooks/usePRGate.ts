import { useState, useCallback } from 'react';
import { api, ApiError } from '@/lib/api';
import { useApiErrorHandler } from '@/components/ErrorToast';

export interface PRDecision {
  id: number;
  repo_owner: string;
  repo_name: string;
  pr_number: number;
  commit_sha: string;
  decision: 'PASS' | 'BLOCK' | 'WARN' | 'OVERRIDDEN_PASS';
  evaluationStatus: 'FINAL' | 'PENDING';
  decisionReason: string;
  raw_data: string;
  created_at: string;
  updated_at: string;
}

export interface DecisionObject {
  decision: string;
  evaluationStatus: string;
  decisionReason: string;
  advisor: {
    rationale: string;
    riskAssessment: {
      riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    };
  };
  override?: {
    executed: boolean;
    by: string;
    role: string;
    justification: string;
    timestamp: string;
  };
}

export const usePRGate = () => {
  const [latestDecision, setLatestDecision] = useState<PRDecision | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { handleError, handleSuccess } = useApiErrorHandler();

  const fetchLatestDecision = useCallback(async (owner: string, repo: string, prNumber: number) => {
    setIsLoading(true);
    setError(null);
    try {
      // Assuming we have an endpoint for this, if not we'll need to create one or use a general query
      // For now, let's assume /v1/github/repos/:owner/:repo/pr/:prNumber/decision
      const response = await api.get<PRDecision>(`/v1/github/repos/${owner}/${repo}/pr/${prNumber}/decision`);
      setLatestDecision(response);
      return response;
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Failed to fetch PR decision');
      // Don't show toast for 404 as it might just mean no decision yet
      if (apiErr.status !== 404) {
        handleError(err as Error, 'Fetch Decision Failed');
      }
      setLatestDecision(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  const executeOverride = useCallback(async (owner: string, repo: string, prNumber: number, reason: string) => {
    setIsLoading(true);
    try {
      const response = await api.post<{ decision: string }>(
        `/v1/github/repos/${owner}/${repo}/pr/${prNumber}/override`,
        { reason }
      );
      handleSuccess('PR Gate bypassed successfully');
      // Refresh decision after override
      await fetchLatestDecision(owner, repo, prNumber);
      return response;
    } catch (err) {
      handleError(err as Error, 'Override Failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, handleSuccess, fetchLatestDecision]);

  return {
    latestDecision,
    isLoading,
    error,
    fetchLatestDecision,
    executeOverride
  };
};
