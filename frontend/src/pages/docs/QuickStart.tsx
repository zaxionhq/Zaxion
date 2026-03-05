import React from 'react';
import { ArrowRight, Terminal } from 'lucide-react';
import { Link } from 'react-router-dom';
import DocsCallout from '../../components/docs/DocsCallout';
import DocsStep from '../../components/docs/DocsStep';

const DocsQuickStart = () => {
  return (
    <div className="space-y-12">
      {/* Header Section */}
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-indigo-400 uppercase tracking-widest">
          5 Minute Guide
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white leading-tight">
          Quick Start
        </h1>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
          Get Zaxion running in your repository in under 5 minutes.
        </p>
      </div>

      <div className="space-y-10">
        <DocsStep number="01" title="Install the GitHub App">
          <p className="mb-4 text-slate-400 text-sm">
            Navigate to the Zaxion GitHub App page and click <strong>Install</strong>. Select the repositories you want to protect.
          </p>
          <a href="#" className="inline-flex items-center gap-2 px-4 py-2 rounded border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-medium transition-colors">
            Install GitHub App
            <ArrowRight className="h-3 w-3" />
          </a>
        </DocsStep>

        <DocsStep number="02" title="Configure Your First Policy">
          <p className="mb-4 text-slate-400 text-sm">
            Create a file named <code className="bg-white/10 px-1 rounded text-indigo-300">.zaxion.yaml</code> in the root of your repo.
          </p>
          <div className="p-4 rounded bg-black border border-white/10 font-mono text-xs text-slate-300 overflow-x-auto">
            <pre>{`version: 1.0.0
policies:
  # Rule: Warn if a PR has more than 20 files
  - name: "PR Size Check"
    type: "pr_size"
    threshold: 20
    action: "warn"

  # Rule: Block if critical files are changed without tests
  - name: "Critical Path Tests"
    type: "coverage"
    paths: ["src/auth/**", "src/payments/**"]
    min_tests: 1
    action: "block"`}</pre>
          </div>
        </DocsStep>

        <DocsStep number="03" title="See It in Action">
          <ul className="list-disc list-inside space-y-2 text-slate-400 text-sm ml-4">
            <li>Create a new branch: <code className="bg-white/10 px-1 rounded text-slate-300">git checkout -b test-zaxion</code></li>
            <li>Make a small change to a file.</li>
            <li>Push the branch and open a Pull Request.</li>
            <li>Watch the checks appear in the PR status area!</li>
          </ul>
        </DocsStep>
      </div>

      <div className="pt-8 border-t border-white/5 flex gap-4">
        <Link 
          to="/docs/use-cases" 
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-sm font-medium transition-colors"
        >
          Explore Use Cases
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

export default DocsQuickStart;
