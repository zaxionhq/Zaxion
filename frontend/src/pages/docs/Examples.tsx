import React from 'react';
import { ArrowRight, Building2, Shield, FileCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Enterprise-grade policy JSON examples for teams of 20–200+.
 * Matches the evaluation engine rule types; use in Create New Policy (Policy Rules JSON).
 */
const DocsExamples = () => {
  return (
    <div className="space-y-12">
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-indigo-400 uppercase tracking-widest">
          Enterprise Policy Reference
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white leading-tight">
          Policy Rules (JSON) Reference
        </h1>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
          Governance policies in Zaxion are defined as JSON <strong>rules_logic</strong>. Each policy has a single <code className="bg-white/10 px-1 rounded text-indigo-300">type</code> and type-specific parameters. Use these examples in the Policy Impact Simulator when creating or editing policies. Scope policies to org, repository, or branch as needed.
        </p>
      </div>

      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 flex items-start gap-3">
        <FileCheck className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-amber-200">Where to use this</h3>
          <p className="text-sm text-slate-400 mt-1">
            In the Dashboard, open <strong>Policy Impact Simulator</strong> → click <strong>+</strong> to create a policy → paste one of the JSON blocks below into <strong>Policy Rules (JSON)</strong>. For full reference and copy-paste, use the link in the Create New Policy dialog to open this page.
          </p>
        </div>
      </div>

      <div className="space-y-10">
        <section>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-400" />
            Operational controls (PR size, coverage)
          </h2>
          <p className="text-slate-400 text-sm mt-1 mb-4">
            Standard controls for cross-team consistency and reviewability. Typical for org-wide or repo-level policies.
          </p>

          <div className="bg-black/20 p-6 rounded-lg border border-white/5 space-y-4">
            <h3 className="text-base font-bold text-slate-200">PR size cap</h3>
            <p className="text-sm text-slate-400">
              Enforce a maximum number of files per PR. Reduces review load and blast radius. Common values: 20–40 for product teams, 15–25 for platform/security.
            </p>
            <div className="p-4 rounded bg-black border border-white/10 font-mono text-xs text-slate-300 overflow-x-auto">
              <pre>{`{
  "type": "pr_size",
  "max_files": 25
}`}</pre>
            </div>
          </div>

          <div className="bg-black/20 p-6 rounded-lg border border-white/5 space-y-4 mt-6">
            <h3 className="text-base font-bold text-slate-200">Minimum test coverage</h3>
            <p className="text-sm text-slate-400">
              Require at least N test files in the PR (or use <code className="bg-white/10 px-1 rounded text-indigo-300">min_coverage_ratio</code> when AST coverage is available). Use for critical paths or org-wide quality bars.
            </p>
            <div className="p-4 rounded bg-black border border-white/10 font-mono text-xs text-slate-300 overflow-x-auto">
              <pre>{`{
  "type": "coverage",
  "min_tests": 1
}`}</pre>
            </div>
            <div className="p-4 rounded bg-black border border-white/10 font-mono text-xs text-slate-300 overflow-x-auto mt-2">
              <pre>{`// Alternative: require minimum coverage ratio (when AST data available)\n{
  "type": "coverage",
  "min_coverage_ratio": 0.8
}`}</pre>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-indigo-400" />
            Path and file-type governance
          </h2>
          <p className="text-slate-400 text-sm mt-1 mb-4">
            Restrict which paths or file types can be changed. Essential for multi-repo and platform teams.
          </p>

          <div className="bg-black/20 p-6 rounded-lg border border-white/5 space-y-4">
            <h3 className="text-base font-bold text-slate-200">Allowed file extensions (with scope)</h3>
            <p className="text-sm text-slate-400">
              Only allow changes to specified extensions within an optional glob <code className="bg-white/10 px-1 rounded text-indigo-300">pattern</code>. Use to lock down config directories or enforce language boundaries (e.g. only .ts in app code).
            </p>
            <div className="p-4 rounded bg-black border border-white/10 font-mono text-xs text-slate-300 overflow-x-auto">
              <pre>{`{
  "type": "file_extension",
  "allowed_extensions": [".js", ".ts", ".tsx", ".json"],
  "pattern": "src/**"
}`}</pre>
            </div>
          </div>

          <div className="bg-black/20 p-6 rounded-lg border border-white/5 space-y-4 mt-6">
            <h3 className="text-base font-bold text-slate-200">Protected (security-sensitive) paths</h3>
            <p className="text-sm text-slate-400">
              Changes under these paths trigger mandatory review or additional checks. Standard for auth, secrets, payments, and production config.
            </p>
            <div className="p-4 rounded bg-black border border-white/10 font-mono text-xs text-slate-300 overflow-x-auto">
              <pre>{`{
  "type": "security_path",
  "security_paths": ["auth/", "config/", "lib/secrets/", "packages/payment/"],
  "pattern": "**"
}`}</pre>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-400" />
            Security and quality (content scan)
          </h2>
          <p className="text-slate-400 text-sm mt-1 mb-4">
            Policies that inspect file content. Require file content to be available (e.g. GitHub PR URL with “Fetch PRs” or upload/paste/zip).
          </p>

          <div className="bg-black/20 p-6 rounded-lg border border-white/5 space-y-4">
            <h3 className="text-base font-bold text-slate-200">Security patterns</h3>
            <p className="text-sm text-slate-400">
              Scans code for hardcoded secrets, <code className="bg-white/10 px-1 rounded text-indigo-300">eval()</code>, dangerous DOM usage. Use org-wide or on repos that handle PII/credentials.
            </p>
            <div className="p-4 rounded bg-black border border-white/10 font-mono text-xs text-slate-300 overflow-x-auto">
              <pre>{`{
  "type": "security_patterns"
}`}</pre>
            </div>
          </div>

          <div className="bg-black/20 p-6 rounded-lg border border-white/5 space-y-4 mt-6">
            <h3 className="text-base font-bold text-slate-200">Code quality (no debug artifacts)</h3>
            <p className="text-sm text-slate-400">
              Blocks <code className="bg-white/10 px-1 rounded text-indigo-300">console.log</code> and <code className="bg-white/10 px-1 rounded text-indigo-300">debugger</code>. Use for production branches or release gates.
            </p>
            <div className="p-4 rounded bg-black border border-white/10 font-mono text-xs text-slate-300 overflow-x-auto">
              <pre>{`{
  "type": "code_quality"
}`}</pre>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white">Additional rule types</h2>
          <p className="text-slate-400 text-sm mt-1 mb-4">
            The engine also supports: <code className="bg-white/10 px-1 rounded text-indigo-300">documentation</code> (JSDoc on exports), <code className="bg-white/10 px-1 rounded text-indigo-300">architecture</code> (circular dependency checks), <code className="bg-white/10 px-1 rounded text-indigo-300">reliability</code>, <code className="bg-white/10 px-1 rounded text-indigo-300">performance</code>, <code className="bg-white/10 px-1 rounded text-indigo-300">api</code>. Configure scope (Global / Repo / Branch) in the Create Policy dialog to align with team structure (e.g. org-wide baseline + repo-specific tightening).
          </p>
        </section>
      </div>

      <div className="pt-8 border-t border-white/5 flex flex-wrap gap-4">
        <Link
          to="/docs/policies"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-sm font-medium transition-colors"
        >
          Canonical policies
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          to="/governance"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium transition-colors"
        >
          Open Policy Impact Simulator
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

export default DocsExamples;
