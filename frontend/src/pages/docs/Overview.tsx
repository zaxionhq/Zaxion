import React from 'react';
import { Shield, Lock, Terminal, History, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const DocsOverview = () => {
  return (
    <div className="space-y-12">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-neon-cyan/10 border border-neon-cyan/20 text-[10px] font-mono text-neon-cyan uppercase tracking-widest">
          Institutional Foundation
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
          What is <span className="gradient-text">Zaxion?</span>
        </h1>
        <p className="text-xl text-white/40 leading-relaxed font-medium max-w-2xl">
          Zaxion is the deterministic governance layer for institutional engineering teams. It transforms quality gates from simple checklists into a verifiable constitution.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="p-8 rounded-xl border border-white/5 bg-white/[0.01] space-y-4">
          <div className="h-10 w-10 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center">
            <Lock className="h-5 w-5 text-neon-cyan" />
          </div>
          <h3 className="text-xl font-bold">The Referee, Not the Player</h3>
          <p className="text-sm text-white/40 leading-relaxed">
            Unlike Copilots or AI assistants, Zaxion does not write code. It acts as the impartial Referee, ensuring every Pull Request adheres to versioned architectural standards.
          </p>
        </div>

        <div className="p-8 rounded-xl border border-white/5 bg-white/[0.01] space-y-4">
          <div className="h-10 w-10 rounded-lg bg-neon-purple/10 border border-neon-purple/20 flex items-center justify-center">
            <Terminal className="h-5 w-5 text-neon-purple" />
          </div>
          <h3 className="text-xl font-bold">Deterministic Logic</h3>
          <p className="text-sm text-white/40 leading-relaxed">
            Zaxion avoids fuzzy AI scores. Every evaluation is powered by AST-based fact extraction, providing 100% predictable outcomes for every decision.
          </p>
        </div>
      </div>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Core Value Proposition</h2>
        <div className="space-y-4">
          {[
            {
              title: "Decision Ownership",
              desc: "Every override requires a signed rationale, binding architectural debt to a specific owner."
            },
            {
              title: "Institutional Memory",
              desc: "Fact snapshots record the exact state of code during an evaluation, creating a longitudinal audit trail."
            },
            {
              title: "Risk-Proportionality",
              desc: "Apply stricter governance to critical domains (e.g., /auth) while maintaining high velocity in lower-risk areas."
            }
          ].map((item, i) => (
            <div key={i} className="flex gap-4 group">
              <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-neon-cyan shrink-0" />
              <div>
                <h4 className="font-bold text-white/80">{item.title}</h4>
                <p className="text-sm text-white/40">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="pt-12 border-t border-white/5">
        <Link 
          to="/docs/constitution" 
          className="inline-flex items-center gap-2 group text-neon-cyan font-bold tracking-tight hover:underline"
        >
          Next: The Governance Constitution
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
};

export default DocsOverview;
