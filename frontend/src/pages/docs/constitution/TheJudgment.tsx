import React from 'react';
import { Scale, Terminal, ArrowRight, Cpu, Search, Binary } from 'lucide-react';
import { Link } from 'react-router-dom';
import DocsAccordion from '../../../components/docs/DocsAccordion';

const TheJudgment = () => {
  return (
    <div className="space-y-16">
      {/* Header Section */}
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-indigo-400 uppercase tracking-widest">
          Pillar 02
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white">
          The Judgment (Evaluation)
        </h1>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
          Judgment is the deterministic process of evaluating a code change against the Law. It transforms source code into verifiable technical verdicts.
        </p>
      </div>

      <section className="space-y-12">
        <div className="grid gap-8">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Stateless Trial</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Unlike human code reviews, Zaxion's Judgment is objective, repeatable, and instantaneous. It does not rely on "feelings" or "conventions"—it relies on structural facts.
            </p>
          </div>

          <div className="grid gap-4">
            <DocsAccordion 
              title="AST Fact Extraction" 
              subtitle="The Discovery Phase"
              defaultOpen={true}
            >
              <p>The system parses the Abstract Syntax Tree (AST) of the incoming code change to extract architectural facts. These facts include dependency graphs, interface usage, and visibility scopes.</p>
              <div className="bg-black/40 rounded p-4 border border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase">
                  <Search className="h-3 w-3" /> Fact Extraction
                </div>
                <code className="text-[11px] text-indigo-300 block font-mono">
                  [FACT] Component "UserDashboard" imports "AuthInternal"<br />
                  [FACT] "AuthInternal" is marked @visibility:private<br />
                  [FACT] Violation detected in scope "src/features/dashboard"
                </code>
              </div>
            </DocsAccordion>

            <DocsAccordion 
              title="Deterministic Logic Gates" 
              subtitle="The Verdict"
            >
              <p>Once facts are extracted, they are passed through the logic gates defined by the current active Law. This process is purely mathematical—if the code violates a rule, the judgment is a <strong>BLOCK</strong>. If it adheres, it is a <strong>PASS</strong>.</p>
              <div className="flex items-center gap-6 py-4">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                    <Binary className="h-5 w-5 text-green-500" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">1 (PASS)</span>
                </div>
                <div className="h-px w-12 bg-white/5" />
                <div className="flex flex-col items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <Binary className="h-5 w-5 text-red-500" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">0 (BLOCK)</span>
                </div>
              </div>
            </DocsAccordion>

            <DocsAccordion 
              title="Technical Rationale Generation" 
              subtitle="Accountability"
            >
              <p>Every BLOCK verdict is accompanied by a technical rationale. This is not a generic error message; it is a specific explanation of which rule was violated, where it occurred, and how to fix it to regain constitutional compliance.</p>
            </DocsAccordion>
          </div>
        </div>
      </section>

      <div className="pt-12 border-t border-white/5 flex justify-between items-center">
        <Link 
          to="/docs/constitution/the-law" 
          className="text-xs font-bold text-slate-500 hover:text-slate-400 transition-colors"
        >
          Pillar 01: The Law
        </Link>
        <Link 
          to="/docs/constitution/the-memory" 
          className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Pillar 03: The Memory
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
};

export default TheJudgment;
