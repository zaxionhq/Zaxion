import React from 'react';
import { ArrowRight, FileCode, Settings } from 'lucide-react';
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
            Zaxion policies are managed in the <strong className="text-slate-200">Governance</strong> dashboard: a centralized registry so teams share versioned rules instead of scattering one-off config per repo. Scope can be org-wide or targeted to specific repos and branches where your deployment supports it.
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
            Before promoting a policy to <strong className="text-slate-300">BLOCK</strong>, use the Policy Impact Simulator to estimate blast radius and catch false positives.
          </p>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600">Authoring rules</h2>
        <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
          Policies reference a <strong className="text-slate-200">rules_logic</strong> JSON object (one rule per object). Use the references below for shape, parameters, and copy-paste examples.
        </p>
        <ul className="text-sm space-y-2">
          <li>
            <Link to="/docs/examples" className="text-indigo-400 hover:text-indigo-300 font-medium underline">
              Policy Rules (JSON) Reference
            </Link>
            <span className="text-slate-500"> — examples and capability levels</span>
          </li>
          <li>
            <Link to="/docs/rules" className="text-indigo-400 hover:text-indigo-300 font-medium underline">
              Rule types
            </Link>
            <span className="text-slate-500"> — parameters per engine checker</span>
          </li>
        </ul>
      </section>

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
