import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, AlertCircle, Loader2, Plus, Filter, Search, ShieldCheck, Clock, User, GitBranch } from 'lucide-react';
import { format } from 'date-fns';
import { CreatePolicyModal } from '@/components/governance/CreatePolicyModal';
import { cn } from '@/lib/utils';
import { DashboardLayout } from '@/components/governance/DashboardLayout';

// Types based on backend Policy model
interface Policy {
  id: string;
  name: string;
  scope: 'ORG' | 'REPO' | 'BRANCH';
  target_id: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  is_enabled: boolean;
  created_by: { id: string, username: string, role: string } | null;
  createdAt: string;
  owning_role: string;
  latest_version?: { version_number: number, rules_logic: Record<string, unknown> };
  display_description?: string;
  approved_by?: { username: string } | null;
  approved_at?: string | null;
  deleted_at?: string | null;
  deletedBy?: { username: string } | null;
  deletion_reason?: string | null;
}

import { Trash2, RotateCcw } from 'lucide-react';

export default function GovernancePolicyLibrary() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedPolicies, setSelectedPolicies] = useState<string[]>([]);
  
  // Enable Modal State
  const [isEnableModalOpen, setIsEnableModalOpen] = useState(false);
  const [enableScope, setEnableScope] = useState<'ORG' | 'REPO' | 'BRANCH'>('ORG');
  const [enableTargetId, setEnableTargetId] = useState('ORG');
  const [policyToEnable, setPolicyToEnable] = useState<Policy | null>(null);

  // Diff Modal State
  const [diffPolicy, setDiffPolicy] = useState<Policy | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useQuery<unknown>({
    staleTime: Infinity,
    queryKey: ['user'],
    queryFn: () => api.get<unknown>('/v1/auth/me'),
  });

  // TARGET POLICY STATE (Renamed to avoid conflicts)
  const [simTargetPolicy, setSimTargetPolicy] = useState<Policy | null>(null);

  const { data: policies = [], isLoading } = useQuery<Policy[], Error>({
    queryKey: ['policies'],
    queryFn: async () => {
      const response = await api.get<Policy[]>('/v1/policies');
      return response;
    }
  });

  const { data: corePolicies = [] } = useQuery<Policy[], Error>({
    queryKey: ['core-policies'],
    staleTime: Infinity,
    queryFn: async () => {
      const response = await api.get<Array<Record<string, unknown>>>('/v1/policies/core');
      return response.map((p) => ({
        ...p,
        display_description: p.description as string | undefined,
        createdAt: new Date().toISOString(),
        id: (p.id as string | undefined) || `core-${String(p.name ?? 'policy')}`,
        is_enabled: false
      })) as Policy[];
    }
  });

  const { data: deletedPolicies = [] } = useQuery<Policy[], Error>({
    queryKey: ['deleted-policies'],
    queryFn: async () => {
      return await api.get<Policy[]>('/v1/policies?deleted=true');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string, reason: string }) => {
      const query = reason ? `?reason=${encodeURIComponent(reason)}` : '';
      return await api.delete(`/v1/policies/${id}${query}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      queryClient.invalidateQueries({ queryKey: ['deleted-policies'] });
      toast({ title: "Policy Deleted", description: "Policy has been moved to trash." });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Deletion Failed", 
        description: error.message || "Could not delete policy.", 
        variant: "destructive" 
      });
    }
  });

  const enableMutation = useMutation({
    mutationFn: async ({ id, scope, target_id }: { id: string, scope: string, target_id: string }) => {
      return await api.post(`/v1/policies/${id}/enable`, { scope, target_id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      toast({ title: "Policy Enabled", description: "Policy is now active." });
      setIsEnableModalOpen(false);
      setPolicyToEnable(null);
    },
    onError: (error: Error) => {
      toast({ 
        title: "Enable Failed", 
        description: error.message || "Could not enable policy.", 
        variant: "destructive" 
      });
    }
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.post(`/v1/policies/${id}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      toast({ title: "Policy Approved", description: "Policy marked as approved." });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Approval Failed", 
        description: error.message || "Could not approve policy.", 
        variant: "destructive" 
      });
    }
  });

  const simulateMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.post(`/v1/policies/${id}/simulate`, {
        sample_strategy: 'RANDOM',
        sample_size: 10,
        is_sandbox: true
      });
    },
    onSuccess: () => {
      toast({ title: "Simulation Started", description: "Running simulation in sandbox mode." });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Simulation Failed", 
        description: error.message || "Could not start simulation.", 
        variant: "destructive" 
      });
    }
  });

  // Filter Logic
  const filteredPolicies = policies.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.display_description?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredCorePolicies = corePolicies.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.display_description?.toLowerCase().includes(search.toLowerCase())
  );

  // Combine DB policies and Core Templates (avoid duplicates by name if needed, but for now just show both)
  // Actually, if a core policy is enabled, it should be in `policies`. 
  // We should show `corePolicies` only if they are NOT in `policies`? 
  // Or just show them as "Templates" available to be enabled.
  // The requirement is "display all available... descriptions".
  
  const zaxionPolicies = [
    ...filteredPolicies.filter(p => p.owning_role === 'system' || p.name.includes('Zaxion Core')),
    ...filteredCorePolicies.filter(cp => !policies.some(p => p.name === cp.name))
  ];
  
  const adminPolicies = filteredPolicies.filter(p => p.owning_role !== 'system' && !p.name.includes('Zaxion Core') && p.created_by?.role === 'admin' && p.status !== 'PENDING_APPROVAL');
  const userPolicies = filteredPolicies.filter(p => p.owning_role !== 'system' && !p.name.includes('Zaxion Core') && p.created_by?.role !== 'admin' && p.status !== 'PENDING_APPROVAL');
  const pendingPolicies = filteredPolicies.filter(p => p.status === 'PENDING_APPROVAL');

  const handleSelectAll = (checked: boolean, policiesToSelect: Policy[]) => {
    if (checked) {
      const ids = policiesToSelect.map(p => p.id);
      setSelectedPolicies(prev => Array.from(new Set([...prev, ...ids])));
    } else {
      const idsToRemove = new Set(policiesToSelect.map(p => p.id));
      setSelectedPolicies(prev => prev.filter(id => !idsToRemove.has(id)));
    }
  };

  const handleEnableClick = (policy: Policy) => {
    setPolicyToEnable(policy);
    setEnableScope(policy.scope);
    setEnableTargetId(policy.target_id);
    setIsEnableModalOpen(true);
  };

  const PolicyTable = ({ data, showActions = false, showApproval = false, isDeleted = false }: { data: Policy[], showActions?: boolean, showApproval?: boolean, isDeleted?: boolean }) => {
    const allSelected = data.length > 0 && data.every(p => selectedPolicies.includes(p.id));
    const someSelected = data.some(p => selectedPolicies.includes(p.id)) && !allSelected;

    return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[30px]">
              <input 
                type="checkbox" 
                checked={allSelected}
                ref={input => { if (input) input.indeterminate = someSelected; }}
                onChange={(e) => handleSelectAll(e.target.checked, data)}
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Version</TableHead>
            <TableHead>Scope</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created By</TableHead>
            <TableHead>{isDeleted ? 'Deleted At' : 'Created At'}</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">No policies found.</TableCell>
            </TableRow>
          ) : (
            data.map((policy) => (
              <TableRow key={policy.id} className={isDeleted ? "opacity-60 bg-muted/20" : ""}>
                <TableCell><input type="checkbox" checked={selectedPolicies.includes(policy.id)} onChange={(e) => {
                  if (e.target.checked) setSelectedPolicies([...selectedPolicies, policy.id]);
                  else setSelectedPolicies(selectedPolicies.filter(id => id !== policy.id));
                }} /></TableCell>
                <TableCell className="font-medium">
                  <div>{policy.name}</div>
                  <div className="text-xs text-muted-foreground truncate max-w-[300px]">{policy.display_description}</div>
                  {isDeleted && policy.deletion_reason && (
                    <div className="text-[10px] text-destructive mt-1">
                      Reason: {policy.deletion_reason}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {policy.owning_role === 'system' ? `v${policy.latest_version?.version_number || 1}` : (policy.created_by?.username || 'User')}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {policy.scope}
                  </Badge>
                  {policy.scope !== 'ORG' && <div className="text-xs text-muted-foreground mt-1">{policy.target_id}</div>}
                </TableCell>
                <TableCell>
                  {isDeleted ? (
                    <Badge variant="destructive">DELETED</Badge>
                  ) : (
                    <Badge variant={policy.is_enabled ? 'default' : 'secondary'} className={cn(
                      policy.status === 'APPROVED' && "bg-green-100 text-green-800 hover:bg-green-100",
                      policy.status === 'PENDING_APPROVAL' && "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
                      policy.status === 'REJECTED' && "bg-red-100 text-red-800 hover:bg-red-100"
                    )}>
                      {policy.is_enabled ? 'ENABLED' : policy.status}
                    </Badge>
                  )}
                  {policy.approved_by && !isDeleted && (
                    <div className="text-[10px] text-muted-foreground mt-1">
                      Approved by {policy.approved_by.username}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs">{isDeleted ? policy.deletedBy?.username : (policy.created_by?.username || 'System')}</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {isDeleted 
                    ? (policy.deleted_at ? format(new Date(policy.deleted_at), 'MMM d, yyyy HH:mm') : 'N/A')
                    : (policy.createdAt ? format(new Date(policy.createdAt), 'MMM d, yyyy') : 'N/A')
                  }
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {!isDeleted && showApproval && policy.status === 'PENDING_APPROVAL' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => setDiffPolicy(policy)}>
                          View Diff
                        </Button>
                        <Button size="sm" variant="default" onClick={() => approveMutation.mutate(policy.id)}>
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive">Reject</Button>
                      </>
                    )}
                    {!isDeleted && showActions && (
                      <>
                        <Button 
                          size="sm" 
                          variant={policy.is_enabled ? "outline" : "default"}
                          onClick={() => handleEnableClick(policy)}
                        >
                          {policy.is_enabled ? "Update Scope" : "Enable"}
                        </Button>
                        
                        {(user?.role === 'admin' || user?.role === 'maintainer') && (
                          <Button 
                            size="sm" 
                            variant="secondary"
                            onClick={() => simulateMutation.mutate(policy.id)}
                            disabled={simulateMutation.isPending}
                          >
                            {simulateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simulate"}
                          </Button>
                        )}

                        {policy.owning_role !== 'system' && !policy.name.includes('Zaxion Core') && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this policy?')) {
                                deleteMutation.mutate({ id: policy.id, reason: 'Manual deletion by user' });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
                    {isDeleted && (
                      <div className="text-[10px] italic text-muted-foreground">
                        Audit Record
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Policy Library</h1>
            <p className="text-muted-foreground">Manage and enforce governance standards across your organization.</p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create New Policy
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search policies..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
          {selectedPolicies.length > 0 && (
            <Button 
              variant="default" 
              className="ml-auto bg-green-600 hover:bg-green-700"
              onClick={() => {
                const firstPolicy = policies.find(p => p.id === selectedPolicies[0]);
                if (firstPolicy) handleEnableClick(firstPolicy);
              }}
            >
              Enable Policies ({selectedPolicies.length})
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {/* Pending Approval Section */}
          {pendingPolicies.length > 0 && (
            <div className="rounded-lg border bg-yellow-50/50 p-4 border-yellow-200">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-yellow-800">
                <Clock className="h-5 w-5" /> Pending Approval ({pendingPolicies.length})
              </h2>
              <PolicyTable data={pendingPolicies} showApproval={true} />
            </div>
          )}

          <Accordion type="multiple" defaultValue={["zaxion", "admin", "user"]} className="w-full space-y-4">
            
            <AccordionItem value="zaxion" className="border rounded-lg px-4 bg-card">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-2 w-full">
                  <ShieldCheck className="h-5 w-5 text-blue-600" />
                  <div className="flex flex-col items-start text-left">
                     <span className="text-lg font-semibold">Zaxion Core Policy Library (V1)</span>
                     <span className="text-xs text-muted-foreground">30 Enterprise-grade policies ready for simulation and enforcement.</span>
                  </div>
                  <Badge variant="secondary" className="ml-auto mr-4">{zaxionPolicies.length} Policies</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                <div className="space-y-4">
                   <div className="flex justify-between items-center bg-muted/30 p-3 rounded-md border">
                      <div className="text-sm">
                        {simTargetPolicy ? (
                          <span>Target Policy: <strong>{simTargetPolicy.name}</strong></span>
                        ) : (
                          <span className="text-muted-foreground italic">Select a policy below to simulate...</span>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        variant="default" 
                        disabled={!simTargetPolicy || simulateMutation.isPending || !(user?.role === 'admin' || user?.role === 'maintainer')}
                        onClick={() => simTargetPolicy && simulateMutation.mutate(simTargetPolicy.id)}
                      >
                         {simulateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                         Run Simulation (Sandbox)
                      </Button>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-2">
                     {zaxionPolicies.map(policy => (
                       <Card 
                         key={policy.id} 
                         className={cn(
                           "cursor-pointer transition-all hover:border-primary", 
                           simTargetPolicy?.id === policy.id ? "border-primary ring-1 ring-primary bg-primary/5" : "hover:bg-muted/50"
                         )}
                         onClick={() => setSimTargetPolicy(policy)}
                       >
                         <CardHeader className="pb-2">
                           <div className="flex justify-between items-start">
                             <Badge variant="outline">{policy.id.split('-')[0]}</Badge>
                             <Badge className={cn(
                               policy.status === 'APPROVED' ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                             )}>V1</Badge>
                           </div>
                           <CardTitle className="text-base mt-2">{policy.name}</CardTitle>
                         </CardHeader>
                         <CardContent>
                           <p className="text-sm text-muted-foreground leading-relaxed">
                             {policy.display_description}
                           </p>
                         </CardContent>
                       </Card>
                     ))}
                   </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="admin" className="border rounded-lg px-4 bg-card">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-lg font-semibold">Administrator Policies</span>
                  <Badge variant="secondary" className="ml-2">{adminPolicies.length}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                <PolicyTable data={adminPolicies} showActions={true} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="user" className="border rounded-lg px-4 bg-card">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-gray-600" />
                <span className="text-lg font-semibold">User-Created Policies</span>
                <Badge variant="secondary" className="ml-2">{userPolicies.length}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              <PolicyTable data={userPolicies} showActions={true} />
            </AccordionContent>
          </AccordionItem>

          {/* Deleted Policies Section */}
          <AccordionItem value="deleted" className="border rounded-lg px-4 bg-muted/30">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-destructive" />
                <span className="text-lg font-semibold text-muted-foreground">Deleted Policies (Audit Trail)</span>
                <Badge variant="outline" className="ml-2">{deletedPolicies.length}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              <PolicyTable data={deletedPolicies} isDeleted={true} />
            </AccordionContent>
          </AccordionItem>

        </Accordion>
      </div>

        <Dialog open={!!diffPolicy} onOpenChange={(val) => !val && setDiffPolicy(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Policy Review: {diffPolicy?.name}</DialogTitle>
              <DialogDescription>
                Submitted by {diffPolicy?.created_by?.username} on {diffPolicy?.createdAt ? format(new Date(diffPolicy.createdAt), 'PPP') : 'N/A'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <h4 className="text-sm font-semibold mb-2">Description</h4>
                <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md border">
                  {diffPolicy?.display_description || "No description provided."}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2">Rules Logic (JSON)</h4>
                <pre className="text-xs p-3 bg-slate-950 text-slate-50 rounded-md border overflow-x-auto max-h-[300px]">
                  {JSON.stringify(diffPolicy?.latest_version?.rules_logic, null, 2)}
                </pre>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDiffPolicy(null)}>Close</Button>
              <Button 
                variant="default"
                onClick={() => {
                  if (diffPolicy) {
                    approveMutation.mutate(diffPolicy.id);
                    setDiffPolicy(null);
                  }
                }}
              >
                Approve Now
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <CreatePolicyModal 
          open={isCreateModalOpen} 
          onOpenChange={setIsCreateModalOpen} 
          onPolicyCreated={() => queryClient.invalidateQueries({ queryKey: ['policies'] })} 
        />

        <Dialog open={isEnableModalOpen} onOpenChange={setIsEnableModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enable Policy: {policyToEnable?.name}</DialogTitle>
              <DialogDescription>Choose where this policy should be enforced.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Enforcement Scope</label>
                <Select value={enableScope} onValueChange={(val: 'ORG' | 'REPO' | 'BRANCH') => setEnableScope(val)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ORG">Global (Organization-wide)</SelectItem>
                    <SelectItem value="REPO">Specific Repository</SelectItem>
                    <SelectItem value="BRANCH">Specific Branch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {enableScope !== 'ORG' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Identifier</label>
                  <Input 
                    value={enableTargetId} 
                    onChange={(e) => setEnableTargetId(e.target.value)} 
                    placeholder={enableScope === 'REPO' ? 'owner/repo' : 'owner/repo/branch'} 
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEnableModalOpen(false)}>Cancel</Button>
              <Button 
                onClick={() => {
                  if (policyToEnable) {
                    enableMutation.mutate({ 
                      id: policyToEnable.id, 
                      scope: enableScope, 
                      target_id: enableTargetId 
                    });
                  }
                }}
                disabled={enableMutation.isPending}
              >
                {enableMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enable Policy
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
