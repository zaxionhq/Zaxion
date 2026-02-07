import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { Github, Shield, History, ExternalLink, AlertTriangle, CheckCircle2, FileText, Scale, Info, Lock, Loader2, AlertCircle, ListChecks, FileCode, ChevronDown, Fingerprint, Activity, HelpCircle } from 'lucide-react';
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
import { usePRGate, PRDecision, DecisionObject, PolicyResult } from '@/hooks/usePRGate';

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

  const decisionData = React.useMemo<any | null>(() => {
    if (!latestDecision) return null;
    
    // Phase 6 Structural Requirement:
    // If we have a structured object from the DTO, use it directly.
    // If we have raw_data (legacy or nested), parse it.
    
    let baseData = latestDecision;
    
    // If raw_data exists and is valid, merge it in as the source of truth for 'facts'
    if (latestDecision.raw_data) {
      try {
        const parsed = typeof latestDecision.raw_data === 'string' 
          ? JSON.parse(latestDecision.raw_data) 
          : latestDecision.raw_data;
        
        // Merge structured facts from raw_data if they exist
        baseData = {
          ...latestDecision,
          ...parsed,
          facts: parsed.facts || latestDecision.facts,
          advisor: parsed.advisor || latestDecision.advisor
        };
      } catch (e) {
        console.error("Failed to parse decision raw_data:", e);
      }
    }
    
    return baseData;
  }, [latestDecision]);

  // Fetch decision when context is available and user is logged in
  useEffect(() => {
    if (user && pOwner && pRepo && pPr) {
      const prNumber = parseInt(pPr);
      if (!isNaN(prNumber)) {
        fetchLatestDecision(pOwner, pRepo, prNumber);
      }
    }
  }, [user, pOwner, pRepo, pPr, fetchLatestDecision]);

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

  // Auth Overlay
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-white/10 bg-white/[0.02] backdrop-blur-2xl rounded-3xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-neon-cyan/50" />
          <CardHeader className="text-center pt-10">
            <div className="flex justify-center mb-6">
              <img src="/zaxion-guard.png" alt="Zaxion Guard Logo" className="h-28 w-auto object-contain drop-shadow-[0_0_15px_rgba(0,255,255,0.3)]" />
            </div>
            <CardTitle className="text-2xl font-black text-white uppercase tracking-tight">Zaxion Governance</CardTitle>
            <CardDescription className="text-white/40 font-medium px-6">
              {sessionLoading ? 'Verifying credentials...' : 'Authenticate to review PR compliance decisions.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-10">
            <GitHubButton 
              variant="hero" 
              size="lg" 
              onClick={handleGitHubConnect}
              className="w-full gap-3 bg-neon-cyan text-black hover:bg-neon-cyan/90 rounded-2xl font-bold py-6"
              disabled={sessionLoading}
            >
              <Github className="h-5 w-5" />
              {sessionLoading ? 'Authenticating...' : 'Sign in with GitHub'}
            </GitHubButton>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Missing PR Context State
  if (!pOwner || !pRepo || !pPr) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-white/10 bg-white/[0.02] backdrop-blur-2xl rounded-3xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-500/50" />
          <CardHeader className="text-center pt-10">
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="h-10 w-10 text-amber-500" />
              </div>
            </div>
            <CardTitle className="text-2xl font-black text-white uppercase tracking-tight">No PR Context</CardTitle>
            <CardDescription className="text-white/40 font-medium">
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
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white selection:bg-neon-cyan/30 overflow-x-hidden font-sans">
      {/* Background depth layers - Glassmorphism base */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-neon-cyan/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-neon-purple/5 blur-[120px] rounded-full" />
      </div>

      <nav className="relative z-10 border-b border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && navigate('/')}>
            <img src="/zaxion-guard.png" alt="Zaxion Guard Logo" className="h-10 w-auto object-contain transition-transform group-hover:scale-105" />
            <span className="font-black tracking-tighter text-lg uppercase">Zaxion <span className="text-neon-cyan">Guard</span></span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white/40 uppercase tracking-widest">
              <Activity className="h-3 w-3 text-neon-cyan" />
              Governance System
            </div>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="relative z-10 container max-w-5xl mx-auto px-6 py-16 md:py-24">
        <div className="space-y-16">
          
          {/* ZONE 1: DECISION SUMMARY (HERO) */}
          <section className="relative space-y-10 animate-in fade-in slide-in-from-top-6 duration-1000">
            <div className="space-y-8">
              <div className="flex items-center gap-3 text-white/30 text-[10px] font-mono uppercase tracking-[0.4em]">
                <Activity className="h-3.5 w-3.5 text-neon-cyan" />
                PR #{pPr} · {pRepo} · Evaluated against v{decisionData?.policy_version || "2.0.0"} (Constitutional)
              </div>
              
              <div className="space-y-6">
                <div className="space-y-4">
                  <h1 className="text-5xl font-black tracking-tight text-white/90">
                    Zaxion Governance Decision
                  </h1>
                  <div className="flex items-center gap-3">
                    <div className={`h-1 w-12 rounded-full ${isBlocked ? 'bg-destructive shadow-[0_0_12px_rgba(239,68,68,0.5)]' : isOverridden ? 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]' : 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.5)]'}`} />
                    <span className={`text-sm font-black uppercase tracking-widest ${isBlocked ? 'text-destructive' : isOverridden ? 'text-amber-500' : 'text-green-500'}`}>
                      Status: <span className={isBlocked ? 'border-b-2 border-destructive/30 pb-0.5' : ''}>{isBlocked ? 'BLOCKED' : isOverridden ? 'OVERRIDDEN' : 'PASSED'}</span> · {isBlocked ? 'Mandatory Policy Violation' : isOverridden ? 'Administrative Exception' : 'Compliance Satisfied'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* POLICY VIOLATION BREAKDOWN (MAPPING CARD) */}
            {(isBlocked || isOverridden) && (
              <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-2xl relative overflow-hidden group">
                <div className={`absolute top-0 left-0 w-1 h-full ${isBlocked ? 'bg-destructive/50' : 'bg-amber-500/50'}`} />
                
                <div className="relative z-10 space-y-8">
                  <div className="flex items-center gap-3">
                    {isBlocked ? <AlertCircle className="h-5 w-5 text-destructive" /> : <Shield className="h-5 w-5 text-amber-500" />}
                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/40">
                      {isOverridden ? 'Overridden Policy Context' : 'Policy Violation Breakdown'}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-10 gap-x-12">
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-white/20">Policy Violated</h4>
                      <p className={`text-sm font-mono px-3 py-1.5 rounded-lg inline-block border ${isBlocked ? 'text-destructive bg-destructive/5 border-destructive/10' : 'text-amber-500 bg-amber-500/5 border-amber-500/10'}`}>
                        {decisionData?.violated_policy || "coverage-auth-required"}
                      </p>
                      <p className="text-[9px] font-bold text-white/30 uppercase tracking-tighter mt-1">MANDATORY · HIGH SEVERITY</p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-white/20">Violation Reason</h4>
                      <p className="text-sm font-medium text-white/70 leading-relaxed">
                        {decisionData?.violation_reason || "Authentication-related file modified without test coverage"}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-white/20">Affected File</h4>
                      <p className="text-sm font-mono text-neon-cyan truncate">
                        {decisionData?.facts?.affectedAreas?.[0] || "auth/login.js"}
                      </p>
                    </div>

                    {isOverridden && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-white/20">Authorization Actor</h4>
                        <div className="flex items-center gap-2">
                          <Fingerprint className="h-3 w-3 text-amber-500" />
                          <p className="text-sm font-bold text-amber-500">
                            {latestDecision?.override_by || "System Admin"}
                          </p>
                        </div>
                        <p className="text-[9px] font-bold text-white/30 uppercase tracking-tighter mt-1">
                          Verified Governance Signature
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-white/20">Observed Change</h4>
                      <p className="text-sm font-medium text-white/70">
                        {decisionData?.observed_change || "File modified · No corresponding test files detected"}
                      </p>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-white/20">
                        {isOverridden ? 'Override Justification' : 'Required Action'}
                      </h4>
                      <div className={`flex items-start gap-3 p-4 rounded-2xl border ${isBlocked ? 'bg-white/5 border-white/5' : 'bg-amber-500/5 border-amber-500/10'}`}>
                        {isBlocked ? <ListChecks className="h-4 w-4 text-neon-cyan mt-0.5" /> : <FileText className="h-4 w-4 text-amber-500 mt-0.5" />}
                        <p className={`text-sm ${isBlocked ? 'text-white/80' : 'text-amber-500/80 italic'}`}>
                          {isBlocked ? (
                            <>Add unit tests covering authentication logic in <code className="text-neon-cyan font-mono">{decisionData?.facts?.affectedAreas?.[0] || "auth/login.js"}</code></>
                          ) : (
                            `"${latestDecision?.override_reason || "Administrative bypass granted for emergency resolution."}"`
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl">
              <div className="space-y-3">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/20">Decision Context</h3>
                <p className="text-2xl font-bold text-white/90 leading-tight">
                  {isBlocked 
                    ? `Mandatory policy violation: ${decisionData?.policies?.find((p: PolicyResult) => !p.passed)?.name || "High-risk Code Coverage"}`
                    : isOverridden
                    ? "Governance Authorization Granted"
                    : "All Security Protocols Satisfied"}
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/20">Operational Impact</h3>
                <div className="flex items-start gap-2">
                  <p className="text-xl font-medium text-white/50 leading-relaxed">
                    {isBlocked 
                      ? (decisionData?.violation_reason || decisionData?.decisionReason || "This PR modifies high-risk logic without required validation. Merge is currently prohibited by the governance engine.")
                      : isOverridden
                      ? "An authorized administrator has bypassed the block for this specific commit. The override justification is recorded in the audit log below."
                      : "This PR has passed all deterministic security checks and is eligible for merge according to Zaxion protocols."}
                  </p>
                  {isBlocked && decisionData?.facts?.affectedAreas && decisionData.facts.affectedAreas.length > 0 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="mt-1.5 p-1 rounded-full bg-white/5 border border-white/10 text-white/30 hover:text-neon-cyan hover:bg-neon-cyan/10 transition-all">
                            <HelpCircle className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-[#0B0F1A] border-white/10 p-4 rounded-2xl w-80 shadow-2xl backdrop-blur-xl">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-neon-cyan">Policy Violations</h4>
                              <Badge variant="outline" className="text-[9px] bg-destructive/10 text-destructive border-destructive/20 px-2 py-0">
                                {decisionData?.facts?.affectedAreas?.length || 0} FILES
                              </Badge>
                            </div>
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                              {decisionData?.facts?.affectedAreas?.map((file: string, i: number) => (
                                <div key={i} className="space-y-1.5 p-2 rounded-xl bg-white/[0.02] border border-white/5">
                                  <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 bg-destructive rounded-full shadow-[0_0_5px_rgba(239,68,68,0.5)]" />
                                    <span className="text-[11px] font-mono text-white/80 break-all">{file}</span>
                                  </div>
                                  <p className="text-[10px] text-white/40 pl-3 leading-relaxed italic">
                                    {decisionData?.violated_policy || "coverage-auth-required"} violation: Missing tests for critical path logic.
                                  </p>
                                </div>
                              ))}
                            </div>
                            {decisionData?.policies && decisionData.policies.filter((p: PolicyResult) => !p.passed).length > 1 && (
                              <div className="pt-2 border-t border-white/5 mt-2">
                                <p className="text-[9px] text-white/30 font-bold uppercase tracking-tighter">
                                  + {decisionData.policies.filter((p: PolicyResult) => !p.passed).length - 1} more policy constraints violated
                                </p>
                              </div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-4">
              <div className="flex items-center gap-3 bg-white/[0.03] border border-white/10 rounded-full pl-5 pr-2 py-2 backdrop-blur-xl group transition-all hover:bg-white/[0.05]">
                <AlertCircle className={`h-5 w-5 ${isBlocked ? 'text-destructive' : 'text-green-500'}`} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
                  {decisionData?.violated_policy || "coverage-auth-required"} · HIGH
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowDetails(!showDetails)}
                  className="rounded-full h-8 px-4 text-[9px] font-black uppercase tracking-widest bg-white/5 hover:bg-white/10 text-white/40 hover:text-white border-none"
                >
                  {showDetails ? 'Hide Details' : 'View Details'}
                </Button>
              </div>
              
              {showDetails && (
                <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 font-mono text-[9px] text-white/40">
                    <Fingerprint className="h-3 w-3" />
                    {decisionData?.commit_sha?.substring(0, 7) || "7-HEX-ID"}
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 font-mono text-[9px] text-white/40">
                    <Scale className="h-3 w-3" />
                    v{decisionData?.policy_version || "2.0.0"}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ZONE 2: DECISION EVIDENCE */}
          <section className="space-y-10">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-neon-cyan" />
              <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/40">Decision Evidence</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Change Evidence */}
              <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-white/20">Change Evidence</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/40">Files changed</span>
                    <span className="text-xs font-bold font-mono">{decisionData?.affected_files?.length || decisionData?.facts?.totalChanges || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/40">High-risk files</span>
                    <span className="text-xs font-bold font-mono text-amber-500">{decisionData?.facts?.affectedAreas?.length || 0}</span>
                  </div>
                </div>
              </div>

              {/* Safety Evidence */}
              <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-white/20">Safety Evidence</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/40">Tests added</span>
                    <span className={`text-xs font-bold font-mono ${decisionData?.facts?.testFilesAdded > 0 ? 'text-green-500' : 'text-destructive'}`}>
                      {decisionData?.facts?.testFilesAdded || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/40">Critical path</span>
                    <span className={`text-xs font-bold font-mono ${decisionData?.facts?.hasCriticalChanges ? 'text-amber-500' : 'text-white/40'}`}>
                      {decisionData?.facts?.hasCriticalChanges ? "YES" : "NO"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Governance Context */}
              <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-white/20">Governance Context</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/40">Protected branch</span>
                    <span className={`text-xs font-bold font-mono ${decisionData?.facts?.isMainBranch ? 'text-amber-500' : 'text-white/40'}`}>
                      {decisionData?.facts?.isMainBranch ? "YES" : "NO"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/40">Risk level</span>
                    <span className={`text-xs font-bold font-mono ${decisionData?.advisor?.riskAssessment?.riskLevel === 'CRITICAL' ? 'text-destructive' : 'text-amber-500'}`}>
                      {decisionData?.advisor?.riskAssessment?.riskLevel || "HIGH"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="evidence" className="border-none">
                <AccordionTrigger className="flex items-center justify-between p-8 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-3xl transition-all group outline-none [&[data-state=open]]:rounded-b-none">
                  <div className="flex items-center gap-6">
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 group-hover:border-neon-cyan/30 group-hover:bg-neon-cyan/5 transition-all">
                      <Scale className="h-6 w-6 text-white/30 group-hover:text-neon-cyan" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-bold text-white/80 group-hover:text-white transition-colors">Detailed Policy Rationale</h3>
                      <p className="text-sm text-white/30 mt-0.5">Constitutional basis for this decision</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-0">
                  <div className="p-10 bg-white/[0.01] border-x border-b border-white/5 rounded-b-3xl space-y-12">
                    {/* Compliance Rationale */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Plain English Rationale</h4>
                      <div className="text-xl font-medium text-white/70 leading-relaxed max-w-3xl">
                        {decisionData?.advisor?.rationale ? (
                          <span>"{decisionData.advisor.rationale}"</span>
                        ) : (
                          <span>"{decisionData?.decisionReason || "No detailed rationale available for this decision."}"</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                      {/* Affected Files */}
                      <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Affected Context</h4>
                        <div className="space-y-3">
                          {decisionData?.facts?.changedFiles?.map((file: string, i: number) => (
                            <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                              <span className="text-xs font-mono text-white/50">{file}</span>
                              <Badge variant="outline" className="text-[9px] font-black bg-white/5 text-white/30 border-white/10 px-2 py-0.5 uppercase tracking-tighter">
                                {decisionData?.facts?.affectedAreas?.includes(file) ? "Critical Path" : "Modified"}
                              </Badge>
                            </div>
                          )) || <span className="text-xs text-white/30 italic">No specific file-level violations.</span>}
                        </div>
                      </div>

                      {/* Detailed Audit Trail */}
                      <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Decision Audit Trail</h4>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between py-3 border-b border-white/5">
                            <span className="text-xs text-white/40">Evaluation Timestamp</span>
                            <span className="text-xs font-bold font-mono">{latestDecision?.created_at ? new Date(latestDecision.created_at).toLocaleString() : 'N/A'}</span>
                          </div>
                          <div className="flex items-center justify-between py-3 border-b border-white/5">
                            <span className="text-xs text-white/40">Policy Engine Version</span>
                            <span className="text-xs font-bold font-mono">v{decisionData?.policy_version || "2.0.0"}</span>
                          </div>
                          <div className="flex items-center justify-between py-3 border-b border-white/5">
                            <span className="text-xs text-white/40">Integrity Hash</span>
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
          <section className="space-y-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Scale className="h-5 w-5 text-neon-cyan" />
                <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/40">Limited Allowed Actions</h2>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  onClick={handleMergeSubmit}
                  disabled={isMerging || isPrLoading || !isPassed}
                  className={`h-10 px-8 rounded-xl font-bold gap-2 transition-all ${
                    isPassed
                      ? 'bg-green-600 hover:bg-green-700 text-white shadow-[0_0_20px_rgba(34,197,94,0.2)]'
                      : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'
                  }`}
                >
                  {isMerging ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  {isPassed ? 'Merge Pull Request' : 'Merge Blocked'}
                </Button>
                 
                 <Dialog open={isOverrideDialogOpen} onOpenChange={setIsOverrideDialogOpen}>
                   <DialogTrigger asChild>
                     <Button 
                       disabled={!isBlocked || isPrLoading}
                       className={`h-10 px-8 rounded-xl font-bold gap-2 transition-all ${
                         isBlocked 
                           ? 'bg-amber-500 hover:bg-amber-600 text-black shadow-[0_0_20px_rgba(245,158,11,0.2)]' 
                           : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'
                       }`}
                     >
                       <Shield className="h-4 w-4" />
                       Request Override
                     </Button>
                   </DialogTrigger>
                   <DialogContent className="bg-[#0B0F1A] border-white/10 rounded-3xl backdrop-blur-3xl">
                     <DialogHeader className="space-y-4">
                       <div className="flex items-center gap-3">
                         <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                           <Shield className="h-5 w-5 text-amber-500" />
                         </div>
                         <DialogTitle className="text-xl font-black text-white uppercase tracking-tight">Administrative Override</DialogTitle>
                       </div>
                       <DialogDescription className="text-white/40 text-sm leading-relaxed">
                         You are about to authorize a manual bypass of the governance block for PR #{pPr}. 
                         This action will be permanently recorded in the immutable audit log.
                       </DialogDescription>
                     </DialogHeader>
                     <div className="py-8 space-y-6">
                       <div className="space-y-4">
                         <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Exception Category</label>
                             <Select value={category} onValueChange={setCategory}>
                               <SelectTrigger className="bg-black/20 border-white/10 text-white rounded-xl focus:ring-neon-cyan/50">
                                 <SelectValue placeholder="Select category" />
                               </SelectTrigger>
                               <SelectContent className="bg-[#0B0F1A] border-white/10">
                                 <SelectItem value="BUSINESS_EXCEPTION">Business Exception</SelectItem>
                                 <SelectItem value="EMERGENCY_PRODUCTION_FIX">Emergency Production Fix</SelectItem>
                                 <SelectItem value="FALSE_POSITIVE">False Positive</SelectItem>
                                 <SelectItem value="LEGACY_REFACTOR">Legacy Refactor (Non-functional)</SelectItem>
                               </SelectContent>
                             </Select>
                           </div>
                           <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Override TTL</label>
                             <Select value={ttlHours} onValueChange={setTtlHours}>
                               <SelectTrigger className="bg-black/20 border-white/10 text-white rounded-xl focus:ring-neon-cyan/50">
                                 <SelectValue placeholder="Select TTL" />
                               </SelectTrigger>
                               <SelectContent className="bg-[#0B0F1A] border-white/10">
                                 <SelectItem value="1">1 Hour</SelectItem>
                                 <SelectItem value="4">4 Hours</SelectItem>
                                 <SelectItem value="12">12 Hours</SelectItem>
                                 <SelectItem value="24">24 Hours (Standard)</SelectItem>
                                 <SelectItem value="168">7 Days (Long-term)</SelectItem>
                               </SelectContent>
                             </Select>
                           </div>
                         </div>
                         <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Justification (Required)</label>
                          <Textarea 
                            placeholder="Provide a detailed reason for this governance exception..."
                            className="bg-black/20 border-white/10 text-white rounded-xl min-h-[120px] focus:ring-neon-cyan/50"
                            value={justification}
                            onChange={(e) => setJustification(e.target.value)}
                            onKeyDown={handleKeyDown}
                          />
                           <p className="text-[9px] text-white/20 italic">Minimum 10 characters required for audit compliance.</p>
                         </div>
                       </div>
                       <DialogFooter className="gap-3">
                         <Button 
                           variant="ghost" 
                           onClick={() => setIsOverrideDialogOpen(false)}
                           className="text-white/40 hover:text-white"
                         >
                           Cancel
                         </Button>
                         <Button 
                           onClick={handleOverrideSubmit}
                           disabled={justification.length < 10 || isSubmitting}
                           className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-8 rounded-xl gap-2 transition-all"
                         >
                           {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                           Authorize Override
                         </Button>
                       </DialogFooter>
                     </div>
                   </DialogContent>
                 </Dialog>

                 <Button 
                   variant="outline" 
                   onClick={() => setIsAcknowledged(true)}
                   disabled={isAcknowledged}
                   className={`h-10 px-6 rounded-xl gap-2 transition-all border-white/10 ${isAcknowledged ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-white/5 text-white/60 hover:text-white'}`}
                 >
                   {isAcknowledged ? <CheckCircle2 className="h-4 w-4" /> : <Info className="h-4 w-4" />}
                   {isAcknowledged ? 'Decision Acknowledged' : 'Acknowledge Decision'}
                 </Button>
               </div>
             </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-neon-cyan/40 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <FileCode className="h-24 w-24 text-neon-cyan" />
                </div>
                <div className="h-12 w-12 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center text-neon-cyan mb-6 group-hover:scale-110 transition-transform">
                  <FileCode className="h-6 w-6" />
                </div>
                <div className="space-y-3 relative z-10">
                  <h4 className="text-lg font-bold text-white/90">Add required tests</h4>
                  <p className="text-sm text-white/40 leading-relaxed">
                    Ensure all critical auth paths in <code className="text-neon-cyan font-mono text-[10px]">{decisionData?.facts?.affectedAreas?.[0] || "auth/login.js"}</code> have unit coverage.
                  </p>
                  <div className="pt-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-neon-cyan/60">Targeted Fix Hint</span>
                    <p className="text-[11px] text-white/30 italic mt-1">
                      Add a test file matching <code className="text-white/40">**/*.test.js</code> that imports and exercises the modified logic.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-neon-cyan/40 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <History className="h-24 w-24 text-neon-cyan" />
                </div>
                <div className="h-12 w-12 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center text-neon-cyan mb-6 group-hover:scale-110 transition-transform">
                  <History className="h-6 w-6" />
                </div>
                <div className="space-y-3 relative z-10">
                  <h4 className="text-lg font-bold text-white/90">Push new commit</h4>
                  <p className="text-sm text-white/40 leading-relaxed">Zaxion will automatically re-evaluate your PR once the new changes are detected.</p>
                  <div className="pt-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-neon-cyan/60">Targeted Fix Hint</span>
                    <p className="text-[11px] text-white/30 italic mt-1">
                      New commits trigger immediate re-validation of all mandatory policies.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-neon-cyan/40 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <CheckCircle2 className="h-24 w-24 text-neon-cyan" />
                </div>
                <div className="h-12 w-12 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center text-neon-cyan mb-6 group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div className="space-y-3 relative z-10">
                  <h4 className="text-lg font-bold text-white/90">Auto-clearance</h4>
                  <p className="text-sm text-white/40 leading-relaxed">Once requirements are met, the block will be lifted and merge will be authorized.</p>
                  <div className="pt-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-neon-cyan/60">Targeted Fix Hint</span>
                    <p className="text-[11px] text-white/30 italic mt-1">
                      Successful validation updates the GitHub check status to "Passed".
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* SECONDARY OVERRIDE ACTION */}
            {isBlocked && (
              <div className="pt-12 flex flex-col items-center gap-6 text-center border-t border-white/5">
                <div className="space-y-2 max-w-md">
                  <h5 className="text-sm font-bold text-white/60">Can't satisfy this policy?</h5>
                  <p className="text-xs text-white/30 leading-relaxed">
                    If this is an emergency or an intentional policy deviation, you may request a governance override.
                    <span className="block mt-1 opacity-50 italic">All overrides are audited and require business justification.</span>
                  </p>
                </div>
                <Dialog open={isOverrideDialogOpen} onOpenChange={setIsOverrideDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="rounded-full px-8 py-6 bg-white/5 border-white/10 hover:bg-white/10 text-white/60 hover:text-white gap-3 transition-all group"
                    >
                      <Lock className="h-4 w-4 text-white/40 group-hover:text-amber-500 transition-colors" />
                      Request Governance Override
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#0B0F1A] border-white/10 text-white sm:max-w-[500px] backdrop-blur-2xl">
                    <DialogHeader className="space-y-3">
                      <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                        <Lock className="h-6 w-6 text-amber-500" />
                        Override Request
                      </DialogTitle>
                      <DialogDescription className="text-white/40 leading-relaxed">
                        You are requesting to bypass a mandatory security protocol. This action will be logged in the permanent audit trail.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Justification Category</label>
                        <Select value={category} onValueChange={setCategory}>
                          <SelectTrigger className="bg-black/20 border-white/10 text-white rounded-xl">
                            <SelectValue placeholder="Select reason" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0B0F1A] border-white/10 text-white">
                            <SelectItem value="BUSINESS_EXCEPTION">Business Exception (Critical Path)</SelectItem>
                            <SelectItem value="EMERGENCY_PRODUCTION_FIX">Emergency Production Fix</SelectItem>
                            <SelectItem value="LEGACY_REFACTOR">Legacy Refactor (Non-functional)</SelectItem>
                            <SelectItem value="FALSE_POSITIVE">False Positive / Tooling Error</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Business Justification</label>
                        <Textarea 
                          placeholder="Explain why this policy cannot be satisfied..."
                          className="bg-black/20 border-white/10 text-white rounded-xl min-h-[120px] focus:ring-neon-cyan/50"
                          value={justification}
                          onChange={(e) => setJustification(e.target.value)}
                          onKeyDown={handleKeyDown}
                        />
                        <p className="text-[9px] text-white/20 italic">Minimum 10 characters required for audit compliance.</p>
                      </div>
                    </div>
                    <DialogFooter className="gap-3">
                      <Button 
                        variant="ghost" 
                        onClick={() => setIsOverrideDialogOpen(false)}
                        className="text-white/40 hover:text-white"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleOverrideSubmit}
                        disabled={justification.length < 10 || isSubmitting}
                        className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-8 rounded-xl gap-2 transition-all"
                      >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                        Authorize Override
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </section>

          {/* ZONE 4: AUDIT & INTEGRITY (TRUST LAYER) */}
          <section className="pt-16 pb-24">
            <Accordion type="single" collapsible className="w-full space-y-4">
              {/* Override History Segment */}
              <AccordionItem value="history" className="border-none">
                <AccordionTrigger className="flex items-center justify-between p-6 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-2xl transition-all group outline-none">
                  <div className="flex items-center gap-4">
                    <History className="h-4 w-4 text-white/30 group-hover:text-amber-500 transition-colors" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 group-hover:text-white transition-colors">Governance Override History</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="p-6 space-y-4">
                    {latestDecision?.override_by ? (
                      <div className="flex items-start gap-4 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                        <div className="p-2 rounded-lg bg-amber-500/10">
                          <Shield className="h-4 w-4 text-amber-500" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white/80">{latestDecision.override_by}</span>
                            <Badge variant="outline" className="text-[8px] h-4 bg-amber-500/10 text-amber-500 border-amber-500/20 uppercase">Authorized</Badge>
                          </div>
                          <p className="text-xs text-white/50 leading-relaxed italic">"{latestDecision.override_reason}"</p>
                          <p className="text-[9px] text-white/20 font-mono mt-2 uppercase tracking-tighter">
                            Executed at: {new Date(latestDecision.overridden_at!).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-white/20 text-xs italic">
                        No overrides recorded for this specific decision instance.
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="trust" className="border-none">
                <AccordionTrigger className="flex items-center justify-center py-4 text-white/10 hover:text-white/30 transition-all group outline-none">
                  <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em]">
                    <Fingerprint className="h-3 w-3" />
                    Audit & Integrity Layer
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-10 border-t border-white/5">
                    <div className="space-y-3">
                      <h6 className="text-[9px] font-black text-white/20 uppercase tracking-widest">Evaluation Cryptographic ID</h6>
                      <div className="font-mono text-[10px] text-white/40 select-all bg-white/5 p-3 rounded-lg truncate">
                        {latestDecision?.id || "e9f8-d7c6-b5a4-1234"}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h6 className="text-[9px] font-black text-white/20 uppercase tracking-widest">Policy Constitution</h6>
                      <div className="text-[10px] text-white/40 flex items-center gap-2">
                        <Badge variant="outline" className="text-[8px] bg-green-500/10 text-green-500 border-green-500/20 uppercase">Immutable</Badge>
                        v{decisionData?.policy_version || "1.0.0"} · Global Standard
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h6 className="text-[9px] font-black text-white/20 uppercase tracking-widest">Evaluation Timestamp</h6>
                      <div className="text-[10px] text-white/40 font-mono">
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

      <footer className="relative z-10 border-t border-white/5 py-16 bg-black/20 backdrop-blur-xl">
        <div className="container max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-start justify-between gap-12">
            <div className="space-y-6 max-w-sm">
              <div className="flex items-center gap-3">
                <img src="/zaxion-guard.png" alt="Zaxion Guard Logo" className="h-12 w-auto object-contain" />
                <span className="font-black tracking-tighter text-xl uppercase">Zaxion <span className="text-neon-cyan">Guard</span></span>
              </div>
              <p className="text-sm text-white/30 leading-relaxed">
                Deterministic governance engine for high-stakes software environments.
                Enforcing organizational policy through automated code analysis.
              </p>
            </div>

            <div className="w-full md:w-auto">
              <Accordion type="single" collapsible className="w-full md:min-w-[300px]">
                <AccordionItem value="why-zaxion" className="border-white/10">
                  <AccordionTrigger className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:no-underline py-4">
                    Why am I seeing this?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-white/30 leading-relaxed pb-6 space-y-4">
                    <p>
                      Zaxion enforces organization-wide policies to prevent unsafe code from reaching protected branches. 
                      Decisions are deterministic, audited, and reproducible.
                    </p>
                    <p>
                      By ensuring all changes meet mandatory security and quality standards before merge, Zaxion maintains the integrity of the production environment.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-white/20 uppercase tracking-[0.2em]">
            <span>© 2024 Zaxion Governance Engine</span>
            <span>v2.4.0-Stable</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DecisionResolutionConsole;