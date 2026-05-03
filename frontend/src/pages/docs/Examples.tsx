import React from 'react';
import { ArrowRight, Building2, Shield, FileCheck, Layers, Cpu } from 'lucide-react';
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
          Governance policies in Zaxion use a single JSON object as <strong className="text-slate-200">rules_logic</strong>: a
          required <code className="bg-white/10 px-1 rounded text-indigo-300">type</code> string plus optional fields read by that
          checker. Paste one object at a time into <strong className="text-slate-200">Policy Rules (JSON)</strong> in the Policy
          Impact Simulator. For parameter semantics, see{' '}
          <Link to="/docs/rules" className="text-indigo-400 hover:text-indigo-300 underline">
            Rule types
          </Link>
          .
        </p>
      </div>

      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 flex items-start gap-3">
        <FileCheck className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-amber-200">Where to use this</h3>
          <p className="text-sm text-slate-400 mt-1">
            In the Dashboard, open <strong className="text-slate-200">Policy Impact Simulator</strong> → click <strong className="text-slate-200">+</strong> to create a policy → paste one of the JSON blocks below into <strong className="text-slate-200">Policy Rules (JSON)</strong>.
          </p>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FileCheck className="h-5 w-5 text-indigo-400" />
          Minimal JSON shape
        </h2>
        <p className="text-slate-400 text-sm">
          Every example is one object. Types with no extra fields are still valid—only <code className="bg-white/10 px-1 rounded text-indigo-300">type</code> is required.
        </p>
        <div className="p-4 rounded bg-black border border-white/10 font-mono text-xs text-slate-300 overflow-x-auto">
          <pre>{`{
  "type": "pr_size",
  "max_files": 25
}`}</pre>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Layers className="h-5 w-5 text-indigo-400" />
          Capability ladder (what “advanced” means today)
        </h2>
        <p className="text-slate-400 text-sm leading-relaxed max-w-3xl">
          The evaluation engine runs deterministic checkers in process. Rough power levels—from simple gates to org-wide structure:
        </p>
        <ol className="list-decimal pl-5 space-y-3 text-sm text-slate-400 max-w-3xl">
          <li>
            <strong className="text-slate-200">Parametric gates</strong> — <code className="bg-white/10 px-1 rounded text-indigo-300">pr_size</code>,{' '}
            <code className="bg-white/10 px-1 rounded text-indigo-300">coverage</code>, <code className="bg-white/10 px-1 rounded text-indigo-300">file_extension</code>,{' '}
            <code className="bg-white/10 px-1 rounded text-indigo-300">security_path</code>.
          </li>
          <li>
            <strong className="text-slate-200">Content / pattern scan</strong> — <code className="bg-white/10 px-1 rounded text-indigo-300">security_patterns</code> runs the full YAML-backed pattern library on file text.{' '}
            <code className="bg-white/10 px-1 rounded text-indigo-300">code_quality</code> reports only a subset of those patterns (console/debug, deprecated APIs, magic numbers in patterns, etc.).
          </li>
          <li>
            <strong className="text-slate-200">AST and metadata</strong> — <code className="bg-white/10 px-1 rounded text-indigo-300">documentation</code>,{' '}
            <code className="bg-white/10 px-1 rounded text-indigo-300">architecture</code>, <code className="bg-white/10 px-1 rounded text-indigo-300">testing_best_practices</code>,{' '}
            <code className="bg-white/10 px-1 rounded text-indigo-300">complexity_metrics</code>, semantic <code className="bg-white/10 px-1 rounded text-indigo-300">no_*</code> types, <code className="bg-white/10 px-1 rounded text-indigo-300">dependency_scan</code> need parsed content and/or AST when available.
          </li>
          <li>
            <strong className="text-slate-200">Org structure</strong> — <code className="bg-white/10 px-1 rounded text-indigo-300">architectural_integrity</code> (layer import rules),{' '}
            <code className="bg-white/10 px-1 rounded text-indigo-300">institutional_style</code> (path/suffix conventions), <code className="bg-white/10 px-1 rounded text-indigo-300">data_privacy</code> (PII-style naming heuristics).
          </li>
          <li>
            <strong className="text-slate-200">Optional flags</strong> — <code className="bg-white/10 px-1 rounded text-indigo-300">performance</code> with{' '}
            <code className="bg-white/10 px-1 rounded text-indigo-300">require_performance_tests</code>; <code className="bg-white/10 px-1 rounded text-indigo-300">api</code> with{' '}
            <code className="bg-white/10 px-1 rounded text-indigo-300">disallow_breaking_changes</code> (see caveat below).
          </li>
        </ol>
      </section>

      <section className="rounded-lg border border-white/10 bg-white/[0.02] p-6 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Cpu className="h-4 w-4 text-indigo-400" />
          Data depth and strictness
        </h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          Some rules only run when file <strong className="text-slate-200">content</strong> or <strong className="text-slate-200">AST</strong> is present in the fact snapshot. Fetch full PR context (or use upload/paste) when simulating content-heavy rules. For how verdicts are produced, see{' '}
          <Link to="/docs/deterministic-evaluation" className="text-indigo-400 hover:text-indigo-300 underline">
            Deterministic evaluation
          </Link>{' '}
          and{' '}
          <Link to="/docs/ast-analysis" className="text-indigo-400 hover:text-indigo-300 underline">
            AST analysis
          </Link>
          .
        </p>
      </section>

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
            These checkers need file text in the snapshot (e.g. PR fetch, upload, paste, or zip). Patterns come from the server-side policy configuration (YAML-backed library).
          </p>

          <div className="bg-black/20 p-6 rounded-lg border border-white/5 space-y-4">
            <h3 className="text-base font-bold text-slate-200">Security patterns</h3>
            <p className="text-sm text-slate-400">
              Runs the <strong className="text-slate-200">full</strong> pattern library for secrets, unsafe transport, injection-style strings, insecure crypto, admin-route heuristics, hardcoded config, and other enabled security rules—not a single “eval only” check.
            </p>
            <div className="p-4 rounded bg-black border border-white/10 font-mono text-xs text-slate-300 overflow-x-auto">
              <pre>{`{
  "type": "security_patterns"
}`}</pre>
            </div>
          </div>

          <div className="bg-black/20 p-6 rounded-lg border border-white/5 space-y-4 mt-6">
            <h3 className="text-base font-bold text-slate-200">Code quality (pattern subset)</h3>
            <p className="text-sm text-slate-400">
              Surfaces matches from the same pattern engine, filtered to quality-oriented policies: e.g. console/debug logging, deprecated API usage, debug-in-production patterns, and related YAML rules—use alongside AST rules for coverage.
            </p>
            <div className="p-4 rounded bg-black border border-white/10 font-mono text-xs text-slate-300 overflow-x-auto">
              <pre>{`{
  "type": "code_quality"
}`}</pre>
            </div>
          </div>

          <div className="bg-black/20 p-6 rounded-lg border border-white/5 space-y-4 mt-6">
            <h3 className="text-base font-bold text-slate-200">Dependency scan</h3>
            <p className="text-sm text-slate-400">
              Scans <code className="bg-white/10 px-1 rounded text-indigo-300">package.json</code> in the change set for known vulnerable versions (advisory-style checks in the engine).
            </p>
            <div className="p-4 rounded bg-black border border-white/10 font-mono text-xs text-slate-300 overflow-x-auto">
              <pre>{`{
  "type": "dependency_scan"
}`}</pre>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white">AST semantic rules (one-liners)</h2>
          <p className="text-slate-400 text-sm mt-1 mb-4">
            Each type below uses semantic facts when AST is available for changed files. No extra JSON fields required unless you add future tunables in the engine.
          </p>
          <div className="p-4 rounded bg-black border border-white/10 font-mono text-xs text-slate-300 overflow-x-auto">
            <pre>{`{ "type": "no_hardcoded_secrets" }
{ "type": "no_eval" }
{ "type": "no_unsafe_regex" }
{ "type": "no_sql_injection" }
{ "type": "no_xss" }
{ "type": "no_magic_numbers" }
{ "type": "hardcoded_urls" }
{ "type": "documentation" }
{ "type": "documentation", "require_jsdoc_on_exports": false }
{ "type": "architecture" }
{ "type": "reliability" }
{ "type": "testing_best_practices" }
{ "type": "complexity_metrics" }`}</pre>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white">Org structure and privacy</h2>
          <p className="text-slate-400 text-sm mt-1 mb-4">
            Layer and naming rules use globs on file paths; customize arrays to match your repo layout.
          </p>

          <div className="bg-black/20 p-6 rounded-lg border border-white/5 space-y-4">
            <h3 className="text-base font-bold text-slate-200">Architectural integrity (layer imports)</h3>
            <p className="text-sm text-slate-400">
              Default rules in the engine can be overridden with <code className="bg-white/10 px-1 rounded text-indigo-300">layer_rules</code>: each rule has <code className="bg-white/10 px-1 rounded text-indigo-300">from</code>, <code className="bg-white/10 px-1 rounded text-indigo-300">to</code>, <code className="bg-white/10 px-1 rounded text-indigo-300">allow</code>, and <code className="bg-white/10 px-1 rounded text-indigo-300">message</code>.
            </p>
            <div className="p-4 rounded bg-black border border-white/10 font-mono text-xs text-slate-300 overflow-x-auto">
              <pre>{`{
  "type": "architectural_integrity",
  "layer_rules": [
    {
      "from": "**/services/**",
      "to": "**/controllers/**",
      "allow": false,
      "message": "Services should not depend on Controllers (layer violation)"
    }
  ]
}`}</pre>
            </div>
          </div>

          <div className="bg-black/20 p-6 rounded-lg border border-white/5 space-y-4 mt-6">
            <h3 className="text-base font-bold text-slate-200">Institutional style (path conventions)</h3>
            <p className="text-sm text-slate-400">
              Optional <code className="bg-white/10 px-1 rounded text-indigo-300">style_rules</code> entries use <code className="bg-white/10 px-1 rounded text-indigo-300">path</code> (glob), <code className="bg-white/10 px-1 rounded text-indigo-300">suffix</code>, and <code className="bg-white/10 px-1 rounded text-indigo-300">message</code>.
            </p>
            <div className="p-4 rounded bg-black border border-white/10 font-mono text-xs text-slate-300 overflow-x-auto">
              <pre>{`{
  "type": "institutional_style",
  "style_rules": [
    {
      "path": "**/controllers/**",
      "suffix": "Controller.ts",
      "message": "Controller files should end with Controller.ts"
    }
  ]
}`}</pre>
            </div>
          </div>

          <div className="bg-black/20 p-6 rounded-lg border border-white/5 space-y-4 mt-6">
            <h3 className="text-base font-bold text-slate-200">Data privacy (PII heuristics)</h3>
            <p className="text-sm text-slate-400">
              Flags risky naming/logging patterns using semantic analysis; tune org practices alongside this rule.
            </p>
            <div className="p-4 rounded bg-black border border-white/10 font-mono text-xs text-slate-300 overflow-x-auto">
              <pre>{`{
  "type": "data_privacy"
}`}</pre>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white">Performance and API gates</h2>

          <div className="bg-black/20 p-6 rounded-lg border border-white/5 space-y-4">
            <h3 className="text-base font-bold text-slate-200">Performance tests</h3>
            <p className="text-sm text-slate-400">
              When <code className="bg-white/10 px-1 rounded text-indigo-300">require_performance_tests</code> is true, the engine looks for benchmark-style patterns in test files; otherwise the checker passes.
            </p>
            <div className="p-4 rounded bg-black border border-white/10 font-mono text-xs text-slate-300 overflow-x-auto">
              <pre>{`{
  "type": "performance",
  "require_performance_tests": true
}`}</pre>
            </div>
          </div>

          <div className="bg-black/20 p-6 rounded-lg border border-white/5 space-y-4 mt-6">
            <h3 className="text-base font-bold text-slate-200">API breaking changes</h3>
            <p className="text-sm text-slate-400">
              Set <code className="bg-white/10 px-1 rounded text-indigo-300">disallow_breaking_changes</code> when you want the API checker enabled. Today the implementation returns pass when no API diff context is attached—treat this as a placeholder until richer API diff facts are wired.
            </p>
            <div className="p-4 rounded bg-black border border-white/10 font-mono text-xs text-slate-300 overflow-x-auto">
              <pre>{`{
  "type": "api",
  "disallow_breaking_changes": true
}`}</pre>
            </div>
          </div>
        </section>
      </div>

      <div className="pt-8 border-t border-white/5 flex flex-wrap gap-4">
        <Link
          to="/docs/rules"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-sm font-medium transition-colors"
        >
          Rule types (parameters)
          <ArrowRight className="h-4 w-4" />
        </Link>
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
