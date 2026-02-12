import React from 'react';
import { Cpu, Code2, Microscope, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const DocsLogic = () => {
  return (
    <div className="space-y-12">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-neon-cyan/10 border border-neon-cyan/20 text-[10px] font-mono text-neon-cyan uppercase tracking-widest">
          Technical Logic
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
          Deterministic <span className="gradient-text">Evaluation.</span>
        </h1>
        <p className="text-xl text-white/40 leading-relaxed font-medium max-w-2xl">
          Zaxion achieves absolute predictability by using AST-based analysis to extract code facts, removing the uncertainty of black-box scoring systems.
        </p>
      </div>

      <section className="space-y-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="p-8 rounded-xl border border-white/5 bg-white/[0.01] space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Code2 className="h-5 w-5 text-neon-cyan" />
              AST-Based Fact Extraction
            </h3>
            <p className="text-sm text-white/40 leading-relaxed">
              Zaxion parses source code into an Abstract Syntax Tree (AST) to extract structural facts without executing the code. This ensures analysis is fast, safe, and 100% deterministic.
            </p>
            <ul className="space-y-2 pt-4">
              {["Function Signatures", "Class Hierarchies", "Import Mapping", "Dependency Graphs"].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-[11px] font-mono text-white/30">
                  <div className="h-1 w-1 bg-neon-cyan/40 rounded-full" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="p-8 rounded-xl border border-white/5 bg-white/[0.01] space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Microscope className="h-5 w-5 text-neon-purple" />
              Risk-Proportional Gating
            </h3>
            <p className="text-sm text-white/40 leading-relaxed">
              Not all changes are equal. Zaxion applies governance based on the risk profile of the code being modified, allowing high velocity in non-critical paths while enforcing strictness in core domains.
            </p>
            <ul className="space-y-2 pt-4">
              {["Domain-Aware Rules", "Change-Impact Scoring", "Path-Based Strictness"].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-[11px] font-mono text-white/30">
                  <div className="h-1 w-1 bg-neon-purple/40 rounded-full" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-black/40 rounded-xl border border-white/5 p-8 backdrop-blur-sm">
          <h3 className="text-lg font-bold mb-4">The Evaluation Flow</h3>
          <div className="space-y-6">
            {[
              { step: "01", title: "Ingestion", desc: "Zaxion receives the PR diff and source metadata via the Protocol Webhook." },
              { step: "02", title: "Parsing", desc: "The engine builds a stateless AST snapshot of the modified files." },
              { step: "03", title: "Comparison", desc: "Code facts are compared against the versioned Constitutional policy." },
              { step: "04", title: "Verdict", desc: "A final rationale is generated and recorded in the Institutional Ledger." }
            ].map((item, i) => (
              <div key={i} className="flex gap-6 items-start">
                <div className="text-xs font-mono text-neon-cyan bg-neon-cyan/5 px-2 py-1 rounded border border-neon-cyan/10 shrink-0">
                  {item.step}
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-white/80">{item.title}</h4>
                  <p className="text-xs text-white/40 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="pt-12 border-t border-white/5">
        <Link 
          to="/docs/security" 
          className="inline-flex items-center gap-2 group text-neon-cyan font-bold tracking-tight hover:underline"
        >
          Next: Security Model & Trust
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
};

export default DocsLogic;
