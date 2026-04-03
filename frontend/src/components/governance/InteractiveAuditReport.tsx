import React, { useState, useMemo } from 'react';
import { 
  Shield, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Zap, 
  Download, 
  ExternalLink, 
  GitPullRequest,
  User,
  Clock,
  Search,
  ArrowRight,
  FileCode,
  Info,
  ShieldCheck,
  GitBranch,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  BulkAnalysisData, 
  AnalysisResult, 
  Violation 
} from './SocialAuditTerminal';
import { toast } from 'sonner';

interface InteractiveAuditReportProps {
  data: BulkAnalysisData;
}

export const InteractiveAuditReport: React.FC<InteractiveAuditReportProps> = ({ data }) => {
  const { owner, repo, results, summary } = data;
  const [filter, setStatusFilter] = useState<'ALL' | 'BLOCK' | 'PASS' | 'WARN'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredResults = useMemo(() => {
    return results.filter(pr => {
      const matchesFilter = 
        filter === 'ALL' || 
        (filter === 'BLOCK' && (pr.status === 'BLOCK' || pr.status === 'BLOCKED')) ||
        (filter === 'PASS' && (pr.status === 'PASS' || pr.status === 'PASSED')) ||
        (filter === 'WARN' && (pr.status === 'WARN' || pr.status === 'WARNED'));
      
      const matchesSearch = 
        pr.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        pr.prNumber.toString().includes(searchQuery) ||
        pr.author?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [results, filter, searchQuery]);

  const generateHtmlReport = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Governance audit — ${owner}/${repo}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body { background-color: #020617; color: #f8fafc; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
          .card { background-color: #0f172a; border: 1px solid #1e293b; border-radius: 0.75rem; padding: 1.5rem; margin-bottom: 1.5rem; }
          .badge { padding: 0.25rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
          .pass { background-color: rgba(34, 197, 94, 0.1); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.2); }
          .fail { background-color: rgba(239, 68, 68, 0.1); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.2); }
          .warn { background-color: rgba(245, 158, 11, 0.1); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.2); }
        </style>
      </head>
      <body class="p-8 max-w-5xl mx-auto">
        <header class="flex justify-between items-center mb-12 border-b border-slate-800 pb-8">
          <div>
            <h1 class="text-4xl font-black tracking-tighter">Zaxion</h1>
            <p class="text-slate-500 mt-2">Founder Console — read-only audit of public pull requests</p>
          </div>
          <div class="text-right">
            <div class="text-5xl font-black ${summary?.grade === 'A' || summary?.grade === 'B' ? 'text-green-400' : 'text-red-400'}">${summary?.grade}</div>
            <div class="text-xs text-slate-500 mt-1 uppercase font-bold tracking-widest">Score: ${summary?.score}%</div>
          </div>
        </header>

        <section class="grid grid-cols-4 gap-6 mb-12">
          <div class="card text-center">
            <div class="text-xs text-slate-500 uppercase font-bold mb-1">Analyzed PRs</div>
            <div class="text-3xl font-black">${results.length}</div>
          </div>
          <div class="card text-center">
            <div class="text-xs text-slate-500 uppercase font-bold mb-1">Violations</div>
            <div class="text-3xl font-black text-red-500">${summary?.blocked}</div>
          </div>
          <div class="card text-center">
            <div class="text-xs text-slate-500 uppercase font-bold mb-1">Critical</div>
            <div class="text-3xl font-black text-amber-500">${summary?.critical}</div>
          </div>
          <div class="card text-center">
            <div class="text-xs text-slate-500 uppercase font-bold mb-1">Auto-Fixable</div>
            <div class="text-3xl font-black text-cyan-400">${summary?.autoPatchable}</div>
          </div>
        </section>

        <section class="space-y-4">
          <h2 class="text-xl font-bold mb-6 flex items-center gap-2">
            <span class="w-2 h-2 bg-cyan-400 rounded-full"></span>
            Detailed Audit Findings
          </h2>
          ${results.map(pr => `
            <div class="card">
              <div class="flex justify-between items-start mb-4">
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-slate-500 font-bold">#${pr.prNumber}</span>
                    <h3 class="text-lg font-bold">${pr.title}</h3>
                  </div>
                  <div class="text-xs text-slate-500 flex items-center gap-4">
                    <span>Author: ${pr.author}</span>
                    <span>Branch: ${pr.baseBranch}</span>
                  </div>
                </div>
                <span class="badge ${pr.status.includes('PASS') ? 'pass' : pr.status.includes('BLOCK') ? 'fail' : 'warn'}">${pr.status}</span>
              </div>
              ${pr.violations.length > 0 ? `
                <div class="bg-slate-950/50 rounded-lg p-4 border border-slate-800">
                  <table class="w-full text-xs">
                    <thead>
                      <tr class="text-left text-slate-500 border-b border-slate-800">
                        <th class="pb-2">Rule ID</th>
                        <th class="pb-2">Severity</th>
                        <th class="pb-2">File</th>
                        <th class="pb-2">Explanation</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${pr.violations.map(v => `
                        <tr class="border-b border-slate-900 last:border-0">
                          <td class="py-3 font-bold text-slate-300">${v.rule_id}</td>
                          <td class="py-3"><span class="text-red-400 font-bold">${v.severity}</span></td>
                          <td class="py-3 text-slate-400">
                            ${v.file}:${v.line}
                            ${v.code_context ? `<div class="mt-2 p-1.5 bg-black/40 rounded border border-slate-800 text-[9px] text-red-400 font-mono overflow-x-auto">${v.code_context}</div>` : ''}
                          </td>
                          <td class="py-3 text-slate-300">${v.explanation}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              ` : '<p class="text-green-400 text-xs font-bold">✓ Compliant with all organizational policies.</p>'}
            </div>
          `).join('')}
        </section>

        <footer class="mt-20 text-center text-slate-600 text-[10px] pb-20">
          Zaxion governance · ${new Date().toISOString()} (UTC) · Point-in-time replay; re-run after policy or repo changes.
        </footer>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Zaxion-Audit-${owner}-${repo}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Interactive HTML report downloaded!");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* 1. Simulation-Style Summary Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-muted/30 border-border/50 shadow-sm transition-all hover:shadow-md">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Audit Sample Scanned</p>
              <p className="text-2xl font-bold tracking-tight text-white">{summary?.total_scanned || results.length}</p>
            </div>
            <div className="p-2 rounded-full bg-blue-500/10 text-blue-500">
              <Search className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30 border-border/50 shadow-sm transition-all hover:shadow-md">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Systemic Blocks</p>
              <p className={cn("text-2xl font-bold tracking-tight", (summary?.blocked || 0) > 0 ? "text-red-500" : "text-green-500")}>
                {summary?.blocked || 0}
              </p>
            </div>
            <div className={cn("p-2 rounded-full", (summary?.blocked || 0) > 0 ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500")}>
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30 border-border/50 shadow-sm transition-all hover:shadow-md">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Violation Intensity</p>
              <p className={cn(
                "text-2xl font-bold tracking-tight",
                (summary?.blast_radius ?? 0) > 0.3 ? "text-orange-500" : "text-green-500"
              )}>
                {typeof summary?.blast_radius === 'number'
                  ? `${(summary.blast_radius * 100).toFixed(1)}%`
                  : '0.0%'}
              </p>
            </div>
            <div className={cn("p-2 rounded-full", (summary?.blast_radius ?? 0) > 0.3 ? "bg-orange-500/10 text-orange-500" : "bg-green-500/10 text-green-500")}>
              <GitBranch className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Enforcement Insights Section */}
      <div className="p-6 rounded-2xl bg-muted/20 border border-border/50 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
          <AlertCircle className="h-24 w-24 text-white" />
        </div>
        <div className="relative space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-white">
              <AlertCircle className="h-4 w-4 text-cyan-500" />
              Governance Enforcement Insights
            </div>
            <Button 
              onClick={generateHtmlReport}
              size="sm"
              className="h-8 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black uppercase tracking-widest text-[10px] gap-2 rounded-lg"
            >
              <Download className="h-3 w-3" />
              Export Interactive Report
            </Button>
          </div>
          <div className="text-sm text-slate-400 leading-relaxed max-w-3xl">
            Sample: <span className="font-bold text-white">{summary?.total_scanned ?? results.length}</span> recent pull request(s) from{' '}
            <span className="font-bold text-white">{owner}/{repo}</span> evaluated against your selected policies. Outcomes:{' '}
            <span className="font-bold text-green-400">{summary?.passed ?? 0}</span> pass,{' '}
            <span className="font-bold text-red-500">{summary?.blocked ?? 0}</span> block,{' '}
            <span className="font-bold text-amber-500">{summary?.warned ?? 0}</span> warn. Block rate:{' '}
            <span className="font-bold text-white">
              {summary?.total_scanned ? `${((summary.blast_radius ?? 0) * 100).toFixed(0)}%` : '—'}
            </span>
            {summary?.risk_assessment && (
              <p className="mt-2 text-slate-300">
                <span className="font-semibold text-white">Risk: {summary.risk_assessment.level}.</span>{' '}
                {summary.risk_assessment.impact}
              </p>
            )}
            {!summary?.risk_assessment && (
              <p className="mt-2">
                {(summary?.blast_radius || 0) > 0.5 ? (
                  <span className="text-red-300">High block rate: prioritize remediation on failing PRs before merge.</span>
                ) : (summary?.blast_radius || 0) > 0.2 ? (
                  <span className="text-orange-300">Elevated block rate: review failing PRs and policy alignment.</span>
                ) : (
                  <span className="text-green-300">Low block rate in this sample relative to selected policies.</span>
                )}
              </p>
            )}
          </div>
          
          {summary?.total_violations && summary.total_violations > 0 && (
            <div className="space-y-3 mt-4 pt-4 border-t border-border/50">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                <span>Violation Severity Distribution</span>
                <span className="text-white">{summary.total_violations} Total Violations</span>
              </div>
              <div className="flex h-3 w-full rounded-full overflow-hidden bg-slate-800">
                {summary.violations_by_severity?.BLOCK && (
                  <div 
                    className="bg-red-500 h-full transition-all duration-1000" 
                    style={{ width: `${(summary.violations_by_severity.BLOCK / summary.total_violations) * 100}%` }}
                    title={`BLOCK: ${summary.violations_by_severity.BLOCK}`}
                  />
                )}
                {summary.violations_by_severity?.WARN && (
                  <div 
                    className="bg-amber-500 h-full transition-all duration-1000" 
                    style={{ width: `${(summary.violations_by_severity.WARN / summary.total_violations) * 100}%` }}
                    title={`WARN: ${summary.violations_by_severity.WARN}`}
                  />
                )}
                {summary.violations_by_severity?.OBSERVE && (
                  <div 
                    className="bg-cyan-500 h-full transition-all duration-1000" 
                    style={{ width: `${(summary.violations_by_severity.OBSERVE / summary.total_violations) * 100}%` }}
                    title={`OBSERVE: ${summary.violations_by_severity.OBSERVE}`}
                  />
                )}
              </div>
              <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-tighter text-slate-500">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  BLOCK: {summary.violations_by_severity?.BLOCK || 0}
                </div>
                <div className="flex items-center gap-1.5 pl-4 border-l border-slate-800">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  WARN: {summary.violations_by_severity?.WARN || 0}
                </div>
                <div className="flex items-center gap-1.5 pl-4 border-l border-slate-800">
                  <div className="w-2 h-2 rounded-full bg-cyan-500" />
                  OBSERVE: {summary.violations_by_severity?.OBSERVE || 0}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2.5 Strategic Enterprise Insights */}
      {summary?.risk_assessment && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className={cn(
            "lg:col-span-1 border-2 transition-all hover:scale-[1.02]",
            summary.risk_assessment.level === 'CRITICAL' ? "border-red-500/50 bg-red-500/5" :
            summary.risk_assessment.level === 'HIGH' ? "border-orange-500/50 bg-orange-500/5" :
            "border-green-500/50 bg-green-500/5"
          )}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Strategic Risk Level
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-3xl font-black mb-2",
                summary.risk_assessment.level === 'CRITICAL' ? "text-red-500" :
                summary.risk_assessment.level === 'HIGH' ? "text-orange-500" :
                "text-green-500"
              )}>
                {summary.risk_assessment.level}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed italic">
                {summary.risk_assessment.impact}
              </p>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-white">
                <ArrowRight className="h-4 w-4 text-cyan-500" />
                Strategic Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {summary.recommendations?.map((rec, i) => (
                  <div key={i} className="flex items-start gap-4 p-3 rounded-xl bg-slate-950/50 border border-slate-800/50 group hover:border-cyan-500/30 transition-colors">
                    <Badge className={cn(
                      "mt-0.5 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 shrink-0",
                      rec.priority === 'IMMEDIATE' ? "bg-red-500 text-white" :
                      rec.priority === 'HIGH' ? "bg-orange-500 text-white" :
                      "bg-slate-700 text-slate-300"
                    )}>
                      {rec.priority}
                    </Badge>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">{rec.action}</p>
                      <p className="text-[10px] text-slate-400 leading-snug">{rec.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 3. Detailed PR Findings */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-cyan-500 rounded-full" />
            <h3 className="text-xl font-black text-white uppercase tracking-tight italic">Detailed Audit Findings</h3>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search PRs, authors, or IDs..." 
                className="h-9 w-64 bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-1">
              {(['ALL', 'BLOCK', 'PASS', 'WARN'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={cn(
                    "px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all",
                    filter === f ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredResults.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl bg-slate-950/50">
            <Info className="h-10 w-10 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 font-mono text-sm">No matching PRs found for the current filters.</p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-4">
            {filteredResults.map((pr, idx) => {
              const isPassed = pr.status === 'PASSED' || pr.status === 'PASS';
              const isBlocked = pr.status === 'BLOCKED' || pr.status === 'BLOCK';
              
              return (
                <AccordionItem 
                  key={pr.prNumber} 
                  value={`item-${idx}`}
                  className="border border-slate-800 bg-slate-900/30 rounded-2xl overflow-hidden px-0 transition-all hover:border-slate-700"
                >
                  <AccordionTrigger className="hover:no-underline px-6 py-4 group">
                    <div className="flex items-center gap-4 w-full text-left">
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg transition-transform group-hover:scale-110",
                        isPassed ? "bg-green-500/10 text-green-500" : 
                        isBlocked ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"
                      )}>
                        {isPassed ? <CheckCircle2 className="h-5 w-5" /> : 
                         isBlocked ? <XCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-mono font-bold text-slate-500">#{pr.prNumber}</span>
                          <h4 className="text-sm font-bold text-white truncate group-hover:text-cyan-400 transition-colors">{pr.title}</h4>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                            <User className="h-3 w-3" /> {pr.author}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium uppercase tracking-wider pl-3 border-l border-slate-800">
                            <GitPullRequest className="h-3 w-3" /> {pr.baseBranch}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium uppercase tracking-wider pl-3 border-l border-slate-800">
                            <Clock className="h-3 w-3" /> {pr.createdAt ? new Date(pr.createdAt).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 pr-4">
                        {pr.isAutoPatchable && (
                          <Badge variant="outline" className="h-5 text-[8px] bg-cyan-500/5 text-cyan-400 border-cyan-500/20 px-1.5">
                            <Zap className="h-2.5 w-2.5 mr-1 fill-cyan-400" />
                            AUTO-PATCH
                          </Badge>
                        )}
                        <Badge className={cn(
                          "h-6 px-3 text-[10px] font-black uppercase tracking-widest",
                          isPassed ? "bg-green-500/10 text-green-500 border-green-500/20" :
                          isBlocked ? "bg-red-500/10 text-red-500 border-red-500/20" :
                          "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        )}>
                          {pr.status}
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6 pt-2">
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 text-[10px] font-bold uppercase tracking-wider border-slate-800 bg-slate-900/50 hover:bg-slate-800 gap-2 rounded-lg"
                          onClick={() => window.open(pr.url, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                          GitHub Source
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 text-[10px] font-bold uppercase tracking-wider text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/5 gap-2 rounded-lg"
                          asChild
                        >
                          <a href={`/pr/${owner}/${repo}/${pr.prNumber}`}>
                            Detailed Zaxion Report
                            <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                          </a>
                        </Button>
                      </div>

                      {pr.violations.length > 0 ? (
                        <div className="rounded-xl border border-slate-800 bg-slate-950/50 overflow-hidden shadow-inner">
                          <Table>
                            <TableHeader className="bg-slate-900/50">
                              <TableRow className="border-slate-800 hover:bg-transparent">
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 h-10">Policy / Rule ID</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 h-10 text-center">Severity</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 h-10">Context</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 h-10">Analysis & Recommendation</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {pr.violations.map((v, vIdx) => (
                                <TableRow key={vIdx} className="border-slate-800/50 hover:bg-slate-900/30 transition-colors group/row">
                                  <TableCell className="py-4">
                                    <div className="flex items-center gap-2">
                                      <div className={cn(
                                        "w-1 h-4 rounded-full",
                                        v.severity === 'BLOCK' || v.severity === 'CRITICAL' ? "bg-red-500" : "bg-amber-500"
                                      )} />
                                      <span className="text-xs font-mono font-bold text-slate-200">{v.rule_id}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-4 text-center">
                                    <Badge variant="outline" className={cn(
                                      "text-[9px] font-black uppercase px-1.5",
                                      v.severity === 'BLOCK' || v.severity === 'CRITICAL' || v.severity === 'HIGH' ? "text-red-500 border-red-500/20 bg-red-500/5" : "text-amber-500 border-amber-500/20 bg-amber-500/5"
                                    )}>
                                      {v.severity}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="py-4">
                                    <div className="flex flex-col gap-2">
                                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                        <FileCode className="h-3 w-3 text-slate-600" />
                                        {v.file}
                                      </div>
                                      {v.line && (
                                        <span className="text-[9px] font-mono text-slate-600 uppercase">Line: {v.line}</span>
                                      )}
                                      {v.code_context && (
                                        <div className="mt-2 p-2 rounded bg-slate-950 border border-slate-800 font-mono text-[10px] text-red-400/90 overflow-x-auto whitespace-pre">
                                          {v.code_context}
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-4">
                                    <div className="space-y-2 max-w-md">
                                      <p className="text-xs text-slate-300 leading-relaxed">{v.explanation}</p>
                                      {v.remediation && (
                                        <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
                                          <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                            <Zap className="h-3 w-3 fill-cyan-500" />
                                            Remediation Strategy
                                          </p>
                                          <ul className="list-disc list-inside space-y-1">
                                            {v.remediation.steps.map((step, sIdx) => (
                                              <li key={sIdx} className="text-[10px] text-cyan-400/80 leading-snug">{step}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 p-6 rounded-2xl border border-green-500/20 bg-green-500/5">
                          <CheckCircle2 className="h-6 w-6 text-green-500" />
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-green-400">Policy Compliance Verified</p>
                            <p className="text-xs text-green-500/70">No violations detected. This PR meets all organizational governance standards.</p>
                          </div>
                        </div>
                      )}

                      {/* Verified Policy Controls */}
                      {pr.passes && pr.passes.length > 0 && (
                        <div className="space-y-3 pt-2">
                          <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <ShieldCheck className="h-3 w-3 text-green-500" />
                            Verified Policy Controls ({pr.passes.length})
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {pr.passes.map((p, pIdx) => (
                              <div key={pIdx} className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-400 flex items-center gap-2 transition-colors hover:border-slate-700">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                {p.rule_id}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>
    </div>
  );
};
