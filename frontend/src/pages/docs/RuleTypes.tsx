import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Reference for all policy rule types supported by the evaluation engine.
 * Complements Policy Rules (JSON) Reference (Examples) with type semantics and parameters.
 */
const DocsRuleTypes = () => {
  const ruleTypes = [
    {
      type: 'coverage',
      title: 'Coverage',
      description:
        'Requires a minimum number of test files in the PR, or a minimum coverage ratio when AST coverage is available.',
      params: [
        { name: 'min_tests', type: 'number', desc: 'Minimum test files in the PR.' },
        { name: 'min_coverage_ratio', type: 'number', desc: 'Optional; e.g. 0.8 for 80% when AST coverage is available.' },
      ],
    },
    {
      type: 'security_path',
      title: 'Security path',
      description: 'Marks paths as security-sensitive; changes there may trigger mandatory review or extra checks.',
      params: [
        { name: 'security_paths', type: 'string[]', desc: 'e.g. ["auth/", "config/", "lib/secrets/"].' },
        { name: 'pattern', type: 'string', desc: 'Optional path scope.' },
      ],
    },
    {
      type: 'file_extension',
      title: 'File extension',
      description: 'Restricts which file types can be changed, optionally scoped by a path pattern.',
      params: [
        { name: 'allowed_extensions', type: 'string[]', desc: 'e.g. [".js", ".ts", ".tsx", ".json"].' },
        { name: 'pattern', type: 'string', desc: 'Optional glob pattern (e.g. "src/**") the rule applies to.' },
      ],
    },
    {
      type: 'pr_size',
      title: 'PR size',
      description: 'Limits the number of files allowed per pull request. Reduces review load and blast radius.',
      params: [{ name: 'max_files', type: 'number', desc: 'Maximum files per PR (e.g. 20–40).' }],
    },
    {
      type: 'security_patterns',
      title: 'Security patterns',
      description:
        'Runs PatternMatcherService over file text and surfaces all enabled security-related YAML policies (secrets, unsafe patterns, injection-style strings, and other configured rules). Requires file content in the fact snapshot.',
      params: [],
    },
    {
      type: 'complexity_metrics',
      title: 'Complexity metrics',
      description: 'Enforces limits on cyclomatic complexity, function length, and file length using ComplexityMetricsService on source text.',
      params: [],
    },
    {
      type: 'dependency_scan',
      title: 'Dependency scan',
      description:
        'When changed files include package.json, runs DependencyScannerService for known vulnerable dependency versions. Lockfiles listed in the engine are collected but only package.json is scanned today.',
      params: [],
    },
    {
      type: 'code_quality',
      title: 'Code quality',
      description:
        'Uses the same pattern matcher as security_patterns, then keeps only matches whose policy id is one of: no-console-logs-production, no-magic-numbers, no-deprecated-apis, no-debug-mode-production. Requires file content.',
      params: [],
    },
    {
      type: 'documentation',
      title: 'Documentation',
      description:
        'When AST is available, warns on changed JS/TS files with exports that lack JSDoc on exports. If no AST is present, the checker passes.',
      params: [
        {
          name: 'require_jsdoc_on_exports',
          type: 'boolean',
          desc: 'Optional. Defaults to requiring JSDoc when omitted (true). Set false to disable this checker.',
        },
      ],
    },
    {
      type: 'architecture',
      title: 'Architecture',
      description: 'Builds an import graph from changed JS/TS files with content and blocks on circular dependencies.',
      params: [],
    },
    {
      type: 'reliability',
      title: 'Reliability',
      description:
        'Heuristic scan of source (non-test) files for await without try/catch, enclosing try with await, or .catch. Warns when patterns suggest missing error handling.',
      params: [],
    },
    {
      type: 'performance',
      title: 'Performance',
      description:
        'When require_performance_tests is true, looks for benchmark/perf-style patterns in test files; otherwise passes immediately.',
      params: [
        {
          name: 'require_performance_tests',
          type: 'boolean',
          desc: 'Must be true to enable the check; otherwise the checker returns pass.',
        },
      ],
    },
    {
      type: 'api',
      title: 'API',
      description:
        'When disallow_breaking_changes is true, the engine currently returns pass with a message that no API diff is available in context—use as a placeholder until richer API diff facts are wired.',
      params: [
        {
          name: 'disallow_breaking_changes',
          type: 'boolean',
          desc: 'Must be true to enable the stub check; otherwise the checker returns pass.',
        },
      ],
    },
    {
      type: 'testing_best_practices',
      title: 'Testing best practices',
      description: 'Uses AST metadata (skipped tests, empty tests) to block or warn on .skip/xit and empty test cases.',
      params: [],
    },
    {
      type: 'no_magic_numbers',
      title: 'No magic numbers',
      description:
        'AST semantic: warns on numeric literals assigned to variables in non-test files when they look like unnamed magic numbers (excludes descriptive ALL_CAPS constants and some heuristic exceptions).',
      params: [],
    },
    {
      type: 'hardcoded_urls',
      title: 'Hardcoded URLs',
      description:
        'AST semantic: blocks hardcoded http(s) URLs in string/template literals where the engine classifies them as static configuration.',
      params: [],
    },
    {
      type: 'no_hardcoded_secrets',
      title: 'No hardcoded secrets',
      description:
        'AST semantic: blocks long string/template assignments to variables whose names suggest secrets (token, api_key, password, etc.), excluding URL-named fields and plain http URLs.',
      params: [],
    },
    {
      type: 'no_eval',
      title: 'No eval',
      description: 'AST semantic: blocks direct eval() calls.',
      params: [],
    },
    {
      type: 'no_unsafe_regex',
      title: 'No unsafe regex',
      description: 'AST semantic: blocks regex literals that match simple ReDoS-style nested quantifier heuristics.',
      params: [],
    },
    {
      type: 'no_sql_injection',
      title: 'No SQL injection',
      description:
        'AST semantic: blocks SQL-looking template literals that interpolate expressions (possible string-built queries).',
      params: [],
    },
    {
      type: 'no_xss',
      title: 'No XSS',
      description:
        'AST semantic: blocks dynamic assignment to innerHTML or dangerouslySetInnerHTML when the right-hand side is not a string literal.',
      params: [],
    },
    {
      type: 'architectural_integrity',
      title: 'Architectural integrity',
      description:
        'Uses import edges from semantic facts and minimatch: flags imports that violate layer rules (default rules apply if you omit layer_rules).',
      params: [
        {
          name: 'layer_rules',
          type: 'object[]',
          desc: 'Each: { from, to, allow, message } — globs for source file path and imported path; allow false blocks matching pairs.',
        },
      ],
    },
    {
      type: 'data_privacy',
      title: 'Data privacy',
      description:
        'AST semantic: flags PII-style variable names (SSN, email, card, phone, name patterns); stronger severity when values appear passed into logging calls.',
      params: [],
    },
    {
      type: 'institutional_style',
      title: 'Institutional style',
      description:
        'Path-based naming: for each changed file matching a rule path glob, filename must end with the configured suffix (default style rules apply if style_rules is omitted).',
      params: [
        {
          name: 'style_rules',
          type: 'object[]',
          desc: 'Each: { path, suffix, message } — minimatch path, required filename suffix, violation message.',
        },
      ],
    },
  ];

  return (
    <div className="space-y-12">
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-indigo-400 uppercase tracking-widest">
          Rule reference
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white leading-tight">
          Rule types
        </h1>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
          Each policy <strong>rules_logic</strong> object has a <code className="bg-white/10 px-1 rounded text-indigo-300">type</code> and type-specific parameters. This page describes what each rule type does and which parameters it accepts. For copy-paste JSON examples, see the <Link to="/docs/examples" className="text-indigo-400 hover:text-indigo-300 underline">Policy Rules (JSON) Reference</Link>.
        </p>
      </div>

      <div className="space-y-8">
        {ruleTypes.map((rule) => (
          <section key={rule.type} className="p-6 rounded-lg border border-white/5 bg-white/[0.02] space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-indigo-300">{rule.type}</span>
              <h2 className="text-lg font-bold text-white">{rule.title}</h2>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">{rule.description}</p>
            {rule.params.length > 0 && (
              <div className="pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Parameters</h4>
                <ul className="space-y-1.5">
                  {rule.params.map((p) => (
                    <li key={p.name} className="text-xs text-slate-400 flex items-baseline gap-2">
                      <code className="bg-white/10 px-1.5 py-0.5 rounded text-indigo-300 font-mono">{p.name}</code>
                      <span className="text-slate-500 font-mono">{p.type}</span>
                      <span>— {p.desc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        ))}
      </div>

      <div className="pt-8 border-t border-white/5 flex flex-wrap gap-4">
        <Link
          to="/docs/examples"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-sm font-medium transition-colors"
        >
          Policy Rules (JSON) Reference
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

export default DocsRuleTypes;
