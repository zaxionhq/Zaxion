import React from 'react';
import { Shield, Lock, Terminal, History, ArrowRight, GitBranch, Search, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import DocsCallout from '../../components/docs/DocsCallout';
import DocsStep from '../../components/docs/DocsStep';

const DocsOverview = () => {
  return (
    <div className="space-y-20">
      {/* Header Section */}
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          Foundational
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white leading-tight">
          Protocol Overview
        </h1>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
          Zaxion is a deterministic governance layer for institutional engineering. It codifies architectural intent into a verifiable protocol, ensuring every change adheres to established institutional standards.
        </p>
      </div>

      <DocsCallout type="security" title="Institutional Mandate">
        Zaxion is not a linting tool. It is a governance enforcement engine designed to ensure that architectural decisions are deliberate, documented, and compliant with institutional risk models.
      </DocsCallout>

      <div className="grid sm:grid-cols-2 gap-12 pt-4">
        <div className="space-y-4">
          <div className="h-10 w-10 rounded border border-white/10 bg-white/[0.02] flex items-center justify-center">
            <Lock className="h-5 w-5 text-indigo-400/70" />
          </div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-tight">Institutional Integrity</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Zaxion acts as an impartial referee. It doesn't write code; it validates it against a versioned constitution of architectural rules.
          </p>
        </div>

        <div className="space-y-4">
          <div className="h-10 w-10 rounded border border-white/10 bg-white/[0.02] flex items-center justify-center">
            <Terminal className="h-5 w-5 text-indigo-400/70" />
          </div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-tight">Deterministic Logic</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Outcomes are 100% predictable. By using AST-based fact extraction, Zaxion removes the ambiguity of fuzzy scoring and heuristic analysis.
          </p>
        </div>
      </div>

      {/* Visual Workflow Section */}
      <section className="space-y-10">
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600">The Enforcement Lifecycle</h2>
          <p className="text-sm text-slate-500">How Zaxion intervenes in the development process.</p>
        </div>

        <div className="pt-4">
          <DocsStep number="01" title="Proposal">
            A developer submits a Pull Request. This represents a proposed change to the institutional codebase state.
          </DocsStep>
          <DocsStep number="02" title="Fact Extraction">
            Zaxion's AST engine parses the diff, extracting structural facts (dependencies, visibility, patterns) without executing code.
          </DocsStep>
          <DocsStep number="03" title="Trial">
            The extracted facts are matched against the versioned Policy Constitution active for that repository.
          </DocsStep>
          <DocsStep number="04" title="Verdict" last>
            A binary PASS or BLOCK is issued. If blocked, a technical rationale is required for any override, creating a signed audit trail.
          </DocsStep>
        </div>
      </section>

      <section className="space-y-8">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600">Core Principles</h2>
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600">Core Principles</h2>
        <div className="grid gap-6">
          {[
            {
              title: "Ownership by Design",
              desc: "Every architectural deviation requires a signed rationale, linking technical debt to explicit institutional accountability.",
              icon: GitBranch
            },
            {
              title: "Permanent Memory",
              desc: "Fact snapshots create a longitudinal audit trail of the protocol's state at the moment of every governance decision.",
              icon: History
            },
            {
              title: "Risk-Proportionality",
              desc: "Governance strictness scales with the sensitivity of the domain, maintaining velocity without compromising core stability.",
              icon: Shield
            }
          ].map((item, i) => (
            <div key={i} className="flex gap-5 p-5 rounded border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-colors group">
              <div className="h-8 w-8 rounded bg-white/5 flex items-center justify-center shrink-0">
                <item.icon className="h-4 w-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-300">{item.title}</h4>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="pt-12 border-t border-white/5">
        <Link 
          to="/docs/constitution" 
          className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Institutional Constitution
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
};

export default DocsOverview;
