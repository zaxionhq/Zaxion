import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/governance/DashboardLayout';
import { 
  Shield, 
  Search, 
  GitPullRequest, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Loader2, 
  Crown,
  Filter,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { api, ApiError } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useSession } from '@/hooks/useSession';
import { useNavigate } from 'react-router-dom';

interface Policy {
  id: string;
  name: string;
  category?: string;
  type: 'CORE' | 'CUSTOM';
}

interface Violation {
  rule_id: string;
  explanation: string;
  file?: string;
  line?: number;
}

interface AnalysisResult {
  prNumber: number;
  title: string;
  url: string;
  status: 'PASSED' | 'BLOCKED' | 'ERROR' | 'WARNED';
  reason: string;
  violations: Violation[];
}

interface BulkAnalysisData {
  owner: string;
  repo: string;
  totalAnalyzed: number;
  results: AnalysisResult[];
}

const FounderConsole = () => {
  const navigate = useNavigate();
  const { user, loading: sessionLoading } = useSession();
  const [repoUrl, setRepoUrl] = useState('');
  const [prCount, setPrCount] = useState(5);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [selectedPolicies, setSelectedPolicies] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<BulkAnalysisData | null>(null);
  const [loadingPolicies, setLoadingPolicies] = useState(true);

  // Identity Gating
  useEffect(() => {
    if (sessionLoading) return;
    if (!user || !user.is_founder) {
      toast.error("Restricted Access: Founder credentials required.");
      navigate('/governance');
    }
  }, [user, sessionLoading, navigate]);

  // Fetch Policies
  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const [coreRes, customRes] = await Promise.all([
          api.get<Policy[]>('/v1/policies/core'),
          api.get<Policy[]>('/v1/policies')
        ]);

        const corePolicies: Policy[] = (coreRes || []).map((p: Policy) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          type: 'CORE'
        }));

        const customPolicies: Policy[] = (customRes || []).map((p: Policy) => ({
          id: p.id,
          name: p.name,
          type: 'CUSTOM'
        }));

        setPolicies([...corePolicies, ...customPolicies]);
        // Default to all policies selected
        setSelectedPolicies([...corePolicies, ...customPolicies].map(p => p.id));
      } catch (err) {
        console.error("Failed to fetch policies:", err);
        toast.error("Failed to initialize policy matrix.");
      } finally {
        setLoadingPolicies(false);
      }
    };

    if (user?.is_founder) {
      fetchPolicies();
    }
  }, [user]);

  const handleAnalyze = async () => {
    if (!repoUrl) {
      toast.error("Please provide a repository URL.");
      return;
    }

    setIsAnalyzing(true);
    setResults(null);

    try {
      const response = await api.post<{ success: boolean; data: BulkAnalysisData }>('/v1/admin/bulk-analyze', {
        repoUrl,
        prCount,
        policyIds: selectedPolicies
      });

      if (response.success) {
        setResults(response.data);
        toast.success(`Analysis complete for ${response.data.owner}/${response.data.repo}`);
      }
    } catch (err) {
      const error = err as ApiError;
      toast.error(error.message || "Bulk analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const togglePolicy = (policyId: string) => {
    setSelectedPolicies(prev => 
      prev.includes(policyId) 
        ? prev.filter(id => id !== policyId) 
        : [...prev, policyId]
    );
  };

  const selectAll = () => setSelectedPolicies(policies.map(p => p.id));
  const selectNone = () => setSelectedPolicies([]);

  if (sessionLoading || !user?.is_founder) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-8 p-8 pt-6 max-w-7xl mx-auto">
        {/* Admin Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Crown className="h-6 w-6 text-amber-500 fill-amber-500/20" />
              <h2 className="text-3xl font-black tracking-tight uppercase italic">Founder Console</h2>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30 animate-pulse">
                SUPERUSER MODE
              </Badge>
            </div>
            <p className="text-muted-foreground font-medium">
              High-privilege ad-hoc analysis for any repository. 
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-card border border-border px-4 py-2 rounded-xl shadow-sm">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-ping" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
              Admin Session Active
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls Panel */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-border bg-card/50 backdrop-blur-sm shadow-xl">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-bold uppercase tracking-wider">Target Configuration</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Repository URL</label>
                  <Input 
                    placeholder="https://github.com/owner/repo" 
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    className="bg-background/50 border-border focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-muted-foreground uppercase">PR Sample Size</label>
                    <Badge variant="secondary" className="font-mono">{prCount} PRs</Badge>
                  </div>
                  <Slider 
                    value={[prCount]} 
                    onValueChange={(v) => setPrCount(v[0])} 
                    max={50} 
                    min={1} 
                    step={1}
                    className="py-4"
                  />
                  <p className="text-[10px] text-muted-foreground italic text-center">
                    Higher counts may take longer due to GitHub API rate limits.
                  </p>
                </div>

                <Button 
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4 fill-current" />
                      Execute Audit
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Policy Matrix */}
            <Card className="border-border bg-card/50 backdrop-blur-sm shadow-lg overflow-hidden">
              <CardHeader className="pb-4 border-b border-border bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-bold uppercase tracking-wider">Policy Matrix</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] uppercase font-bold" onClick={selectAll}>All</Button>
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] uppercase font-bold text-destructive" onClick={selectNone}>None</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[400px] overflow-y-auto scrollbar-thin">
                  {loadingPolicies ? (
                    <div className="p-8 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {policies.map((policy) => (
                        <div 
                          key={policy.id} 
                          className={cn(
                            "flex items-center justify-between px-4 py-3 transition-colors hover:bg-muted/50 cursor-pointer",
                            selectedPolicies.includes(policy.id) ? "bg-primary/[0.03]" : "opacity-60"
                          )}
                          onClick={() => togglePolicy(policy.id)}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <Checkbox 
                              checked={selectedPolicies.includes(policy.id)} 
                              onCheckedChange={() => togglePolicy(policy.id)}
                              className="border-primary/50 data-[state=checked]:bg-primary"
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold truncate">{policy.name}</span>
                              <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">
                                {policy.id} • {policy.type}
                              </span>
                            </div>
                          </div>
                          {policy.type === 'CORE' && (
                            <Badge variant="outline" className="text-[8px] h-4 px-1.5 border-primary/20 text-primary uppercase">Core</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-7">
            {!results ? (
              <div className="h-full flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-3xl bg-muted/5">
                <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center mb-6">
                  <GitPullRequest className="h-10 w-10 text-muted-foreground/40" />
                </div>
                <h3 className="text-xl font-black text-muted-foreground/60 uppercase tracking-tight">Awaiting Target</h3>
                <p className="text-muted-foreground text-center max-w-xs mt-2 text-sm">
                  Provide a GitHub URL and select policies to begin the deep-dive audit.
                </p>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between bg-primary/10 border border-primary/20 p-4 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black">
                      {results.totalAnalyzed}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-wider">{results.owner} / {results.repo}</h4>
                      <p className="text-[10px] text-muted-foreground font-mono">Analysis Report Generated</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-background font-mono text-[10px]">
                    {new Date().toLocaleTimeString()}
                  </Badge>
                </div>

                <div className="space-y-4">
                  {results.results.map((pr: AnalysisResult, i: number) => (
                    <Card key={i} className="border-border bg-card/50 hover:bg-card transition-colors overflow-hidden group">
                      <div className="p-4 flex items-start justify-between gap-4">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-muted-foreground">#{pr.prNumber}</span>
                            <h5 className="text-sm font-bold group-hover:text-primary transition-colors line-clamp-1">{pr.title}</h5>
                          </div>
                          <div className="flex items-center gap-4">
                            <a 
                              href={pr.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                            >
                              View on GitHub <ExternalLink className="h-2 w-2" />
                            </a>
                            {pr.violations.length > 0 && (
                              <span className="text-[10px] text-destructive font-bold uppercase tracking-widest flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" /> {pr.violations.length} Violations
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className={cn(
                            "flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest shadow-sm",
                            pr.status === 'PASSED' ? "bg-green-500/10 text-green-500 border-green-500/30" :
                            pr.status === 'BLOCKED' ? "bg-destructive/10 text-destructive border-destructive/30" :
                            "bg-amber-500/10 text-amber-500 border-amber-500/30"
                          )}>
                            {pr.status === 'PASSED' ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                            {pr.status}
                          </div>
                          
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 text-[10px] font-bold gap-1 group/btn"
                            onClick={() => navigate(`/pr/${results.owner}/${results.repo}/${pr.prNumber}`)}
                          >
                            Full Report <ArrowRight className="h-3 w-3 group-hover/btn:translate-x-1 transition-transform" />
                          </Button>
                        </div>
                      </div>
                      
                      {pr.violations.length > 0 && (
                        <div className="px-4 pb-4">
                          <div className="bg-muted/30 rounded-lg p-3 space-y-2 border border-border/50">
                            {pr.violations.slice(0, 2).map((v: Violation, j: number) => (
                              <div key={j} className="flex items-start gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-destructive mt-1.5 shrink-0" />
                                <div className="space-y-0.5">
                                  <p className="text-[10px] font-bold text-foreground/80 leading-tight">{v.rule_id}</p>
                                  <p className="text-[9px] text-muted-foreground line-clamp-1">{v.explanation}</p>
                                </div>
                              </div>
                            ))}
                            {pr.violations.length > 2 && (
                              <p className="text-[9px] text-muted-foreground italic pl-3">
                                + {pr.violations.length - 2} more violations...
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FounderConsole;
