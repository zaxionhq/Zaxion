import React from 'react';
import { ArrowRight, ShieldCheck, Scale, History } from 'lucide-react';
import { Link } from 'react-router-dom';

const DocsConstitution = () => {
  return (
    <div className="space-y-16">
      {/* Header Section */}
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          Institutional Framework
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white">
          Governance Constitution
        </h1>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
          The Zaxion Constitution is a verifiable set of rules that defines the boundaries of acceptable architectural change. Every evaluation is anchored to three institutional pillars.
        </p>
      </div>

      {/* Pillars Grid */}
      <div className="grid gap-6">
        {[
          {
            id: "the-law",
            title: "The Law",
            subtitle: "Pillar 01",
            icon: ShieldCheck,
            path: "/docs/constitution/the-law",
            desc: "Versioned, declarative, and immutable policies that define the legal boundaries of your architecture."
          },
          {
            id: "the-judgment",
            title: "The Judgment",
            subtitle: "Pillar 02",
            icon: Scale,
            path: "/docs/constitution/the-judgment",
            desc: "The deterministic trial of a code change, transforming source code into verifiable technical verdicts."
          },
          {
            id: "the-memory",
            title: "The Memory",
            subtitle: "Pillar 03",
            icon: History,
            path: "/docs/constitution/the-memory",
            desc: "The permanent, longitudinal record of all institutional events and architectural intent."
          }
        ].map((pillar) => (
          <Link 
            key={pillar.id}
            to={pillar.path}
            className="group block p-8 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="text-[10px] font-mono tracking-widest text-indigo-400 uppercase">{pillar.subtitle}</div>
                  <h2 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">{pillar.title}</h2>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed max-w-md">
                  {pillar.desc}
                </p>
                <div className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400/50 group-hover:text-indigo-400 transition-colors">
                  Explore Pillar
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
              <div className="h-12 w-12 rounded-lg border border-white/10 bg-white/[0.02] flex items-center justify-center group-hover:border-indigo-500/30 group-hover:bg-indigo-500/5 transition-all">
                <pillar.icon className="h-6 w-6 text-slate-500 group-hover:text-indigo-400 transition-colors" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="pt-12 border-t border-white/5">
        <Link 
          to="/docs/policies" 
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-400 transition-colors"
        >
          Explore Canonical Policies
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
};

export default DocsConstitution;
