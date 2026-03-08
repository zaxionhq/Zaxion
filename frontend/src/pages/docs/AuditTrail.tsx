import React from 'react';
import { History, ArrowRight, ShieldCheck, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import DocsInlineFAQ from '../../components/docs/DocsInlineFAQ';

const DocsAuditTrail = () => {
  return (
    <div className="space-y-16">
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          Governance & Audit
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white">
          Institutional Audit Trail
        </h1>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
          The Zaxion audit trail is an immutable record of every governance decision made by the protocol. It provides a longitudinal view of architectural compliance across your organization.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-12">
        <div className="space-y-4">
          <div className="h-8 w-8 rounded border border-white/10 bg-white/[0.02] flex items-center justify-center">
            <ShieldCheck className="h-4 w-4 text-slate-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-tight">Verifiable Evidence</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Every audit entry contains the technical rationale, the policy version, and the identity of the developer involved in the decision.
          </p>
        </div>

        <div className="space-y-4">
          <div className="h-8 w-8 rounded border border-white/10 bg-white/[0.02] flex items-center justify-center">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-tight">Search & Discovery</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Filter the audit trail by repository, policy ID, or override event to identify patterns of architectural debt.
          </p>
        </div>
      </div>

      <section className="space-y-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600">Audit Entry Anatomy</h2>
        <div className="bg-[#0a0a0a] rounded border border-white/5 p-6 font-mono text-[10px] text-slate-500 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/20 group-hover:bg-indigo-500/40 transition-colors" />
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-indigo-400">event_id:</span>
              <span>"evt_2026_0212_001"</span>
            </div>
            <div className="flex justify-between">
              <span className="text-indigo-400">repo_name:</span>
              <span>"institutional-core-api"</span>
            </div>
            <div className="flex justify-between">
              <span className="text-indigo-400">commit_hash:</span>
              <span>"8f1a2c3..."</span>
            </div>
            <div className="flex justify-between">
              <span className="text-indigo-400">policy_v:</span>
              <span>"1.2.0"</span>
            </div>
            <div className="flex justify-between">
              <span className="text-indigo-400">verdict:</span>
              <span className="text-red-400">BLOCK (OVERRIDDEN)</span>
            </div>
            <div className="pt-2 border-t border-white/5">
              <p className="text-indigo-400 mb-1">rationale:</p>
              <p className="italic">"Legacy dependency required for internal SDK compatibility."</p>
            </div>
            <div className="flex justify-between pt-2 border-t border-white/5">
              <span className="text-indigo-400">blast_radius:</span>
              <span>"2.4%"</span>
            </div>
          </div>
        </div>
      </section>

      <div className="pt-12 border-t border-white/5">
        <Link 
          to="/docs/signed-overrides" 
          className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Signed Overrides
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <DocsInlineFAQ 
        title="Audit Trail – FAQ"
        items={[
          {
            question: "How long are audit logs stored?",
            answer: "By default, Zaxion stores audit logs for 12 months. Enterprise customers can configure custom retention policies or export logs to their own data warehouse for long-term storage and compliance reporting."
          },
          {
            question: "Can audit entries be deleted or modified?",
            answer: "No. The audit trail is immutable. Once a decision event is recorded and signed, it cannot be altered. This ensures a tamper-proof record of all governance activity, which is critical for security and regulatory compliance."
          },
          {
            question: "Who can access the audit trail?",
            answer: "Access to the audit trail is restricted to users with administrative or audit-level roles. Permissions are managed through Zaxion's RBAC system, and all access to audit data is itself logged for security purposes."
          }
        ]}
      />
    </div>
  );
};

export default DocsAuditTrail;
