import React from 'react';
import { ArrowRight, Terminal, CheckCircle2, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import DocsStep from '../../components/docs/DocsStep';
import DocsInlineFAQ from '../../components/docs/DocsInlineFAQ';

const DocsGettingStarted = () => {
  return (
    <div className="space-y-16">
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[11px] font-bold text-indigo-400 uppercase tracking-widest">
          Deployment Guide
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
          Quick Start: Deploying Zaxion
        </h1>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
          Zaxion is designed to be integrated into your engineering workflow in minutes. Whether you are testing a single policy or rolling out organizational governance, follow this guide to get started.
        </p>
      </div>

      <div className="grid gap-8 sm:grid-cols-3">
        {[
          {
            title: "1. Define Policies",
            desc: "Translate your engineering handbook into executable JSON rules that define your architectural constitution.",
            icon: Shield
          },
          {
            title: "2. Simulate Impact",
            desc: "Test your policies against existing PRs or code snippets to understand impact before enabling enforcement.",
            icon: CheckCircle2
          },
          {
            title: "3. Enforce Governance",
            desc: "Activate policies on your repositories to automatically block non-compliant code and create audit trails.",
            icon: Terminal
          }
        ].map((item, i) => (
          <div key={i} className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] space-y-4 hover:border-white/10 transition-colors">
            <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <item.icon className="h-5 w-5 text-indigo-400" />
            </div>
            <h3 className="text-base font-bold text-white">{item.title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      <section className="space-y-10 pt-10 border-t border-white/5">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Core Workflow Steps</h2>
          <p className="text-slate-500">From initial setup to organization-wide governance.</p>
        </div>
        
        <div className="space-y-6">
          <DocsStep number="01" title="Access the Governance Dashboard" to="/governance">
            Your central command for all governance activities. Monitor organizational health, override rates, and policy compliance from a single interface.
          </DocsStep>
          
          <DocsStep number="02" title="Create Your First Policy" to="/governance">
            Navigate to the Policy Library. Use our DSL to define rules like mandatory unit tests, secret detection, or architectural boundaries. Start with a template to move faster.
          </DocsStep>
          
          <DocsStep number="03" title="Run a Policy Simulation" to="/governance">
            Before going live, use the **Impact Simulator**. Upload code, paste a snippet, or provide a GitHub PR URL to see exactly how your new policy would affect existing workflows.
          </DocsStep>
          
          <DocsStep number="04" title="Activate & Monitor" to="/governance/decisions">
            Once satisfied, enable the policy for specific repositories. Track all decisions and overrides in the **Audit Ledger** to maintain full transparency.
          </DocsStep>
        </div>
      </section>

      <div className="flex items-center justify-between p-8 rounded-2xl border border-indigo-500/20 bg-indigo-500/5">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white">Ready for production?</h3>
          <p className="text-sm text-slate-400 font-medium">Configure the GitHub App for automated PR enforcement.</p>
        </div>
        <Link 
          to="/docs/quick-start" 
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
        >
          View Quick Start
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <DocsInlineFAQ
        title="Onboarding – FAQ"
        items={[
          {
            question: "Is there a free trial for enterprise features?",
            answer: "Yes. Every new Zaxion account starts with a 14-day trial of our full Enterprise suite, including advanced policy simulation and SSO integration."
          },
          {
            question: "How do I invite my engineering team?",
            answer: "You can manage team access via the Settings panel in the Governance Dashboard. We support both direct invitations and automated provisioning via SAML."
          },
          {
            question: "Can I use Zaxion with private repositories?",
            answer: "Absolutely. Zaxion is designed with a security-first architecture. For private repositories, we recommend using our GitHub App integration which uses short-lived tokens and never stores your source code."
          }
        ]}
      />
    </div>
  );
};

export default DocsGettingStarted;
