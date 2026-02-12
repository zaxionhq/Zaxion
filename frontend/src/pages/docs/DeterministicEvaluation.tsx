import React from 'react';
import { Terminal, ArrowRight, Cpu, Zap, Code2, Binary } from 'lucide-react';
import { Link } from 'react-router-dom';
import DocsAccordion from '../../components/docs/DocsAccordion';

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

      <div className="grid gap-6">
        <DocsAccordion 
          title="The Evaluation Pipeline" 
          subtitle="Stateless Computation"
          defaultOpen={true}
        >
          <p>The evaluation engine does not maintain internal state between runs. It ingests the current PR state and the active policy version, producing a verdict without side effects.</p>
          <div className="bg-black/40 rounded p-4 border border-white/5 space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase">
              <Code2 className="h-3 w-3" /> Input Schema
            </div>
            <pre className="text-[11px] text-indigo-300 font-mono leading-relaxed">
{`{
  "pr_context": {
    "base_sha": "a1b2c3d...",
    "head_sha": "f9e8d7c..."
  },
  "policy_context": {
    "id": "pol_7721",
    "version": "1.0.4"
  }
}`}
            </pre>
          </div>
        </DocsAccordion>

        <DocsAccordion 
          title="Repeatable Verdicts" 
          subtitle="Static Fact Extraction"
        >
          <p>Because the analysis is based on static AST facts, you can replay any historical evaluation and arrive at the exact same rationale and decision. This is critical for legal and architectural compliance in regulated industries.</p>
        </DocsAccordion>

        <DocsAccordion 
          title="No-Guessing Policy" 
          subtitle="Binary Logic"
        >
          <p>Zaxion does not use probabilistic models or AI to determine if a policy is violated. It uses formal logic gates. If a rule states "No circular dependencies between Layer A and Layer B," the engine either finds a path or it doesn't. There is no middle ground.</p>
        </DocsAccordion>
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
