import React from 'react';
import { Shield, Lock, Terminal, History, ArrowRight, GitBranch, Search, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import DocsCallout from '../../components/docs/DocsCallout';
import DocsStep from '../../components/docs/DocsStep';
import DocsInlineFAQ from '../../components/docs/DocsInlineFAQ';

const DocsOverview = () => {
  return (
    <div className="space-y-20">
      {/* Hero Section: Enterprise Branding */}
      <div className="space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
          Enterprise Governance Engine
        </div>
        <div className="space-y-4">
          <h1 className="text-5xl font-extrabold tracking-tight text-white leading-[1.1]">
            Standardize Engineering <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
              at Organizational Scale.
            </span>
          </h1>
          <p className="text-xl text-slate-400 leading-relaxed max-w-3xl font-medium">
            Zaxion is the deterministic governance layer for modern engineering teams. It transforms your architectural standards from passive documentation into active, automated enforcement across every pull request.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 pt-4">
          <Link 
            to="/docs/quick-start" 
            className="px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
          >
            Start Deploying
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link 
            to="/docs/security" 
            className="px-6 py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-bold transition-all"
          >
            Security Architecture
          </Link>
        </div>
      </div>

      {/* Value Pillars */}
      <div className="grid md:grid-cols-3 gap-8">
        {[
          {
            title: "Deterministic Trust",
            desc: "Zero-execution AST analysis ensures 100% predictable outcomes. No flaky tests, no fuzzy AI logic—just absolute policy compliance.",
            icon: Shield,
            color: "text-blue-400"
          },
          {
            title: "Audit-Ready Ledger",
            desc: "Every architectural deviation is cryptographically signed and stored in an immutable audit trail for compliance and accountability.",
            icon: History,
            color: "text-emerald-400"
          },
          {
            title: "Policy as Code",
            desc: "Define your engineering 'Constitution' using version-controlled JSON policies that scale from single repos to entire organizations.",
            icon: Terminal,
            color: "text-indigo-400"
          }
        ].map((item, i) => (
          <div key={i} className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] space-y-4 relative overflow-hidden group hover:border-white/10 transition-colors">
            <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center mb-6">
              <item.icon className={`h-6 w-6 ${item.color}`} />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">{item.title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      <DocsCallout type="info" title="The Zaxion Difference">
        Unlike traditional linters or static analysis tools that focus on syntax and formatting, Zaxion governs the **structural integrity** and **security posture** of your applications. It bridges the gap between high-level architectural requirements and daily developer workflows.
      </DocsCallout>

      {/* Visual Workflow Section */}
      <section className="space-y-12 py-12 border-y border-white/5">
        <div className="text-center space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-indigo-500">The Governance Lifecycle</h2>
          <p className="text-3xl font-bold text-white">How Zaxion Protects Your Mainline</p>
        </div>

        <div className="grid md:grid-cols-4 gap-4 relative">
          <DocsStep number="01" title="Proposal" description="Developer submits a PR, proposing a state change to the institutional codebase." />
          <DocsStep number="02" title="Extraction" description="Our AST engine parses the diff to extract deep structural facts without code execution." />
          <DocsStep number="03" title="Trial" description="Extracted facts are validated against the active Policy Constitution for the repository." />
          <DocsStep number="04" title="Verdict" description="A binary PASS/BLOCK is issued. All overrides require signed rationale for the audit trail." last />
        </div>
      </section>

      {/* Integration & Ecosystem */}
      <section className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Infrastructure Support</h2>
            <h3 className="text-3xl font-bold text-white">Seamless Ecosystem Integration</h3>
          </div>
          <Link to="/docs/setup-guide" className="text-indigo-400 font-bold flex items-center gap-2 hover:underline">
            View Integration Guides <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { name: "GitHub Enterprise", desc: "Native App & Action support", icon: GitBranch },
            { name: "Multi-Cloud", desc: "AWS, Azure, & GCP Ready", icon: Shield },
            { name: "SAML/SSO", desc: "Enterprise Identity Integration", icon: Lock },
            { name: "REST API", desc: "Automate Governance via Code", icon: Terminal }
          ].map((item, i) => (
            <div key={i} className="p-6 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-indigo-500/5 transition-all">
              <item.icon className="h-5 w-5 text-slate-500 mb-4" />
              <h4 className="text-sm font-bold text-slate-200 mb-1">{item.name}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <DocsInlineFAQ 
        title="Institutional Governance – FAQ"
        items={[
          {
            question: "How does Zaxion compare to static analysis tools (SAST)?",
            answer: "SAST tools search for known vulnerabilities. Zaxion enforces organizational policy. While Zaxion can detect security patterns, its primary role is ensuring architectural consistency and institutional standards (e.g., 'every public API must have an audit log')."
          },
          {
            question: "What is the performance overhead for developers?",
            answer: "Zaxion is built for high-velocity teams. By using deterministic fact extraction instead of full environment builds, typical evaluations complete in under 500ms for even the largest repositories."
          },
          {
            question: "Does Zaxion support custom policy logic?",
            answer: "Yes. Using our Policy DSL (Domain Specific Language), you can define complex rules that check for specific AST nodes, dependency versions, file path interactions, and custom security signatures."
          }
        ]}
      />
    </div>
  );
};

export default DocsOverview;
