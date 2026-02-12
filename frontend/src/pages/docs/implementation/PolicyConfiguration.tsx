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
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600">Centralized Governance</h2>
        <div className="p-8 rounded border border-white/5 bg-white/[0.01] space-y-6">
          <p className="text-sm text-slate-400 leading-relaxed">
            Zaxion policies are managed through the **Institutional Registry**. Instead of local configuration files, policies are distributed via a cryptographically signed control plane. This ensures that architectural standards are consistent across thousands of repositories without manual intervention.
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-200 uppercase">Policy Versioning</h4>
              <p className="text-[11px] text-slate-500">Every policy update creates a new immutable version in the registry, allowing for graceful rollbacks and historical audits.</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-200 uppercase">Registry Scope</h4>
              <p className="text-[11px] text-slate-500">Apply policies globally across the organization or target specific sensitive domains with surgical precision.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid sm:grid-cols-2 gap-12">
        <div className="space-y-4">
          <div className="h-8 w-8 rounded border border-white/10 bg-white/[0.02] flex items-center justify-center">
            <Settings className="h-4 w-4 text-slate-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-tight">Version Pinning</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Always pin your repositories to a specific institutional policy version. This prevents upstream changes from disrupting local development velocity.
          </p>
        </div>

        <div className="space-y-4">
          <div className="h-8 w-8 rounded border border-white/10 bg-white/[0.02] flex items-center justify-center">
            <FileCode className="h-4 w-4 text-slate-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-tight">Simulation Testing</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Before promoting a policy to **BLOCK**, use the Policy Simulator to calculate the blast radius and ensure institutional readiness.
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
