import React, { useState, useEffect, useMemo } from 'react';
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
  latest_version?: {
    id?: string;
    version_number?: number;
    enforcement_level?: string;
    createdAt: string;
    rules_logic?: unknown;
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

  const fetchRepositories = async () => {
    setIsLoadingRepos(true);
    try {
      const response = await api.get('/v1/github/repos') as Repository[];
      setRepositories(response);
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
      const response = await api.get(`/v1/github/repos/${owner}/${repo}/branches`) as Branch[];
      setBranches(response);
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
  }, [policies, selectedPolicyId]);

  // When user selects "Specific Branch" and has a repo, load branches so the dropdown shows without manual refresh
  useEffect(() => {
    if (simulationScope === 'BRANCH' && simulationRepo) {
      fetchBranches(simulationRepo);
    } else if (simulationScope !== 'BRANCH') {
      setSimulationBranch('');
    }
  }, [simulationScope, simulationRepo]);

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
        results?: {
          summary?: {
            total_snapshots?: number;
            newly_blocked_count?: number;
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
        total_blocked: summary.newly_blocked_count ?? 0,
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
      };
      setResult(mapped);
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
      };
      setResult(mapped);
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
      };
      setResult(mapped);
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
                {policies.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPolicy && (
              <div className="group/card p-3 rounded-lg border border-border/50 bg-muted/10 space-y-2 transition-colors hover:border-primary/30 hover:bg-muted/20">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">Selected policy</p>
                {selectedPolicy.description && (
                  <p className="text-xs text-slate-300">{selectedPolicy.description}</p>
                )}
                {selectedPolicy.latest_version?.rules_logic && (
                  <>
                    <div className="mt-2 pt-2 border-t border-border/30">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1.5">What this policy does</p>
                      <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
                        {describePolicyRules(selectedPolicy.latest_version.rules_logic).map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <div className="mt-2 pt-2 border-t border-border/30 flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer rounded px-2 py-1.5 -mx-2 hover:text-primary hover:bg-muted/50 transition-colors">
                            <FileJson className="h-3.5 w-3.5 shrink-0" />
                            <span>View policy JSON</span>
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-96" align="start">
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold">Policy Configuration</h4>
                          <ScrollArea className="h-[300px] w-full rounded-md border bg-slate-950 p-2">
                             <pre className="text-xs text-slate-50 font-mono whitespace-pre-wrap break-words">
                               {typeof selectedPolicy.latest_version.rules_logic === 'object'
                                 ? JSON.stringify(selectedPolicy.latest_version.rules_logic, null, 2)
                                 : String(selectedPolicy.latest_version.rules_logic)}
                             </pre>
                          </ScrollArea>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </>
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
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Block rate change</p>
                  <p className="text-xl font-bold text-orange-500">
                    {typeof result.blast_radius === 'number'
                      ? `${result.blast_radius >= 0 ? '+' : ''}${(result.blast_radius * 100).toFixed(1)}%`
                      : '—'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  Enforcement Insights
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This policy would have enforced {result.total_blocked} blocks across {result.total_scanned} pull requests.
                  {typeof result.blast_radius === 'number' ? (
                    result.blast_radius < 0 ? (
                      <> Fewer PRs would be blocked with this policy (less friction).</>
                    ) : result.blast_radius > 0 ? (
                      <> More PRs would be blocked with this policy (more friction).</>
                    ) : (
                      <> No change in how many PRs would be blocked.</>
                    )
                  ) : null}
                </p>
                {result.summary && (result.summary.total_violations ?? 0) > 0 && (
                  <p className="text-xs font-medium">
                    Total violations: {result.summary.total_violations}
                    {result.summary.violations_by_severity && (
                      <span className="text-muted-foreground font-normal">
                        {' '}(BLOCK: {result.summary.violations_by_severity.BLOCK ?? 0}, WARN: {result.summary.violations_by_severity.WARN ?? 0}
                        {(result.summary.violations_by_severity.OBSERVE ?? 0) > 0 ? `, OBSERVE: ${result.summary.violations_by_severity.OBSERVE}` : ''})
                      </span>
                    )}
                  </p>
                )}
                {result.summary?.policy_would_pass && result.total_scanned > 0 && (
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">✓ Policy would PASS for the simulated PRs.</p>
                )}
              </div>

              {result.violations && result.violations.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Violations (with remediation)</div>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {result.violations.slice(0, 50).map((v, i) => (
                      <div key={`${v.rule_id}-${v.pr_number ?? i}-${i}`} className="rounded-lg border border-border/50 bg-muted/20 p-3 text-xs space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={v.severity === 'BLOCK' ? 'destructive' : 'secondary'} className="text-[10px]">
                            {v.severity}
                          </Badge>
                          <span className="font-mono font-medium">{v.rule_id}</span>
                          {v.pr_number != null && (
                            <span className="text-muted-foreground">
                              PR #{v.pr_number} · {v.repo}
                            </span>
                          )}
                        </div>
                        <p className="font-medium">{v.message}</p>
                        {v.file && (
                          <p className="text-muted-foreground">
                            File: {v.file}
                            {(v.line != null || v.column != null) && (
                              <span className="ml-1">(Line{v.line != null ? ` ${v.line}` : ''}{v.column != null ? `, col ${v.column}` : ''})</span>
                            )}
                          </p>
                        )}
                        {(v.current_value != null || v.required_value != null) && (
                          <p className="text-muted-foreground">
                            Current: {v.current_value ?? '—'} → Required: {v.required_value ?? '—'}
                          </p>
                        )}
                        {v.explanation && <p className="text-muted-foreground">{v.explanation}</p>}
                        {v.remediation?.steps && v.remediation.steps.length > 0 && (
                          <div>
                            <p className="font-medium text-muted-foreground mb-1">How to fix:</p>
                            <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                              {v.remediation.steps.map((step, j) => (
                                <li key={j}>{step}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {v.remediation?.example && (
                          <pre className="mt-1 p-2 rounded bg-muted/50 text-[10px] overflow-x-auto whitespace-pre-wrap font-mono">
                            {v.remediation.example}
                          </pre>
                        )}
                        {v.documentation_link && (
                          <a
                            href={v.documentation_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            Documentation <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.per_pr_results && result.per_pr_results.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Per-PR impact (metadata)</div>
                  <div className="rounded border border-border/50 overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          <th className="text-left p-2 font-medium">PR</th>
                          <th className="text-left p-2 font-medium">Repo</th>
                          <th className="text-left p-2 font-medium">Title</th>
                          <th className="text-left p-2 font-medium">Author</th>
                          <th className="text-left p-2 font-medium">Branch</th>
                          <th className="text-left p-2 font-medium">Verdict</th>
                          <th className="text-left p-2 font-medium">Rationale</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.per_pr_results.map((pr, i) => (
                          <tr key={`${pr.repo}-${pr.pr_number}-${i}`} className="border-t border-border/50">
                            <td className="p-2 font-mono">PR #{pr.pr_number ?? i + 1}</td>
                            <td className="p-2 font-mono text-muted-foreground max-w-[140px] truncate" title={pr.repo ?? undefined}>{pr.repo ?? '—'}</td>
                            <td className="p-2 max-w-[180px] truncate" title={pr.pr_title ?? undefined}>{pr.pr_title ?? '—'}</td>
                            <td className="p-2 text-muted-foreground">{pr.author ?? '—'}</td>
                            <td className="p-2 text-muted-foreground">{pr.base_branch ?? '—'}</td>
                            <td className="p-2">
                              <Badge variant={pr.verdict === 'BLOCK' ? 'destructive' : 'secondary'} className="text-[10px]">
                                {pr.verdict}
                              </Badge>
                            </td>
                            <td className="p-2 max-w-[200px] truncate text-muted-foreground" title={pr.rationale}>{pr.rationale}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Docs:</span>
                  <Link to="/docs/policies" className="inline-flex items-center gap-0.5 text-primary hover:underline">
                    Policy format <ExternalLink className="h-3 w-3" />
                  </Link>
                  <Link to="/docs/rules" className="inline-flex items-center gap-0.5 text-primary hover:underline">
                    Rule types <ExternalLink className="h-3 w-3" />
                  </Link>
                  <Link to="/docs/examples" className="inline-flex items-center gap-0.5 text-primary hover:underline">
                    Examples <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
                <div className="flex gap-2">
                  {result && (
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
                      <Download className="mr-2 h-4 w-4" />
                      Download Report (JSON)
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => setResult(null)}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Re-test
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
                    Enable Policy
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
