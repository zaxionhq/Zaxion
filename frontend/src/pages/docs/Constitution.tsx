import React from 'react';
import { Scale, ShieldCheck, History, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const DocsConstitution = () => {
  return (
    <div className="space-y-12">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-neon-cyan/10 border border-neon-cyan/20 text-[10px] font-mono text-neon-cyan uppercase tracking-widest">
          Governance Architecture
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
          The <span className="gradient-text">Constitution.</span>
        </h1>
        <p className="text-xl text-white/40 leading-relaxed font-medium max-w-2xl">
          Zaxion transforms architectural intent into a verifiable constitution. Every evaluation is anchored to three institutional pillars: Law, Judgment, and Memory.
        </p>
      </div>

      <section className="space-y-8">
        {[
          {
            pillar: "Pillar 01",
            title: "LAW: The Policy Layer",
            icon: ShieldCheck,
            desc: "Policies are versioned, declarative, and immutable. They define the legal boundaries of your architecture. When a policy is updated, Zaxion maintains a history of versioned rule-sets, ensuring that old decisions remain traceable to the law that existed at the time of evaluation.",
            features: ["Versioned YAML configuration", "Declarative rule definitions", "Immutable policy records"]
          },
          {
            pillar: "Pillar 02",
            title: "JUDGMENT: Deterministic Evaluation",
            icon: Scale,
            desc: "Zaxion performs a technical trial of every Pull Request. Using AST-based analysis, the system extracts code facts (functions, imports, classes) and evaluates them against the active policy. The result is a binary PASS or BLOCK, backed by a verifiable rationale.",
            features: ["Stateless analysis", "AST fact extraction", "Context-aware gating"]
          },
          {
            pillar: "Pillar 03",
            title: "MEMORY: The Institutional Ledger",
            icon: History,
            desc: "The system never forgets. Every decision, rationale, and override is recorded in a permanent ledger. By capturing 'Fact Snapshots' of the code during evaluation, Zaxion builds a longitudinal record of architectural intent and technical debt.",
            features: ["Permanent decision logs", "Fact snapshot persistence", "Bypass velocity tracking"]
          }
        ].map((item, i) => (
          <div key={i} className="p-8 rounded-xl border border-white/5 bg-white/[0.01] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
              <item.icon className="h-32 w-32" />
            </div>
            
            <div className="space-y-4 relative z-10">
              <div className="text-[10px] font-mono tracking-[0.4em] text-neon-cyan/60 uppercase">{item.pillar}</div>
              <h3 className="text-2xl font-black tracking-tight">{item.title}</h3>
              <p className="text-sm text-white/40 leading-relaxed max-w-2xl">{item.desc}</p>
              
              <div className="flex flex-wrap gap-4 pt-4">
                {item.features.map((feature, j) => (
                  <div key={j} className="flex items-center gap-2 px-3 py-1 rounded bg-white/5 border border-white/5 text-[10px] font-bold text-white/60">
                    <div className="h-1 w-1 rounded-full bg-neon-cyan" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </section>

      <div className="pt-12 border-t border-white/5">
        <Link 
          to="/docs/logic" 
          className="inline-flex items-center gap-2 group text-neon-cyan font-bold tracking-tight hover:underline"
        >
          Next: Technical Logic & AST Analysis
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
};

export default DocsConstitution;
