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
        <div className="p-8 rounded border border-white/5 bg-white/[0.01] space-y-6">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600">The Signature Process</h2>
          <div className="grid sm:grid-cols-2 gap-12">
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-200 uppercase tracking-tight">1. Rationale Submission</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                The developer provides a technical justification for the override within the Resolution Console.
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-200 uppercase tracking-tight">2. Cryptographic Binding</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                The rationale is bound to the specific commit hash and policy version, creating an immutable audit entry.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-12">
        <div className="space-y-4">
          <div className="h-8 w-8 rounded border border-white/10 bg-white/[0.02] flex items-center justify-center">
            <UserCheck className="h-4 w-4 text-slate-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-tight">Accountability</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            By requiring a signature, Zaxion ensures that technical debt is never "accidental." It is always a conscious choice by an authorized institutional actor.
          </p>
        </div>

        <div className="space-y-4">
          <div className="h-8 w-8 rounded border border-white/10 bg-white/[0.02] flex items-center justify-center">
            <ShieldCheck className="h-4 w-4 text-slate-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-tight">Compliance Readiness</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Signed overrides provide the documentation required for regulatory compliance (e.g., SOC2, HIPAA), where deviations from standard procedures must be justified and logged.
          </p>
        </div>
      </div>

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
