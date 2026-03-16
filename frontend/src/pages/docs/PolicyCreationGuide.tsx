import React from 'react';
import { Shield, CheckCircle2, Zap, Rocket, BookOpen, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/**
 * Simplified documentation for policy creation and governance rules.
 * Focuses on current capabilities using friendly language.
 */
const PolicyCreationDocs = () => {
  const capabilities = [
    {
      title: "Quick Start with Templates",
      description: "Choose from our core library of 30 enterprise policies. These are pre-configured to handle common security and quality needs immediately.",
      icon: Zap
    },
    {
      title: "Smart Policy Editor",
      description: "Create custom rules using our visual editor. You can write your requirements in simple English, and our AI will help set up the technical details.",
      icon: Settings
    },
    {
      title: "Safety Simulations",
      description: "Before you activate a policy, run a simulation. This shows you exactly which Pull Requests would have been affected, so there are no surprises.",
      icon: Shield
    }
  ];

  const ruleExamples = [
    { type: "PR Size", desc: "Keep reviews manageable by limiting how many files can change at once." },
    { type: "Security Scan", desc: "Automatically find hardcoded secrets or unsafe code patterns before they are merged." },
    { type: "Test Coverage", desc: "Ensure every important change comes with the right amount of tests." },
    { type: "Code Quality", desc: "Automatically block console logs or debug statements from reaching production." }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-8">
      {/* Header */}
      <div className="space-y-4">
        <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">Feature Guide</Badge>
        <h1 className="text-3xl font-bold text-white">Creating & Managing Policies</h1>
        <p className="text-slate-400 text-lg">
          Zaxion helps your team maintain high standards without slowing down. Set up automated guardrails that review code as fast as you write it.
        </p>
      </div>

      {/* Main Capabilities */}
      <div className="grid md:grid-cols-3 gap-6">
        {capabilities.map((item, i) => (
          <div key={i} className="p-6 rounded-xl border border-white/5 bg-white/[0.02] space-y-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <item.icon className="h-5 w-5 text-indigo-400" />
            </div>
            <h3 className="font-bold text-white">{item.title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{item.description}</p>
          </div>
        ))}
      </div>

      {/* Supported Scenarios */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Rocket className="h-5 w-5 text-indigo-400" />
          What you can automate today
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {ruleExamples.map((item, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-lg border border-white/5 bg-white/[0.01]">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-slate-200">{item.type}</h4>
                <p className="text-sm text-slate-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Forward Looking */}
      <section className="p-8 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-indigo-500/20">
            <BookOpen className="h-5 w-5 text-indigo-400" />
          </div>
          <h3 className="text-lg font-bold text-white">Continuous Improvements</h3>
        </div>
        <p className="text-sm text-slate-400 leading-relaxed">
          We are constantly adding new rule types and smarter analysis tools. Our goal is to make Zaxion the most helpful member of your team, providing instant feedback so you can ship great code with confidence.
        </p>
      </section>
    </div>
  );
};

export default PolicyCreationDocs;
