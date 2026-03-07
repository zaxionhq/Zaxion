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
      type: 'pr_size',
      title: 'PR size',
      description: 'Limits the number of files allowed per pull request. Reduces review load and blast radius.',
      params: [{ name: 'max_files', type: 'number', desc: 'Maximum files per PR (e.g. 20–40).' }],
    },
    {
      type: 'coverage',
      title: 'Coverage',
      description: 'Requires a minimum number of test files in the PR, or a minimum coverage ratio when AST data is available.',
      params: [
        { name: 'min_tests', type: 'number', desc: 'Minimum test files in the PR.' },
        { name: 'min_coverage_ratio', type: 'number', desc: 'Optional; e.g. 0.8 for 80% when AST coverage is available.' },
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
      type: 'security_path',
      title: 'Security path',
      description: 'Marks paths as security-sensitive; changes there may trigger mandatory review or extra checks.',
      params: [
        { name: 'security_paths', type: 'string[]', desc: 'e.g. ["auth/", "config/", "lib/secrets/"].' },
        { name: 'pattern', type: 'string', desc: 'Optional path scope.' },
      ],
    },
    {
      type: 'security_patterns',
      title: 'Security patterns',
      description: 'Scans code for hardcoded secrets, eval(), and risky patterns (e.g. XSS). Content-based; requires file content.',
      params: [],
    },
    {
      type: 'code_quality',
      title: 'Code quality',
      description: 'Blocks console.log and debugger in code. Use for production or release branches.',
      params: [],
    },
    {
      type: 'documentation',
      title: 'Documentation',
      description: 'Requires JSDoc on exported functions.',
      params: [],
    },
    {
      type: 'architecture',
      title: 'Architecture',
      description: 'Checks for circular dependencies.',
      params: [],
    },
    {
      type: 'reliability',
      title: 'Reliability',
      description: 'Enforces error handling (e.g. try/catch) where needed.',
      params: [],
    },
    {
      type: 'performance',
      title: 'Performance',
      description: 'Requires performance or benchmark tests for critical paths.',
      params: [],
    },
    {
      type: 'api',
      title: 'API',
      description: 'Guards against breaking API changes.',
      params: [],
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
