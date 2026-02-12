import React from 'react';
import { History, ArrowRight, GitPullRequest, ShieldCheck, Zap, BarChart3, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import DocsStep from '../../components/docs/DocsStep';
import DocsCallout from '../../components/docs/DocsCallout';

const DocsEnforcementLifecycle = () => {
  return (
    <div className="space-y-20">
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          Technical Engine
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white leading-tight">
          Enforcement Lifecycle
        </h1>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
          The Zaxion enforcement engine operates within the CI/CD pipeline, acting as a final checkpoint for institutional compliance before any code is merged into protected branches.
        </p>
      </div>

      <DocsCallout type="info" title="Zero-Trust Execution">
        Zaxion does not trust the local environment. Every lifecycle event is executed in a volatile, stateless container that is cryptographically isolated from the repository's build environment.
      </DocsCallout>

      <div className="space-y-12">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600">The 4-Stage Protocol</h2>
        <div className="pt-4">
          <DocsStep number="01" title="Ingestion & Protocol Webhook">
            A Pull Request event triggers the Zaxion webhook. The system ingests the diff and identifies the institutional owner of the change. This is the **Deterministic Ingestion** layer where input is validated for purity.
          </DocsStep>
          <DocsStep number="02" title="Simulation & Blast Radius Analysis">
            Before a final verdict, Zaxion simulates the policy change against historical data to calculate the **Blast Radius**. This ensures that new rules don't cause widespread institutional friction without justification.
          </DocsStep>
          <DocsStep number="03" title="Stateless AST Trial">
            The core engine extracts structural facts and judges them against the active Policy Constitution. If violations are found, the PR is blocked with a technical rationale requirement.
          </DocsStep>
          <DocsStep number="04" title="Commitment to Memory" last>
            The final decision is signed and recorded in the permanent ledger. This completes the **Compliance Cycle**, ensuring the governance state is immutable and auditable.
          </DocsStep>
        </div>
      </div>

      <section className="space-y-8">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600">Lifecycle Metrics</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="p-6 rounded border border-white/5 bg-white/[0.01] space-y-4">
            <div className="h-8 w-8 rounded bg-white/5 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-indigo-400" />
            </div>
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-tight">Blast Radius</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Calculates the percentage of existing codebase that would be invalidated by a proposed policy change. High blast-radius rules require multi-signature overrides.
            </p>
          </div>
          <div className="p-6 rounded border border-white/5 bg-white/[0.01] space-y-4">
            <div className="h-8 w-8 rounded bg-white/5 flex items-center justify-center">
              <Search className="h-4 w-4 text-indigo-400" />
            </div>
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-tight">Fact Lineage</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every decision includes a full trace of the symbols and files that led to the verdict, allowing developers to quickly resolve architectural violations.
            </p>
          </div>
        </div>
      </section>

      <div className="pt-12 border-t border-white/5">
        <Link 
          to="/docs/implementation/github-integration" 
          className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          GitHub Integration
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
};

export default DocsEnforcementLifecycle;
