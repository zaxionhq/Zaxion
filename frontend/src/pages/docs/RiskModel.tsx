import React from 'react';
import { Shield, ArrowRight, AlertTriangle, Target } from 'lucide-react';
import { Link } from 'react-router-dom';

const DocsRiskModel = () => {
  return (
    <div className="space-y-16">
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          Technical Engine
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white">
          Risk-Proportional Model
        </h1>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
          Zaxion doesn't treat every file equally. Our risk model assigns a sensitivity score to codebase domains, allowing for high-velocity development in low-risk areas while enforcing strict gates on critical paths.
        </p>
      </div>

      <div className="space-y-12">
        <div className="flex gap-6">
          <div className="mt-1 h-8 w-8 rounded border border-white/10 bg-white/[0.02] flex items-center justify-center shrink-0">
            <Target className="h-4 w-4 text-slate-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-tight">Domain Sensitivity</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Paths like <code className="text-xs text-indigo-400 bg-white/5 px-1 rounded">/src/auth</code> or <code className="text-xs text-indigo-400 bg-white/5 px-1 rounded">/src/billing</code> are automatically flagged as high-sensitivity, triggering deep architectural reviews.
            </p>
          </div>
        </div>

        <div className="flex gap-6">
          <div className="mt-1 h-8 w-8 rounded border border-white/10 bg-white/[0.02] flex items-center justify-center shrink-0">
            <AlertTriangle className="h-4 w-4 text-slate-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-tight">Impact Assessment</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              The model calculates risk based on change volume, dependency depth, and proximity to core institutional logic.
            </p>
          </div>
        </div>
      </div>

      <section className="space-y-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600">Risk Severity Levels</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { level: "L1", color: "text-slate-500", label: "Operational", desc: "Minimal gating for CSS, docs, or tests." },
            { level: "L2", color: "text-indigo-400", label: "Functional", desc: "Standard gates for feature logic." },
            { level: "L3", color: "text-red-400", label: "Critical", desc: "Strict constitutional enforcement." }
          ].map((item, i) => (
            <div key={i} className="p-4 rounded border border-white/5 bg-white/[0.01] space-y-2">
              <div className={`text-[10px] font-mono font-bold ${item.color}`}>{item.level}</div>
              <div className="text-[11px] font-bold text-slate-300">{item.label}</div>
              <p className="text-[10px] text-slate-600 leading-tight">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="pt-12 border-t border-white/5">
        <Link 
          to="/docs/enforcement-lifecycle" 
          className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Enforcement Lifecycle
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
};

export default DocsRiskModel;
