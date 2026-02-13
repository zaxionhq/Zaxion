import React, { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/governance/DashboardLayout';
import { 
  BarChart3, Shield, Loader2, AlertCircle, BadgeCheck, 
  TrendingUp, Link as LinkIcon, Search, GitBranch, 
  Globe, LayoutGrid, CheckCircle2, ChevronRight,
  Info
} from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { useNavigate, Link } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Hotspot {
  repo: string;
  count: number;
  policy_name?: string;
  version?: string;
  created_by?: string;
}

interface GovernanceAlert {
  policy_version_id: number;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  current_velocity: number;
  threshold: number;
}

interface AnalyticsData {
  trustScore: number;
  bypassVelocity: number;
  frictionIndex: number;
  totalDecisions: number;
  totalBlocks: number;
  totalOverrides: number;
  totalPolicies: number;
  hotspots: Hotspot[];
  alerts: GovernanceAlert[];
  timestamp: string;
}

interface PolicyRule {
  id?: string;
  type: string;
  version?: string;
  description?: string;
  severity?: string;
  status?: string;
  parameters: Record<string, unknown>;
}

interface PolicyVersion {
  id: string;
  version_number: number;
  enforcement_level: string;
  status?: string;
  description?: string;
  rules_logic: {
    rules?: PolicyRule[];
    [key: string]: unknown;
  };
  createdAt: string;
  creator?: {
    username: string;
    displayName?: string;
  };
}

interface Policy {
  id: string;
  name: string;
  description?: string;
  display_description?: string;
  scope: string;
  target_id: string;
  versions?: PolicyVersion[];
  latest_version?: PolicyVersion;
  created_by?: {
    username: string;
    displayName?: string;
  };
}

interface GitHubBranch {
  name: string;
  protected?: boolean;
}

const RuleExplainer: React.FC<{ rules?: PolicyRule[]; compact?: boolean }> = ({ rules, compact }) => {
  if (!rules || rules.length === 0) return null;

  return (
    <div className={cn("mt-4 space-y-2", compact && "mt-2")}>
      {!compact && (
        <p className="text-[9px] font-bold uppercase text-primary/60 tracking-widest flex items-center gap-1.5">
          <Shield className="h-3 w-3" />
          Active Guardrails
        </p>
      )}
      <div className="space-y-1.5">
        {rules.map((rule, idx) => (
          <div key={idx} className={cn(
            "flex flex-col gap-0.5 p-2 rounded bg-primary/5 border border-primary/10",
            compact && "p-1.5 bg-transparent border-border/20"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-[10px] font-bold text-white uppercase tracking-tighter",
                  compact && "text-[9px]"
                )}>
                  {rule.type.replace(/_/g, ' ')}
                </span>
                {rule.version && (
                  <span className="text-[9px] font-mono text-primary/50 px-1 rounded bg-primary/5 border border-primary/10">
                    v{rule.version}
                  </span>
                )}
                {(rule.severity || rule.status) && (
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-[8px] h-3.5 px-1 py-0 border-primary/20",
                      (rule.severity === 'BLOCK' || rule.status === 'BLOCK') ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-primary/5 text-primary"
                    )}
                  >
                    {rule.severity || rule.status}
                  </Badge>
                )}
              </div>
              {rule.parameters && Object.keys(rule.parameters).length > 0 && (
                <Badge variant="outline" className="text-[8px] h-3 px-1 py-0 bg-black/40 border-primary/20 text-primary/80">
                  {Object.entries(rule.parameters).map(([k, v]) => `${k}:${v}`).join(', ')}
                </Badge>
              )}
            </div>
            <p className={cn(
              "text-[10px] text-muted-foreground leading-tight italic",
              compact && "text-[9px]"
            )}>
              {rule.description || "Automated governance check."}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

const GovernanceAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: sessionLoading } = useSession();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Policy Inventory State
  const [activeTab, setActiveTab] = useState<'GLOBAL' | 'REPO' | 'BRANCH'>('GLOBAL');
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [isPoliciesLoading, setIsPoliciesLoading] = useState(false);
  
  // Repo/Branch Selection
  const [repos, setRepos] = useState<{ name: string; full_name: string }[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const [branches, setBranches] = useState<string[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [repoSearch, setRepoSearch] = useState("");
  const [isReposLoading, setIsReposLoading] = useState(false);

  useEffect(() => {
    if (sessionLoading) return;
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`, { replace: true });
      return;
    }

    const fetchAnalytics = async () => {
      try {
        const response = await api.get<AnalyticsData>('/v1/analytics/governance/summary');
        setAnalyticsData(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [user, sessionLoading, navigate]);

  // Fetch Repositories
  useEffect(() => {
    const fetchRepos = async () => {
      setIsReposLoading(true);
      try {
        const data = await api.get<{ name: string; full_name: string }[]>('/v1/github/repos');
        setRepos(data);
      } catch (error) {
        console.error('Failed to fetch repos:', error);
      } finally {
        setIsReposLoading(false);
      }
    };
    if (user) fetchRepos();
  }, [user]);

  // Fetch Branches when repo changes
  useEffect(() => {
    const fetchBranches = async () => {
      if (!selectedRepo) return;
      try {
        const [owner, name] = selectedRepo.split('/');
        const data = await api.get<GitHubBranch[]>(`/v1/github/repos/${owner}/${name}/branches`);
        setBranches(data.map((b: GitHubBranch) => b.name));
      } catch (error) {
        console.error('Failed to fetch branches:', error);
      }
    };
    if (selectedRepo) fetchBranches();
  }, [selectedRepo]);

  // Fetch Policies based on scope and target
  useEffect(() => {
    const fetchPolicies = async () => {
      setIsPoliciesLoading(true);
      try {
        // scope should be ORG for GLOBAL, and REPO for both REPO and BRANCH tabs
        const scope = activeTab === 'GLOBAL' ? 'ORG' : 'REPO';
        let query = `?scope=${scope}`;
        
        if ((activeTab === 'REPO' || activeTab === 'BRANCH') && selectedRepo) {
          query += `&target_id=${selectedRepo}`;
        } else if (activeTab === 'GLOBAL') {
          query += `&target_id=GLOBAL`;
        }
        
        if (activeTab === 'BRANCH' && selectedBranch) {
          query += `&branch=${selectedBranch}`;
        } else if (activeTab !== 'GLOBAL' && (!selectedRepo || (activeTab === 'BRANCH' && !selectedBranch))) {
          setPolicies([]);
          setIsPoliciesLoading(false);
          return;
        }

        const data = await api.get<Policy[]>(`/v1/policies${query}`);
        setPolicies(data);
      } catch (error) {
        console.error('Failed to fetch policies:', error);
      } finally {
        setIsPoliciesLoading(false);
      }
    };

    fetchPolicies();
  }, [activeTab, selectedRepo, selectedBranch]);

  const filteredRepos = useMemo(() => {
    if (!repoSearch) return repos;
    return repos.filter(repo => 
      repo.full_name.toLowerCase().includes(repoSearch.toLowerCase())
    );
  }, [repos, repoSearch]);

  if (sessionLoading || !user) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-white/40 font-mono text-xs uppercase tracking-[0.2em]">
          Analyzing Risk Vectors...
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
              Governance Analytics
            </h2>
            <p className="text-muted-foreground">
              Identify violation hotspots and organizational risk patterns.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs font-medium">
            <TrendingUp className="h-3 w-3" />
            Risk Intelligence Active
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6">
          <div className="rounded-lg border border-border/50 bg-card/30 p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h3 className="font-bold tracking-tight text-lg">Violation Hotspots</h3>
            </div>
            
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
              ) : analyticsData?.hotspots?.length > 0 ? (
                analyticsData.hotspots.map((hotspot: Hotspot) => (
                  <div key={hotspot.repo} className="flex flex-col p-4 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/40 transition-colors gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="font-medium">{hotspot.repo}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="font-mono">{hotspot.count} Blocks</Badge>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/governance/decisions?repo=${encodeURIComponent(hotspot.repo)}&status=BLOCK`}>
                            <LinkIcon className="h-3 w-3 mr-2" />
                            View Risk Report
                          </Link>
                        </Button>
                      </div>
                    </div>
                    
                    {/* Policy & Version Detail */}
                    <div className="flex items-center gap-4 pl-5 border-l border-border/50">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Policy Context</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white font-medium">{hotspot.policy_name === "Internal Zaxion Policy" || hotspot.policy_name === "Zaxion Core Governance" ? "Zaxion Core Policy" : (hotspot.policy_name || "Zaxion Core Policy")}</span>
                          {hotspot.version && (
                            <Badge variant="outline" className="text-[9px] py-0 h-4 bg-primary/5 border-primary/20 text-primary">
                              v{hotspot.version}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {hotspot.created_by && (
                        <div className="flex flex-col gap-1 border-l border-border/30 pl-4">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Architect</span>
                          <span className="text-xs text-slate-400">{hotspot.created_by}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <BadgeCheck className="h-12 w-12 mx-auto mb-4 opacity-10" />
                  <p className="text-sm">No violation hotspots detected.</p>
                  <p className="text-xs">Your repositories are currently 100% compliant with all active policies.</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border/50 bg-card/30 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <h3 className="font-bold tracking-tight text-lg">Active Governance Inventory</h3>
              </div>
              
              <Tabs 
                value={activeTab} 
                onValueChange={(v) => setActiveTab(v as 'GLOBAL' | 'REPO' | 'BRANCH')}
                className="w-full md:w-auto"
              >
                <TabsList className="grid grid-cols-3 w-full md:w-[300px] bg-muted/20">
                  <TabsTrigger value="GLOBAL" className="text-[10px] uppercase font-bold tracking-tighter">Global</TabsTrigger>
                  <TabsTrigger value="REPO" className="text-[10px] uppercase font-bold tracking-tighter">Repo</TabsTrigger>
                  <TabsTrigger value="BRANCH" className="text-[10px] uppercase font-bold tracking-tighter">Branch</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Scope Selection UI */}
            {(activeTab === 'REPO' || activeTab === 'BRANCH') && (
              <div className="flex flex-wrap gap-4 mb-6 p-4 rounded-lg bg-muted/20 border border-border/50">
                <div className="flex-1 min-w-[240px]">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1.5 block ml-1">Repository</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between bg-[#0a0a0a] border-border/50 text-xs",
                          !selectedRepo && "text-muted-foreground"
                        )}
                      >
                        {selectedRepo ? selectedRepo : "Search repository..."}
                        <Search className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-[#0a0a0a] border-border/50">
                      <Command className="bg-transparent">
                        <CommandInput 
                          placeholder="Search repositories..." 
                          className="h-8 text-xs"
                          onValueChange={setRepoSearch}
                        />
                        <CommandEmpty className="py-2 text-[10px] text-muted-foreground text-center">No repository found.</CommandEmpty>
                        <CommandGroup className="max-h-[200px] overflow-y-auto">
                          {isReposLoading ? (
                            <div className="py-2 flex justify-center"><Loader2 className="h-3 w-3 animate-spin" /></div>
                          ) : (
                            filteredRepos.map((repo) => (
                              <CommandItem
                                key={repo.full_name}
                                value={repo.full_name}
                                onSelect={(currentValue) => {
                                  setSelectedRepo(currentValue);
                                  setSelectedBranch("");
                                }}
                                className="text-xs py-1.5 cursor-pointer"
                              >
                                <CheckCircle2
                                  className={cn(
                                    "mr-2 h-3 w-3",
                                    selectedRepo === repo.full_name ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {repo.full_name}
                              </CommandItem>
                            ))
                          )}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {activeTab === 'BRANCH' && (
                  <div className="flex-1 min-w-[240px]">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1.5 block ml-1">Branch</label>
                    <Popover>
                      <PopoverTrigger asChild disabled={!selectedRepo}>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between bg-[#0a0a0a] border-border/50 text-xs",
                            !selectedBranch && "text-muted-foreground"
                          )}
                        >
                          {selectedBranch ? selectedBranch : "Select branch..."}
                          <GitBranch className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-[#0a0a0a] border-border/50">
                        <Command className="bg-transparent">
                          <CommandInput placeholder="Search branches..." className="h-8 text-xs" />
                          <CommandEmpty className="py-2 text-[10px] text-muted-foreground text-center">No branch found.</CommandEmpty>
                          <CommandGroup className="max-h-[200px] overflow-y-auto">
                            {branches.map((branch) => (
                              <CommandItem
                                key={branch}
                                value={branch}
                                onSelect={(currentValue) => setSelectedBranch(currentValue)}
                                className="text-xs py-1.5 cursor-pointer"
                              >
                                <CheckCircle2
                                  className={cn(
                                    "mr-2 h-3 w-3",
                                    selectedBranch === branch ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {branch}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4">
              {isPoliciesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
              ) : policies.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {policies.map((policy) => (
                    <div key={policy.id} className="p-4 rounded-lg border border-border/50 bg-muted/10 hover:bg-muted/20 transition-all group">
                      <div className="flex justify-between items-start mb-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-white group-hover:text-primary transition-colors">{policy.name}</h4>
                            {policy.latest_version?.version_number && (
                              <span className="text-[10px] font-mono text-primary px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">
                                v{policy.latest_version.version_number}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                            <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                              {policy.display_description || "No description provided."}
                            </p>
                            {policy.created_by && (
                              <div className="flex items-center gap-1 mt-1">
                                <span className="text-[9px] text-muted-foreground/60 uppercase font-bold tracking-tighter">Created By:</span>
                                <span className="text-[9px] text-primary/80 font-medium">{policy.created_by.displayName || policy.created_by.username}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge 
                          variant={policy.latest_version?.enforcement_level === 'MANDATORY' ? 'destructive' : 'secondary'}
                          className="text-[9px] uppercase tracking-tighter h-5"
                        >
                          {policy.latest_version?.enforcement_level || 'Draft'}
                        </Badge>
                      </div>

                      {/* Rule Breakdown */}
                      <RuleExplainer rules={policy.latest_version?.rules_logic?.rules} />

                      {/* Version List for Zaxion Core Policy - Only show if there are previous versions */}
                      {policy.versions && policy.versions.length > 1 && (
                        <div className="mt-4 space-y-3 pt-3 border-t border-border/20">
                          <p className="text-[9px] font-bold uppercase text-muted-foreground/60 tracking-widest flex items-center gap-2">
                            <TrendingUp className="h-3 w-3" />
                            Policy Evolution (Previous Versions)
                          </p>
                          <div className="space-y-3">
                            {policy.versions.slice(1).map((v) => (
                              <div key={v.id} className="p-2 rounded bg-black/20 border border-border/10">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-[10px] font-mono h-5 bg-primary/5 text-primary border-primary/20">
                                      v{v.version_number}
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground/40">
                                      {new Date(v.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <Badge 
                                    variant={v.enforcement_level === 'MANDATORY' ? 'destructive' : 'secondary'}
                                    className="text-[8px] h-4 uppercase tracking-tighter"
                                  >
                                    {v.enforcement_level}
                                  </Badge>
                                </div>
                                <p className="text-[10px] text-slate-300 mb-2 italic">
                                  {v.description || "Historical governance snapshot."}
                                </p>
                                {/* Recursive Rule Explainer for historical context */}
                                <RuleExplainer rules={v.rules_logic?.rules} compact={true} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/30">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5">
                            <LayoutGrid className="h-3 w-3 text-slate-500" />
                            <span className="text-[9px] font-mono text-slate-400 uppercase">{policy.scope}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Info className="h-3 w-3 text-slate-500" />
                            <span className="text-[9px] font-mono text-slate-400">
                              {policy.latest_version?.rules_logic?.rules?.length || 0} Rules
                            </span>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono text-slate-500 italic">
                          ID: POL-{policy.id}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-border/50 rounded-lg">
                  <Shield className="h-10 w-10 mx-auto mb-3 opacity-10" />
                  <p className="text-sm font-medium text-muted-foreground">No active policies found for this scope.</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Select a repository or branch to see localized governance.</p>
                </div>
              )}
            </div>
          </div>

          {/* Placeholder for future detailed charts */}
          <div className="grid md:grid-cols-2 gap-6">
             <div className="rounded-lg border border-border/50 bg-card/10 p-6 flex flex-col items-center justify-center text-center opacity-50">
                <TrendingUp className="h-8 w-8 mb-2 text-muted-foreground" />
                <h4 className="text-sm font-bold">Policy Compliance Trends</h4>
                <p className="text-xs text-muted-foreground mt-1 italic">Advanced trending data arriving in v2.4</p>
             </div>
             <div className="rounded-lg border border-border/50 bg-card/10 p-6 flex flex-col items-center justify-center text-center opacity-50">
                <Shield className="h-8 w-8 mb-2 text-muted-foreground" />
                <h4 className="text-sm font-bold">Trust Vector Mapping</h4>
                <p className="text-xs text-muted-foreground mt-1 italic">Enterprise identity mapping arriving in v2.4</p>
             </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default GovernanceAnalytics;
