import React from 'react';
import { FileText, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const DocsSignedOverrides = () => {
  return (
    <div className="space-y-16">
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          Governance & Audit
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white">
          Signed Overrides
        </h1>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
          A signed override is a formal acknowledgment of architectural risk. It transforms a technical bypass into a business decision with clear institutional ownership.
        </p>
      </div>

      <div className="space-y-12">
        <div className="p-8 rounded border border-white/5 bg-white/[0.01] space-y-8">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600">The Signature Protocol</h2>
          
          <div className="grid gap-8">
            <div className="flex gap-6 relative group">
              <div className="absolute left-[15px] top-8 bottom-0 w-[1px] bg-white/5 group-hover:bg-indigo-500/20 transition-colors" />
              <div className="h-8 w-8 rounded-full border border-indigo-500/20 bg-[#050505] flex items-center justify-center shrink-0 z-10">
                <span className="text-[10px] font-mono text-indigo-400">01</span>
              </div>
              <div className="space-y-2 pb-8">
                <h4 className="text-sm font-bold text-slate-200 uppercase tracking-tight">Rationale Submission</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  The developer must provide a structured justification within the Resolution Console. This rationale is the "why" behind the architectural deviation.
                </p>
                <div className="bg-black/40 rounded p-3 font-mono text-[10px] text-slate-400 border border-white/5 mt-2">
                  <span className="text-indigo-400">RATIONALE:</span> "Bypassing layer isolation for legacy auth migration. Verified by @arch_lead."
                </div>
              </div>
            </div>

            <div className="flex gap-6 relative group">
              <div className="absolute left-[15px] top-8 bottom-0 w-[1px] bg-white/5 group-hover:bg-indigo-500/20 transition-colors" />
              <div className="h-8 w-8 rounded-full border border-indigo-500/20 bg-[#050505] flex items-center justify-center shrink-0 z-10">
                <span className="text-[10px] font-mono text-indigo-400">02</span>
              </div>
              <div className="space-y-2 pb-8">
                <h4 className="text-sm font-bold text-slate-200 uppercase tracking-tight">Cryptographic Binding</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  The signature is bound to a specific triplet: <code className="text-[10px] text-indigo-300">Commit Hash</code> + <code className="text-[10px] text-indigo-300">Policy Version</code> + <code className="text-[10px] text-indigo-300">Developer Identity</code>.
                </p>
              </div>
            </div>

            <div className="flex gap-6 group">
              <div className="h-8 w-8 rounded-full border border-indigo-500/20 bg-[#050505] flex items-center justify-center shrink-0 z-10">
                <span className="text-[10px] font-mono text-indigo-400">03</span>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-200 uppercase tracking-tight">Ledger Commitment</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Once signed, the override is committed to the immutable audit trail. It cannot be deleted or modified, even if the PR is later closed or the policy is updated.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="space-y-8">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600">Override Governance</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="p-6 rounded border border-white/5 bg-white/[0.01] space-y-4">
            <div className="h-8 w-8 rounded bg-white/5 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-indigo-400" />
            </div>
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-tight">Expiration Policies</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Overrides can be time-bound. A "Temporary Bypass" will automatically expire after a set duration, re-triggering the BLOCK verdict until a permanent fix is merged.
            </p>
          </div>
          <div className="p-6 rounded border border-white/5 bg-white/[0.01] space-y-4">
            <div className="h-8 w-8 rounded bg-white/5 flex items-center justify-center">
              <UserCheck className="h-4 w-4 text-indigo-400" />
            </div>
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-tight">Multi-Sig Requirements</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              For high-risk violations (e.g., security mandates), Zaxion requires signatures from both the PR author and a designated security officer.
            </p>
          </div>
        </div>
      </section>

      <div className="pt-12 border-t border-white/5">
        <Link 
          to="/docs/overview" 
          className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Protocol Overview
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
};

export default DocsSignedOverrides;
