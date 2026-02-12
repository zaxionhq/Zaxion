import React from 'react';
import { History, ArrowRight, ShieldCheck, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

const DocsAuditTrail = () => {
  return (
    <div className="space-y-16">
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          Governance & Audit
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white">
          Institutional Audit Trail
        </h1>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
          The Zaxion audit trail is an immutable record of every governance decision made by the protocol. It provides a longitudinal view of architectural compliance across your organization.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-12">
        <div className="space-y-4">
          <div className="h-8 w-8 rounded border border-white/10 bg-white/[0.02] flex items-center justify-center">
            <ShieldCheck className="h-4 w-4 text-slate-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-tight">Verifiable Evidence</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Every audit entry contains the technical rationale, the policy version, and the identity of the developer involved in the decision.
          </p>
        </div>

        <div className="space-y-4">
          <div className="h-8 w-8 rounded border border-white/10 bg-white/[0.02] flex items-center justify-center">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-tight">Search & Discovery</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Filter the audit trail by repository, policy ID, or override event to identify patterns of architectural debt.
          </p>
        </div>
      </div>

      <section className="space-y-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600">Audit Entry Anatomy</h2>
        <div className="bg-[#0a0a0a] rounded border border-white/5 p-6 font-mono text-[10px] text-slate-500">
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-indigo-400">event_id:</span>
              <span>"evt_2026_0212_001"</span>
            </div>
            <div className="flex justify-between">
              <span className="text-indigo-400">commit_hash:</span>
              <span>"8f1a2c3..."</span>
            </div>
            <div className="flex justify-between">
              <span className="text-indigo-400">policy_v:</span>
              <span>"1.2.0"</span>
            </div>
            <div className="flex justify-between">
              <span className="text-indigo-400">verdict:</span>
              <span className="text-red-400">BLOCK (OVERRIDDEN)</span>
            </div>
            <div className="pt-2 border-t border-white/5">
              <p className="text-indigo-400 mb-1">rationale:</p>
              <p className="italic">"Legacy dependency required for internal SDK compatibility."</p>
            </div>
          </div>
        </div>
      </section>

      <div className="pt-12 border-t border-white/5">
        <Link 
          to="/docs/signed-overrides" 
          className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Signed Overrides
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
};

export default DocsAuditTrail;
