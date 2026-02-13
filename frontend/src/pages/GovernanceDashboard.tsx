import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/governance/DashboardLayout';
import { AnalyticsCards } from '@/components/governance/AnalyticsCards';
import { PolicySimulation } from '@/components/governance/PolicySimulation';
import { Shield, Microscope, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import { api } from '@/lib/api';

const GovernanceDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: sessionLoading } = useSession();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionLoading) return;
    
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`, { replace: true });
      return;
    }

    const fetchAnalytics = async () => {
      try {
        const response = await api.get('/v1/analytics/governance/summary');
        setAnalyticsData(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
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

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <AnalyticsCards data={analyticsData} isLoading={isLoading} />

        <div className="grid gap-6">
          <div className="rounded-lg border border-border/50 bg-card/30 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Microscope className="h-5 w-5 text-primary" />
              <h3 className="font-bold tracking-tight text-lg">Policy Impact Simulator</h3>
            </div>
            <PolicySimulation />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default GovernanceDashboard;
