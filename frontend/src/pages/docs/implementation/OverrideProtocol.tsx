import React from 'react';
import { Lock, ArrowRight, UserCheck, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

const DocsOverrideProtocol = () => {
  return (
    <div className="space-y-16">
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          Implementation
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white">
          Override Protocol
        </h1>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
          Zaxion recognizes that engineering is a series of trade-offs. Our override protocol allows authorized developers to bypass blocks, provided they supply a signed institutional rationale.
        </p>
      </div>

      <div className="space-y-12">
        <div className="flex gap-6">
          <div className="mt-1 h-8 w-8 rounded border border-white/10 bg-white/[0.02] flex items-center justify-center shrink-0">
            <UserCheck className="h-4 w-4 text-slate-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-tight">Signed Rationales</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              An override is not a "skip" button. It is a documented decision. Developers must explicitly explain why the architectural rule is being waived for this specific context.
            </p>
          </div>
        </div>

        <div className="flex gap-6">
          <div className="mt-1 h-8 w-8 rounded border border-white/10 bg-white/[0.02] flex items-center justify-center shrink-0">
            <ShieldAlert className="h-4 w-4 text-slate-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-tight">Override Velocity</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Zaxion tracks "Override Velocity"—the rate at which rules are bypassed. High velocity in a specific domain signals a mismatch between policy and reality, triggering a governance review.
            </p>
          </div>
        </div>
      </div>

      <section className="p-8 rounded border border-white/5 bg-white/[0.01] space-y-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600">The Resolution Console</h2>
        <p className="text-sm text-slate-500">
          When a PR is blocked, developers are directed to the Zaxion Resolution Console. Here, they can review the technical rationale and, if authorized, initiate an override request.
        </p>
      </section>

      <div className="pt-12 border-t border-white/5">
        <Link 
          to="/docs/audit-trail" 
          className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Institutional Audit Trail
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
};

export default DocsOverrideProtocol;
