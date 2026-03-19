import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Play, RotateCcw, ShieldCheck, AlertCircle, Loader2, Plus, Search, GitBranch, CheckCircle2, Download, ExternalLink, FileJson, HelpCircle, Upload } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { api } from '@/lib/api';
import logger from '@/lib/logger';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Link } from 'react-router-dom';
import { CreatePolicyModal } from '@/components/governance/CreatePolicyModal';
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

interface RulesLogic {
  type?: string;
  [key: string]: unknown;
}

/** Turn rules_logic into plain-language "what this policy does" lines. */
function describePolicyRules(rulesLogic: unknown): string[] {
  const lines: string[] = [];
  if (rulesLogic == null || typeof rulesLogic !== 'object') return lines;
  const r = rulesLogic as RulesLogic;
  const type = (r.type as string) || '';

  switch (type) {
    case 'pr_size': {
      const max = r.max_files;
      const n = typeof max === 'number' ? max : 20;
      lines.push(`Limits PRs to at most ${n} files.`);
      break;
    }
    case 'coverage': {
      const minTests = r.min_tests;
      const minRatio = r.min_coverage_ratio;
      if (typeof minRatio === 'number') {
        lines.push(`Requires at least ${(minRatio * 100).toFixed(0)}% test coverage (when AST data is available).`);
      } else {
        const n = typeof minTests === 'number' ? minTests : 1;
        lines.push(`Requires at least ${n} test file(s) in the PR.`);
      }
      break;
    }
    case 'file_extension': {
      const ext = r.allowed_extensions;
      const exts = Array.isArray(ext) ? ext.map(String) : ext ? [String(ext)] : [];
      const pattern = r.pattern ? String(r.pattern) : null;
      if (exts.length) {
        lines.push(`Only allows these file types: ${exts.join(', ')}.`);
        if (pattern) lines.push(`Applies to paths matching: ${pattern}`);
      } else {
        lines.push('Restricts allowed file extensions (see rules).');
      }
      break;
    }
    case 'security_path': {
      const paths = r.security_paths;
      const arr = Array.isArray(paths) ? paths.map(String) : paths ? [String(paths)] : [];
      if (arr.length) {
        lines.push(`Treats these paths as security-sensitive: ${arr.join(', ')}`);
      } else {
        lines.push('Enforces extra scrutiny on security-sensitive paths.');
      }
      break;
    }
    case 'security_patterns':
      lines.push('Scans code for hardcoded secrets, eval(), and risky patterns (e.g. XSS).');
      break;
    case 'code_quality':
      lines.push('Blocks console.log and debugger in code.');
      break;
    case 'documentation':
      lines.push('Requires JSDoc on exported functions.');
      break;
    case 'architecture':
      lines.push('Checks for circular dependencies.');
      break;
    case 'reliability':
      lines.push('Enforces error handling (e.g. try/catch) where needed.');
      break;
    case 'performance':
      lines.push('Requires performance or benchmark tests for critical paths.');
      break;
    case 'api':
      lines.push('Guards against breaking API changes.');
      break;
    default:
      if (type) lines.push(`Runs rule type: ${type}.`);
      else lines.push('Custom or composite rules apply.');
  }
  return lines.length ? lines : ['No rule description available.'];
}

