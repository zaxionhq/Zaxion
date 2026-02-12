import React from 'react';
import { ArrowRight, Terminal, ShieldCheck, Scale, History } from 'lucide-react';
import { Link } from 'react-router-dom';
import DocsAccordion from '../../components/docs/DocsAccordion';
import DocsCallout from '../../components/docs/DocsCallout';

const DocsConstitution = () => {
  return (
    <div className="space-y-20">
      {/* Header Section */}
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          Institutional Framework
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white leading-tight">
          Governance Constitution
        </h1>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
          The Zaxion Constitution is a verifiable set of rules that defines the boundaries of acceptable architectural change. Every evaluation is anchored to three institutional pillars.
        </p>
      </div>

      <DocsCallout type="info" title="Constitutional Authority">
        The Constitution is the supreme source of truth for Zaxion. It is versioned, cryptographically signed, and cannot be bypassed without a recorded exception protocol.
      </DocsCallout>

      {/* Pillar 01: The Law */}
      <section id="the-law" className="space-y-8 scroll-mt-20">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded bg-indigo-500/10 flex items-center justify-center">
              <Scale className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="text-[10px] font-mono tracking-widest text-indigo-400 uppercase font-bold">Pillar 01</div>
          </div>
          <h2 className="text-2xl font-bold text-white">The Law (Policy Layer)</h2>
          <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
            The Policy Layer serves as the foundational legal framework of the architecture. It translates abstract governance requirements into versioned, machine-readable constraints.
          </p>
        </div>

        <div className="grid gap-4">
          <DocsAccordion 
            title="Article I: Canonical Immutability" 
            subtitle="Persistence & Versioning"
          >
            <div className="space-y-4">
              <p className="text-sm text-slate-400 leading-relaxed">Every policy committed to Zaxion is assigned a unique cryptographic hash. Once a policy is used in a production judgment, it cannot be modified.</p>
              <div className="bg-black/40 rounded p-4 border border-white/5 space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase">
                  <Terminal className="h-3 w-3" /> Policy Metadata Example
                </div>
                <div className="font-mono text-[11px] space-y-1">
                  <div className="flex gap-4"><span className="text-slate-600 w-24">policy_id:</span> <span className="text-indigo-300">"sha256:e3b0c442..."</span></div>
                  <div className="flex gap-4"><span className="text-slate-600 w-24">version:</span> <span className="text-indigo-300">"2024.02.12.01"</span></div>
                  <div className="flex gap-4"><span className="text-slate-600 w-24">status:</span> <span className="text-emerald-400/70">CANONICAL</span></div>
                </div>
              </div>
            </div>
          </DocsAccordion>

          <DocsAccordion 
            title="Article II: Declarative Boundaries" 
            subtitle="Structural Constraints"
          >
            <div className="space-y-4">
              <p className="text-sm text-slate-400 leading-relaxed">
                Laws are defined using Zaxion-flavored YAML, focusing on structural facts. Every proposed policy change undergoes a **Blast Radius Analysis** to calculate the institutional impact across the existing codebase before activation.
              </p>
              <div className="bg-black/40 rounded p-4 border border-white/5">
                <pre className="text-[11px] text-slate-400 font-mono">
{`rules:
  - id: "layer-isolation"
    type: "dependency-restriction"
    impact_threshold: "5%" # Blast Radius limit
    from: "src/ui/*"
    to: "src/db/*"
    verdict: "BLOCK"`}
                </pre>
              </div>
            </div>
          </DocsAccordion>
        </div>
      </section>

      {/* Pillar 02: The Judgment */}
      <section id="the-judgment" className="space-y-8 scroll-mt-20">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded bg-indigo-500/10 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="text-[10px] font-mono tracking-widest text-indigo-400 uppercase font-bold">Pillar 02</div>
          </div>
          <h2 className="text-2xl font-bold text-white">The Judgment (Evaluation)</h2>
          <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
            Judgment is the deterministic process of evaluating code state against the Law. It eliminates subjectivity by extracting verifiable structural facts.
          </p>
        </div>

        <div className="grid gap-4">
          <DocsAccordion 
            title="Article III: Deterministic Extraction" 
            subtitle="AST Analysis"
          >
            <p className="text-sm text-slate-400 leading-relaxed">The system performs a stateless AST (Abstract Syntax Tree) analysis on every PR. It does not "guess" intent; it extracts verifiable facts—such as dependency cycles and visibility modifiers.</p>
          </DocsAccordion>

          <DocsAccordion 
            title="Article IV: The Binary Verdict" 
            subtitle="Pass/Block Logic"
          >
            <div className="space-y-4">
              <p className="text-sm text-slate-400 leading-relaxed">Every judgment must result in a binary outcome. There are no "warnings" in the Core Layer.</p>
              <DocsCallout type="warning" title="No Soft Violations">
                A "BLOCK" verdict requires immediate resolution or an authorized override. Allowing "warnings" leads to normalized deviance and architectural rot.
              </DocsCallout>
            </div>
          </DocsAccordion>
        </div>
      </section>

      {/* Pillar 03: The Memory */}
      <section id="the-memory" className="space-y-8 scroll-mt-20">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded bg-indigo-500/10 flex items-center justify-center">
              <History className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="text-[10px] font-mono tracking-widest text-indigo-400 uppercase font-bold">Pillar 03</div>
          </div>
          <h2 className="text-2xl font-bold text-white">The Memory (Ledger)</h2>
          <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
            Institutional Memory ensures absolute traceability of architectural evolution. It captures the full context of every decision.
          </p>
        </div>

        <div className="grid gap-4">
          <DocsAccordion 
            title="Article V: Fact Snapshotting" 
            subtitle="Historical State"
          >
            <p className="text-sm text-slate-400 leading-relaxed">At the moment of judgment, Zaxion captures a "Fact Snapshot" of the codebase. This ledger allows architects to reconstruct the state of the system at any point in history.</p>
          </DocsAccordion>

          <DocsAccordion 
            title="Article VI: Signed Overrides" 
            subtitle="Exception Protocols"
          >
            <div className="space-y-4">
              <p className="text-sm text-slate-400 leading-relaxed">In cases where the Law must be bypassed, Zaxion requires a "Signed Override." This is a recorded event tied to a specific identity.</p>
              <div className="p-4 rounded border border-indigo-500/10 bg-indigo-500/[0.02] space-y-3">
                <div className="text-[10px] font-mono text-indigo-400/60 uppercase tracking-widest">Audit Ledger Preview</div>
                <div className="font-mono text-[10px] text-slate-500 space-y-1">
                  <div>[2026-02-12 14:30:01] <span className="text-slate-300">VERDICT: BLOCK</span></div>
                  <div>[2026-02-12 14:32:45] <span className="text-amber-400/70">OVERRIDE_REQUESTED</span> by <span className="text-slate-300">@h_architect</span></div>
                  <div className="pl-4 border-l border-white/5 mt-1">"Rationale: Temporary bypass for legacy system migration. Expiry: 30 days."</div>
                  <div>[2026-02-12 14:32:50] <span className="text-emerald-400/70">OVERRIDE_SIGNED</span> (Hash: 8f1a2c...)</div>
                </div>
              </div>
            </div>
          </DocsAccordion>
        </div>
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
