import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle, Shield, Eye } from 'lucide-react';
import { api } from '@/lib/api';
import { InteractiveAuditReport } from '@/components/governance/InteractiveAuditReport';
import { SocialAuditTerminal, BulkAnalysisData } from '@/components/governance/SocialAuditTerminal';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface SharedReportResponse {
  type: 'founder_audit' | 'policy_simulation';
  payload: unknown;
  report_html?: string;
  meta?: Record<string, unknown>;
  generated_at?: string;
  expires_at?: string;
}

const ReadOnlyBanner = () => (
  <Alert className="mb-6 border-primary/20 bg-primary/5">
    <Eye className="h-4 w-4 text-primary" />
    <AlertTitle className="text-sm font-semibold">Shared report — view only</AlertTitle>
    <AlertDescription className="text-xs text-muted-foreground">
      This is a read-only snapshot. Export and share controls are disabled.
    </AlertDescription>
  </Alert>
);

const ReportSharePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['shared-report', token],
    queryFn: async () => {
      try {
        return await api.get<SharedReportResponse>(`/v1/reports/${token}`);
      } catch (e: unknown) {
        const err = e as { status?: number };
        if (err.status === 410) throw new Error('This report link has expired or been revoked.');
        throw e;
      }
    },
    enabled: !!token,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Loading shared report...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Report unavailable</AlertTitle>
          <AlertDescription>
            {(error as Error)?.message || 'This link may be invalid or expired.'}
          </AlertDescription>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/">Return home</Link>
          </Button>
        </Alert>
      </div>
    );
  }

  if (data.type === 'founder_audit') {
    const viewMode = data.meta?.view_mode;
    return (
      <div className="min-h-screen p-6 md:p-10 max-w-6xl mx-auto">
        <header className="mb-8 flex items-center gap-3 border-b border-border/60 pb-6">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Zaxion Governance Audit</h1>
            <p className="text-xs text-muted-foreground font-mono">
              Shared report · {data.generated_at ? new Date(data.generated_at).toLocaleString() : ''}
            </p>
          </div>
        </header>
        <ReadOnlyBanner />
        {viewMode === 'SOCIAL' ? (
          <SocialAuditTerminal data={data.payload as BulkAnalysisData} readOnly />
        ) : (
          <InteractiveAuditReport data={data.payload as BulkAnalysisData} readOnly />
        )}
      </div>
    );
  }

  if (data.report_html) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="p-4 border-b border-border/60 bg-card/40">
          <ReadOnlyBanner />
        </div>
        <iframe
          title="Zaxion policy simulation report"
          srcDoc={data.report_html}
          className="w-full flex-1 min-h-[calc(100vh-120px)] border-0"
          sandbox="allow-same-origin"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <p className="text-muted-foreground">Report format not supported for display.</p>
    </div>
  );
};

export default ReportSharePage;
