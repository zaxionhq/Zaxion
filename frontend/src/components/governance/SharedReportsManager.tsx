import React, { useCallback, useEffect, useState } from 'react';
import { Link2, Copy, Trash2, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GlassCard } from '@/components/ui/glass-card';
import {
  listMySharedReports,
  revokeSharedReport,
  SharedReportListItem,
} from '@/lib/shareReport';
import { toast } from 'sonner';

function formatMetaSummary(item: SharedReportListItem): string {
  const m = item.meta ?? {};
  if (item.type === 'founder_audit') {
    if (Array.isArray(m.repos) && (m.repos as string[]).length > 1) {
      return `Multi-repo · ${m.totalAnalyzed ?? '?'} PRs`;
    }
    if (m.owner && m.repo) return `${m.owner}/${m.repo}`;
    return 'Founder audit';
  }
  if (m.repo) return String(m.repo);
  if (m.policy_id) return `Policy ${m.policy_id}`;
  return 'Policy simulation';
}

export const SharedReportsManager: React.FC = () => {
  const [reports, setReports] = useState<SharedReportListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listMySharedReports();
      setReports(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load shared reports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCopy = async (url: string) => {
    await navigator.clipboard.writeText(url);
    toast.success('Link copied');
  };

  const handleRevoke = async (token: string) => {
    setRevoking(token);
    try {
      await revokeSharedReport(token);
      toast.success('Share link revoked');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to revoke');
    } finally {
      setRevoking(null);
    }
  };

  return (
    <GlassCard className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold tracking-tight text-lg">Shared Reports</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Manage read-only links you created from audits and policy simulations.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : reports.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          No shared reports yet. Create a link from Founder Console or Policy Impact Simulator.
        </p>
      ) : (
        <div className="space-y-3">
          {reports.map((item) => (
            <div
              key={item.share_token}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-border/60 bg-muted/20"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-[10px] uppercase">
                    {item.type === 'founder_audit' ? 'Audit' : 'Simulation'}
                  </Badge>
                  <Badge
                    variant={item.is_active ? 'default' : 'secondary'}
                    className="text-[10px]"
                  >
                    {item.is_active ? 'Active' : item.revoked_at ? 'Revoked' : 'Expired'}
                  </Badge>
                </div>
                <p className="text-sm font-medium truncate">{formatMetaSummary(item)}</p>
                <p className="text-[10px] font-mono text-muted-foreground">
                  Created {item.created_at ? new Date(item.created_at).toLocaleString() : '—'}
                  {item.expires_at && ` · Expires ${new Date(item.expires_at).toLocaleDateString()}`}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                {item.is_active && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(item.share_url)}
                    >
                      <Copy className="h-3.5 w-3.5 mr-1" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a href={item.share_url} target="_blank" rel="noopener noreferrer">
                        <Link2 className="h-3.5 w-3.5 mr-1" />
                        Open
                      </a>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={revoking === item.share_token}
                      onClick={() => handleRevoke(item.share_token)}
                    >
                      {revoking === item.share_token ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
};
