import React from 'react';
import { Terminal, ArrowRight, FileCode, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

const DocsPolicyConfiguration = () => {
  return (
    <div className="space-y-16">
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          Implementation
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white">
          Policy Configuration
        </h1>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
          Institutional policies are defined in a centralized registry. This ensures that every repository within your organization adheres to the same versioned governance standards.
        </p>
      </div>

      <section className="space-y-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600">The .zaxion Schema</h2>
        <div className="bg-[#0a0a0a] rounded border border-white/5 p-6 font-mono text-xs text-slate-400 overflow-x-auto">
          <pre>{`# .zaxion/policy.yaml
metadata:
  id: "canonical-security-v1"
  owner: "institutional-security-team"

rules:
  - id: "prevent-hardcoded-secrets"
    type: "ast_pattern"
    match: "Symbol(api_key).value != null"
    severity: "BLOCK"

  - id: "require-internal-pkg"
    type: "import_gate"
    disallow: ["axios", "request"]
    recommend: "@institutional/http-client"`}</pre>
        </div>
      </section>

      <div className="grid sm:grid-cols-2 gap-12">
        <div className="space-y-4">
          <div className="h-8 w-8 rounded border border-white/10 bg-white/[0.02] flex items-center justify-center">
            <Settings className="h-4 w-4 text-slate-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-tight">Version Pinning</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Always pin your policies to a specific version. This prevents upstream policy changes from breaking your local development velocity.
          </p>
        </div>

        <div className="space-y-4">
          <div className="h-8 w-8 rounded border border-white/10 bg-white/[0.02] flex items-center justify-center">
            <FileCode className="h-4 w-4 text-slate-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-tight">Dry Run Mode</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Test new policies using <code className="text-xs text-indigo-400 bg-white/5 px-1 rounded">severity: ADVISE</code> before promoting them to <code className="text-xs text-indigo-400 bg-white/5 px-1 rounded">BLOCK</code>.
          </p>
        </div>
      </div>

      <div className="pt-12 border-t border-white/5">
        <Link 
          to="/docs/implementation/override-protocol" 
          className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Override Protocol
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
};

export default DocsPolicyConfiguration;
