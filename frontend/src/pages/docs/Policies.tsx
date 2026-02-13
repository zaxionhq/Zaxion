import React from 'react';
import { FileText, ArrowRight, ShieldCheck, GitBranch } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

const DocsPolicies = () => {
  return (
    <div className="space-y-16">
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          Core Layer
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white">
          Governance Policies
        </h1>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
          Zaxion distinguishes between platform-standard policies and organization-specific rules. All policies are declarative and version-controlled for audit integrity.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="p-6 rounded border border-white/5 bg-white/[0.02] space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-indigo-500/10 text-indigo-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-white">Canonical Policies</h3>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            Platform-wide standards maintained by Zaxion. These follow strict semantic versioning (v1.0.0) and are used for baseline compliance across all organizations.
          </p>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider border-indigo-500/30 text-indigo-400">Versioned</Badge>
        </div>

        <div className="p-6 rounded border border-white/5 bg-white/[0.02] space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-emerald-500/10 text-emerald-400">
              <FileText className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-white">Custom Admin Policies</h3>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            Organization-specific rules created by admins. These are tracked via an <strong>Audit Trail</strong> (who & when) rather than semantic versions, ensuring local accountability.
          </p>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider border-emerald-500/30 text-emerald-400">Audit-Tracked</Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600">YAML Structure</h2>
          <div className="bg-[#0a0a0a] rounded border border-white/5 p-6 font-mono text-xs text-slate-400 overflow-x-auto h-full">
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

        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600">JSON Structure</h2>
          <div className="bg-[#0a0a0a] rounded border border-white/5 p-6 font-mono text-xs text-slate-400 overflow-x-auto h-full">
            <pre>{`{
  "version": "1.0.0",
  "name": "institutional-auth-gate",
  "rules": [
    {
      "id": "no-unsafe-eval",
      "severity": "BLOCK",
      "pattern": "eval(*)",
      "rationale": "Unsafe execution detected. Use structured parsing."
    },
    {
      "id": "require-audit-log",
      "severity": "WARN",
      "target": "src/auth/*",
      "condition": "has_call(logger.audit)"
    }
  ]
}`}</pre>
          </div>
        </section>
      </div>

      <section className="space-y-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600">Field Definitions</h2>
        <div className="grid gap-4">
          {[
            { field: 'version', type: 'string', desc: 'Semantic version of the policy definition.' },
            { field: 'name', type: 'string', desc: 'Unique identifier for the policy.' },
            { field: 'rules', type: 'array', desc: 'List of rules to be enforced.' },
            { field: 'rules[].id', type: 'string', desc: 'Unique identifier for the rule.' },
            { field: 'rules[].severity', type: 'enum', desc: 'BLOCK (prevents PR), WARN (comments only), or INFO.' },
            { field: 'rules[].pattern', type: 'string', desc: 'AST or Regex pattern to match in code.' },
            { field: 'rules[].rationale', type: 'string', desc: 'Explanation shown to developers when rule is triggered.' }
          ].map((item) => (
            <div key={item.field} className="flex items-start gap-4 p-4 rounded bg-white/[0.02] border border-white/5">
              <div className="min-w-[120px]">
                <code className="text-[10px] text-indigo-400 font-mono font-bold uppercase tracking-tight">{item.field}</code>
              </div>
              <div className="flex-1 space-y-1">
                <div className="text-[10px] text-slate-500 font-mono italic">{item.type}</div>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </div>
            </div>
          ))}
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
