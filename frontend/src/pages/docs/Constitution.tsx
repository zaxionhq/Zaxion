import React from 'react';
import { ArrowRight, Terminal } from 'lucide-react';
import { Link } from 'react-router-dom';
import DocsAccordion from '../../components/docs/DocsAccordion';

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

      {/* Pillar 01: The Law */}
      <section className="space-y-8">
        <div className="space-y-3">
          <div className="text-[10px] font-mono tracking-widest text-indigo-400 uppercase">Pillar 01</div>
          <h2 className="text-2xl font-bold text-white">The Law (Policy Layer)</h2>
          <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">
            Policies are versioned, declarative, and immutable. They define the legal boundaries of your architecture.
          </p>
        </div>

        <div className="grid gap-4">
          <DocsAccordion 
            title="Article I: Canonical Immutability" 
            subtitle="Persistence & Versioning"
          >
            <p>Every policy committed to Zaxion is assigned a unique cryptographic hash. Once a policy is used in a production judgment, it cannot be modified. Changes must be issued as a new version, ensuring that historical audits remain accurate to the specific rules active at the time of execution.</p>
            <div className="bg-black/40 rounded p-4 border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase">
                <Terminal className="h-3 w-3" /> Technical Spec
              </div>
              <code className="text-[11px] text-indigo-300 block">
                policy_id: "sha256:e3b0c442..."<br />
                version: "2024.02.12.01"<br />
                state: "CANONICAL"
              </code>
            </div>
          </DocsAccordion>

          <DocsAccordion 
            title="Article II: Declarative Boundaries" 
            subtitle="Structural Constraints"
          >
            <p>Laws are defined using Zaxion-flavored YAML, focusing on structural facts rather than implementation details. This allows for language-agnostic enforcement across polyglot repositories.</p>
          </DocsAccordion>
        </div>
      </section>

      {/* Pillar 02: The Judgment */}
      <section className="space-y-8">
        <div className="space-y-3">
          <div className="text-[10px] font-mono tracking-widest text-indigo-400 uppercase">Pillar 02</div>
          <h2 className="text-2xl font-bold text-white">The Judgment (Evaluation)</h2>
          <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">
            Judgment is the deterministic trial of a code change, extracting facts and measuring them against the Law.
          </p>
        </div>

        <div className="grid gap-4">
          <DocsAccordion 
            title="Article III: Deterministic Extraction" 
            subtitle="AST Analysis"
          >
            <p>The system performs a stateless AST (Abstract Syntax Tree) analysis on every PR. It does not "guess" intent; it extracts verifiable facts—such as dependency cycles, visibility modifiers, and architectural boundaries.</p>
          </DocsAccordion>

          <DocsAccordion 
            title="Article IV: The Binary Verdict" 
            subtitle="Pass/Block Logic"
          >
            <p>Every judgment must result in a binary outcome. There are no "warnings" in the Core Layer. A change either adheres to the Constitution or it violates it. This removes the ambiguity of "technical debt by consensus."</p>
          </DocsAccordion>
        </div>
      </section>

      {/* Pillar 03: The Memory */}
      <section className="space-y-8">
        <div className="space-y-3">
          <div className="text-[10px] font-mono tracking-widest text-indigo-400 uppercase">Pillar 03</div>
          <h2 className="text-2xl font-bold text-white">The Memory (Ledger)</h2>
          <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">
            Institutional memory is the permanent record of all governance events and technical intent.
          </p>
        </div>

        <div className="grid gap-4">
          <DocsAccordion 
            title="Article V: Fact Snapshotting" 
            subtitle="Historical State"
          >
            <p>At the moment of judgment, Zaxion captures a "Fact Snapshot" of the codebase. This ledger allows architects to reconstruct the state of the system at any point in history, providing a perfect audit trail for compliance.</p>
          </DocsAccordion>

          <DocsAccordion 
            title="Article VI: Signed Overrides" 
            subtitle="Exception Protocols"
          >
            <p>In cases where the Law must be bypassed, Zaxion requires a "Signed Override." This is not a simple button click; it is a recorded event tied to a specific identity and a technical justification, stored permanently in the ledger.</p>
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