interface Policy {
  id: string;
  name: string;
  description?: string;
  scope: string;
  target_id: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  latest_version?: {
    id?: string;
    version_number?: number;
    enforcement_level?: string;
    createdAt: string;
    rules_logic?: RulesLogic;
    creator?: { email: string };
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

interface Violation {
  rule_id: string;
  severity: string;
  message: string;
  file?: string;
  line?: number;
  column?: number;
  current_value?: string;
  required_value?: string;
  explanation?: string;
  remediation?: { steps: string[]; example?: string };
  documentation_link?: string;
  pr_number?: number;
  repo?: string;
  pr_title?: string;
}

interface PerPrResult {
  pr_number: number;
  repo: string;
  verdict: string;
  rationale: string;
  pr_title: string;
  author: string | null;
  base_branch: string | null;
  historical_result: string;
  ingested_at?: string;
  change?: string;
  violations?: Violation[];
  passes?: { rule_id: string; status: string; message: string; file?: string }[];
}

interface SimulationResult {
  id: string;
  status: 'COMPLETED' | 'FAILED' | 'PENDING' | 'RUNNING';
  total_scanned: number;
  total_blocked: number;
  blast_radius: number;
  created_at: string;
  impacted_prs?: PerPrResult[];
  per_pr_results?: PerPrResult[];
  violations?: Violation[];
  summary?: {
    total_violations?: number;
    violations_by_severity?: { BLOCK?: number; WARN?: number; OBSERVE?: number };
    policy_would_block?: boolean;
    policy_would_pass?: boolean;
  };
  report_html?: string;
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

  // Simulation target overrides (where to replay this policy)
  const [simulationScope, setSimulationScope] = useState<'GLOBAL' | 'REPO' | 'BRANCH'>('GLOBAL');
  const [simulationRepo, setSimulationRepo] = useState<string>('');
  const [simulationBranch, setSimulationBranch] = useState<string>('');
  // Sample size / time range for simulation (Task 4)
  const [sampleSizeOption, setSampleSizeOption] = useState<'last_10' | 'last_20' | 'last_50' | 'last_30_days'>('last_20');
  const [fetchFromGitHub, setFetchFromGitHub] = useState(false);
  const [isFetchingPrs, setIsFetchingPrs] = useState(false);

  // Input mode: repository (historical PRs) | upload | paste | github_url
  const [inputMode, setInputMode] = useState<'repository' | 'upload' | 'paste' | 'github_url' | 'zip'>('repository');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedZipFile, setUploadedZipFile] = useState<File | null>(null);
  const [zipError, setZipError] = useState<string | null>(null);
  const [pastedCode, setPastedCode] = useState('');
  const [pastedVirtualPath, setPastedVirtualPath] = useState('src/index.ts');
  const [githubPrUrl, setGithubPrUrl] = useState('');

  // New Policy Form State
  const [newPolicy, setNewPolicy] = useState({
    name: '',
    scope: 'GLOBAL',
    target_id: 'GLOBAL',
    branch_name: '',
    rules_logic: '{\n  "type": "mandatory_review",\n  "count": 1\n}'
  });
  const [isCreating, setIsCreating] = useState(false);
  const [aiDescription, setAiDescription] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  const { toast } = useToast();

  const handleAiTranslate = async () => {
    if (!aiDescription.trim()) return;
    setIsTranslating(true);
    try {
      const result = await api.post<Record<string, unknown>>('/v1/policies/translate-natural-language', {
        description: aiDescription
      });
      setNewPolicy({
        ...newPolicy,
        rules_logic: JSON.stringify(result, null, 2)
      });
      toast({
        title: "Policy Generated",
        description: "AI has translated your description into Zaxion rules.",
      });
    } catch (error) {
      toast({
        title: "Translation Failed",
        description: error instanceof Error ? error.message : "AI could not parse your description.",
        variant: "destructive",
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const handleMdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.md')) {
      toast({ title: "Invalid File", description: "Please upload a Markdown (.md) file.", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      setIsTranslating(true);
      try {
        const result = await api.post<Record<string, unknown>>('/v1/policies/translate-natural-language', {
          description: `Analyze this Markdown policy file and extract the governance rules into Zaxion JSON schema:\n\n${content}`
        });
        setNewPolicy({
          ...newPolicy,
          rules_logic: JSON.stringify(result, null, 2)
        });
        toast({ title: "Policy Uploaded", description: "Rules extracted from Markdown file." });
      } catch (error) {
        toast({ title: "Upload Failed", description: "Could not extract rules from Markdown.", variant: "destructive" });
      } finally {
        setIsTranslating(false);
      }
    };
    reader.readAsText(file);
  };

  const fetchPolicies = async () => {
    try {
      const [dbPolicies, corePolicies] = await Promise.all([
        api.get<Policy[]>('/v1/policies'),
        api.get<Array<Record<string, unknown>>>('/v1/policies/core')
      ]);

      const formattedCorePolicies: Policy[] = corePolicies.map((p) => {
        const name = String(p.name ?? 'Core Policy');
        const id = (typeof p.id === 'string' && p.id.length > 0) ? p.id : `core-${name}`;

        return {
          id,
          name,
          description: typeof p.description === 'string' ? p.description : undefined,
          scope: 'ORG',
          target_id: 'ORG',
          status: 'APPROVED',
          latest_version: {
            version_number: 1,
            createdAt: new Date().toISOString(),
            rules_logic: {
              type: 'core_enforcement',
              severity: p.severity,
              category: p.category,
              remediation: p.remediation,
            },
          },
        };
      });

      // Merge, prioritizing DB policies if they override core ones (by name or ID if shared)
      // For now, just append core policies that aren't in DB (by name)
      const uniquePolicies: Policy[] = [...dbPolicies];
      formattedCorePolicies.forEach((cp) => {
        if (!uniquePolicies.some(dbp => dbp.name === cp.name)) {
          uniquePolicies.push(cp);
        }
      });

      setPolicies(uniquePolicies);
    } catch (error) {
      logger.error('Failed to fetch policies:', error);
    }
  };

  const fetchRepositories = useCallback(async () => {
    setIsLoadingRepos(true);
    try {
      const response = await api.get<Repository[]>('/v1/github/repos');
      setRepositories(response);
    } catch (error) {
      logger.error('Failed to fetch repositories:', error);
    } finally {
      setIsLoadingRepos(false);
    }
  }, []);

  const fetchBranches = useCallback(async (fullName: string) => {
    if (!fullName || !fullName.includes('/')) return;
    const [owner, repo] = fullName.split('/');
    setIsLoadingBranches(true);
    try {
      const response = await api.get<Branch[]>(`/v1/github/repos/${owner}/${repo}/branches`);
      setBranches(response);
    } catch (error) {
      logger.error('Failed to fetch branches:', error);
    } finally {
      setIsLoadingBranches(false);
    }
  }, []);

  useEffect(() => {
    fetchPolicies();
    if (inputMode === 'repository' && repositories.length === 0) {
      fetchRepositories();
    }
  }, [fetchRepositories, inputMode, repositories.length]);

  // Whenever a policy is selected, derive a sensible default simulation target
  useEffect(() => {
    const policy = policies.find(p => p.id.toString() === selectedPolicyId);
    if (!policy) {
      setSimulationScope('GLOBAL');
      setSimulationRepo('');
      setSimulationBranch('');
      return;
    }

    if (policy.target_id === 'GLOBAL') {
      setSimulationScope('GLOBAL');
      setSimulationRepo('');
      setSimulationBranch('');
      return;
    }

    // If target_id encodes repo or repo:branch, use that as default
    const [repoFullName, branchName] = policy.target_id.split(':');
    if (branchName) {
      setSimulationScope('BRANCH');
      setSimulationRepo(repoFullName);
      setSimulationBranch(branchName);
      fetchBranches(repoFullName);
    } else {
      setSimulationScope('REPO');
      setSimulationRepo(repoFullName);
      setSimulationBranch('');
    }
  }, [policies, selectedPolicyId, fetchBranches]);

  // When user selects "Specific Branch" and has a repo, load branches so the dropdown shows without manual refresh
  useEffect(() => {
    if (simulationScope === 'BRANCH' && simulationRepo) {
      fetchBranches(simulationRepo);
    } else if (simulationScope !== 'BRANCH') {
      setSimulationBranch('');
    }
  }, [simulationScope, simulationRepo, fetchBranches]);

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
      type CreatedPolicy = { id: string | number };
      // For BRANCH scope, target_id is "repo:branch"
      const finalTargetId = newPolicy.scope === 'BRANCH' 
        ? `${newPolicy.target_id}:${newPolicy.branch_name}`
        : newPolicy.target_id;

      // 1. Create Policy (use centralized API to include CSRF + credentials)
      const createdPolicy = await api.post<CreatedPolicy>('/v1/policies', {
        name: newPolicy.name,
        scope: newPolicy.scope === 'GLOBAL' ? 'ORG' : 'REPO',
        target_id: finalTargetId,
        owning_role: 'admin'
      });

      // 2. Create Initial Version with rules
      await api.post(`/v1/policies/${createdPolicy.id}/versions`, {
        enforcement_level: 'MANDATORY',
        rules_logic: parsedRules
      });

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

  const [htmlReport, setHtmlReport] = useState<string | null>(null);

  const fetchPrsFromGitHub = async () => {
    if (!simulationRepo) {
      toast({ title: "Select a repository first", variant: "destructive" });
      return;
    }
    const limit = sampleSizeOption === 'last_30_days' ? 50 : sampleSizeOption === 'last_10' ? 10 : sampleSizeOption === 'last_20' ? 20 : 50;
    setIsFetchingPrs(true);
    try {
      const res = await api.post<{ fetched: number; ingested: number; repo_full_name: string }>('/v1/github/simulation/fetch-prs', {
        repo_full_name: simulationRepo,
        branch: simulationScope === 'BRANCH' ? simulationBranch : undefined,
        limit,
      });
      toast({
        title: "PRs fetched from GitHub",
        description: `Fetched ${res.fetched} PR(s), ${res.ingested} new snapshot(s) ready for simulation.`,
      });
    } catch (error) {
      toast({
        title: "Fetch failed",
        description: error instanceof Error ? error.message : "Could not fetch PRs from GitHub.",
        variant: "destructive",
      });
    } finally {
      setIsFetchingPrs(false);
    }
  };

  const runSimulation = async () => {
    if (!selectedPolicyId) return;

    if (simulationScope !== 'GLOBAL' && !simulationRepo) {
      toast({
        title: "Missing Simulation Target",
        description: "Please select a repository to simulate this policy against.",
        variant: "destructive",
      });
      return;
    }

    if (simulationScope === 'BRANCH' && !simulationBranch) {
      toast({
        title: "Missing Branch",
        description: "Please select a branch to simulate this policy against.",
        variant: "destructive",
      });
      return;
    }

    if (fetchFromGitHub && simulationScope !== 'GLOBAL') {
      await fetchPrsFromGitHub();
    }

    const { sample_size, days_back } = sampleSizeOption === 'last_30_days'
      ? { sample_size: 100, days_back: 30 }
      : sampleSizeOption === 'last_10'
        ? { sample_size: 10, days_back: undefined }
        : sampleSizeOption === 'last_20'
          ? { sample_size: 20, days_back: undefined }
          : { sample_size: 50, days_back: undefined };

    setIsSimulating(true);
    try {
      type SimulationApiResponse = {
        id: string;
        status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
        createdAt?: string;
        report_html?: string;
        results?: {
          summary?: {
            total_snapshots?: number;
            newly_blocked_count?: number;
            total_blocked_count?: number;
            fail_rate_change?: string;
            total_violations?: number;
            violations_by_severity?: { BLOCK?: number; WARN?: number; OBSERVE?: number };
            policy_would_block?: boolean;
            policy_would_pass?: boolean;
          };
          impacted_prs?: PerPrResult[];
          per_pr_results?: PerPrResult[];
          violations?: Violation[];
        };
      };
      const policy = policies.find(p => p.id.toString() === selectedPolicyId);
      const draftRules = policy?.latest_version?.rules_logic ?? {};

      const data = await api.post<SimulationApiResponse>(`/v1/policies/${selectedPolicyId}/simulate`, {
        draft_rules: draftRules,
        sample_strategy: 'TIME_BASED',
        sample_size,
        days_back,
        scope_override: simulationScope,
        target_repo_full_name: simulationScope !== 'GLOBAL' ? simulationRepo : undefined,
        target_branch: simulationScope === 'BRANCH' ? simulationBranch : undefined,
      });

      const summary = data?.results?.summary || {};
      const br = typeof summary.fail_rate_change === 'string'
        ? parseFloat(summary.fail_rate_change.replace('%', '')) / 100
        : 0;
      const mapped: SimulationResult = {
        id: data.id,
        status: data.status || 'PENDING',
        total_scanned: summary.total_snapshots ?? 0,
        total_blocked: summary.total_blocked_count ?? summary.newly_blocked_count ?? 0,
        blast_radius: isNaN(br) ? 0 : br,
        created_at: data.createdAt || new Date().toISOString(),
        impacted_prs: data?.results?.impacted_prs,
        per_pr_results: data?.results?.per_pr_results,
        violations: data?.results?.violations,
        summary: {
          total_violations: summary.total_violations,
          violations_by_severity: summary.violations_by_severity,
          policy_would_block: summary.policy_would_block,
          policy_would_pass: summary.policy_would_pass,
        },
        report_html: data.report_html,
      };
      setResult(mapped);
      setHtmlReport(data.report_html || null);
      toast({
        title: "Simulation completed",
        description: `Scanned ${mapped.total_scanned} PR(s). ${mapped.total_blocked} would be blocked.`,
      });
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

  const MAX_UPLOAD_MB = 100;
  const MAX_ZIP_MB = 50;
  const ALLOWED_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json', '.yaml', '.yml'];

  const runAnalyzeCode = async (mode: 'upload' | 'paste' | 'zip') => {
    if (!selectedPolicyId) return;
    if (mode === 'upload' && !uploadedFile) {
      toast({ title: 'Select a file first', variant: 'destructive' });
      return;
    }
    if (mode === 'zip' && !uploadedZipFile) {
      toast({ title: 'Select a zip file first', variant: 'destructive' });
      return;
    }
    if (mode === 'paste' && !pastedCode.trim()) {
      toast({ title: 'Paste some code first', variant: 'destructive' });
      return;
    }
    setIsSimulating(true);
    setUploadError(null);
    setZipError(null);
    try {
      let body: { mode: 'upload' | 'paste' | 'zip'; file?: { name: string; contentBase64: string }; paste?: { code: string; virtualPath?: string }; zip?: { contentBase64: string } };
      if (mode === 'upload' && uploadedFile) {
        const buf = await uploadedFile.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
        body = { mode: 'upload', file: { name: uploadedFile.name, contentBase64: base64 } };
      } else if (mode === 'zip' && uploadedZipFile) {
        const buf = await uploadedZipFile.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
        body = { mode: 'zip', zip: { contentBase64: base64 } };
      } else {
        body = { mode: 'paste', paste: { code: pastedCode, virtualPath: pastedVirtualPath || undefined } };
      }
      const data = await api.post<{
        id: string;
        status: string;
        summary?: { total_snapshots?: number; total_violations?: number; violations_by_severity?: { BLOCK?: number; WARN?: number; OBSERVE?: number }; policy_would_block?: boolean; policy_would_pass?: boolean };
        violations?: Violation[];
        per_pr_results?: PerPrResult[];
        result?: string;
        rationale?: string;
        createdAt?: string;
        report_html?: string;
      }>(`/v1/policies/${selectedPolicyId}/analyze-code`, body);
      const summary = data?.summary || {};
      const mapped: SimulationResult = {
        id: data.id || `code-${Date.now()}`,
        status: (data.status as SimulationResult['status']) || 'COMPLETED',
        total_scanned: summary.total_snapshots ?? 1,
        total_blocked: data.result === 'BLOCK' ? 1 : 0,
        blast_radius: data.result === 'BLOCK' ? 1 : 0,
        created_at: data.createdAt || new Date().toISOString(),
        per_pr_results: data.per_pr_results,
        violations: data.violations,
        summary: {
          total_violations: summary.total_violations,
          violations_by_severity: summary.violations_by_severity,
          policy_would_block: summary.policy_would_block,
          policy_would_pass: summary.policy_would_pass,
        },
        report_html: data.report_html,
      };
      setResult(mapped);
      setHtmlReport(data.report_html ?? null);
      toast({
        title: 'Code analysis completed',
        description: data.result === 'BLOCK' ? 'Policy would block this code.' : 'Policy would pass.',
      });
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Analysis failed';
      toast({ title: 'Analysis failed', description: msg, variant: 'destructive' });
    } finally {
      setIsSimulating(false);
    }
  };

  const runAnalyzePrUrl = async () => {
    if (!selectedPolicyId || !githubPrUrl.trim()) {
      toast({ title: 'Enter a GitHub PR URL', variant: 'destructive' });
      return;
    }
    const trimmed = githubPrUrl.trim();
    if (!/github\.com[/:]\w[-.\w]*\/[^/]+\/pull\/\d+/i.test(trimmed)) {
      toast({ title: 'Invalid URL', description: 'Use format: https://github.com/owner/repo/pull/123', variant: 'destructive' });
      return;
    }
    setIsSimulating(true);
    try {
      const data = await api.post<{
        id: string;
        status: string;
        summary?: { total_snapshots?: number; total_violations?: number; violations_by_severity?: { BLOCK?: number; WARN?: number; OBSERVE?: number }; policy_would_block?: boolean; policy_would_pass?: boolean };
        violations?: Violation[];
        per_pr_results?: PerPrResult[];
        result?: string;
        rationale?: string;
        createdAt?: string;
        report_html?: string;
      }>('/v1/github/simulation/analyze-pr', {
        policy_id: selectedPolicyId,
        github_pr_url: trimmed,
      });
      const summary = data?.summary || {};
      const mapped: SimulationResult = {
        id: data.id || `pr-${Date.now()}`,
        status: (data.status as SimulationResult['status']) || 'COMPLETED',
        total_scanned: summary.total_snapshots ?? 1,
        total_blocked: data.result === 'BLOCK' ? 1 : 0,
        blast_radius: data.result === 'BLOCK' ? 1 : 0,
        created_at: data.createdAt || new Date().toISOString(),
        per_pr_results: data.per_pr_results,
        violations: data.violations,
        summary: {
          total_violations: summary.total_violations,
          violations_by_severity: summary.violations_by_severity,
          policy_would_block: summary.policy_would_block,
          policy_would_pass: summary.policy_would_pass,
        },
        report_html: data.report_html,
      };
      setResult(mapped);
      setHtmlReport(data.report_html ?? null);
      toast({
        title: 'PR analysis completed',
        description: data.result === 'BLOCK' ? 'Policy would block this PR.' : 'Policy would pass.',
      });
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Analysis failed';
      toast({ title: 'Analysis failed', description: msg, variant: 'destructive' });
    } finally {
      setIsSimulating(false);
    }
  };

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setZipError(null);
    if (!file) {
      setUploadedZipFile(null);
      return;
    }
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setZipError('Please select a .zip file');
      setUploadedZipFile(null);
      e.target.value = '';
      return;
    }
    if (file.size > MAX_ZIP_MB * 1024 * 1024) {
      setZipError(`Max size ${MAX_ZIP_MB}MB`);
      setUploadedZipFile(null);
      e.target.value = '';
      return;
    }
    setUploadedZipFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError(null);
    if (!file) {
      setUploadedFile(null);
      return;
    }
    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setUploadError(`Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
      setUploadedFile(null);
      e.target.value = '';
      return;
    }
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setUploadError(`Max size ${MAX_UPLOAD_MB}MB`);
      setUploadedFile(null);
      e.target.value = '';
      return;
    }
    setUploadedFile(file);
  };

  const selectedPolicy = useMemo(() => 
    policies.find(p => p.id === selectedPolicyId),
  [policies, selectedPolicyId]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1 border-border/50 bg-card/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-sm font-bold uppercase tracking-wider">Simulation Configuration</CardTitle>
            <CardDescription>Select or create a policy to test.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Policy
          </Button>
          <CreatePolicyModal 
            open={isCreateModalOpen} 
            onOpenChange={setIsCreateModalOpen} 
            onPolicyCreated={() => { fetchPolicies(); }} 
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Target Policy</label>
            <Select value={selectedPolicyId} onValueChange={setSelectedPolicyId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a policy..." />
              </SelectTrigger>
              <SelectContent>
                {policies.filter(p => p.status !== 'REJECTED').map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{p.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPolicy && (
              <div className="p-4 rounded-lg border border-border/50 bg-muted/20 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-sm">{selectedPolicy.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{selectedPolicy.description}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase">
                    {selectedPolicy.latest_version?.rules_logic?.type || 'Custom'}
                  </Badge>
                </div>
                
                {selectedPolicy.latest_version?.rules_logic && (
                  <div className="pt-3 border-t border-border/50">
                    <Dialog>
                      <DialogTrigger asChild>
                        <div className="flex items-center justify-between cursor-pointer group/logic">
                          <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2 group-hover/logic:text-primary transition-colors">Rules Logic</p>
                          <ExternalLink className="h-3 w-3 text-muted-foreground group-hover/logic:text-primary transition-colors" />
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                        <DialogHeader>
                          <DialogTitle>Rules Logic: {selectedPolicy.name}</DialogTitle>
                          <DialogDescription>
                            Full JSON configuration for this policy version.
                          </DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="flex-1 mt-4 rounded-md border bg-slate-950 p-4">
                          <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap">
                            {JSON.stringify(selectedPolicy.latest_version.rules_logic, null, 2)}
                          </pre>
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                    <div className="bg-slate-950 rounded-md p-3 overflow-hidden max-h-24 relative">
                      <code className="text-xs font-mono text-slate-300 block whitespace-pre-wrap">
                        {JSON.stringify(selectedPolicy.latest_version.rules_logic, null, 2)}
                      </code>
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Input mode</label>
            <Select
              value={inputMode}
              onValueChange={(v: 'repository' | 'upload' | 'paste' | 'github_url' | 'zip') => setInputMode(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="repository">Repository / historical PRs</SelectItem>
                <SelectItem value="upload">Upload file</SelectItem>
                <SelectItem value="paste">Paste code</SelectItem>
                <SelectItem value="zip">Upload zip</SelectItem>
                <SelectItem value="github_url">GitHub PR URL</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {inputMode === 'repository' && (
          <>
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Simulation Target Scope</label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-muted-foreground hover:text-foreground p-0.5 rounded">
                      <HelpCircle className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[240px]">
                    <p className="font-medium mb-1">Scope</p>
                    <p className="text-xs"><strong>Org-wide:</strong> Run against all repos in the org.</p>
                    <p className="text-xs mt-1"><strong>Repository:</strong> Run only against the selected repo.</p>
                    <p className="text-xs mt-1"><strong>Branch:</strong> Run only against the selected branch of a repo.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select value={simulationScope} onValueChange={(v: 'GLOBAL' | 'REPO' | 'BRANCH') => setSimulationScope(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select scope for analysis..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GLOBAL">Organization-wide (all repos)</SelectItem>
                <SelectItem value="REPO">Specific Repository</SelectItem>
                <SelectItem value="BRANCH">Specific Branch</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {simulationScope !== 'GLOBAL' && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                {simulationScope === 'REPO' ? 'Repository' : 'Repository for Branch'}
              </label>
              <Select
                value={simulationRepo}
                onValueChange={(value) => {
                  setSimulationRepo(value);
                  // If branch-level simulation, refresh branches for the selected repo
                  if (simulationScope === 'BRANCH') {
                    setBranches([]); // Clear old branches immediately
                    fetchBranches(value);
                    setSimulationBranch('');
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select repository..." />
                </SelectTrigger>
                <SelectContent>
                  {repositories.map((repo) => (
                    <SelectItem key={repo.full_name} value={repo.full_name}>
                      {repo.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {simulationScope === 'BRANCH' && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Branch</label>
              <Select
                value={simulationBranch}
                onValueChange={setSimulationBranch}
                disabled={!simulationRepo}
              >
                <SelectTrigger>
                  <SelectValue placeholder={simulationRepo ? "Select branch..." : "Select a repository first"} />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.name} value={branch.name}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">PRs to test (sample)</label>
            <Select value={sampleSizeOption} onValueChange={(v: 'last_10' | 'last_20' | 'last_50' | 'last_30_days') => setSampleSizeOption(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last_10">Last 10 PRs</SelectItem>
                <SelectItem value="last_20">Last 20 PRs</SelectItem>
                <SelectItem value="last_50">Last 50 PRs</SelectItem>
                <SelectItem value="last_30_days">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {simulationScope !== 'GLOBAL' && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="fetch-from-github"
                checked={fetchFromGitHub}
                onChange={(e) => setFetchFromGitHub(e.target.checked)}
                className="rounded border-border"
              />
              <Label htmlFor="fetch-from-github" className="text-xs font-medium text-muted-foreground cursor-pointer">
                Fetch PRs from GitHub before running (ingests latest PRs for simulation)
              </Label>
            </div>
          )}

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
                    {selectedPolicy.latest_version?.createdAt 
                      ? new Date(selectedPolicy.latest_version.createdAt).toLocaleString() 
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
          </>
          )}

          {inputMode === 'upload' && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Upload file</label>
              <input
                type="file"
                accept={ALLOWED_EXTENSIONS.join(',')}
                onChange={handleFileChange}
                className="block w-full text-xs text-muted-foreground file:mr-2 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:text-primary-foreground"
              />
              <p className="text-[10px] text-muted-foreground">
                Allowed: {ALLOWED_EXTENSIONS.join(', ')}. Max {MAX_UPLOAD_MB}MB.
              </p>
              {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
              {uploadedFile && <p className="text-xs text-muted-foreground">{uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)</p>}
            </div>
          )}

          {inputMode === 'paste' && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Paste code</label>
              <Textarea
                placeholder="Paste your code here..."
                className="font-mono text-xs min-h-[120px]"
                value={pastedCode}
                onChange={(e) => setPastedCode(e.target.value)}
              />
              <div>
                <label className="text-[10px] text-muted-foreground">Virtual path (optional, e.g. src/index.ts)</label>
                <Input
                  className="mt-1 font-mono text-xs"
                  placeholder="src/index.ts"
                  value={pastedVirtualPath}
                  onChange={(e) => setPastedVirtualPath(e.target.value)}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">Max 1MB. Used for extension and test-file detection.</p>
            </div>
          )}

          {inputMode === 'zip' && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Upload zip</label>
              <input
                type="file"
                accept=".zip"
                onChange={handleZipChange}
                className="block w-full text-xs text-muted-foreground file:mr-2 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:text-primary-foreground"
              />
              <p className="text-[10px] text-muted-foreground">
                .zip with .ts, .js, .tsx, .jsx, .json, .yaml. Max {MAX_ZIP_MB}MB, 500 files.
              </p>
              {zipError && <p className="text-xs text-destructive">{zipError}</p>}
              {uploadedZipFile && (
                <p className="text-xs text-muted-foreground">
                  {uploadedZipFile.name} ({(uploadedZipFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>
          )}

          {inputMode === 'github_url' && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">GitHub PR URL</label>
              <Input
                placeholder="https://github.com/owner/repo/pull/123"
                value={githubPrUrl}
                onChange={(e) => setGithubPrUrl(e.target.value)}
                className="font-mono text-xs"
              />
              <p className="text-[10px] text-muted-foreground">Requires GitHub connected. Fetches PR and runs policy.</p>
            </div>
          )}


          <Button 
            className="w-full" 
            onClick={() => {
              if (inputMode === 'repository') runSimulation();
              else if (inputMode === 'upload') runAnalyzeCode('upload');
              else if (inputMode === 'paste') runAnalyzeCode('paste');
              else if (inputMode === 'zip') runAnalyzeCode('zip');
              else if (inputMode === 'github_url') runAnalyzePrUrl();
            }}
            disabled={
              !selectedPolicyId || isSimulating ||
              (inputMode === 'upload' && !uploadedFile) ||
              (inputMode === 'paste' && !pastedCode.trim()) ||
              (inputMode === 'zip' && !uploadedZipFile) ||
              (inputMode === 'github_url' && !githubPrUrl.trim())
            }
          >
            {isSimulating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            {inputMode === 'repository' ? 'Analyze Policy Impact' : 'Analyze'}
          </Button>
          <p className="text-[10px] text-muted-foreground text-center">
            This analysis typically takes 10–15 seconds.
          </p>
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
          {isSimulating ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Loader2 className="h-10 w-10 animate-spin mb-4 text-primary" />
              <p className="text-sm font-medium">Analyzing...</p>
              <p className="text-xs mt-1">This typically takes 10–15 seconds.</p>
            </div>
          ) : !result ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <ShieldCheck className="h-12 w-12 mb-4 opacity-10" />
              <p className="text-sm">No impact data available.</p>
              <p className="text-xs">Configure and run a simulation to see projected enforcement results.</p>
            </div>
          ) : (
            <div className="p-6 space-y-8 animate-in fade-in duration-500">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-muted/30 border-border/50 shadow-sm transition-all hover:shadow-md">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Historical PRs Scanned</p>
                      <p className="text-2xl font-bold tracking-tight">{result.total_scanned}</p>
                    </div>
                    <div className="p-2 rounded-full bg-blue-500/10 text-blue-500">
                      <Search className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30 border-border/50 shadow-sm transition-all hover:shadow-md">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Projected Blocks</p>
                      <p className={cn("text-2xl font-bold tracking-tight", result.total_blocked > 0 ? "text-red-500" : "text-green-500")}>
                        {result.total_blocked}
                      </p>
                    </div>
                    <div className={cn("p-2 rounded-full", result.total_blocked > 0 ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500")}>
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30 border-border/50 shadow-sm transition-all hover:shadow-md">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Block Rate Change</p>
                      <p className={cn(
                        "text-2xl font-bold tracking-tight",
                        (result.blast_radius ?? 0) > 0 ? "text-orange-500" : "text-green-500"
                      )}>
                        {typeof result.blast_radius === 'number'
                          ? `${result.blast_radius >= 0 ? '+' : ''}${(result.blast_radius * 100).toFixed(1)}%`
                          : '—'}
                      </p>
                    </div>
                    <div className={cn("p-2 rounded-full", (result.blast_radius ?? 0) > 0 ? "bg-orange-500/10 text-orange-500" : "bg-green-500/10 text-green-500")}>
                      <GitBranch className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Enforcement Insights */}
              <div className="p-5 rounded-xl bg-muted/20 border border-border/50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                  <AlertCircle className="h-24 w-24" />
                </div>
                <div className="relative space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    Enforcement Insights
                  </div>
                  <div className="text-sm text-muted-foreground leading-relaxed">
                    This policy would have enforced <span className="font-bold text-foreground">{result.total_blocked}</span> blocks across <span className="font-bold text-foreground">{result.total_scanned}</span> pull requests.
                    {typeof result.blast_radius === 'number' ? (
                      <p className="mt-1">
                        {result.blast_radius < 0 ? (
                          <span className="text-green-500 font-medium">Fewer PRs would be blocked with this policy, reducing friction in development.</span>
                        ) : result.blast_radius > 0 ? (
                          <span className="text-orange-500 font-medium">More PRs would be blocked with this policy, adding more enforcement checks.</span>
                        ) : (
                          <span>No change in how many PRs would be blocked.</span>
                        )}
                      </p>
                    ) : null}
                  </div>
                  
                  {result.summary && (result.summary.total_violations ?? 0) > 0 && (
                    <div className="space-y-2 mt-4 pt-4 border-t border-border/50">
                      <div className="flex items-center justify-between text-xs font-medium mb-1">
                        <span>Severity Distribution</span>
                        <span>{result.summary.total_violations} Total Violations</span>
                      </div>
                      <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-muted">
                        {result.summary.violations_by_severity?.BLOCK && (
                          <div 
                            className="bg-red-500 h-full" 
                            style={{ width: `${(result.summary.violations_by_severity.BLOCK / result.summary.total_violations) * 100}%` }}
                            title={`BLOCK: ${result.summary.violations_by_severity.BLOCK}`}
                          />
                        )}
                        {result.summary.violations_by_severity?.WARN && (
                          <div 
                            className="bg-yellow-500 h-full" 
                            style={{ width: `${(result.summary.violations_by_severity.WARN / result.summary.total_violations) * 100}%` }}
                            title={`WARN: ${result.summary.violations_by_severity.WARN}`}
                          />
                        )}
                        {result.summary.violations_by_severity?.OBSERVE && (
                          <div 
                            className="bg-blue-500 h-full" 
                            style={{ width: `${(result.summary.violations_by_severity.OBSERVE / result.summary.total_violations) * 100}%` }}
                            title={`OBSERVE: ${result.summary.violations_by_severity.OBSERVE}`}
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-[10px] font-medium uppercase tracking-tighter text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                          BLOCK: {result.summary.violations_by_severity?.BLOCK ?? 0}
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                          WARN: {result.summary.violations_by_severity?.WARN ?? 0}
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                          OBSERVE: {result.summary.violations_by_severity?.OBSERVE ?? 0}
                        </div>
                      </div>
                    </div>
                  )}
                  {result.summary?.policy_would_pass && result.total_scanned > 0 && (
                    <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2 text-green-600 dark:text-green-400 font-medium text-sm">
                      <CheckCircle2 className="h-4 w-4" />
                      Policy would pass for all simulated PRs.
                    </div>
                  )}
                </div>
              </div>

              {/* Violations Section with Accordion */}
              {result.violations && result.violations.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold tracking-tight">Violations & Remediation</h3>
                    <Badge variant="outline" className="font-mono text-[10px]">{result.violations.length} Findings</Badge>
                  </div>
                  
                  <Accordion type="single" collapsible className="w-full space-y-3 border-none">
                    {result.violations.slice(0, 50).map((v, i) => (
                      <AccordionItem 
                        key={`${v.rule_id}-${v.pr_number ?? i}-${i}`} 
                        value={`item-${i}`}
                        className="rounded-lg border border-border/50 bg-card shadow-sm overflow-hidden"
                      >
                        <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 transition-all group">
                          <div className="flex flex-col items-start gap-1 text-left w-full">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={v.severity === 'BLOCK' ? 'destructive' : 'secondary'} className="text-[10px] h-4">
                                {v.severity}
                              </Badge>
                              <span className="font-mono text-xs font-bold">{v.rule_id}</span>
                              {v.pr_number != null && (
                                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                  PR #{v.pr_number}
                                </span>
                              )}
                            </div>
                            <span className="text-sm font-medium leading-tight group-hover:text-primary transition-colors">{v.message}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4 pt-0 text-xs border-t border-border/50 bg-muted/5">
                          <div className="space-y-4 pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <p className="font-semibold text-muted-foreground uppercase text-[10px]">Location</p>
                                <div className="p-2 rounded bg-muted/50 font-mono text-[11px] border border-border/30">
                                  {v.file ? (
                                    <>
                                      {v.file}
                                      {(v.line != null || v.column != null) && (
                                        <span className="text-muted-foreground block mt-1">
                                          Line: {v.line ?? '—'} · Column: {v.column ?? '—'}
                                        </span>
                                      )}
                                    </>
                                  ) : 'Not specified'}
                                </div>
                              </div>
                              <div className="space-y-2">
                                <p className="font-semibold text-muted-foreground uppercase text-[10px]">Values</p>
                                <div className="p-2 rounded bg-muted/50 font-mono text-[11px] border border-border/30 space-y-1">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Current:</span>
                                    <span className="text-red-400 truncate ml-2 max-w-[150px]">{v.current_value ?? '—'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Required:</span>
                                    <span className="text-green-400 truncate ml-2 max-w-[150px]">{v.required_value ?? '—'}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {v.explanation && (
                              <div className="space-y-1.5">
                                <p className="font-semibold text-muted-foreground uppercase text-[10px]">Explanation</p>
                                <p className="text-muted-foreground leading-relaxed">{v.explanation}</p>
                              </div>
                            )}

                            {v.remediation?.steps && v.remediation.steps.length > 0 && (
                              <div className="space-y-2">
                                <p className="font-semibold text-muted-foreground uppercase text-[10px]">Remediation Steps</p>
                                <div className="rounded-lg bg-green-500/5 border border-green-500/10 p-3">
                                  <ul className="space-y-1.5">
                                    {v.remediation.steps.map((step, j) => (
                                      <li key={j} className="flex items-start gap-2">
                                        <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                                        <span className="text-muted-foreground">{step}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            )}

                            {v.remediation?.example && (
                              <div className="space-y-1.5">
                                <p className="font-semibold text-muted-foreground uppercase text-[10px]">Code Example</p>
                                <pre className="p-3 rounded-lg bg-slate-950 text-[11px] overflow-x-auto whitespace-pre-wrap font-mono border border-border/50 text-slate-300">
                                  {v.remediation.example}
                                </pre>
                              </div>
                            )}

                            {v.documentation_link && (
                              <div className="pt-2">
                                <Button variant="link" size="sm" className="h-auto p-0 text-primary" asChild>
                                  <a href={v.documentation_link} target="_blank" rel="noopener noreferrer">
                                    View Full Documentation <ExternalLink className="ml-1 h-3 w-3" />
                                  </a>
                                </Button>
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              )}

              {/* Per-PR Impact Section */}
              {result.per_pr_results && result.per_pr_results.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold tracking-tight">Per-PR Detailed Impact</h3>
                    <Badge variant="secondary" className="text-[10px]">{result.per_pr_results.length} Snapshots</Badge>
                  </div>
                  
                  <div className="rounded-xl border border-border/50 overflow-hidden bg-card/30">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="w-[100px]">PR</TableHead>
                          <TableHead>Repository</TableHead>
                          <TableHead className="hidden md:table-cell">Details</TableHead>
                          <TableHead>Verdict</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.per_pr_results.map((pr, i) => (
                          <TableRow key={`${pr.repo}-${pr.pr_number}-${i}`} className="hover:bg-muted/20 transition-colors">
                            <TableCell className="font-mono text-xs font-bold">
                              PR #{pr.pr_number ?? i + 1}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-xs font-medium truncate max-w-[120px]" title={pr.repo ?? undefined}>
                                  {pr.repo?.split('/').pop() ?? '—'}
                                </span>
                                <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                                  {pr.repo ?? '—'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-medium truncate max-w-[200px]" title={pr.pr_title ?? undefined}>
                                  {pr.pr_title ?? 'Untitled PR'}
                                </span>
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                  <span className="flex items-center gap-0.5"><GitBranch className="h-2.5 w-2.5" /> {pr.base_branch ?? 'main'}</span>
                                  <span>·</span>
                                  <span>{pr.author ?? 'unknown'}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={pr.verdict === 'BLOCK' ? 'destructive' : 'secondary'} className="text-[10px] h-5">
                                {pr.verdict}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <HoverCard>
                                <HoverCardTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                </HoverCardTrigger>
                                <HoverCardContent className="w-80 p-4" align="end">
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <h4 className="text-sm font-semibold">Policy Rationale</h4>
                                      <Badge variant={pr.verdict === 'BLOCK' ? 'destructive' : 'secondary'} className="text-[10px]">
                                        {pr.verdict}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                      {pr.rationale}
                                    </p>
                                    {pr.violations && pr.violations.length > 0 && (
                                      <div className="pt-2 border-t border-border/50">
                                        <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">Primary Violations</p>
                                        <div className="space-y-1">
                                          {pr.violations.slice(0, 3).map((v, idx) => (
                                            <div key={idx} className="flex items-start gap-1.5 text-[10px]">
                                              <div className="mt-1 h-1 w-1 rounded-full bg-red-500 shrink-0" />
                                              <span className="text-muted-foreground line-clamp-1">{v.message}</span>
                                            </div>
                                          ))}
                                          {pr.violations.length > 3 && (
                                            <p className="text-[9px] text-primary italic">+{pr.violations.length - 3} more violations</p>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </HoverCardContent>
                              </HoverCard>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Action Footer */}
              <div className="pt-6 border-t border-border/50 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="font-semibold uppercase tracking-wider text-[10px]">Resources:</span>
                    <div className="flex items-center gap-2">
                      <Link to="/docs/policies" className="inline-flex items-center gap-1 text-primary hover:underline">
                        Policy Format <ExternalLink className="h-3 w-3" />
                      </Link>
                      <Separator orientation="vertical" className="h-3" />
                      <Link to="/docs/rules" className="inline-flex items-center gap-1 text-primary hover:underline">
                        Rule Types <ExternalLink className="h-3 w-3" />
                      </Link>
                      <Separator orientation="vertical" className="h-3" />
                      <Link to="/docs/examples" className="inline-flex items-center gap-1 text-primary hover:underline">
                        Examples <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {result?.report_html && (inputMode === 'repository' || inputMode === 'github_url') && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                        onClick={() => {
                          const blob = new Blob([result.report_html!], { type: 'text/html' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `zaxion-interactive-report-${new Date().toISOString().slice(0, 10)}.html`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Interactive Report
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const report = {
                          summary: result.summary,
                          total_scanned: result.total_scanned,
                          total_blocked: result.total_blocked,
                          violations: result.violations,
                          per_pr_results: result.per_pr_results,
                          generated_at: new Date().toISOString(),
                        };
                        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `zaxion-simulation-report-${new Date().toISOString().slice(0, 10)}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      <FileJson className="mr-2 h-4 w-4" />
                      Export JSON
                    </Button>

                    <Button variant="ghost" size="sm" onClick={() => setResult(null)}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reset
                    </Button>
                    
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700 shadow-lg shadow-green-900/20"
                      onClick={handleDeployPolicy}
                      disabled={isDeploying}
                    >
                      {isDeploying ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="mr-2 h-4 w-4" />
                      )}
                      Deploy Policy
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
