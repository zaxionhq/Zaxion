import React from 'react';
import { ArrowRight, Terminal, CheckCircle2, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import DocsStep from '../../components/docs/DocsStep';

const DocsGettingStarted = () => {
  return (
    <div className="space-y-12">
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-indigo-400 uppercase tracking-widest">
          New User Guide
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white leading-tight">
          Getting Started with Zaxion
        </h1>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
          Zaxion checks your code before it gets merged. You set rules (like “every PR must have tests” or “no secrets in code”), and Zaxion runs those checks on every Pull Request—or on code you paste, upload, or point to via a GitHub PR URL. No extra tools needed to understand it.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {[
          {
            title: "Catch problems early",
            desc: "Run checks on PRs, pasted code, uploaded files, or zips. See pass/fail and what to fix before merge.",
            icon: Shield
          },
          {
            title: "Set your own rules",
            desc: "Create policies in plain JSON: limit PR size, require tests, protect folders, block secrets, and more.",
            icon: CheckCircle2
          },
          {
            title: "One dashboard",
            desc: "Dashboard, Policy Simulator, Decisions, and Analytics live in one place. No jumping between apps.",
            icon: Terminal
          }
        ].map((item, i) => (
          <div key={i} className="p-5 rounded-lg border border-white/5 bg-white/[0.01] space-y-3">
            <item.icon className="h-5 w-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-200">{item.title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      <section className="space-y-8 pt-8 border-t border-white/5">
        <h2 className="text-2xl font-bold text-white">What you can do in Zaxion</h2>
        <div className="space-y-4">
          <DocsStep number="01" title="Dashboard" to="/governance">
            See trust score, override rate, and workflow impact. Quick view of how governance is doing.
          </DocsStep>
          <DocsStep number="02" title="Policy Impact Simulator" to="/governance">
            Test a policy without merging anything. Pick a policy, then give it code via <strong>Upload file</strong>, <strong>Paste code</strong>, <strong>Upload zip</strong>, or <strong>GitHub PR URL</strong>. Click Analyze to see pass/fail and violations.
          </DocsStep>
          <DocsStep number="03" title="Create a policy" to="/governance">
            Click the + next to “Simulation Configuration,” name the policy, set scope (Global, Repo, or Branch), and paste <strong>Policy Rules (JSON)</strong>. Use the example formats (simple → advanced) in the dialog—e.g. PR size, coverage, file types, security paths, or security/code-quality scans.
          </DocsStep>
          <DocsStep number="04" title="Decisions & Analytics" to="/governance/decisions">
            View past decisions and override history. In Analytics, see violation hotspots and the full list of active policies with descriptions and affected paths.
          </DocsStep>
        </div>
      </section>

      <div className="pt-8">
        <Link 
          to="/docs/quick-start" 
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium transition-colors"
        >
          Next: Quick Start (step-by-step)
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

export default DocsGettingStarted;
