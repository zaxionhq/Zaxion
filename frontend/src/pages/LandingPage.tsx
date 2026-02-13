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
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src="/zaxion-full.png" alt="Zaxion" className="h-20 w-auto object-contain brightness-0 invert" />
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
            <a href="#architecture" className="text-sm font-medium text-white/60 hover:text-neon-cyan transition-colors">Architecture</a>
            <NeonButton variant="glass" color="cyan" className="px-6 py-2 text-sm" onClick={() => navigate('/governance')}>
              Access Console
            </NeonButton>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-32">
        {/* SECTION 1 — Hero */}
        <section className="container mx-auto px-6 mb-32">
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel text-[10px] font-black tracking-[0.2em] uppercase mb-8 border-neon-cyan/30 text-neon-cyan shadow-neon-cyan/10 shadow-lg">
              <Lock className="h-3 w-3" />
              Constitutional Governance Layer
            </div>
            
            <h1 className="text-5xl md:text-8xl font-black tracking-tight mb-8 leading-[1.1] md:leading-[0.9]">
              Deterministic <br />
              <span className="gradient-text">Governance.</span>
            </h1>

            <div className="mb-8">
              <p className="text-lg md:text-2xl font-bold text-white/80">
                Every PR becomes a verifiable 
                <span className="text-neon-cyan block md:inline md:ml-2">governance record.</span>
              </p>
            </div>
    
            <p className="text-lg text-white/40 max-w-2xl mb-12 leading-relaxed font-medium">
              Zaxion provides a deterministic, auditable framework for enforcing organizational standards and recording immutable intent. Designed for senior engineering and security teams.
            </p>

            <div className="flex flex-col items-center gap-6">
              <NeonButton color="cyan" size="lg" className="px-12 h-14 text-lg" onClick={() => navigate('/governance')}>
                Access Console
                <ArrowRight className="h-5 w-5 ml-2 inline" />
              </NeonButton>
              
              <div className="flex flex-col items-center gap-2">
                <Link 
                  to="/waitlist" 
                  className="text-sm font-bold text-white/40 hover:text-neon-cyan transition-colors"
                >
                  Request Beta Access
                </Link>
                <p className="text-[10px] font-black tracking-[0.2em] uppercase text-white/20">
                  Design Partner Cohort: 04/10 Slots Remaining
                </p>
              </div>
            </div>

            {/* Hero Artifact */}
            <div className="mt-24 w-full flex justify-center opacity-100">
              <GovernanceRecordCard />
            </div>
          </div>
        </section>

        {/* SECTION 2 — The Broken Status Quo */}
        <section id="problem" className="py-32 bg-white/[0.01] border-y border-white/5">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-black mb-16 tracking-tight">Why PR Quality Gates Fail</h2>
              <div className="space-y-12">
                {[
                  { title: "Rules lack risk-proportionality", desc: "Static analysis blocks everything or nothing, ignoring that a change to Auth logic is 100x higher risk than a CSS update." },
                  { title: "Overrides create 'Dark Debt'", desc: "Emergency bypasses are common, but they often happen via shadow-IT (like [skip ci]) with zero permanent record of ownership." },
                  { title: "Decisions lack institutional memory", desc: "Pipelines treat every PR as an isolated event, losing the context of why similar risks were accepted or rejected in the past." }
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

        {/* SECTION 3 — The Core Insight */}
        <section className="py-32 container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-6xl font-black mb-12 tracking-tight">Quality Problems Are <br />Governance Problems</h2>
            <div className="space-y-8 text-xl text-white/60 leading-relaxed font-light">
              <p>The issue in modern delivery pipelines isn’t a lack of code quality tools.</p>
              <p className="text-white font-medium italic">It is the lack of decision ownership, traceability, and institutional accountability.</p>
              <p>Zaxion transforms quality from a "checklist" into a "constitution" by anchoring every evaluation to a verifiable leadership record.</p>
            </div>
          </div>
        </section>

        {/* SECTION 4 — The Governance Model (Institutional Pillars) */}
        <section id="architecture" className="py-24 md:py-32 bg-white/[0.01]">
          <div className="container mx-auto px-6">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-black mb-16 md:mb-24 text-center tracking-tight">Constitutional Pillars</h2>
              <div className="grid md:grid-cols-3 gap-12 md:gap-24">
                {[
                  {
                    title: "LAW",
                    desc: "Policies are versioned, declarative, and immutable. They define the legal boundaries of your architecture."
                  },
                  {
                    title: "JUDGMENT",
                    desc: "Deterministic evaluation of every PR. Logic is history-blind and context-aware, ensuring absolute consistency."
                  },
                  {
                    title: "MEMORY",
                    desc: "Every decision, signal, and override is recorded in a permanent ledger. The system never forgets debt."
                  }
                ].map((pillar, i) => (
                  <div key={i} className="space-y-8 text-center md:text-left">
                    <div className="text-[10px] font-mono tracking-[0.4em] text-neon-cyan/60 uppercase">Pillar 0{i+1}</div>
                    <h3 className="text-4xl font-black tracking-tighter">{pillar.title}</h3>
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

        {/* SECTION 5 — Adoption Modes */}
        <section className="py-32 border-t border-white/5">
          <div className="container mx-auto px-6">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-black mb-8 text-center tracking-tight">Adoption Safety Modes</h2>
              <p className="text-white/40 text-center mb-16 max-w-2xl mx-auto text-sm">
                Zaxion supports a phased promotion path, allowing teams to socialize policies before they become binding architectural requirements.
              </p>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { mode: "OBSERVE_ONLY", desc: "Passive monitoring. Zaxion records decisions in the background to baseline current architectural compliance without affecting velocity." },
                  { mode: "WARN_ONLY", desc: "Policy socialization. Signals are visible to developers as advisories, allowing teams to adjust to new standards before enforcement." },
                  { mode: "ENFORCE", desc: "Full Governance. Decisions are binding. PRs cannot be merged without meeting constitutional standards or obtaining a signed override." }
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

        {/* SECTION 6 — What Zaxion Is NOT */}
        <section className="py-32 bg-white/[0.01] border-y border-white/5">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl font-black mb-16 tracking-tight">What Zaxion Is Not</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  { title: "Not a Copilot", desc: "We don't write code. Zaxion is the Referee, not the Player—ensuring rules are followed, not playing the game." },
                  { title: "Not a Linter", desc: "We don't care about semicolons. We care about architectural intent and high-risk domain violations." },
                  { title: "Not a Black Box", desc: "No fuzzy AI scoring. Decisions are binary, deterministic, and traceable to your constitutional source code." },
                  { title: "Not a Suggestion", desc: "Bypassing a gate requires a cryptographically signed record, not a simple comment or a 'merge anyway' click." }
                ].map((item, i) => (
                  <div key={i} className="p-8 rounded-xl border border-white/5 bg-white/[0.01]">
                    <h4 className="font-bold mb-3 text-sm uppercase tracking-widest text-white/40">{item.title}</h4>
                    <p className="text-xs text-white/30 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 7 — Visual Feature Highlights */}
        <section className="py-32 container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Deterministic Gating",
                description: "No black-box decisions. Gates are powered by explicit policies and AST-based code analysis for 100% predictability.",
                icon: Code2,
                color: "cyan"
              },
              {
                title: "Human Accountability",
                description: "Signed overrides bind justifications to specific actors, ensuring that every exception is tracked and auditable.",
                icon: Shield,
                color: "purple"
              },
              {
                title: "Organizational Memory",
                description: "A historical ledger of outcomes inform future policy updates, turning raw signals into institutional knowledge.",
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

        {/* SECTION 8 — Maturity Statement */}
        <section className="py-32 bg-white/[0.01] border-t border-white/5">
          <div className="container mx-auto px-6 text-center">
            <div className="max-w-2xl mx-auto p-12 rounded-xl border border-white/5 bg-white/[0.01]">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-neon-cyan mb-8 uppercase tracking-widest">
                <Shield className="h-3 w-3" />
                Maturity Statement
              </div>
              <p className="text-white/40 leading-relaxed font-medium text-sm">
                Zaxion is in a locked architectural state. All governance contracts and decision logic are versioned to ensure longitudinal auditability and institutional stability.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 9 — Final CTA */}
        <section className="container mx-auto px-6 py-24 md:py-32 border-t border-white/5">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-6xl font-black tracking-tight mb-12 leading-tight">
              Ready to evaluate Zaxion <br />
              <span className="gradient-text">in your workflow?</span>
            </h2>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
              <NeonButton color="cyan" size="lg" className="w-full md:w-auto px-12 h-14" onClick={() => navigate('/governance')}>
                Access Console
              </NeonButton>
              
              <Link 
                to="/waitlist" 
                className="group flex items-center gap-2 text-sm font-bold text-white/40 hover:text-white transition-colors"
              >
                Request Beta Access
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <p className="mt-16 text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">
              Early teams get priority • Enterprise support available
            </p>
          </div>
        </section>
      </main>

      {/* Institutional Footer */}
      <footer className="py-20 bg-black border-t border-white/5">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-end">
            <div className="space-y-6">
              <img src="/zaxion-full.png" alt="Zaxion" className="h-12 w-auto brightness-0 invert opacity-40" />
              <p className="text-xs text-white/20 max-w-sm leading-relaxed">
                Zaxion is the deterministic governance layer for institutional engineering. 
                Built for teams where every decision must be verifiable and every override must be signed.
              </p>
            </div>
            <div className="text-right space-y-2">
              <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Zaxion Governance Constitution v7.0.0</div>
              <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Public Registry Interface • Data Retention: 7 Years</div>
              <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest mt-4">Contact: design-partners@zaxion.gov</div>
            </div>
          </div>
          <div className="mt-20 pt-8 border-t border-white/5 flex justify-between items-center">
            <span className="text-[9px] font-mono text-white/10 uppercase tracking-[0.4em]">© 2026 Zaxion Governance Protocol</span>
            <div className="flex gap-8">
              <span className="text-[9px] font-mono text-white/10 uppercase tracking-[0.2em] cursor-help">Status: Operational</span>
              <span className="text-[9px] font-mono text-white/10 uppercase tracking-[0.2em] cursor-help">Latency: 12ms</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

