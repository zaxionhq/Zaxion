import React from 'react';
import { History, Terminal, ArrowRight, Database, Fingerprint, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import DocsAccordion from '../../../components/docs/DocsAccordion';

const TheMemory = () => {
  return (
    <div className="space-y-16">
      {/* Header Section */}
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-indigo-400 uppercase tracking-widest">
          Pillar 03
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white">
          The Memory (Ledger)
        </h1>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
          The Memory is the permanent, longitudinal record of all institutional events. It ensures that architectural intent is never lost and technical debt is always visible.
        </p>
      </div>

      <section className="space-y-12">
        <div className="grid gap-8">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Institutional Ledger</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Zaxion maintains an immutable audit trail of every evaluation, every override, and every policy change. This creates a "Time Machine" for your codebase's architectural integrity.
            </p>
          </div>

          <div className="grid gap-4">
            <DocsAccordion 
              title="Fact Snapshotting" 
              subtitle="The State Record"
              defaultOpen={true}
            >
              <p>At the moment of every Judgment, Zaxion captures a "Fact Snapshot" of the codebase. This is not a copy of the source code, but a structured map of the architectural facts found during extraction. This allows for historical trend analysis of your architecture.</p>
              <div className="bg-black/40 rounded p-4 border border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase">
                  <Database className="h-3 w-3" /> Snapshot Storage
                </div>
                <code className="text-[11px] text-indigo-300 block font-mono">
                  SNAPSHOT_ID: "snap_9912"<br />
                  TIMESTAMP: "2024-02-12T20:34:00Z"<br />
                  FACT_COUNT: 1,242 structural facts recorded
                </code>
              </div>
            </DocsAccordion>

            <DocsAccordion 
              title="Signed Overrides & Justification" 
              subtitle="Exceptions to the Law"
            >
              <p>When the Law is bypassed, the event is recorded as a "Signed Override." This requires a cryptographically signed justification from an authorized architect. Overrides are never deleted; they remain in the Memory forever as a record of intentional technical debt.</p>
              <div className="bg-black/40 rounded p-4 border border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase">
                  <Fingerprint className="h-3 w-3" /> Signed Event
                </div>
                <p className="text-[11px] text-red-400 font-mono italic">
                  "Override issued by @lead_architect: Urgent hotfix for API-v2 bypass. Expiry: 48h."
                </p>
              </div>
            </DocsAccordion>

            <DocsAccordion 
              title="Audit-Trail Compliance" 
              subtitle="Regulatory Readiness"
            >
              <p>For organizations in regulated industries (Finance, Healthcare, Defense), the Memory provides a perfect audit trail. You can prove exactly which rules were enforced on which code changes, by whom, and when.</p>
            </DocsAccordion>
          </div>
        </div>
      </section>

      <div className="pt-12 border-t border-white/5 flex justify-between items-center">
        <Link 
          to="/docs/constitution/the-judgment" 
          className="text-xs font-bold text-slate-500 hover:text-slate-400 transition-colors"
        >
          Pillar 02: The Judgment
        </Link>
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

export default TheMemory;
