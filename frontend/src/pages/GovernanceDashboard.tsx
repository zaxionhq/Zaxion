import React, { Suspense, lazy } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/governance/DashboardLayout';
import { AnalyticsCards } from '@/components/governance/AnalyticsCards';
import { Shield, Microscope, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import { api } from '@/lib/api';

const PolicySimulationLazy = lazy(() =>
  import('@/components/governance/PolicySimulation').then((m) => ({ default: m.PolicySimulation }))
);

const GovernanceDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: sessionLoading } = useSession();

  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    error: analyticsError,
  } = useQuery({
    queryKey: ['governance', 'summary'],
    queryFn: () => api.get('/v1/analytics/governance/summary'),
    enabled: !!user,
    staleTime: 60_000,
  });

  React.useEffect(() => {
    if (sessionLoading) return;
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`, { replace: true });
    }
  }, [user, sessionLoading, navigate]);

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-muted-foreground font-mono text-xs uppercase tracking-[0.2em]">
          Verifying credentials...
        </p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const errorMessage = analyticsError instanceof Error ? analyticsError.message : null;

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-8 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/50 bg-clip-text text-transparent">
              Governance Strategy Hub
            </h2>
            <p className="text-muted-foreground">
              Monitor systemic trust and simulate the impact of new governance policies.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-medium">
              <Shield className="h-3 w-3" />
              Enterprise Mode Active
            </div>
          </div>
        </div>

        {errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <AnalyticsCards data={analyticsData} isLoading={analyticsLoading} />

        <div className="grid gap-6">
          <div className="rounded-lg border border-border/50 bg-card/30 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Microscope className="h-5 w-5 text-primary" />
              <h3 className="font-bold tracking-tight text-lg">Policy Impact Simulator</h3>
            </div>
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              }
            >
              <PolicySimulationLazy />
            </Suspense>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default GovernanceDashboard;
