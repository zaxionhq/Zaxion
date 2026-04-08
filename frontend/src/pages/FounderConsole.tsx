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
  Layers,
  ArrowRight,
  Camera,
  Copy,
  Terminal,
  X
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
import { 
  SocialAuditTerminal, 
  BulkAnalysisData, 
  AnalysisResult, 
  Violation 
} from '@/components/governance/SocialAuditTerminal';
import { InteractiveAuditReport } from '@/components/governance/InteractiveAuditReport';

interface Policy {
  id: string;
  name: string;
  category?: string;
  type: 'CORE' | 'CUSTOM';
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
  const [isCaptureMode, setIsCaptureMode] = useState(false);
  const [viewMode, setViewMode] = useState<'INTERACTIVE' | 'SOCIAL'>('INTERACTIVE');

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
      // Long-running bulk analysis requires a higher timeout (120s)
      const response = await api.post<{ success: boolean; data: BulkAnalysisData }>('/v1/admin/bulk-analyze', {
        repoUrl,
        prCount,
        policyIds: selectedPolicies
      }, undefined, 120000);

      if (response && response.success && response.data) {
        setResults(response.data);
        toast.success(`Analysis complete for ${response.data.owner}/${response.data.repo}`);
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (err) {
      const error = err as ApiError;
      toast.error(error.message || "Bulk analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copySocialReport = () => {
    if (!results) return;

    const s = results.summary;
    const timestamp = new Date().toISOString();
    const auditRef = `ZC|${results.owner}/${results.repo}|n=${results.totalAnalyzed}|${timestamp}`;
    const blockedPrs = results.results.filter(r => r.status === 'BLOCKED' || r.status === 'BLOCK');
    const spotlightPr = blockedPrs[0];
    const spotlightViolation = spotlightPr?.violations?.[0];
    const spotlightRule = spotlightViolation?.rule_id || spotlightViolation?.checker || null;

    let text = `# Zaxion Founder Audit Receipt — ${results.owner}/${results.repo}\n\n`;
    text += `**Scope:** Trending/public repository audit (read-only), last ${results.totalAnalyzed} pull request(s). `;
    text += `**Outcome grade:** ${s?.grade ?? '—'} (${typeof s?.score === 'number' ? `${s.score}%` : String(s?.score ?? '—')} pass rate). `;
    text += `**Generated:** ${timestamp} (UTC).\n\n`;

    if (spotlightPr && spotlightRule) {
      text += `## Issue spotlight\n`;
      text += `- **Primary finding:** PR #${spotlightPr.prNumber} triggered \`${spotlightRule}\`\n`;
      if (spotlightViolation?.message || spotlightViolation?.explanation) {
        text += `- **What Zaxion found:** ${spotlightViolation?.explanation || spotlightViolation?.message}\n`;
      }
      if (spotlightViolation?.file) {
        text += `- **Evidence path:** ${spotlightViolation.file}${spotlightViolation?.line != null ? `:${spotlightViolation.line}` : ''}\n`;
      }
      text += `\n`;
    }

    text += `## Executive summary\n`;
    text += `- Pull requests scanned: ${results.totalAnalyzed}\n`;
    text += `- Pass: ${s?.passed ?? 0} | Block: ${s?.blocked ?? 0} | Warn: ${s?.warned ?? 0}\n`;
    text += `- Violations (BLOCK / WARN / OBSERVE): ${s?.violations_by_severity?.BLOCK ?? 0} / ${s?.violations_by_severity?.WARN ?? 0} / ${s?.violations_by_severity?.OBSERVE ?? 0}\n`;
    if (s?.risk_assessment) {
      text += `- Risk posture: **${s.risk_assessment.level}** — ${s.risk_assessment.impact}\n`;
    }
    text += `\n`;

    if (s?.recommendations?.length) {
      text += `## Recommended actions\n`;
      s.recommendations.slice(0, 5).forEach((rec) => {
        text += `- **${rec.priority}:** ${rec.action} — ${rec.detail}\n`;
      });
      text += `\n`;
    }

    if (blockedPrs.length > 0) {
      text += `## Blocking findings (detail)\n`;
      blockedPrs.slice(0, 8).forEach((pr) => {
        text += `### PR #${pr.prNumber}: ${pr.title}\n`;
        const violations = pr.violations || [];
        if (violations.length > 0) {
          const grouped = violations.reduce((acc: Record<string, Violation[]>, v: Violation) => {
            const ruleId = v.rule_id || v.checker || 'policy';
            if (!acc[ruleId]) acc[ruleId] = [];
            acc[ruleId].push(v);
            return acc;
          }, {});

          Object.entries(grouped).forEach(([ruleId, viols]: [string, Violation[]]) => {
            text += `- **Rule:** \`${ruleId}\`\n`;
            viols.forEach((v: Violation) => {
              const loc = v.file ? ` (${v.file}${v.line != null ? `:${v.line}` : ''})` : '';
              text += `  - ${v.explanation || v.message || 'Policy violation'}${loc}\n`;
            });
          });
        } else if (pr.reason) {
          text += `- ${pr.reason}\n`;
        }
        text += `\n`;
      });
      if (blockedPrs.length > 8) {
        text += `*...${blockedPrs.length - 8} additional blocked PR(s) omitted from this excerpt.*\n\n`;
      }
    }

    text += `---\n`;
    text += `**Audit reference:** \`${auditRef}\`\n`;
    text += `**Analyst note:** Founder Console performs deterministic policy replay on public PR history. `;
    text += `This is a point-in-time receipt for awareness and remediation, not a legal security certification.\n`;

    navigator.clipboard.writeText(text);
    toast.success('Audit receipt copied to clipboard');
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

  if (isCaptureMode && results) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-20 relative overflow-hidden">
        {/* Background depth layers */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-cyan-500/10 blur-[150px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-500/10 blur-[150px] rounded-full animate-pulse delay-700" />
        </div>

        <div className="absolute top-12 left-12 z-50 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <img src="/Zaxion landing page logo.png" alt="Zaxion" className="h-12 w-auto object-contain grayscale invert" />
            <span className="text-2xl font-black tracking-tighter text-white">
              ZAXION<span className="text-cyan-400">.</span>
            </span>
          </div>
        </div>

        <div className="absolute top-12 right-12 z-50 flex gap-4 no-print">
          <Button 
            variant="outline" 
            className="bg-white/5 border-white/10 text-white hover:bg-white/10 gap-2"
            onClick={() => window.print()}
          >
            <Camera className="h-4 w-4" />
            Save as PDF/Image
          </Button>
          <Button 
            variant="ghost" 
            className="text-white hover:bg-white/10"
            onClick={() => setIsCaptureMode(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="relative z-10 w-full max-w-4xl flex flex-col items-center">
          <div className="text-center mb-12 space-y-4">
            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 font-black uppercase tracking-widest px-4 py-1.5">
              INSTITUTIONAL GOVERNANCE AUDIT
            </Badge>
            <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">
              Systemic Risk Report
            </h1>
            <p className="text-slate-400 font-mono text-sm max-w-lg mx-auto uppercase tracking-wider">
              Autonomous PR Analysis for {results.owner}/{results.repo}
            </p>
          </div>

          <SocialAuditTerminal data={results} isCaptureMode={true} />
          
          <div className="mt-16 text-center space-y-2 opacity-40">
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.4em]">
              Verified by Zaxion Guard Protocol v2.4.0
            </p>
            <p className="text-[8px] font-mono text-slate-700">
              AUDIT REF: {`ZC|${results.owner}/${results.repo}|n=${results.totalAnalyzed}|${new Date(results.summary?.auditDate || Date.now()).toISOString()}`}
            </p>
          </div>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            .no-print { display: none !important; }
            body { background: #020617 !important; }
          }
        `}} />
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
                              onCheckedChange={(checked) => {
                                // If triggered by the checkbox itself, don't let the div's onClick handle it too
                                // But onCheckedChange doesn't receive the event. 
                                // Actually, we can just rely on the div's onClick and make the checkbox read-only
                                // OR use a dedicated handler that doesn't toggle twice.
                              }}
                              className="border-primary/50 data-[state=checked]:bg-primary pointer-events-none"
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
              <div className="space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-primary rounded-full" />
                    <h3 className="text-xl font-black uppercase tracking-tight italic">Governance Audit Output</h3>
                  </div>
                  
                  <div className="flex bg-muted rounded-xl p-1">
                    <Button
                      variant={viewMode === 'INTERACTIVE' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('INTERACTIVE')}
                      className="text-[10px] font-black uppercase tracking-widest px-4 h-8 rounded-lg"
                    >
                      Interactive Report
                    </Button>
                    <Button
                      variant={viewMode === 'SOCIAL' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('SOCIAL')}
                      className="text-[10px] font-black uppercase tracking-widest px-4 h-8 rounded-lg"
                    >
                      Social Receipt
                    </Button>
                  </div>
                </div>

                {viewMode === 'SOCIAL' ? (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl flex items-center justify-between col-span-2">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground text-xl font-black">
                            {results.summary?.grade || '?'}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold uppercase tracking-wider">{results.owner} / {results.repo}</h4>
                            <p className="text-[10px] text-muted-foreground font-mono">
                              Score: {results.summary?.score || 0}% • {results.totalAnalyzed} PRs
                            </p>
                          </div>
                        </div>
                        {results.summary?.auditDate && (
                          <Badge variant="outline" className="bg-background font-mono text-[10px]">
                            {new Date(results.summary.auditDate).toLocaleTimeString()}
                          </Badge>
                        )}
                      </div>

                      <Button 
                        onClick={() => setIsCaptureMode(true)}
                        variant="outline" 
                        className="h-full border-cyan-500/20 hover:bg-cyan-500/5 text-cyan-500 font-bold uppercase tracking-wider text-xs gap-2 rounded-2xl"
                      >
                        <Camera className="h-4 w-4" />
                        Viral Capture
                      </Button>

                      <Button 
                        onClick={copySocialReport}
                        variant="outline" 
                        className="h-full border-primary/20 hover:bg-primary/5 text-primary font-bold uppercase tracking-wider text-xs gap-2 rounded-2xl"
                      >
                        <Copy className="h-4 w-4" />
                        Copy Post
                      </Button>
                    </div>

                    <div className="py-2">
                      <SocialAuditTerminal data={results} />
                    </div>
                  </div>
                ) : (
                  <InteractiveAuditReport data={results} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FounderConsole;
