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
              Install GitHub App (Free)
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
              Catch Bugs <br />
              <span className="gradient-text">Before They Ship.</span>
            </h1>

            <div className="mb-8">
              <p className="text-lg md:text-2xl font-bold text-white/80">
                Automate Code Review for High-Risk Code. 
                <span className="text-neon-cyan block md:inline md:ml-2">Block bugs, not velocity.</span>
              </p>
            </div>
    
            <p className="text-lg text-white/40 max-w-2xl mb-12 leading-relaxed font-medium">
              Automatically blocks risky PRs until they meet your standards. No more bugs. No more tech debt. Ship faster with confidence.
            </p>

            <div className="flex flex-col items-center gap-6">
              <NeonButton color="cyan" size="lg" className="px-12 h-14 text-lg" onClick={() => navigate('/governance')}>
                Install GitHub App (Free)
                <ArrowRight className="h-5 w-5 ml-2 inline" />
              </NeonButton>
              
              <div className="flex flex-col items-center gap-2">
                <p className="text-[10px] font-black tracking-[0.2em] uppercase text-white/20">
                  Takes 5 Minutes • No Credit Card Required
                </p>
              </div>
            </div>

            {/* Hero Artifact */}
            <div className="mt-24 w-full flex justify-center opacity-100">
              <GovernanceRecordCard />
            </div>
          </div>
        </section>

        {/* SECTION 2 — The Problem */}
        <section id="problem" className="py-32 bg-white/[0.01] border-y border-white/5">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-black mb-16 tracking-tight">Why PR Quality Gates Fail</h2>
              <div className="space-y-12">
                {[
                  { title: "Senior engineers are drowning in manual reviews", desc: "Manual code review is a bottleneck. Senior engineers spend hours catching basic logic errors instead of building core architecture." },
                  { title: "Critical bugs slip through the cracks", desc: "High-risk changes (like payments or auth) often get the same level of scrutiny as simple CSS tweaks, leading to production disasters." },
                  { title: "Tech debt accumulates silently", desc: "Without automated enforcement, inconsistent patterns and 'quick fixes' become permanent fixtures in your codebase." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-6 items-start group">
                    <div className="w-1 h-12 bg-white/10 group-hover:bg-neon-cyan transition-colors shrink-0 mt-1" />
                    <div>
                      <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                      <p className="text-white/40 text-lg leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3 — Start Small (Moved & Renamed) */}
        <section className="py-32 border-b border-white/5 bg-black/20">
          <div className="container mx-auto px-6">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-black mb-8 text-center tracking-tight">Start Small, Scale Gradually</h2>
              <p className="text-white/40 text-center mb-16 max-w-2xl mx-auto text-sm">
                Zaxion isn't a "flip the switch" tool. You can introduce it gradually to your team's workflow.
              </p>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { mode: "OBSERVE ONLY", desc: "Passive monitoring. Zaxion records decisions in the background to baseline current architectural compliance without affecting velocity." },
                  { mode: "WARN ONLY", desc: "Policy socialization. Signals are visible to developers as advisories, allowing teams to adjust to new standards before enforcement." },
                  { mode: "FULL ENFORCEMENT", desc: "Guaranteed Compliance. Decisions are binding. PRs cannot be merged without meeting your team's defined safety standards." }
                ].map((item, i) => (
                  <div key={i} className="p-8 rounded-xl border border-white/5 bg-white/[0.01] space-y-4">
                    <div className="text-[10px] font-mono text-neon-cyan font-bold tracking-widest">{item.mode}</div>
                    <p className="text-sm text-white/50 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4 — Use Cases (New) */}
        <section id="use-cases" className="py-32 container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">Built for Real Scenarios</h2>
            <p className="text-white/40 text-lg">Four ways Zaxion protects your production environment today.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {[
              { 
                title: "Prevent Payment Bugs", 
                desc: "Automatically block any PR that modifies payment logic without accompanying integration tests or senior approval.",
                icon: Shield
              },
              { 
                title: "Enforce Architecture", 
                desc: "Ensure that 'Domain' services never import 'Infrastructure' helpers, keeping your clean architecture clean.",
                icon: Code2
              },
              { 
                title: "Security Guardrails", 
                desc: "Instantly flag and block PRs that use insecure patterns like raw SQL queries or unvalidated user input.",
                icon: Lock
              },
              { 
                title: "API Contract Safety", 
                desc: "Prevent breaking changes to your public API by enforcing versioning and compatibility checks on every diff.",
                icon: Zap
              }
            ].map((item, i) => (
              <GlassCard key={i} className="p-8">
                <item.icon className="h-8 w-8 text-neon-cyan mb-6" />
                <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                <p className="text-white/40 leading-relaxed">{item.desc}</p>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* SECTION 5 — The Zaxion Advantage (Renamed Pillars) */}
        <section id="advantage" className="py-24 md:py-32 bg-white/[0.01] border-y border-white/5">
          <div className="container mx-auto px-6">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-black mb-16 md:mb-24 text-center tracking-tight">The Zaxion Advantage</h2>
              <div className="grid md:grid-cols-3 gap-12 md:gap-24">
                {[
                  {
                    title: "FASTER REVIEWS",
                    desc: "Automate the repetitive parts of code review so your team can focus on complex architecture and business logic."
                  },
                  {
                    title: "ZERO REGRESSIONS",
                    desc: "Ensure every fix stays fixed with automated policy enforcement that never sleeps and never misses a detail."
                  },
                  {
                    title: "CLEAR STANDARDS",
                    desc: "Turn your engineering handbook into executable code that guides every contributor, from junior to senior."
                  }
                ].map((pillar, i) => (
                  <div key={i} className="space-y-8 text-center md:text-left">
                    <div className="text-[10px] font-mono tracking-[0.4em] text-neon-cyan/60 uppercase">Benefit 0{i+1}</div>
                    <h3 className="text-4xl font-black tracking-tighter leading-tight">{pillar.title}</h3>
                    <p className="text-white/40 leading-relaxed font-medium">{pillar.desc}</p>
                  </div>
                ))}
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
              <div className="flex items-center gap-2">
                <img src="/Zaxion landing page logo.png" alt="Zaxion" className="h-8 w-auto" />
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


