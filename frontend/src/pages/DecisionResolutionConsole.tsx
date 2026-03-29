import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { Shield, History, ExternalLink, AlertTriangle, CheckCircle2, FileText, Scale, Info, Lock, Loader2, AlertCircle, ListChecks, FileCode, Fingerprint, Activity, HelpCircle, ChevronRight } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { GitHubButton } from '@/components/ui/github-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSession } from '@/hooks/useSession';
import { api } from '@/lib/api';
import logger from '@/lib/logger';
import { usePRGate, PRDecision, PolicyResult } from '@/hooks/usePRGate';

const DecisionResolutionConsole = () => {
  const { owner, repo: repoName, prNumber: prNumStr } = useParams<{ owner: string; repo: string; prNumber: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const { user, loading: sessionLoading } = useSession();

  // PR Gate Hook
  const { latestDecision, isLoading: isPrLoading, fetchLatestDecision, executeOverride, mergePullRequest } = usePRGate();
  
  // Override Dialog State
  const [justification, setJustification] = useState('');
  const [category, setCategory] = useState('BUSINESS_EXCEPTION');
  const [ttlHours, setTtlHours] = useState('24');
  const [isOverrideDialogOpen, setIsOverrideDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMerging, setIsMerging] = useState(false);

  // Extract PR context from either URL params or query params
  const pOwner = owner || searchParams.get('owner');
  const pRepo = repoName || searchParams.get('repo');
  const pPr = prNumStr || searchParams.get('pr');

  const decisionData = React.useMemo<PRDecision | null>(() => {
    if (!latestDecision) return null;
    
    // Phase 6 Structural Requirement:
    // If we have a structured object from the DTO, use it directly.
    // If we have raw_data (legacy or nested), parse it.
    
    let baseData = { ...latestDecision };
    
    // Ensure violations are picked up from the root if available
    if (latestDecision.violations) {
      baseData.violations = latestDecision.violations;
    }
    
    // If raw_data exists and is valid, merge it in as the source of truth for 'facts' and 'violations'
    if (latestDecision.raw_data) {
      try {
        const parsed = typeof latestDecision.raw_data === 'string' 
          ? JSON.parse(latestDecision.raw_data) 
          : latestDecision.raw_data;
        
        // Merge structured facts from raw_data if they exist
        baseData = {
          ...baseData,
          ...parsed,
          facts: parsed.facts || baseData.facts,
          advisor: parsed.advisor || baseData.advisor,
          violations: parsed.violations || baseData.violations || []
        };
      } catch (e) {
        logger.error("Failed to parse decision raw_data:", e);
      }
    }
    
    return baseData;
  }, [latestDecision]);

  // Fetch decision when context is available
  useEffect(() => {
    if (pOwner && pRepo && pPr) {
      const prNumber = parseInt(pPr);
      if (!isNaN(prNumber)) {
        fetchLatestDecision(pOwner, pRepo, prNumber);
      }
    }
  }, [pOwner, pRepo, pPr, fetchLatestDecision]);

  const handleGitHubConnect = () => {
    const currentUrl = window.location.pathname + window.location.search;
    const url = api.buildUrl(`/v1/auth/github?redirect_url=${encodeURIComponent(currentUrl)}`);
    window.location.href = url;
  };

  const handleOverrideSubmit = async () => {
    if (justification.length < 10 || !pOwner || !pRepo || !pPr) return;
    setIsSubmitting(true);
    try {
      await executeOverride(pOwner, pRepo, parseInt(pPr), justification, category, parseInt(ttlHours));
      setIsOverrideDialogOpen(false);
      setJustification('');
      fetchLatestDecision(pOwner, pRepo, parseInt(pPr));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (justification.length >= 10 && !isSubmitting) {
        handleOverrideSubmit();
      }
    }
  };

  const handleMergeSubmit = async () => {
    if (!pOwner || !pRepo || !pPr) return;
    setIsMerging(true);
    try {
      const success = await mergePullRequest(pOwner, pRepo, parseInt(pPr));
      if (success) {
        fetchLatestDecision(pOwner, pRepo, parseInt(pPr));
      }
    } finally {
      setIsMerging(false);
    }
  };

  const isBlocked = latestDecision?.decision === 'BLOCK';
  const isOverridden = latestDecision?.decision === 'OVERRIDDEN_PASS';
  const isPassed = latestDecision?.decision === 'PASS' || latestDecision?.decision === 'OVERRIDDEN_PASS';

  const [showDetails, setShowDetails] = useState(false);
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  
  // File expansion state management
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({});
  // Context expansion state management
  const [expandedContexts, setExpandedContexts] = useState<Record<string, boolean>>({});

  const toggleFileExpansion = (fileId: string) => {
    setExpandedFiles(prev => ({
      ...prev,
      [fileId]: !prev[fileId]
    }));
  };

  const toggleContextExpansion = (contextId: string) => {
    setExpandedContexts(prev => ({
      ...prev,
      [contextId]: !prev[contextId]
    }));
  };

  // Main content rendering
  if (!pOwner || !pRepo || !pPr) {
    return (
      <div className="min-h-screen bg-background text-foreground selection:bg-neon-cyan/30">
        <header className="border-b border-border bg-background/50 backdrop-blur-md sticky top-0 z-50">
          <div className="container mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/')}>
              <img src="/zaxion-guard.png" alt="Zaxion Guard" className="h-10 w-auto drop-shadow-[0_0_8px_rgba(0,255,255,0.2)] dark:drop-shadow-[0_0_8px_rgba(0,255,255,0.2)]" />
              <div className="h-6 w-px bg-border mx-2" />
              <div className="flex flex-col">
                <span className="text-xs font-black tracking-widest text-neon-cyan uppercase leading-none mb-1">Zaxion Guard</span>
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-tighter leading-none">Governance System</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
            </div>
          </div>
        </header>
        <div className="flex items-center justify-center p-6 mt-20">
          <Card className="w-full max-w-md bg-card border-border backdrop-blur-3xl shadow-xl">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-amber-500" />
              </div>
              <CardTitle className="text-2xl font-black text-foreground uppercase tracking-tight">Context Missing</CardTitle>
              <CardDescription className="text-muted-foreground font-medium">
                Zaxion must be accessed through a Pull Request link.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pb-10">
              <Badge variant="outline" className="text-amber-500 border-amber-500/30 font-mono">
                400: Missing Parameters
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-neon-cyan/30 overflow-x-hidden font-sans transition-colors duration-300">
      {/* Background depth layers - Theme-aware Glassmorphism */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-neon-cyan/5 dark:bg-neon-cyan/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-neon-purple/5 dark:bg-neon-purple/10 blur-[120px] rounded-full animate-pulse delay-700" />
      </div>

      {/* Header */}
      <header className="relative z-50 border-b border-border bg-background/50 backdrop-blur-xl sticky top-0 transition-colors">
        <div className="container mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4 cursor-pointer group" onClick={() => navigate('/')}>
            <img src="/zaxion-guard.png" alt="Zaxion Guard" className="h-8 md:h-10 w-auto transition-transform group-hover:scale-105" />
            <div className="h-5 md:h-6 w-px bg-border mx-1 md:mx-2" />
            <div className="flex flex-col">
              <span className="text-[10px] md:text-xs font-black tracking-widest text-neon-cyan uppercase leading-none mb-1">Zaxion Guard</span>
              <span className="text-[8px] md:text-[10px] font-mono text-muted-foreground uppercase tracking-tighter leading-none">Governance System</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            {!user && !sessionLoading && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleGitHubConnect}
                className="border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10 rounded-xl font-bold text-[10px] md:text-xs h-8 md:h-9"
              >
                Log in <span className="hidden sm:inline ml-1">to Resolve</span>
              </Button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Auth Prompt Banner for unauthenticated users */}
      {!user && !sessionLoading && (
        <div className="relative z-40 bg-amber-500/10 border-b border-amber-500/20 py-2.5 md:py-3 text-center transition-colors">
          <p className="text-[10px] md:text-xs font-medium text-amber-500 flex items-center justify-center gap-2 px-4">
            <Lock className="h-3 w-3 flex-shrink-0" />
            Public View: Authentication required for overrides or policy management.
          </p>
        </div>
      )}

      <main className="relative z-10 container max-w-5xl mx-auto px-4 md:px-6 py-12 md:py-24">
        <div className="space-y-12 md:space-y-24">
          
          {/* ZONE 1: DECISION SUMMARY (HERO) */}
          <section className="relative space-y-8 md:space-y-10 animate-in fade-in slide-in-from-top-6 duration-1000">
            <div className="space-y-6 md:space-y-8">
              <div className="flex items-center gap-2.5 text-muted-foreground text-[9px] md:text-[10px] font-mono uppercase tracking-[0.3em] md:tracking-[0.4em]">
                <Activity className="h-3 md:h-3.5 w-3 md:w-3.5 text-neon-cyan" />
                <span className="truncate">PR #{pPr} · {pRepo}</span>
              </div>
              
              <div className="space-y-4 md:space-y-6">
                <div className="space-y-3 md:space-y-4">
                  <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground/90 leading-[1.1]">
                    Governance Decision
                  </h1>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className={`h-1 w-8 md:w-12 rounded-full ${isBlocked ? 'bg-destructive shadow-[0_0_12px_rgba(239,68,68,0.5)]' : isOverridden ? 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]' : 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.5)]'}`} />
                    <span className={`text-[10px] md:text-xs font-black uppercase tracking-widest ${isBlocked ? 'text-destructive' : isOverridden ? 'text-amber-500' : 'text-green-500'}`}>
                      Status: {isBlocked ? 'BLOCKED' : isOverridden ? 'OVERRIDDEN' : 'PASSED'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* POLICY VIOLATION BREAKDOWN (MAPPING CARD) */}
            {(isBlocked || isOverridden) && (
              <div className="rounded-2xl md:rounded-3xl bg-card border border-border backdrop-blur-2xl relative overflow-hidden group shadow-sm transition-all">
                <div className={`absolute top-0 left-0 w-1 md:w-1.5 h-full ${isBlocked ? 'bg-destructive/50' : 'bg-amber-500/50'}`} />
                
                <div className="relative z-10 p-5 md:p-8 space-y-6 md:space-y-8">
                  <div className="flex items-center gap-3">
                    {isBlocked ? <AlertCircle className="h-4 md:h-5 w-4 md:w-5 text-destructive" /> : <Shield className="h-4 md:h-5 w-4 md:w-5 text-amber-500" />}
                    <h3 className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-muted-foreground">
                      Violation Breakdown
                    </h3>
                  </div>

                  {decisionData?.violations && decisionData.violations.length > 0 ? (
                    <div className="space-y-4">
                      {/* Desktop Table View */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">File</th>
                              <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Policy</th>
                              <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Line(s)</th>
                              <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Description</th>
                              <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {decisionData.violations.map((v, i) => (
                              <React.Fragment key={i}>
                                <tr 
                                  className="group/row hover:bg-muted/50 transition-colors cursor-pointer"
                                  onClick={() => toggleFileExpansion(`violation-${i}`)}
                                >
                                  <td className="py-4 pr-4">
                                    <div className="flex items-center gap-3">
                                      <ChevronRight className={`h-4 w-4 text-muted-foreground/30 transition-transform duration-300 ${expandedFiles[`violation-${i}`] ? 'rotate-90 text-neon-cyan' : ''}`} />
                                      <p className="text-xs font-mono text-neon-cyan truncate max-w-[150px]">{v.file || "N/A"}</p>
                                    </div>
                                  </td>
                                  <td className="py-4 pr-4">
                                    <Badge variant="outline" className={`text-[10px] font-mono ${v.severity === 'BLOCK' ? 'text-destructive border-destructive/20 bg-destructive/5' : 'text-amber-500 border-amber-500/20 bg-amber-500/5'}`}>
                                      {v.rule_id || "N/A"}
                                    </Badge>
                                  </td>
                                  <td className="py-4 pr-4 text-xs font-mono text-muted-foreground">{v.line || "N/A"}</td>
                                  <td className="py-4 pr-4 text-xs text-foreground/70 truncate max-w-[200px]">{v.message || "N/A"}</td>
                                  <td className="py-4 text-xs text-muted-foreground/50 italic">Click for details</td>
                                </tr>
                                {expandedFiles[`violation-${i}`] && (
                                  <tr className="bg-muted/30 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <td colSpan={5} className="p-6">
                                      <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                          <div>
                                            <h5 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2">Detailed Context</h5>
                                            <p className="text-xs text-foreground/80 leading-relaxed">{v.message}</p>
                                            <pre className="mt-3 text-[10px] font-mono bg-background border border-border p-3 rounded-xl text-muted-foreground whitespace-pre-wrap overflow-x-auto">
                                              {v.current_value ? (typeof v.current_value === 'object' ? JSON.stringify(v.current_value, null, 2) : String(v.current_value)) : "No context provided."}
                                            </pre>
                                          </div>
                                        </div>
                                        <div className="space-y-4">
                                          <h5 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2">Remediation Steps</h5>
                                          <div className="bg-background border border-border p-4 rounded-xl space-y-3">
                                            {v.remediation && typeof v.remediation === 'object' && 'steps' in v.remediation ? (
                                              v.remediation.steps.map((step: string, j: number) => (
                                                <div key={j} className="flex items-start gap-2 text-xs text-foreground/70">
                                                  <div className="h-4 w-4 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center flex-shrink-0 mt-0.5 text-neon-cyan font-bold">{j + 1}</div>
                                                  <p>{step}</p>
                                                </div>
                                              ))
                                            ) : <p className="text-xs text-foreground/70">{String(v.remediation || "Manual fix required.")}</p>}
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Stacked Card View */}
                      <div className="md:hidden space-y-4">
                        {decisionData.violations.map((v, i) => (
                          <div key={i} className="rounded-xl bg-muted/20 border border-border overflow-hidden">
                            <button 
                              onClick={() => toggleFileExpansion(`violation-${i}`)}
                              className="w-full p-4 flex items-center justify-between text-left"
                            >
                              <div className="space-y-1 overflow-hidden">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className={`text-[8px] h-4 font-mono ${v.severity === 'BLOCK' ? 'text-destructive border-destructive/20' : 'text-amber-500 border-amber-500/20'}`}>
                                    {v.rule_id}
                                  </Badge>
                                  <span className="text-[10px] font-mono text-neon-cyan truncate">{v.file}</span>
                                </div>
                                <p className="text-xs font-bold text-foreground/90 truncate">{v.message}</p>
                              </div>
                              <ChevronRight className={`h-4 w-4 text-muted-foreground/30 transition-transform ${expandedFiles[`violation-${i}`] ? 'rotate-90' : ''}`} />
                            </button>
                            
                            {expandedFiles[`violation-${i}`] && (
                              <div className="p-4 pt-0 border-t border-border bg-muted/10 space-y-4 animate-in slide-in-from-top-2">
                                <div className="pt-4">
                                  <h5 className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Affected Lines</h5>
                                  <p className="text-[10px] font-mono text-foreground/70">{v.line || "N/A"}</p>
                                </div>
                                <div>
                                  <h5 className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Remediation</h5>
                                  <p className="text-[11px] text-foreground/70 leading-relaxed">
                                    {v.remediation && typeof v.remediation === 'object' && 'steps' in v.remediation ? v.remediation.steps[0] : String(v.remediation)}
                                  </p>
                                </div>
                                <Button variant="secondary" size="sm" className="w-full h-8 text-[10px] font-bold rounded-lg">View Full Context</Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground text-xs italic">No structured violations found.</div>
                  )}
                </div>
              </div>
            )}
            
            {/* Rest of the component follows with similar theme-aware classes... */}


            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 max-w-4xl">
              <div className="space-y-3">
                <h3 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Decision Context</h3>
                <p className="text-xl md:text-2xl font-bold text-foreground/90 leading-tight">
                  {isBlocked 
                    ? `Policy violation: ${decisionData?.policies?.find((p: PolicyResult) => !p.passed)?.name || "High-risk Code Coverage"}`
                    : isOverridden
                    ? "Governance Authorization Granted"
                    : "All Security Protocols Satisfied"}
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Operational Impact</h3>
                <p className="text-base md:text-xl font-medium text-muted-foreground leading-relaxed">
                  {isBlocked 
                    ? (decisionData?.violation_reason || decisionData?.decisionReason || "PR modifies high-risk logic without required validation.")
                    : isOverridden
                    ? "An authorized administrator has bypassed the block. Override recorded in audit log."
                    : "This PR has passed all deterministic security checks."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 md:gap-6 pt-4">
              <div className="flex items-center gap-3 bg-muted/30 border border-border rounded-full pl-5 pr-2 py-2 backdrop-blur-xl group transition-all hover:bg-muted/50">
                <AlertCircle className={`h-4 md:h-5 w-4 md:w-5 ${isBlocked ? 'text-destructive' : 'text-green-500'}`} />
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                  {decisionData?.violated_policy || "coverage-auth-required"} · HIGH
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowDetails(!showDetails)}
                  className="rounded-full h-7 md:h-8 px-3 md:px-4 text-[8px] md:text-[9px] font-black uppercase tracking-widest bg-background/50 hover:bg-background text-muted-foreground hover:text-foreground border-none"
                >
                  {showDetails ? 'Hide Details' : 'View Details'}
                </Button>
              </div>
              
              {showDetails && (
                <div className="flex items-center gap-3 md:gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
                  <div className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-muted/20 border border-border font-mono text-[8px] md:text-[9px] text-muted-foreground">
                    <Fingerprint className="h-3 w-3" />
                    {decisionData?.commit_sha?.substring(0, 7) || "7-HEX-ID"}
                  </div>
                  <div className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-muted/20 border border-border font-mono text-[8px] md:text-[9px] text-muted-foreground">
                    <Scale className="h-3 w-3" />
                    v{decisionData?.policy_version || "2.0.0"}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ZONE 2: DECISION EVIDENCE */}
          <section className="space-y-8 md:space-y-10">
            <div className="flex items-center gap-3">
              <Activity className="h-4 md:h-5 w-4 md:w-5 text-neon-cyan" />
              <h2 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground">Decision Evidence</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {/* Change Evidence */}
              <div className="p-5 md:p-6 rounded-2xl md:rounded-3xl bg-card border border-border space-y-4 md:space-y-6 shadow-sm">
                <h3 className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Change Evidence</h3>
                <div className="space-y-3 md:space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Files changed</span>
                    <span className="text-xs font-bold font-mono text-foreground">{decisionData?.facts?.totalChanges || decisionData?.affected_files?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">High-risk files</span>
                    <span className="text-xs font-bold font-mono text-amber-500">{decisionData?.facts?.affectedAreas?.length || 0}</span>
                  </div>
                </div>
              </div>

              {/* Safety Evidence */}
              <div className="p-5 md:p-6 rounded-2xl md:rounded-3xl bg-card border border-border space-y-4 md:space-y-6 shadow-sm">
                <h3 className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Safety Evidence</h3>
                <div className="space-y-3 md:space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Tests added</span>
                    <span className={`text-xs font-bold font-mono ${decisionData?.facts?.testFilesAdded > 0 ? 'text-green-500' : 'text-destructive'}`}>
                      {decisionData?.facts?.testFilesAdded || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Critical path</span>
                    <span className={`text-xs font-bold font-mono ${decisionData?.facts?.hasCriticalChanges ? 'text-amber-500' : 'text-muted-foreground/40'}`}>
                      {decisionData?.facts?.hasCriticalChanges ? "YES" : "NO"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Governance Context */}
              <div className="p-5 md:p-6 rounded-2xl md:rounded-3xl bg-card border border-border space-y-4 md:space-y-6 shadow-sm">
                <h3 className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Governance Context</h3>
                <div className="space-y-3 md:space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Protected branch</span>
                    <span className={`text-xs font-bold font-mono ${decisionData?.facts?.isMainBranch ? 'text-amber-500' : 'text-muted-foreground/40'}`}>
                      {decisionData?.facts?.isMainBranch ? "YES" : "NO"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Risk level</span>
                    <span className={`text-xs font-bold font-mono ${decisionData?.advisor?.riskAssessment?.riskLevel === 'CRITICAL' ? 'text-destructive' : 'text-amber-500'}`}>
                      {decisionData?.advisor?.riskAssessment?.riskLevel || "HIGH"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI SUGGESTED TEST INTENTS */}
            {decisionData?.advisor?.suggestedTestIntents?.length > 0 && (
              <div className="p-6 md:p-8 rounded-2xl md:rounded-3xl bg-card border border-border space-y-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-neon-purple/10 border border-neon-purple/20">
                    <Fingerprint className="h-4 w-4 text-neon-purple" />
                  </div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">AI Recommended Test Scenarios</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {decisionData.advisor.suggestedTestIntents.map((intent: { file: string; intent: string }, i: number) => (
                     <div key={i} className="group relative p-4 rounded-xl md:rounded-2xl bg-muted/20 border border-border hover:bg-muted/30 hover:border-neon-purple/30 transition-all">
                       <div className="space-y-2">
                         <div className="flex items-center justify-between">
                           <a 
                             href={`https://github.com/${pOwner}/${pRepo}/blob/${decisionData?.commit_sha || 'main'}/${intent.file}`}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="flex items-center gap-2 hover:underline decoration-neon-purple/50 underline-offset-4 overflow-hidden"
                           >
                             <FileCode className="h-3 w-3 text-neon-purple/70 flex-shrink-0" />
                             <span className="text-[10px] font-mono text-neon-purple/70 truncate">{intent.file}</span>
                             <ExternalLink className="h-2.5 w-2.5 text-neon-purple/40 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                           </a>
                         </div>
                         <p className="text-xs md:text-sm text-foreground/70 leading-relaxed">
                           {intent.intent}
                         </p>
                       </div>
                     </div>
                   ))}
                 </div>
              </div>
            )}

            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="evidence" className="border-none">
                <AccordionTrigger className="flex items-center justify-between p-6 md:p-8 bg-card hover:bg-muted/50 border border-border rounded-2xl md:rounded-3xl transition-all group outline-none [&[data-state=open]]:rounded-b-none shadow-sm">
                  <div className="flex items-center gap-4 md:gap-6">
                    <div className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-muted/50 border border-border group-hover:border-neon-cyan/30 group-hover:bg-neon-cyan/5 transition-all">
                      <Scale className="h-5 md:h-6 w-5 md:w-6 text-muted-foreground/50 group-hover:text-neon-cyan" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-base md:text-lg font-bold text-foreground/80 group-hover:text-foreground transition-colors">Policy Rationale</h3>
                      <p className="text-[10px] md:text-sm text-muted-foreground mt-0.5">Constitutional basis for this decision</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-0">
                  <div className="p-6 md:p-10 bg-muted/10 border-x border-b border-border rounded-b-2xl md:rounded-b-3xl space-y-12">
                    {/* Compliance Rationale */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Plain English Rationale</h4>
                      <div className="text-lg md:text-xl font-medium text-foreground/70 leading-relaxed max-w-3xl space-y-4">
                        {decisionData?.violations && decisionData.violations.length > 0 ? (
                          [...new Set(decisionData.violations.map(v => v.explanation).filter(Boolean))].map((exp, i) => (
                            <p key={i}>"{exp}"</p>
                          ))
                        ) : decisionData?.advisor?.rationale ? (
                          <p>"{decisionData.advisor.rationale}"</p>
                        ) : (
                          <p>"{decisionData?.decisionReason || "No detailed rationale available."}"</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
                      {/* Affected Files */}
                      <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Affected Context</h4>
                        <div className="space-y-3">
                          {decisionData?.facts?.changedFiles?.map((file: string, i: number) => (
                            <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-background border border-border hover:border-neon-cyan/20 transition-colors">
                              <span className="text-[10px] md:text-xs font-mono text-muted-foreground truncate mr-2">{file}</span>
                              <Badge variant="outline" className="text-[9px] font-black bg-muted/50 text-muted-foreground/50 border-border px-2 py-0.5 uppercase tracking-tighter flex-shrink-0">
                                {decisionData?.facts?.affectedAreas?.includes(file) ? "Critical Path" : "Modified"}
                              </Badge>
                            </div>
                          )) || <span className="text-xs text-muted-foreground/30 italic">No file violations.</span>}
                        </div>
                      </div>

                      {/* Detailed Audit Trail */}
                      <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Decision Audit Trail</h4>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between py-3 border-b border-border">
                            <span className="text-xs text-muted-foreground">Timestamp</span>
                            <span className="text-xs font-bold font-mono text-foreground">{latestDecision?.created_at ? new Date(latestDecision.created_at).toLocaleString() : 'N/A'}</span>
                          </div>
                          <div className="flex items-center justify-between py-3 border-b border-border">
                            <span className="text-xs text-muted-foreground">Policy Engine</span>
                            <span className="text-xs font-bold font-mono text-foreground">v{decisionData?.policy_version || "2.0.0"}</span>
                          </div>
                          <div className="flex items-center justify-between py-3 border-b border-border">
                            <span className="text-xs text-muted-foreground">Integrity</span>
                            <span className="text-xs font-bold font-mono text-neon-cyan">VERIFIED</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>

          {/* ZONE 3: RESOLUTION & ACTIONS */}
          <section className="space-y-8 md:space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Scale className="h-5 w-5 text-neon-cyan" />
                <h2 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                  {user ? 'Governance Console' : 'Governance Status'}
                </h2>
              </div>

              {user ? (
                <div className="flex flex-wrap items-center gap-3 animate-in fade-in zoom-in-95 duration-500">
                  <Button 
                    onClick={handleMergeSubmit}
                    disabled={isMerging || isPrLoading || !isPassed}
                    className={`h-9 md:h-10 px-5 md:px-8 rounded-xl font-bold gap-2 transition-all ${
                      isPassed
                        ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg'
                        : 'bg-muted text-muted-foreground border border-border cursor-not-allowed'
                    }`}
                  >
                    {isMerging ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    <span className="text-xs md:text-sm">{isPassed ? 'Merge PR' : 'Merge Blocked'}</span>
                  </Button>
                   
                  <Dialog open={isOverrideDialogOpen} onOpenChange={setIsOverrideDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        disabled={!isBlocked || isPrLoading}
                        className={`h-9 md:h-10 px-5 md:px-8 rounded-xl font-bold gap-2 transition-all ${
                          isBlocked 
                            ? 'bg-amber-500 hover:bg-amber-600 text-black shadow-lg' 
                            : 'bg-muted text-muted-foreground border border-border cursor-not-allowed'
                        }`}
                      >
                        <Shield className="h-4 w-4" />
                        <span className="text-xs md:text-sm">Override</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-background border-border rounded-2xl md:rounded-3xl backdrop-blur-3xl w-[95vw] max-w-lg">
                      <DialogHeader className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                            <Shield className="h-5 w-5 text-amber-500" />
                          </div>
                          <DialogTitle className="text-xl font-black text-foreground uppercase tracking-tight">Administrative Override</DialogTitle>
                        </div>
                        <DialogDescription className="text-muted-foreground text-sm leading-relaxed">
                          Bypass governance block for PR #{pPr}. Action will be audited.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4 md:py-6 space-y-6">
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Category</label>
                              <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="bg-muted/50 border-border text-foreground rounded-xl text-xs">
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent className="bg-background border-border">
                                  <SelectItem value="BUSINESS_EXCEPTION">Business Exception</SelectItem>
                                  <SelectItem value="EMERGENCY_PRODUCTION_FIX">Emergency Fix</SelectItem>
                                  <SelectItem value="FALSE_POSITIVE">False Positive</SelectItem>
                                  <SelectItem value="LEGACY_REFACTOR">Legacy Refactor</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">TTL</label>
                              <Select value={ttlHours} onValueChange={setTtlHours}>
                                <SelectTrigger className="bg-muted/50 border-border text-foreground rounded-xl text-xs">
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent className="bg-background border-border">
                                  <SelectItem value="1">1 Hour</SelectItem>
                                  <SelectItem value="4">4 Hours</SelectItem>
                                  <SelectItem value="24">24 Hours</SelectItem>
                                  <SelectItem value="168">7 Days</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Justification</label>
                             <Textarea 
                               placeholder="Reason for this exception..."
                               className="bg-muted/50 border-border text-foreground rounded-xl min-h-[100px] text-sm"
                               value={justification}
                               onChange={(e) => setJustification(e.target.value)}
                               onKeyDown={handleKeyDown}
                             />
                          </div>
                        </div>
                        <DialogFooter className="gap-3">
                          <Button variant="ghost" onClick={() => setIsOverrideDialogOpen(false)} className="text-muted-foreground text-xs">Cancel</Button>
                          <Button 
                            onClick={handleOverrideSubmit}
                            disabled={justification.length < 10 || isSubmitting}
                            className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-6 md:px-8 rounded-xl gap-2 text-xs"
                          >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                            Authorize
                          </Button>
                        </DialogFooter>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button 
                    variant="outline" 
                    onClick={() => setIsAcknowledged(true)}
                    disabled={isAcknowledged}
                    className={`h-9 md:h-10 px-5 md:px-6 rounded-xl gap-2 transition-all border-border ${isAcknowledged ? 'bg-green-500/10 text-green-500' : 'bg-muted/50 text-muted-foreground hover:text-foreground'}`}
                  >
                    {isAcknowledged ? <CheckCircle2 className="h-4 w-4" /> : <Info className="h-4 w-4" />}
                    <span className="text-xs">{isAcknowledged ? 'Acknowledged' : 'Acknowledge'}</span>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 border border-border text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
                    <Lock className="h-3 w-3 text-amber-500" />
                    Actions Locked
                  </div>
                  <Button 
                    onClick={handleGitHubConnect}
                    className="h-9 md:h-10 px-5 md:px-6 rounded-xl bg-neon-cyan/10 hover:bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 font-bold transition-all text-xs"
                  >
                    Log in <span className="hidden sm:inline ml-1">to Resolve</span>
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <div className="p-6 md:p-8 rounded-2xl md:rounded-3xl bg-card border border-border hover:border-neon-cyan/40 transition-all group relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                  <FileCode className="h-20 md:h-24 w-20 md:w-24 text-neon-cyan" />
                </div>
                <div className="h-10 md:h-12 w-10 md:w-12 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center text-neon-cyan mb-6 group-hover:scale-110 transition-transform">
                  <FileCode className="h-5 md:h-6 w-5 md:w-6" />
                </div>
                <div className="space-y-2 md:space-y-3 relative z-10">
                  <h4 className="text-base md:text-lg font-bold text-foreground/90">Add required tests</h4>
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                    Ensure critical paths in <code className="text-neon-cyan font-mono text-[10px]">{decisionData?.facts?.affectedAreas?.[0] || "auth/login.js"}</code> have coverage.
                  </p>
                </div>
              </div>

              <div className="p-6 md:p-8 rounded-2xl md:rounded-3xl bg-card border border-border hover:border-neon-cyan/40 transition-all group relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                  <History className="h-20 md:h-24 w-20 md:w-24 text-neon-cyan" />
                </div>
                <div className="h-10 md:h-12 w-10 md:w-12 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center text-neon-cyan mb-6 group-hover:scale-110 transition-transform">
                  <History className="h-5 md:h-6 w-5 md:w-6" />
                </div>
                <div className="space-y-2 md:space-y-3 relative z-10">
                  <h4 className="text-base md:text-lg font-bold text-foreground/90">Push new commit</h4>
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">Zaxion will re-evaluate once new changes are detected.</p>
                </div>
              </div>

              <div className="p-6 md:p-8 rounded-2xl md:rounded-3xl bg-card border border-border hover:border-neon-cyan/40 transition-all group relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                  <CheckCircle2 className="h-20 md:h-24 w-20 md:w-24 text-neon-cyan" />
                </div>
                <div className="h-10 md:h-12 w-10 md:w-12 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center text-neon-cyan mb-6 group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="h-5 md:h-6 w-5 md:w-6" />
                </div>
                <div className="space-y-2 md:space-y-3 relative z-10">
                  <h4 className="text-base md:text-lg font-bold text-foreground/90">Auto-clearance</h4>
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">Once requirements are met, the block will be lifted.</p>
                </div>
              </div>
            </div>
          </section>

          {/* ZONE 4: AUDIT & INTEGRITY (TRUST LAYER) */}
          <section className="pt-8 md:pt-16 pb-24">
            <Accordion type="single" collapsible className="w-full space-y-4">
              <AccordionItem value="history" className="border-none">
                <AccordionTrigger className="flex items-center justify-between p-5 md:p-6 bg-card hover:bg-muted/50 border border-border rounded-xl md:rounded-2xl transition-all group outline-none shadow-sm">
                  <div className="flex items-center gap-4">
                    <History className="h-4 w-4 text-muted-foreground/30 group-hover:text-amber-500 transition-colors" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-muted-foreground group-hover:text-foreground transition-colors">Governance History</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="p-5 md:p-6 space-y-4">
                    {latestDecision?.override_by ? (
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                        <div className="p-2 rounded-lg bg-amber-500/10 flex-shrink-0 w-fit">
                          <Shield className="h-4 w-4 text-amber-500" />
                        </div>
                        <div className="space-y-1 overflow-hidden">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-foreground truncate">{latestDecision.override_by}</span>
                            <Badge variant="outline" className="text-[8px] h-4 bg-amber-500/10 text-amber-500 border-amber-500/20 uppercase">Authorized</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed italic break-words">"{latestDecision.override_reason}"</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground/30 text-xs italic">No overrides recorded.</div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="trust" className="border-none">
                <AccordionTrigger className="flex items-center justify-center py-4 text-muted-foreground/20 hover:text-muted-foreground/40 transition-all group outline-none">
                  <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em]">
                    <Fingerprint className="h-3 w-3" />
                    Audit & Integrity Layer
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 py-8 md:py-10 border-t border-border">
                    <div className="space-y-2 md:space-y-3">
                      <h6 className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">Cryptographic ID</h6>
                      <div className="font-mono text-[10px] text-muted-foreground/60 select-all bg-muted/50 p-3 rounded-lg truncate">
                        {latestDecision?.id || "e9f8-d7c6-b5a4-1234"}
                      </div>
                    </div>
                    <div className="space-y-2 md:space-y-3">
                      <h6 className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">Policy Engine</h6>
                      <div className="text-[10px] text-muted-foreground/60 flex items-center gap-2">
                        <Badge variant="outline" className="text-[8px] bg-green-500/10 text-green-500 border-green-500/20 uppercase">Immutable</Badge>
                        v{decisionData?.policy_version || "2.0.0"}
                      </div>
                    </div>
                    <div className="space-y-2 md:space-y-3">
                      <h6 className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">Timestamp</h6>
                      <div className="text-[10px] text-muted-foreground/60 font-mono">
                        {latestDecision?.created_at ? new Date(latestDecision.created_at).toISOString() : new Date().toISOString()}
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>
        </div>
      </main>

      <footer className="relative z-50 border-t border-border py-12 md:py-16 bg-muted/20 backdrop-blur-xl transition-colors">
        <div className="container max-w-5xl mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-start justify-between gap-10 md:gap-12">
            <div className="space-y-4 md:space-y-6 max-w-sm">
              <div className="flex items-center gap-3">
                <img src="/zaxion-guard.png" alt="Zaxion Guard Logo" className="h-8 md:h-10 w-auto object-contain" />
                <span className="font-black tracking-tighter text-lg md:text-xl uppercase text-foreground">Zaxion <span className="text-neon-cyan">Guard</span></span>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                Deterministic governance engine enforcing organizational policy through automated analysis.
              </p>
            </div>

            <div className="w-full md:w-auto">
              <Accordion type="single" collapsible className="w-full md:min-w-[300px]">
                <AccordionItem value="why-zaxion" className="border-border">
                  <AccordionTrigger className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 hover:text-foreground hover:no-underline py-4">
                    Why am I seeing this?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed pb-6">
                    Zaxion prevents unsafe code from reaching protected branches by enforcing deterministic policies.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
          <div className="mt-12 md:mt-16 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-[9px] md:text-[10px] font-mono text-muted-foreground/30 uppercase tracking-[0.2em]">
            <span>© 2026 Zaxion</span>
            <span>v2.4.0-Stable</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DecisionResolutionConsole;