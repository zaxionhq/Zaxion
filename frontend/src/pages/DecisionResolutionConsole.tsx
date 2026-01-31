import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { Github, Shield, History, ExternalLink, AlertTriangle, CheckCircle2, FileText, Scale, Info } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { GitHubButton } from '@/components/ui/github-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PRGateStatus } from '@/components/PRGateStatus';
import { useSession } from '@/hooks/useSession';
import { api } from '@/lib/api';
import { usePRGate, PRDecision } from '@/hooks/usePRGate';

const DecisionResolutionConsole = () => {
  const { owner, repo: repoName, prNumber: prNumStr } = useParams<{ owner: string; repo: string; prNumber: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const { user, loading: sessionLoading } = useSession();

  // PR Gate Hook
  const { latestDecision, isLoading: isPrLoading, fetchLatestDecision, executeOverride } = usePRGate();

  // Extract PR context from either URL params or query params
  const pOwner = owner || searchParams.get('owner');
  const pRepo = repoName || searchParams.get('repo');
  const pPr = prNumStr || searchParams.get('pr');

  const decisionData = React.useMemo(() => {
    if (!latestDecision?.raw_data) return null;
    try {
      return typeof latestDecision.raw_data === 'string' 
        ? JSON.parse(latestDecision.raw_data) 
        : latestDecision.raw_data;
    } catch (e) {
      console.error("Failed to parse decision raw_data:", e);
      return null;
    }
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

  const handleOverride = async (reason: string, category: string, ttlHours: number) => {
    if (pOwner && pRepo && pPr) {
      await executeOverride(pOwner, pRepo, parseInt(pPr), reason, category, ttlHours);
      fetchLatestDecision(pOwner, pRepo, parseInt(pPr));
    }
  };

  // Auth Overlay
  if (!user) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-white/10 bg-black/40 backdrop-blur-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Shield className="h-12 w-12 text-neon-cyan" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">Zaxion Governance Console</CardTitle>
            <CardDescription className="text-white/60">
              {sessionLoading ? 'Verifying credentials...' : 'Authenticate to review PR compliance decisions.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GitHubButton 
              variant="hero" 
              size="lg" 
              onClick={handleGitHubConnect}
              className="w-full gap-3 bg-neon-cyan text-black hover:bg-neon-cyan/90"
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
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-white/10 bg-black/40 backdrop-blur-xl">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <CardTitle className="text-xl font-bold text-white">No PR Context Found</CardTitle>
            <CardDescription className="text-white/60">
              Zaxion must be accessed through a Pull Request link.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Badge variant="outline" className="text-amber-500 border-amber-500/30">
              400: Missing Parameters
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-neon-cyan/30 overflow-x-hidden font-sans">
      {/* Background depth layers */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-neon-purple/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-neon-cyan/5 blur-[120px] rounded-full" />
      </div>

      <nav className="relative z-10 border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <Shield className="h-6 w-6 text-neon-cyan" />
            <span className="font-black tracking-tighter text-lg uppercase">Zaxion <span className="text-neon-cyan">Guard</span></span>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-neon-cyan/5 text-neon-cyan border-neon-cyan/20 px-3 py-1 font-mono text-[10px]">
              AUDIT_MODE: ENABLED
            </Badge>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="relative z-10 container mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-8">
          
          {/* Left Column: Summary & Main Decision */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            
            {/* PR Identification Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-white/40 text-xs font-mono uppercase tracking-widest mb-2">
                  <FileText className="h-3 w-3" />
                  Governance Review / {pOwner} / {pRepo}
                </div>
                <h2 className="text-4xl font-black tracking-tight">
                  PR <span className="text-neon-cyan">#{pPr}</span>
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <a 
                  href={`https://github.com/${pOwner}/${pRepo}/pull/${pPr}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs font-bold text-white/60 hover:text-neon-cyan transition-colors bg-white/5 px-4 py-2 rounded-lg border border-white/10"
                >
                  <ExternalLink className="h-3 w-3" />
                  View on GitHub
                </a>
              </div>
            </div>

            {/* Main Decision Status */}
            <PRGateStatus 
              decision={latestDecision} 
              isLoading={isPrLoading} 
              onOverride={handleOverride} 
            />

            {/* Glass Box: Evidence & Reasoning */}
            {latestDecision && decisionData && (
              <Card className="border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden">
                <CardHeader className="border-b border-white/5 pb-4">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Scale className="h-5 w-5 text-neon-cyan" />
                    Decision Evidence & Reasoning
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Policy Rationale */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Compliance Rationale</h4>
                    <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 text-sm italic text-white/80 leading-relaxed">
                      "{decisionData.advisor?.rationale || "No explicit rationale provided by policy engine."}"
                    </div>
                  </div>

                  {/* Fact Paths */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Evaluation Metrics</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-3 rounded-lg bg-white/[0.02] border border-white/5">
                          <span className="text-xs text-white/60 font-mono">files_changed</span>
                          <span className="text-xs font-bold">{decisionData.facts?.totalChanges || 0}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-lg bg-white/[0.02] border border-white/5">
                          <span className="text-xs text-white/60 font-mono">tests_added</span>
                          <span className="text-xs font-bold text-neon-cyan">{decisionData.facts?.testFilesAdded || 0}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-lg bg-white/[0.02] border border-white/5">
                          <span className="text-xs text-white/60 font-mono">critical_path</span>
                          <Badge variant="outline" className={decisionData.facts?.hasCriticalChanges ? "text-amber-500 border-amber-500/30 text-[9px]" : "text-green-500 border-green-500/30 text-[9px]"}>
                            {decisionData.facts?.hasCriticalChanges ? "TRUE" : "FALSE"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Affected Context</h4>
                      <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 min-h-[100px]">
                        <div className="flex flex-wrap gap-2">
                          {decisionData.facts?.affectedAreas?.map((area: string, i: number) => (
                            <Badge key={i} variant="outline" className="bg-neon-purple/5 text-neon-purple border-neon-purple/20 text-[9px] px-2">
                              {area}
                            </Badge>
                          )) || <span className="text-xs text-white/30 italic">No context areas identified.</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column: Governance Metadata & Audit Log */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            
            {/* Audit Metadata */}
            <Card className="border-white/10 bg-black/40 backdrop-blur-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Shield className="h-4 w-4 text-neon-cyan" />
                  Audit Integrity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <div className="text-[9px] font-black uppercase tracking-widest text-white/30">Commit Hash</div>
                  <div className="font-mono text-xs text-white/80 truncate bg-white/5 p-2 rounded border border-white/5">
                    {latestDecision?.commit_sha || "—"}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-[9px] font-black uppercase tracking-widest text-white/30">Policy Version</div>
                  <div className="text-xs font-bold text-neon-cyan">
                    v{decisionData?.policy_version || "1.0.0"} (CONSTITUTIONAL)
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-[9px] font-black uppercase tracking-widest text-white/30">Evaluated At</div>
                  <div className="text-xs text-white/60">
                    {latestDecision ? new Date(latestDecision.created_at).toLocaleString() : "—"}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Instruction Panel */}
            <Card className="border-neon-cyan/20 bg-neon-cyan/5">
              <CardContent className="p-6 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-neon-cyan flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  How to Resolve
                </h4>
                <p className="text-xs text-white/70 leading-relaxed">
                  Zaxion governs code quality via immutable policies. If this PR is blocked:
                </p>
                <ul className="space-y-2">
                  <li className="flex gap-2 text-xs text-white/60">
                    <span className="text-neon-cyan font-bold">1.</span>
                    <span>Fix violations locally and push new changes.</span>
                  </li>
                  <li className="flex gap-2 text-xs text-white/60">
                    <span className="text-neon-cyan font-bold">2.</span>
                    <span>Wait for Zaxion to re-evaluate the new commit.</span>
                  </li>
                  <li className="flex gap-2 text-xs text-white/60">
                    <span className="text-neon-cyan font-bold">3.</span>
                    <span>Request an override only for legitimate exceptions.</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

          </div>
        </div>
      </main>

      {/* Footer / Status Bar */}
      <footer className="relative z-10 border-t border-white/5 bg-black/40 backdrop-blur-md mt-12 py-4">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-white/30 font-mono uppercase tracking-[0.2em]">
          <div className="flex items-center gap-4">
            <span>© 2026 ZAXION PROTOCOL</span>
            <span className="w-1 h-1 rounded-full bg-white/10" />
            <span>SESSION: {user?.id?.toString().padStart(6, '0')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-1.5 w-1.5 rounded-full bg-neon-cyan animate-pulse" />
            LIVE AUDIT CONNECTED
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DecisionResolutionConsole;