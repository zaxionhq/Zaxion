import React from 'react';
import { Terminal, ArrowRight, Cpu, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const DocsDeterministicEvaluation = () => {
  return (
    <div className="space-y-16">
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          Technical Engine
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white">
          Deterministic Evaluation
        </h1>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
          Zaxion replaces heuristic analysis with absolute determinism. Every evaluation follows a stateless, repeatable process that produces identical results for identical code states.
        </p>
      </div>

      <div className="space-y-12">
        {[
          {
            title: "Stateless Pipeline",
            desc: "The evaluation engine does not maintain internal state between runs. It ingests the current PR state and the active policy version, producing a verdict without side effects.",
            icon: Zap
          },
          {
            title: "Repeatable Verdicts",
            desc: "Because the analysis is based on static AST facts, you can replay any historical evaluation and arrive at the exact same rationale and decision.",
            icon: Cpu
          }
        ].map((item, i) => (
          <div key={i} className="flex gap-6">
            <div className="mt-1 h-8 w-8 rounded border border-white/10 bg-white/[0.02] flex items-center justify-center shrink-0">
              <item.icon className="h-4 w-4 text-slate-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-tight">{item.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <section className="p-8 rounded border border-white/5 bg-white/[0.01] space-y-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600">The Decision Loop</h2>
        <div className="space-y-6 text-xs text-slate-500">
          <div className="flex gap-4">
            <span className="font-mono text-indigo-400">01</span>
            <p><strong className="text-slate-300">Input:</strong> PR Diff + Commit Hash + Policy ID</p>
          </div>
          <div className="flex gap-4">
            <span className="font-mono text-indigo-400">02</span>
            <p><strong className="text-slate-300">Extraction:</strong> Fact engine parses AST to extract structural symbols.</p>
          </div>
          <div className="flex gap-4">
            <span className="font-mono text-indigo-400">03</span>
            <p><strong className="text-slate-300">Trial:</strong> Symbols are matched against declarative policy rules.</p>
          </div>
          <div className="flex gap-4">
            <span className="font-mono text-indigo-400">04</span>
            <p><strong className="text-slate-300">Verdict:</strong> PASS or BLOCK with technical rationale.</p>
          </div>
        </div>
      </section>

      <div className="pt-12 border-t border-white/5">
        <Link 
          to="/docs/ast-analysis" 
          className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          AST Analysis Engine
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
};

export default DocsDeterministicEvaluation;
