import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Shield, 
  Globe, 
  Building2, 
  Github, 
  GitBranch, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  History,
  Info,
  Loader2,
  Lock
} from 'lucide-react';
import { format } from 'date-fns';
import { DashboardLayout } from '@/components/governance/DashboardLayout';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CorePolicy {
  id: string;
  name: string;
  description: string;
  severity: string;
  category: string;
  is_enabled: boolean;
  is_disabled_at_current_scope: boolean;
  config?: {
    reason: string;
    user?: {
      username: string;
      displayName: string;
    };
    createdAt: string;
  };
}

interface AuditEntry {
  id: string;
  scope: string;
  target_id: string;
  is_enabled: boolean;
  reason: string;
  createdAt: string;
  user: {
    username: string;
    displayName: string;
  };
}

export default function GovernanceCorePolicies() {
  const [scope, setScope] = useState<'GLOBAL' | 'ORG' | 'REPO' | 'BRANCH'>('GLOBAL');
  const [org, setOrg] = useState<string>('');
  const [repo, setRepo] = useState<string>('');
  const [branch, setBranch] = useState<string>('');
  
  const [targetId, setTargetId] = useState<string | null>(null);

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<CorePolicy | null>(null);
  const [reason, setReason] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch Orgs/Repos for selector
  const { data: repos = [] } = useQuery({
    queryKey: ['github-repos'],
    queryFn: () => api.get<any[]>('/v1/github/repos'),
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['github-branches', repo],
    enabled: !!repo,
    queryFn: () => {
      const [owner, name] = repo.split('/');
      return api.get<any[]>(`/v1/github/repos/${owner}/${name}/branches`);
    }
  });

  // Update targetId based on scope
  useEffect(() => {
    if (scope === 'GLOBAL') setTargetId(null);
    else if (scope === 'ORG') setTargetId(org);
    else if (scope === 'REPO') setTargetId(repo);
    else if (scope === 'BRANCH') setTargetId(repo && branch ? `${repo}:${branch}` : null);
  }, [scope, org, repo, branch]);

  // Fetch Policies
  const { data: policies = [], isLoading } = useQuery<CorePolicy[]>({
    queryKey: ['core-policy-configs', scope, targetId],
    queryFn: () => api.get(`/v1/policies/core/config?scope=${scope}&target_id=${targetId || ''}`),
  });

  // Audit Trail
  const { data: auditTrail = [], isLoading: auditLoading } = useQuery<AuditEntry[]>({
    queryKey: ['core-policy-audit', selectedPolicy?.id],
    enabled: !!selectedPolicy && auditDialogOpen,
    queryFn: () => api.get(`/v1/policies/core/config/${selectedPolicy?.id}/audit`),
  });

  const disableMutation = useMutation({
    mutationFn: (data: { policyId: string, scope: string, targetId: string | null, reason: string }) => 
      api.post('/v1/policies/core/config/disable', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['core-policy-configs'] });
      toast({ title: 'Policy Disabled', description: 'The policy has been disabled for the selected scope.' });
      setConfirmDialogOpen(false);
      setReason('');
    },
    onError: (error: any) => {
      toast({ 
        variant: 'destructive', 
        title: 'Action Blocked', 
        description: error.message || 'Failed to disable policy.' 
      });
    }
  });

  const enableMutation = useMutation({
    mutationFn: (data: { policyId: string, scope: string, targetId: string | null }) => 
      api.post('/v1/policies/core/config/enable', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['core-policy-configs'] });
      toast({ title: 'Policy Enabled', description: 'The policy has been enabled for the selected scope.' });
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to enable policy.' });
    }
  });

  const handleToggle = (policy: CorePolicy, enabled: boolean) => {
    if (!enabled) {
      setSelectedPolicy(policy);
      setConfirmDialogOpen(true);
    } else {
      enableMutation.mutate({ 
        policyId: policy.id, 
        scope, 
        targetId 
      });
    }
  };

  const confirmDisable = () => {
    if (!selectedPolicy) return;
    if (!reason.trim()) {
      toast({ variant: 'destructive', title: 'Reason Required', description: 'Please provide a reason for disabling this policy.' });
      return;
    }
    disableMutation.mutate({
      policyId: selectedPolicy.id,
      scope,
      targetId,
      reason
    });
  };

  const uniqueOrgs = Array.from(new Set(repos.map((r: any) => r.owner.login)));

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8 overflow-y-auto h-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Core Policies</h1>
            <p className="text-muted-foreground">Manage system-wide Zaxion Guard policies and their enforcement scopes.</p>
          </div>
          <Badge variant="outline" className="px-3 py-1 gap-2 bg-primary/5 text-primary border-primary/20">
            <Shield className="h-4 w-4" />
            Zaxion Guard Active
          </Badge>
        </div>

        {/* Scope Selector Card */}
        <Card className="border-primary/10 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Configuration Scope
            </CardTitle>
            <CardDescription>Select the level at which you want to manage policies.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Scope</Label>
              <Select value={scope} onValueChange={(v: any) => setScope(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GLOBAL"><div className="flex items-center gap-2"><Globe className="h-4 w-4" /> Global</div></SelectItem>
                  <SelectItem value="ORG"><div className="flex items-center gap-2"><Building2 className="h-4 w-4" /> Organization</div></SelectItem>
                  <SelectItem value="REPO"><div className="flex items-center gap-2"><Github className="h-4 w-4" /> Repository</div></SelectItem>
                  <SelectItem value="BRANCH"><div className="flex items-center gap-2"><GitBranch className="h-4 w-4" /> Branch</div></SelectItem>
                </SelectContent>
              </Select>
            </div>

            {scope !== 'GLOBAL' && (
              <div className="space-y-2">
                <Label>Organization</Label>
                <Select value={org} onValueChange={setOrg}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueOrgs.map((o: any) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(scope === 'REPO' || scope === 'BRANCH') && (
              <div className="space-y-2">
                <Label>Repository</Label>
                <Select value={repo} onValueChange={setRepo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Repository" />
                  </SelectTrigger>
                  <SelectContent>
                    {repos
                      .filter((r: any) => !org || r.owner.login === org)
                      .map((r: any) => (
                        <SelectItem key={r.full_name} value={r.full_name}>{r.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {scope === 'BRANCH' && (
              <div className="space-y-2">
                <Label>Branch</Label>
                <Select value={branch} onValueChange={setBranch}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b: any) => (
                      <SelectItem key={b.name} value={b.name}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Policies Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Policy</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status ({scope})</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : policies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No policies found.
                  </TableCell>
                </TableRow>
              ) : (
                policies.map((policy) => (
                  <TableRow key={policy.id} className={cn(!policy.is_enabled && "opacity-60 bg-muted/30")}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold flex items-center gap-2">
                          {policy.name}
                          {policy.category === 'Security' && policy.severity === 'CRITICAL' && (
                            <Lock className="h-3 w-3 text-primary" title="Mandatory Compliance" />
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground line-clamp-1">{policy.description}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{policy.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={cn(
                          policy.severity === 'CRITICAL' ? "bg-destructive/10 text-destructive border-destructive/20" :
                          policy.severity === 'HIGH' ? "bg-orange-500/10 text-orange-500 border-orange-500/20" :
                          "bg-blue-500/10 text-blue-500 border-blue-500/20"
                        )}
                      >
                        {policy.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {policy.is_enabled ? (
                          <Badge variant="outline" className="text-green-500 border-green-500/20 bg-green-500/5 gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Enabled
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-destructive border-destructive/20 bg-destructive/5 gap-1">
                            <XCircle className="h-3 w-3" /> Disabled
                          </Badge>
                        )}
                        {policy.is_disabled_at_current_scope && (
                          <span className="text-[10px] text-muted-foreground italic">(Overridden at this scope)</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setSelectedPolicy(policy);
                            setAuditDialogOpen(true);
                          }}
                        >
                          <History className="h-4 w-4" />
                        </Button>
                        <Switch 
                          checked={policy.is_enabled} 
                          onCheckedChange={(checked) => handleToggle(policy, checked)}
                          disabled={disableMutation.isPending || enableMutation.isPending}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirm Disable Policy
            </DialogTitle>
            <DialogDescription>
              Disabling <strong>{selectedPolicy?.name}</strong> at the <strong>{scope}</strong> scope may impact compliance. 
              Each disable action is recorded in the audit trail.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason for Disabling</Label>
              <Textarea 
                placeholder="e.g., False positive in specific branch, legacy refactor exception..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <div className="p-3 bg-muted rounded-md text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Scope:</span>
                <span className="font-medium">{scope}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Target:</span>
                <span className="font-medium">{targetId || 'All'}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDisable} disabled={disableMutation.isPending}>
              {disableMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm Disable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audit Trail Dialog */}
      <Dialog open={auditDialogOpen} onOpenChange={setAuditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Audit Trail: {selectedPolicy?.name}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[400px] pr-4">
            {auditLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : auditTrail.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No audit events recorded for this policy.</div>
            ) : (
              <div className="space-y-4">
                {auditTrail.map((event) => (
                  <div key={event.id} className="p-4 border rounded-lg bg-muted/30 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        {event.is_enabled ? (
                          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">ENABLED</Badge>
                        ) : (
                          <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">DISABLED</Badge>
                        )}
                        <span className="text-xs font-medium">{event.scope}: {event.target_id || 'Global'}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{format(new Date(event.createdAt), 'PPpp')}</span>
                    </div>
                    <p className="text-sm italic">"{event.reason}"</p>
                    <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-xs font-medium">{event.user?.displayName || event.user?.username}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
