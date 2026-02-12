import React from 'react';
import { History, ArrowRight, GitPullRequest, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const DocsEnforcementLifecycle = () => {
  return (
    <div className="space-y-16">
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          Technical Engine
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white">
          Enforcement Lifecycle
        </h1>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
          The Zaxion enforcement engine operates within the CI/CD pipeline, acting as a final checkpoint for institutional compliance before any code is merged into protected branches.
        </p>
      </div>

      <div className="space-y-12">
        <div className="relative pl-8 border-l border-white/5 space-y-12">
          {[
            {
              title: "Trigger: Protocol Webhook",
              desc: "A Pull Request event signals the Zaxion webhook. The system ingests the diff and identifies the institutional owner of the change.",
              icon: GitPullRequest
            },
            {
              title: "Analysis: Stateless Trial",
              desc: "The AST engine extracts code facts. These facts are judged against the active policy set. If violations are found, the PR is blocked with a technical rationale.",
              icon: ShieldCheck
            },
            {
              title: "Persistence: Institutional Memory",
              desc: "The decision, along with the fact snapshot, is recorded in the permanent ledger. This ensures that the governance state is always auditable.",
              icon: History
            }
          ].map((item, i) => (
            <div key={i} className="relative">
              <div className="absolute -left-[41px] top-0 h-4 w-4 rounded-full border border-white/5 bg-[#050505] flex items-center justify-center">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-tight">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

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
