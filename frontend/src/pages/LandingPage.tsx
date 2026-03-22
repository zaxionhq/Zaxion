import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Shield, 
  Zap, 
  ListChecks, 
  ArrowRight, 
  Github, 
  Lock, 
  CheckCircle2, 
  Code2, 
  Cpu,
  GitPullRequest,
  AlertTriangle,
  History,
  Scale,
  Ban,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { GovernanceRecordCard } from '@/components/governance/GovernanceRecordCard';
import { GovernanceAuditTrail } from '@/components/governance/GovernanceAuditTrail';
import { NeonButton } from '@/components/ui/neon-button';
import { GlassCard } from '@/components/ui/glass-card';
import { cn } from '@/lib/utils';
import { LoadingOverlay } from '@/components/ui/loading-overlay';

const LandingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isTransitioning, setIsTransitioning] = React.useState(false);

  // Handle delayed navigation for docs
  const handleDocsNavigation = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsTransitioning(true);
    setTimeout(() => {
      navigate('/docs');
    }, 1500); // 1.5s delay for institutional feel
  };

  // Handle deep link redirects from GitHub "Fix with Zaxion" button
  useEffect(() => {
    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');
    const pr = searchParams.get('pr');

    if (owner && repo && pr) {
      navigate(`/pr/${owner}/${repo}/${pr}`);
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-neon-cyan/30 overflow-x-hidden">
      <LoadingOverlay isVisible={isTransitioning} message="Initializing Governance Docs..." />
      {/* Background depth layers */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-neon-purple/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-neon-cyan/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 radial-bg opacity-50" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="relative">
              <div className="absolute -inset-2 bg-neon-cyan/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <img 
                src="/Zaxion landing page logo.png" 
                alt="Zaxion" 
                className="h-12 md:h-14 w-auto object-contain relative z-10 transition-transform duration-500 group-hover:scale-110" 
              />
            </div>
            <span className="text-xl font-black tracking-tighter hidden sm:block ml-1">
              ZAXION<span className="text-neon-cyan">.</span>
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a 
              href="/docs" 
              onClick={handleDocsNavigation}
              className="text-sm font-medium text-white/60 hover:text-neon-cyan transition-colors"
            >
              Documentation
            </a>

            <a href="#problem" className="text-sm font-medium text-white/60 hover:text-neon-cyan transition-colors">The Problem</a>
            <a href="#use-cases" className="text-sm font-medium text-white/60 hover:text-neon-cyan transition-colors">Use Cases</a>
            <NeonButton variant="glass" color="cyan" className="px-6 py-2 text-sm" onClick={() => navigate('/governance')}>
              Login
            </NeonButton>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-32">
        {/* SECTION 1 — Hero */}
        <section className="container mx-auto px-6 mb-32">
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel text-[10px] font-black tracking-[0.2em] uppercase mb-8 border-neon-cyan/30 text-neon-cyan shadow-neon-cyan/10 shadow-lg">
              <Zap className="h-3 w-3" />
              Automated Code Review for Startups
            </div>
            
            <h1 className="text-5xl md:text-8xl font-black tracking-tight mb-8 leading-[1.1] md:leading-[0.9]">
              Find Hardcoded Secrets <br />
              <span className="gradient-text">In Every PR. Automatically.</span>
            </h1>

            <div className="mb-8">
              <p className="text-lg md:text-2xl font-bold text-white/80">
                Install on GitHub. Check 31 code standards automatically.
                <span className="text-neon-cyan block md:inline md:ml-2">Block bad PRs before merge. Set up in 30 seconds.</span>
              </p>
            </div>

            <div className="flex flex-col items-center gap-6">
              <NeonButton color="cyan" size="lg" className="px-12 h-14 text-lg" onClick={() => navigate('/governance')}>
                Install on GitHub - Free
                <ArrowRight className="h-5 w-5 ml-2 inline" />
              </NeonButton>
              
              <div className="flex flex-col items-center gap-4">
                <div className="flex flex-wrap justify-center gap-4 md:gap-8">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-neon-cyan" />
                    <span className="text-[10px] font-black tracking-[0.1em] uppercase text-white/60">Always Free</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-neon-cyan" />
                    <span className="text-[10px] font-black tracking-[0.1em] uppercase text-white/60">No credit card</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-neon-cyan" />
                    <span className="text-[10px] font-black tracking-[0.1em] uppercase text-white/60">30-second setup</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Artifact - MAIN PROOF */}
            <div className="mt-24 w-full flex flex-col items-center gap-8">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl glass-panel border-red-500/30 bg-red-500/5 animate-pulse">
                <AlertTriangle className="h-6 w-6 text-red-500" />
                <span className="text-lg font-black tracking-tight text-white">Zaxion caught 8 security bugs</span>
              </div>
              <div className="relative group">
                <div className="absolute -inset-4 bg-neon-cyan/10 blur-3xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                <img 
                  src="/github-pr-comment-proof.png"
                  alt="Zaxion catching security bugs in a GitHub PR" 
                  className="rounded-xl border border-white/10 shadow-2xl relative z-10 max-w-4xl w-full transition-transform duration-500 hover:scale-[1.02] cursor-zoom-in"
                />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2 — Zaxion in Action */}
        <section className="py-32 bg-white/[0.01] border-y border-white/5">
          <div className="container mx-auto px-6">
            <div className="max-w-5xl mx-auto text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">Zaxion in Action</h2>
              <p className="text-xl text-white/40">Real-time protection for your codebase.</p>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                {[
                  { 
                    label: "SECURITY", 
                    title: "Found Hardcoded Secret", 
                    desc: "Zaxion detected a GitHub Personal Access Token being committed in plain text.",
                    color: "red"
                  },
                  { 
                    label: "SECURITY", 
                    title: "SQL Injection Blocked", 
                    desc: "Identified raw SQL query using unsanitized user input in the data layer.",
                    color: "orange"
                  },
                  { 
                    label: "QUALITY", 
                    title: "Production Console Log", 
                    desc: "Flagged console.log statements that shouldn't reach production code.",
                    color: "cyan"
                  }
                ].map((item, i) => (
                  <div key={i} className="p-6 rounded-xl border border-white/5 bg-white/[0.02] hover:border-white/10 transition-colors">
                    <div className={cn("text-[10px] font-black tracking-widest uppercase mb-2", `text-${item.color}-500`)}>
                      {item.label}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-white/40 text-sm">{item.desc}</p>
                  </div>
                ))}
              </div>
              <div className="glass-panel p-4 rounded-2xl border-white/10 overflow-hidden">
                <img src="/zaxion-action-screenshot.png" alt="Zaxion PR Comment Action" className="rounded-lg shadow-2xl transition-transform duration-500 hover:scale-110 cursor-zoom-in" />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3 — 31 Policies */}
        <section className="py-32 border-b border-white/5">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center mb-20">
              <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">31 Policies</h2>
              <p className="text-xl text-white/40">Comprehensive coverage for every aspect of your code.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {[
                { name: "Security", count: 8, icon: Shield },
                { name: "Architecture", count: 3, icon: Code2 },
                { name: "Quality", count: 6, icon: ListChecks },
                { name: "Testing", count: 3, icon: CheckCircle2 },
                { name: "Performance", count: 3, icon: Cpu },
                { name: "Other", count: 3, icon: ListChecks }
              ].map((cat, i) => (
                <div key={i} className="glass-panel p-6 rounded-xl border-white/5 flex flex-col items-center text-center group hover:border-neon-cyan/30 transition-colors">
                  <cat.icon className="h-8 w-8 text-neon-cyan mb-4 group-hover:scale-110 transition-transform" />
                  <div className="text-2xl font-black mb-1">{cat.count}</div>
                  <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider">{cat.name}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 4 — The Cost of Missing One Bug */}
        <section id="problem" className="py-32 bg-white/[0.01] border-b border-white/5">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-black mb-16 tracking-tight text-center">The Cost of Missing One Bug</h2>
              <div className="space-y-12">
                {[
                  { title: "Senior engineers are drowning in manual reviews", desc: "Manual code review is a bottleneck. Senior engineers spend hours catching basic logic errors instead of building core architecture." },
                  { title: "Critical bugs slip through the cracks", desc: "High-risk changes (like payments or auth) often get the same level of scrutiny as simple CSS tweaks, leading to production disasters." },
                  { title: "Inconsistent Standards", desc: "Every reviewer has a different 'vibe'. Zaxion ensures your engineering handbook is enforced mathematically on every single PR." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-8 group">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl glass-panel border-white/10 flex items-center justify-center text-neon-cyan font-black group-hover:border-neon-cyan/50 transition-colors">
                      0{i+1}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-3 group-hover:text-neon-cyan transition-colors">{item.title}</h3>
                      <p className="text-white/40 text-lg leading-relaxed font-medium">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5 — The Zaxion Advantage */}
        <section id="advantage" className="py-32 border-b border-white/5">
          <div className="container mx-auto px-6">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-4xl md:text-6xl font-black mb-24 text-center tracking-tight">The Zaxion Advantage</h2>
              
              <div className="grid md:grid-cols-2 gap-16 items-center mb-32">
                <div className="space-y-8">
                  {[
                    { 
                      title: "Policy Simulator", 
                      desc: "Test new policies against historical PRs to see the impact before you enable them.",
                      icon: Scale
                    },
                    { 
                      title: "Shadow Running", 
                      desc: "Run rules in the background to gather data without blocking your team's workflow.",
                      icon: Ban
                    },
                    { 
                      title: "Immutable Audit Trail", 
                      desc: "A tamper-proof record of every governance decision, perfect for SOC2 and security audits.",
                      icon: Shield
                    },
                    { 
                      title: "Dynamic Risk Scoring", 
                      desc: "Automatically adjust enforcement levels based on the sensitivity of the files being changed.",
                      icon: AlertTriangle
                    },
                    { 
                      title: "Semantic Code Understanding", 
                      desc: "Zaxion understands your code's logic using AST analysis, going far beyond simple regex checks.",
                      icon: Code2
                    }
                  ].map((feature, i) => (
                    <div key={i} className="flex gap-6 group">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl glass-panel border-white/10 flex items-center justify-center text-neon-cyan group-hover:border-neon-cyan/50 transition-colors">
                        <feature.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold mb-1 group-hover:text-neon-cyan transition-colors">{feature.title}</h4>
                        <p className="text-white/40 text-sm leading-relaxed">{feature.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="relative group">
                  <div className="absolute -inset-10 bg-neon-cyan/5 blur-[100px] rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                  <GlassCard className="p-4 relative z-10 overflow-hidden">
                    <img src="/policy-simulator-preview.png" alt="Policy Simulator Feature" className="rounded-lg transition-transform duration-700 hover:scale-110 cursor-zoom-in" />
                    <div className="mt-4 p-4 bg-black/40 rounded-lg border border-white/5 relative z-20">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
                        <span className="text-[10px] font-mono text-neon-cyan uppercase">Simulator Active</span>
                      </div>
                      <p className="text-xs text-white/40">Visualizing the projected impact of 31 policies across 1,402 historical PRs.</p>
                    </div>
                  </GlassCard>
                </div>
              </div>

              {/* Live Audit Trail Integration */}
              <div className="mt-24 md:mt-32 p-6 md:p-12 rounded-2xl border border-white/5 bg-white/[0.01] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 hidden md:block">
                  <Scale className="h-64 w-64" />
                </div>
                
                <div className="grid lg:grid-cols-2 gap-12 md:gap-16 items-center relative z-10">
                  <div className="space-y-6 md:space-y-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-neon-cyan/10 border border-neon-cyan/20 text-[10px] font-mono text-neon-cyan uppercase tracking-widest">
                      Protocol Evidence
                    </div>
                    <h3 className="text-2xl md:text-4xl font-black tracking-tight leading-tight">
                      The Deterministic <br />
                      <span className="gradient-text">Audit Trail.</span>
                    </h3>
                    <p className="text-white/40 text-sm md:text-base leading-relaxed font-medium">
                      Zaxion doesn't just block; it provides a longitudinal record of architectural intent. Every PR is a technical trial, resulting in a verifiable rationale anchored to your constitution.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                      {[
                        "Stateless Evaluation",
                        "Cryptographic Intent Verification",
                        "Immutable Ledger Entry"
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <CheckCircle2 className="h-4 w-4 text-neon-cyan shrink-0" />
                          <span className="text-xs md:text-sm font-bold text-white/60">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-black/40 rounded-xl border border-white/5 p-4 md:p-6 backdrop-blur-sm shadow-2xl overflow-x-auto">
                    <div className="min-w-[300px] md:min-w-0">
                      <GovernanceAuditTrail />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 6 — How to Get Started (New) */}
        <section id="onboarding" className="py-32 bg-white/[0.01] border-y border-white/5">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-black mb-16 text-center tracking-tight">How to Get Started</h2>
              <div className="grid md:grid-cols-4 gap-8">
                {[
                  { step: "1", title: "Install App", desc: "Add the Zaxion GitHub App to your organization in seconds." },
                  { step: "2", title: "Select Repos", desc: "Choose the repositories you want Zaxion to monitor." },
                  { step: "3", title: "Define Policies", desc: "Use our Core Library or define your own custom safety rules." },
                  { step: "4", title: "Ship Safely", desc: "Zaxion automatically handles reviews for your high-risk code." }
                ].map((item, i) => (
                  <div key={i} className="text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center text-neon-cyan font-black mx-auto">
                      {item.step}
                    </div>
                    <h4 className="font-bold text-lg">{item.title}</h4>
                    <p className="text-sm text-white/40 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 7 — Feature Highlights */}
        <section className="py-32 container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Automated Gating",
                description: "Block bugs before they merge. Zaxion uses AST-based analysis to ensure your safety standards are met on every PR.",
                icon: Code2,
                color: "cyan"
              },
              {
                title: "Team Accountability",
                description: "Track every decision. Overrides are logged with clear rationale, ensuring your team stays aligned on technical debt.",
                icon: Shield,
                color: "purple"
              },
              {
                title: "Knowledge Retention",
                description: "Turn your PR history into institutional knowledge. Zaxion remembers past decisions to help guide future policy.",
                icon: History,
                color: "pink"
              }
            ].map((feature, i) => (
              <GlassCard key={i} className="group h-full">
                <div className={cn(
                  "w-12 h-12 rounded-xl mb-6 flex items-center justify-center glass-panel border-white/10 group-hover:border-neon-cyan/50 transition-colors",
                  `shadow-neon-${feature.color}/5`
                )}>
                  <feature.icon className={cn("h-6 w-6", `text-neon-${feature.color}`)} />
                </div>
                <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{feature.description}</p>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* SECTION 8 — Simple Call to Action */}
        <section className="container mx-auto px-6 py-24 md:py-32 border-t border-white/5">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-6xl font-black tracking-tight mb-12 leading-tight">
              Ready to ship with <br />
              <span className="gradient-text">Zero Regressions?</span>
            </h2>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
              <NeonButton color="cyan" size="lg" className="w-full md:w-auto px-12 h-14" onClick={() => navigate('/governance')}>
                Install GitHub App (Free)
              </NeonButton>
              
              <a 
                href="/docs" 
                onClick={handleDocsNavigation}
                className="group flex items-center gap-2 text-sm font-bold text-white/40 hover:text-white transition-colors"
              >
                Read Documentation
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

            <p className="mt-16 text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">
              Instant Setup • No Configuration Required
            </p>
          </div>
        </section>
      </main>

      {/* Simplified Footer */}
      <footer className="py-20 bg-black border-t border-white/5">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-end">
            <div className="space-y-6">
              <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <img src="/Zaxion landing page logo.png" alt="Zaxion" className="h-8 w-auto transition-transform duration-500 group-hover:scale-110" />
                <span className="text-xl font-black tracking-tighter">
                  ZAXION<span className="text-neon-cyan">.</span>
                </span>
              </div>
              <p className="text-xs text-white/20 max-w-sm leading-relaxed">
                Zaxion is the automated code review layer for high-growth engineering teams. 
                Built to help you ship faster by catching high-risk bugs before they hit production.
              </p>
            </div>
            <div className="text-right space-y-2">
              <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Version 7.0.0-Stable</div>
              <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest mt-4">Support: support@zaxion.com</div>
            </div>
          </div>
          <div className="mt-20 pt-8 border-t border-white/5 flex justify-between items-center">
            <span className="text-[9px] font-mono text-white/10 uppercase tracking-[0.4em]">© 2026 Zaxion Inc. All Rights Reserved.</span>
            <div className="flex gap-8">
              <span className="text-[9px] font-mono text-white/10 uppercase tracking-[0.2em]">Privacy Policy</span>
              <span className="text-[9px] font-mono text-white/10 uppercase tracking-[0.2em]">Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;


