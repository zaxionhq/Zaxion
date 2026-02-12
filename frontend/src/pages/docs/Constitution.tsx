import React from 'react';
import { Scale, ShieldCheck, History, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const DocsConstitution = () => {
  return (
    <div className="space-y-16">
      {/* Header Section */}
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          Architecture
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white">
          Governance Constitution
        </h1>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
          The Zaxion Constitution is a verifiable set of rules that defines the boundaries of acceptable architectural change. Every evaluation is anchored to three institutional pillars.
        </p>
      </div>

      <section className="space-y-12">
        {[
          {
            pillar: "Pillar 01",
            title: "The Law (Policy Layer)",
            icon: ShieldCheck,
            desc: "Policies are versioned, declarative, and immutable. They define the legal boundaries of your architecture. Zaxion maintains a history of versioned rule-sets, ensuring that decisions remain traceable to the specific law active at the time of judgment.",
            features: ["Versioned YAML", "Declarative rules", "Immutable records"]
          },
          {
            pillar: "Pillar 02",
            title: "The Judgment (Evaluation)",
            icon: Scale,
            desc: "Judgment is the deterministic trial of a code change. Using AST analysis, the system extracts structural facts and evaluates them against the constitution. The result is a binary verdict—PASS or BLOCK—backed by a verifiable technical rationale.",
            features: ["Stateless analysis", "AST extraction", "Context-aware gating"]
          },
          {
            pillar: "Pillar 03",
            title: "The Memory (Ledger)",
            icon: History,
            desc: "Institutional memory is the permanent record of all governance events. By capturing Fact Snapshots of the codebase during evaluation, Zaxion builds a longitudinal ledger of architectural intent and technical debt evolution.",
            features: ["Permanent logs", "Fact snapshots", "Override tracking"]
          }
        ].map((item, i) => (
          <div key={i} className="space-y-6 relative group">
            <div className="space-y-3 relative z-10">
              <div className="text-[10px] font-mono tracking-widest text-slate-600 uppercase">{item.pillar}</div>
              <h3 className="text-lg font-bold text-slate-200">{item.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">{item.desc}</p>
              
              <div className="flex flex-wrap gap-4 pt-2">
                {item.features.map((feature, j) => (
                  <div key={j} className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                    <div className="h-1 w-1 rounded-full bg-slate-800" />
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
          to="/docs/policies" 
          className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Canonical Policies
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
};

export default DocsConstitution;
