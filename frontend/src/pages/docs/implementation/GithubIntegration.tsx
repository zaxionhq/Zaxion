import React from 'react';
import { BookOpen, ArrowRight, Github, Key } from 'lucide-react';
import { Link } from 'react-router-dom';

const DocsGithubIntegration = () => {
  return (
    <div className="space-y-16">
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          Implementation
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white">
          GitHub Integration
        </h1>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
          Zaxion integrates natively with GitHub via an Institutional Webhook. It monitors Pull Request lifecycle events and injects governance verdicts directly into the developer workflow.
        </p>
      </div>

      <div className="space-y-12">
        <div className="p-8 rounded border border-white/5 bg-white/[0.01] space-y-6">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600">Setup Workflow</h2>
          <div className="space-y-6 text-sm text-slate-500">
            <div className="flex gap-4">
              <div className="h-6 w-6 rounded-full border border-white/10 flex items-center justify-center text-[10px] font-mono shrink-0">1</div>
              <p><strong className="text-slate-300">Register Webhook:</strong> Point your repository webhooks to the Zaxion protocol endpoint with <code className="text-xs text-indigo-400 bg-white/5 px-1 rounded">pull_request</code> events enabled.</p>
            </div>
            <div className="flex gap-4">
              <div className="h-6 w-6 rounded-full border border-white/10 flex items-center justify-center text-[10px] font-mono shrink-0">2</div>
              <p><strong className="text-slate-300">Authorize App:</strong> Install the Zaxion GitHub App to grant the protocol permission to post check-run statuses and comment on rationales.</p>
            </div>
            <div className="flex gap-4">
              <div className="h-6 w-6 rounded-full border border-white/10 flex items-center justify-center text-[10px] font-mono shrink-0">3</div>
              <p><strong className="text-slate-300">Secure Secret:</strong> Configure the Webhook Secret to ensure all incoming payloads are cryptographically signed by GitHub.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-12">
        <div className="space-y-4">
          <div className="h-8 w-8 rounded border border-white/10 bg-white/[0.02] flex items-center justify-center">
            <Github className="h-4 w-4 text-slate-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-tight">Check Runs</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Zaxion verdicts appear as native GitHub Check Runs, allowing you to enforce "Required Status Checks" on protected branches.
          </p>
        </div>

        <div className="space-y-4">
          <div className="h-8 w-8 rounded border border-white/10 bg-white/[0.02] flex items-center justify-center">
            <Key className="h-4 w-4 text-slate-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-tight">OAuth Scoping</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            The protocol uses strict OAuth scopes, requesting only the minimum permissions necessary to read code facts and post governance verdicts.
          </p>
        </div>
      </div>

      <div className="pt-12 border-t border-white/5">
        <Link 
          to="/docs/implementation/policy-configuration" 
          className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Policy Configuration
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
};

export default DocsGithubIntegration;
