import React from 'react';
import { ArrowRight, Terminal, CheckCircle2, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import DocsCallout from '../../components/docs/DocsCallout';
import DocsStep from '../../components/docs/DocsStep';

const DocsGettingStarted = () => {
  return (
    <div className="space-y-12">
      {/* Header Section */}
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-indigo-400 uppercase tracking-widest">
          New User Guide
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white leading-tight">
          Getting Started with Zaxion
        </h1>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
          Zaxion is an automated code reviewer that lives in your GitHub repository. It acts like a senior engineer who never sleeps, checking every Pull Request (PR) against your team's standards.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {[
          {
            title: "Catch Bugs Early",
            desc: "Ensure every critical change has tests before it merges.",
            icon: Shield
          },
          {
            title: "Enforce Standards",
            desc: "Prevent 'mega-PRs' and protect sensitive files automatically.",
            icon: CheckCircle2
          },
          {
            title: "Save Time",
            desc: "Automate the boring parts of code review so you can focus on logic.",
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
        <h2 className="text-2xl font-bold text-white">Your Journey</h2>
        <div className="space-y-4">
          <DocsStep number="01" title="Install the GitHub App" to="/docs/quick-start">
            Connect Zaxion to your repositories in just a few clicks.
          </DocsStep>
          <DocsStep number="02" title="Configure Policies" to="/docs/examples">
            Add a simple .zaxion.yaml file to define your rules.
          </DocsStep>
          <DocsStep number="03" title="See it in Action" to="/docs/quick-start">
            Open a PR and watch Zaxion validate your changes automatically.
          </DocsStep>
        </div>
      </section>

      <div className="pt-8">
        <Link 
          to="/docs/quick-start" 
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium transition-colors"
        >
          Start the 5-Minute Quick Start
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

export default DocsGettingStarted;
