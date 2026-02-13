import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/governance/DashboardLayout';
import { DecisionExplorer } from '@/components/governance/DecisionExplorer';
import { History, Shield, Loader2, AlertCircle } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const GovernanceDecisions: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: sessionLoading } = useSession();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionLoading) return;
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`, { replace: true });
    }
  }, [user, sessionLoading, navigate]);

  if (sessionLoading || !user) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-white/40 font-mono text-xs uppercase tracking-[0.2em]">
          Verifying Institutional Credentials...
        </p>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-8 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/50 bg-clip-text text-transparent">
              Governance Audit Trail
            </h2>
            <p className="text-muted-foreground">
              Trace every enforcement decision and manual override across your organization.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
            <History className="h-3 w-3" />
            Audit Mode Active
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4">
          <DecisionExplorer />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default GovernanceDecisions;
