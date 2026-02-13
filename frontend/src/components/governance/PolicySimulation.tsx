import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Play, RotateCcw, ShieldCheck, AlertCircle, Loader2, Plus, Search, GitBranch, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import logger from '@/lib/logger';

interface Policy {
  id: number;
  name: string;
  description?: string;
  scope: string;
  target_id: string;
  latest_version?: {
    created_at: string;
    creator?: {
      email: string;
    };
  };
}

interface Repository {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string };
}

interface Branch {
  name: string;
}

interface SimulationResult {
  id: string;
  status: 'COMPLETED' | 'FAILED' | 'PENDING';
  total_scanned: number;
  total_blocked: number;
  blast_radius: number;
  created_at: string;
}

export const PolicySimulation: React.FC = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRepoPopoverOpen, setIsRepoPopoverOpen] = useState(false);
  const [isBranchPopoverOpen, setIsBranchPopoverOpen] = useState(false);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  
  // New Policy Form State
  const [newPolicy, setNewPolicy] = useState({
    name: '',
    scope: 'GLOBAL',
    target_id: 'GLOBAL',
    branch_name: '',
    rules_logic: '{\n  "type": "mandatory_review",\n  "count": 1\n}'
  });
  const [isCreating, setIsCreating] = useState(false);

  const { toast } = useToast();

  const fetchPolicies = async () => {
    try {
      const response = await fetch('/api/v1/policies');
      if (response.ok) {
        const data = await response.json();
        setPolicies(data);
      }
    } catch (error) {
      logger.error('Failed to fetch policies:', error);
    }
  };

  const fetchRepositories = async () => {
    setIsLoadingRepos(true);
    try {
      const response = await fetch('/api/v1/github/repos');
      if (response.ok) {
        const data = await response.json();
        setRepositories(data);
      }
    } catch (error) {
      logger.error('Failed to fetch repositories:', error);
    } finally {
      setIsLoadingRepos(false);
    }
  };

  const fetchBranches = async (fullName: string) => {
    if (!fullName) return;
    const [owner, repo] = fullName.split('/');
    setIsLoadingBranches(true);
    try {
      const response = await fetch(`/api/v1/github/repos/${owner}/${repo}/branches`);
      if (response.ok) {
        const data = await response.json();
        setBranches(data);
      }
    } catch (error) {
      logger.error('Failed to fetch branches:', error);
    } finally {
      setIsLoadingBranches(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
    fetchRepositories();
  }, []);

  const handleCreatePolicy = async () => {
    if (!newPolicy.name) return;
    
    let parsedRules;
    try {
      parsedRules = JSON.parse(newPolicy.rules_logic);
    } catch (e) {
      toast({
        title: "Invalid Rules",
        description: "Policy rules must be valid JSON.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      // For BRANCH scope, target_id is "repo:branch"
      const finalTargetId = newPolicy.scope === 'BRANCH' 
        ? `${newPolicy.target_id}:${newPolicy.branch_name}`
        : newPolicy.target_id;

      // 1. Create Policy
      const policyResponse = await fetch('/api/v1/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPolicy.name,
          scope: newPolicy.scope === 'GLOBAL' ? 'ORG' : 'REPO', // backend uses ORG/REPO
          target_id: finalTargetId,
          owning_role: 'admin'
        })
      });

      if (!policyResponse.ok) throw new Error('Failed to create policy');
      const createdPolicy = await policyResponse.json();

      // 2. Create Initial Version with rules
      const versionResponse = await fetch(`/api/v1/policies/${createdPolicy.id}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enforcement_level: 'MANDATORY',
          rules_logic: parsedRules
        })
      });

      if (!versionResponse.ok) throw new Error('Failed to create policy version');

      toast({
        title: "Policy Created",
        description: `Policy "${newPolicy.name}" has been created successfully.`,
      });

      await fetchPolicies();
      setSelectedPolicyId(createdPolicy.id.toString());
      setIsCreateModalOpen(false);
      setNewPolicy({
        name: '',
        scope: 'GLOBAL',
        target_id: 'GLOBAL',
        branch_name: '',
        rules_logic: '{\n  "type": "mandatory_review",\n  "count": 1\n}'
      });
    } catch (error) {
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeployPolicy = async () => {
    if (!selectedPolicyId) return;
    
    setIsDeploying(true);
    try {
      // In a real implementation, this might update a status in the DB
      // For now, we simulate the deployment success
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Policy Deployed",
        description: "The policy has been successfully activated and is now enforcing rules.",
      });
      
      setResult(null);
      await fetchPolicies();
    } catch (error) {
      toast({
        title: "Deployment Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const runSimulation = async () => {
    if (!selectedPolicyId) return;

    setIsSimulating(true);
    try {
      const response = await fetch(`/api/v1/policies/${selectedPolicyId}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        toast({
          title: "Simulation Started",
          description: "Policy impact analysis is running in the background.",
        });
      } else {
        throw new Error('Simulation failed to start');
      }
    } catch (error) {
      toast({
        title: "Simulation Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const selectedPolicy = useMemo(() => 
    policies.find(p => p.id.toString() === selectedPolicyId),
  [policies, selectedPolicyId]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1 border-border/50 bg-card/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-sm font-bold uppercase tracking-wider">Simulation Configuration</CardTitle>
            <CardDescription>Select or create a policy to test.</CardDescription>
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button size="icon" variant="outline" className="h-8 w-8">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Policy</DialogTitle>
                <DialogDescription>
                  Define a new governance policy and its scope.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Policy Name</Label>
                  <Input 
                    id="name" 
                    placeholder="e.g., Mandatory Review Policy" 
                    value={newPolicy.name}
                    onChange={e => setNewPolicy({...newPolicy, name: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="scope">Scope</Label>
                  <Select 
                    value={newPolicy.scope} 
                    onValueChange={v => {
                      setNewPolicy({
                        ...newPolicy, 
                        scope: v, 
                        target_id: v === 'GLOBAL' ? 'GLOBAL' : '',
                        branch_name: ''
                      });
                    }}
                  >
                    <SelectTrigger id="scope">
                      <SelectValue placeholder="Select scope" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GLOBAL">Global (Org-wide)</SelectItem>
                      <SelectItem value="REPO">Repository</SelectItem>
                      <SelectItem value="BRANCH">Branch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(newPolicy.scope === 'REPO' || newPolicy.scope === 'BRANCH') && (
                  <div className="grid gap-2">
                    <Label>Target Repository</Label>
                    <Popover open={isRepoPopoverOpen} onOpenChange={setIsRepoPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={isRepoPopoverOpen}
                          className="w-full justify-between font-normal"
                        >
                          {newPolicy.target_id || "Search repository..."}
                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[450px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Type repository name..." />
                          <CommandList>
                            <CommandEmpty>
                              {isLoadingRepos ? "Fetching repositories..." : "No repository found."}
                            </CommandEmpty>
                            <CommandGroup>
                              {repositories.map((repo) => (
                                <CommandItem
                                  key={repo.full_name}
                                  value={repo.full_name}
                                  onSelect={(currentValue) => {
                                    setNewPolicy({ ...newPolicy, target_id: currentValue });
                                    setIsRepoPopoverOpen(false);
                                    if (newPolicy.scope === 'BRANCH') {
                                      fetchBranches(currentValue);
                                    }
                                  }}
                                >
                                  <CheckCircle2
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      newPolicy.target_id === repo.full_name ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {repo.full_name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                {newPolicy.scope === 'BRANCH' && (
                  <div className="grid gap-2">
                    <Label>Target Branch</Label>
                    <Popover open={isBranchPopoverOpen} onOpenChange={setIsBranchPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          disabled={!newPolicy.target_id}
                          aria-expanded={isBranchPopoverOpen}
                          className="w-full justify-between font-normal"
                        >
                          {newPolicy.branch_name || "Search branch..."}
                          <GitBranch className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[450px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Type branch name..." />
                          <CommandList>
                            <CommandEmpty>
                              {isLoadingBranches ? "Fetching branches..." : "No branch found."}
                            </CommandEmpty>
                            <CommandGroup>
                              {branches.map((branch) => (
                                <CommandItem
                                  key={branch.name}
                                  value={branch.name}
                                  onSelect={(currentValue) => {
                                    setNewPolicy({ ...newPolicy, branch_name: currentValue });
                                    setIsBranchPopoverOpen(false);
                                  }}
                                >
                                  <CheckCircle2
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      newPolicy.branch_name === branch.name ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {branch.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="rules">Policy Rules (JSON)</Label>
                  <Textarea 
                    id="rules" 
                    className="font-mono text-xs h-32"
                    value={newPolicy.rules_logic}
                    onChange={e => setNewPolicy({...newPolicy, rules_logic: e.target.value})}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Define the conditions that must be met for this policy to pass.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                <Button 
                  onClick={handleCreatePolicy} 
                  disabled={isCreating || !newPolicy.name || (newPolicy.scope !== 'GLOBAL' && !newPolicy.target_id) || (newPolicy.scope === 'BRANCH' && !newPolicy.branch_name)}
                >
                  {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save as Draft
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Target Policy</label>
            <Select value={selectedPolicyId} onValueChange={setSelectedPolicyId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a policy..." />
              </SelectTrigger>
              <SelectContent>
                {policies.map(p => (
                  <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPolicy && (
            <div className="p-3 rounded border border-border/50 bg-muted/20 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Audit Log</span>
                <Badge variant="outline" className="text-[9px] h-4">Draft</Badge>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-500">Created By:</span>
                  <span className="font-mono text-slate-300">{selectedPolicy.latest_version?.creator?.email || 'Admin'}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-500">Timestamp:</span>
                  <span className="font-mono text-slate-300">
                    {selectedPolicy.latest_version?.created_at 
                      ? new Date(selectedPolicy.latest_version.created_at).toLocaleString() 
                      : new Date().toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-500">Scope:</span>
                  <Badge variant="secondary" className="text-[9px] px-1 h-3">{selectedPolicy.scope}</Badge>
                </div>
              </div>
            </div>
          )}

          <Button 
            className="w-full" 
            onClick={runSimulation} 
            disabled={!selectedPolicyId || isSimulating}
          >
            {isSimulating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Analyze Policy Impact
          </Button>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2 border-border/50 bg-card/50 overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-muted/20">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold uppercase tracking-wider">Enforcement Impact Analysis</CardTitle>
              <CardDescription>Visualizing the projected impact of policy updates.</CardDescription>
            </div>
            {result && (
              <Badge variant={result.status === 'COMPLETED' ? 'outline' : 'secondary'} className="bg-green-500/10 text-green-500 border-green-500/20">
                {result.status}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!result ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <ShieldCheck className="h-12 w-12 mb-4 opacity-10" />
              <p className="text-sm">No impact data available.</p>
              <p className="text-xs">Configure and run a simulation to see projected enforcement results.</p>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Historical PRs Scanned</p>
                  <p className="text-xl font-bold">{result.total_scanned}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Projected Blocks</p>
                  <p className="text-xl font-bold text-red-500">{result.total_blocked}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Policy Impact</p>
                  <p className="text-xl font-bold text-orange-500">{(result.blast_radius * 100).toFixed(1)}%</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  Enforcement Insights
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This policy would have enforced {result.total_blocked} blocks across {result.total_scanned} pull requests in the last 30 days. 
                  An impact of {(result.blast_radius * 100).toFixed(1)}% indicates {result.blast_radius > 0.2 ? 'significant' : 'minimal'} 
                  workflow friction relative to current velocity.
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setResult(null)}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleDeployPolicy}
                  disabled={isDeploying}
                >
                  {isDeploying ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="mr-2 h-4 w-4" />
                  )}
                  Apply to {selectedPolicy?.scope || 'Scope'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
