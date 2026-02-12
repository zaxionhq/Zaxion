import React from 'react';
import { FileText, ArrowRight, ShieldCheck, GitBranch } from 'lucide-react';
import { Link } from 'react-router-dom';

const DocsPolicies = () => {
  return (
    <div className="space-y-16">
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          Core Layer
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white">
          Canonical Policies
        </h1>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
          Policies are the declarative rule-sets that govern your codebase. They are stored as versioned YAML files, ensuring that architectural intent is treated with the same rigor as source code.
        </p>
      </div>

      <section className="space-y-8">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600">Policy Structure</h2>
        <div className="bg-[#0a0a0a] rounded border border-white/5 p-6 font-mono text-xs text-slate-400 overflow-x-auto">
          <pre>{`version: 1.0.0
name: institutional-auth-gate
rules:
  - id: no-unsafe-eval
    severity: BLOCK
    pattern: "eval(*)"
    rationale: "Unsafe execution detected. Use structured parsing."
  
  - id: require-audit-log
    severity: WARN
    target: "src/auth/*"
    condition: "has_call(logger.audit)"`}</pre>
        </div>
      </section>

      <div className="grid sm:grid-cols-2 gap-12">
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-tight">Immutability</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Once a policy is applied to a production gate, its ID and version are pinned. This prevents "floating rules" from changing the outcome of historical audits.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-tight">Inheritance</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Global policies can be extended by repository-specific rules, allowing for centralized governance with localized flexibility.
          </p>
        </div>
      </div>

      <div className="pt-12 border-t border-white/5">
        <Link 
          to="/docs/security" 
          className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Security Model
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
};

export default DocsPolicies;
