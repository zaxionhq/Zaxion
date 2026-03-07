import React from 'react';
import { ArrowRight, Terminal, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import DocsStep from '../../components/docs/DocsStep';

const DocsQuickStart = () => {
  return (
    <div className="space-y-12">
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-indigo-400 uppercase tracking-widest">
          5 Minute Guide
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white leading-tight">
          Quick Start
        </h1>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
          Get from zero to running your first check in a few minutes. All you need is a browser and (optional) a GitHub account.
        </p>
      </div>

      <div className="space-y-10">
        <DocsStep number="01" title="Log in">
          <p className="mb-4 text-slate-400 text-sm">
            Open Zaxion and sign in (e.g. with GitHub). After login you’ll land on the <strong>Governance Dashboard</strong>.
          </p>
          <Link 
            to="/login" 
            className="inline-flex items-center gap-2 px-4 py-2 rounded border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-medium transition-colors"
          >
            <LogIn className="h-3 w-3" />
            Go to Login
            <ArrowRight className="h-3 w-3" />
          </Link>
        </DocsStep>

        <DocsStep number="02" title="Open the Policy Impact Simulator">
          <p className="mb-4 text-slate-400 text-sm">
            On the Dashboard, scroll to <strong>Policy Impact Simulator</strong>. Here you can test any policy against real code without merging anything.
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-400 text-sm ml-4">
            <li>Choose a <strong>Target Policy</strong> (or create one in the next step).</li>
            <li>Choose <strong>Input mode</strong>: Repository (historical PRs), Upload file, Paste code, Upload zip, or <strong>GitHub PR URL</strong>.</li>
            <li>For <strong>GitHub PR URL</strong>, paste a link like <code className="bg-white/10 px-1 rounded text-slate-300">https://github.com/owner/repo/pull/123</code>.</li>
            <li>Click <strong>Analyze</strong>. You’ll see pass/fail, violations, and what to fix.</li>
          </ul>
        </DocsStep>

        <DocsStep number="03" title="Create your first policy (optional)">
          <p className="mb-4 text-slate-400 text-sm">
            Click the <strong>+</strong> button next to “Simulation Configuration” to open <strong>Create New Policy</strong>. Give it a name, set scope (Global / Repository / Branch), then fill <strong>Policy Rules (JSON)</strong>.
          </p>
          <p className="mb-2 text-slate-400 text-sm">
            Use the <strong>Example policy JSON</strong> section in the same dialog—from simple to advanced:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-400 text-sm ml-4 mb-4">
            <li><strong>Simple</strong> – e.g. limit PR size: <code className="bg-white/10 px-1 rounded text-indigo-300">{`{ "type": "pr_size", "max_files": 20 }`}</code></li>
            <li><strong>Simple</strong> – require tests: <code className="bg-white/10 px-1 rounded text-indigo-300">{`{ "type": "coverage", "min_tests": 1 }`}</code></li>
            <li><strong>Medium</strong> – allowed file types or protected paths (see examples in the dialog).</li>
            <li><strong>Advanced</strong> – security pattern scan or code quality (e.g. no console.log).</li>
          </ul>
          <p className="text-slate-400 text-sm">
            Click <strong>Use this</strong> under any example to paste it into the Rules field, then click <strong>Save as Draft</strong>. Your new policy will appear in the Target Policy list.
          </p>
        </DocsStep>

        <DocsStep number="04" title="See results">
          <ul className="list-disc list-inside space-y-2 text-slate-400 text-sm ml-4">
            <li>After <strong>Analyze</strong>, the simulator shows PASS/BLOCK, a short rationale, and any violations with file and line.</li>
            <li>Use <strong>Decisions</strong> and <strong>Analytics</strong> in the sidebar to see past runs, override history, and active policies with full details.</li>
          </ul>
        </DocsStep>
      </div>

      <div className="pt-8 border-t border-white/5 flex gap-4">
        <Link 
          to="/docs/examples" 
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-sm font-medium transition-colors"
        >
          More policy examples (JSON)
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link 
          to="/governance" 
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium transition-colors"
        >
          Open Dashboard
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

export default DocsQuickStart;
