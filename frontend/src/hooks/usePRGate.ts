import { useState, useCallback, useRef } from 'react';
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
  violated_policy?: string;
  violation_reason?: string;
  policy_version?: string;
  facts?: {
    totalChanges: number;
    testFilesAdded: number;
    affectedAreas: string[];
    hasCriticalChanges: boolean;
    changedFiles: string[];
    isMainBranch: boolean;
  };
  advisor?: {
    riskAssessment: {
      riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    };
    rationale: string;
  };
  override_by?: string;
  override_reason?: string;
  overridden_at?: string;
  observed_change?: string;
  affected_files?: string[];
  policies?: PolicyResult[];
  created_at: string;
  updated_at: string;
}

export interface PolicyResult {
  id: string;
  name: string;
  passed: boolean;
  description: string;
}

export interface DecisionObject {
  decision: string;
  evaluationStatus: string;
  decisionReason: string;
  violation_reason?: string;
  violated_policy?: string;
  observed_change?: string;
  affected_files?: string[];
  policy_version: string;
  policies?: PolicyResult[];
  facts: {
    changedFiles: string[];
    testFilesAdded: number;
    affectedAreas: string[];
    totalChanges: number;
    isMainBranch: boolean;
    hasCriticalChanges: boolean;
  };
  ui: {
    fix_link: string;
  };
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
  
  // Prevent excessive polling
  const lastFetchRef = useRef<number>(0);
  const FETCH_COOLDOWN_MS = 2000;

  const fetchLatestDecision = useCallback(async (owner: string, repo: string, prNumber: number) => {
    const now = Date.now();
    if (now - lastFetchRef.current < FETCH_COOLDOWN_MS) {
      console.log("Skipping fetchLatestDecision due to cooldown");
      return null;
    }
    lastFetchRef.current = now;

    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<PRDecision>(`/v1/github/repos/${owner}/${repo}/pr/${prNumber}/decision`);
      setLatestDecision(response);
      return response;
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Failed to fetch PR decision');
      if (apiErr.status !== 404) {
        handleError(apiErr);
      }
      setLatestDecision(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  const fetchDecisionById = useCallback(async (decisionId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<PRDecision>(`/v1/github/decisions/${decisionId}`);
      setLatestDecision(response);
      return response;
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Failed to fetch PR decision by ID');
      handleError(apiErr);
      setLatestDecision(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  const executeOverride = useCallback(async (owner: string, repo: string, prNumber: number, reason: string, category: string = 'BUSINESS_EXCEPTION', ttlHours: number = 24) => {
    setIsLoading(true);
    try {
      const response = await api.post<{ decision: string }>(
        `/v1/github/repos/${owner}/${repo}/pr/${prNumber}/override`,
        { reason, category, ttl_hours: ttlHours }
      );
      handleSuccess('Override applied successfully');
      return true;
    } catch (err) {
      handleError(err as ApiError);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, handleSuccess]);

  const mergePullRequest = useCallback(async (owner: string, repo: string, prNumber: number) => {
    setIsLoading(true);
    try {
      await api.post(`/v1/github/repos/${owner}/${repo}/pr/${prNumber}/merge`);
      handleSuccess('Pull request merged successfully');
      return true;
    } catch (err) {
      handleError(err as ApiError);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, handleSuccess]);

  return {
    latestDecision,
    isLoading,
    error,
    fetchLatestDecision,
    fetchDecisionById,
    executeOverride,
    mergePullRequest
  };
};
