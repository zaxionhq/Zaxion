import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
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
import { GovernanceAuditTrail } from '@/components/governance/GovernanceAuditTrail';
import { ProofImageLightbox } from '@/components/landing/ProofImageLightbox';
import { NeonButton } from '@/components/ui/neon-button';
import { GlassCard } from '@/components/ui/glass-card';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const LandingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 overflow-x-hidden transition-colors duration-300">
      {/* Background depth layers */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 radial-bg opacity-25" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="relative">
              <div className="absolute -inset-2 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <img 
                src="/Zaxion landing page logo.png" 
                alt="Zaxion" 
                className="h-10 md:h-12 w-auto object-contain relative z-10 transition-transform duration-500 group-hover:scale-110" 
              />
            </div>
            <span className="text-xl font-medium tracking-tighter hidden sm:block ml-1">
              ZAXION<span className="text-primary">.</span>
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/docs"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Documentation
            </Link>

            <a href="#problem" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">The Problem</a>
            <a href="#use-cases" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Use Cases</a>
            
            <div className="flex items-center gap-4">
              <NeonButton variant="glass" color="cyan" className="px-6 py-2 text-sm" onClick={() => navigate('/governance')}>
                Login
              </NeonButton>
              <ThemeToggle />
            </div>
          </div>
          
          <div className="md:hidden flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-32">
        {/* SECTION 1 — Hero */}
        <section className="container mx-auto px-6 mb-32">
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel text-[10px] font-medium tracking-[0.2em] uppercase mb-8 border-primary/40 text-primary">
              <Zap className="h-3 w-3" />
              GitHub Pull Request Governance
            </div>
            
            <h1 className="text-5xl md:text-8xl font-normal tracking-tight mb-8 leading-[1.0] text-foreground">
              Zaxion reviews every pull request <br />
              <span className="gradient-text">before it reaches production.</span>
            </h1>

            <div className="mb-8">
              <p className="text-lg md:text-2xl font-normal text-muted-foreground">
                Install the GitHub App and let Zaxion inspect each PR for secrets, risky patterns, and policy violations.
                <span className="text-primary block md:inline md:ml-2">It reports pass, warn, or block before merge.</span>
              </p>
            </div>

            <div className="flex flex-col items-center gap-6">
              <NeonButton color="cyan" size="lg" className="px-12 h-14 text-lg" onClick={() => window.location.href = 'https://github.com/apps/zaxion-governance/installations/new'}>
                Connect GitHub (Free)
                <ArrowRight className="h-5 w-5 ml-2 inline" />
              </NeonButton> 
              
              <div className="flex flex-col items-center gap-4">
                <div className="flex flex-wrap justify-center gap-4 md:gap-8">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="text-[10px] font-medium tracking-[0.1em] uppercase text-muted-foreground">Free tier</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="text-[10px] font-medium tracking-[0.1em] uppercase text-muted-foreground">No credit card</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="text-[10px] font-medium tracking-[0.1em] uppercase text-muted-foreground">Set up in minutes</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Artifact - MAIN PROOF */}
            <div className="mt-24 w-full flex flex-col items-center gap-8">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl glass-panel border-border bg-card">
                <AlertTriangle className="h-6 w-6 text-red-500" />
                <span className="text-lg font-medium tracking-tight text-foreground">Zaxion flagged 8 risky findings in one PR</span>
              </div>
              <div className="relative group">
                <div className="absolute -inset-4 bg-primary/10 blur-3xl rounded-full opacity-40 group-hover:opacity-100 transition-opacity" />
                <ProofImageLightbox
                  src="/github-pr-comment-proof.png"
                  alt="Zaxion catching security bugs in a GitHub PR"
                  caption="Actual Zaxion GitHub check run on a pull request"
                  className="relative z-10 mx-auto max-w-4xl"
                  imgClassName="rounded-xl border border-border shadow-2xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2 — Zaxion in Action */}
        <section className="py-32 bg-card/30 border-y border-border">
          <div className="container mx-auto px-6">
            <div className="max-w-5xl mx-auto text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-normal mb-6 tracking-tight text-foreground">Zaxion in Action</h2>
              <p className="text-xl text-muted-foreground">What reviewers usually miss, Zaxion catches before merge.</p>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                {[
                  { 
                    label: "SECURITY", 
                    title: "Found Hardcoded Secret", 
                    desc: "A GitHub Personal Access Token was found in plain text and blocked before merge.",
                    color: "red"
                  },
                  { 
                    label: "SECURITY", 
                    title: "SQL Injection Blocked", 
                    desc: "Raw SQL with unsanitized user input was detected and marked high risk.",
                    color: "orange"
                  },
                  { 
                    label: "QUALITY", 
                    title: "Production Console Log", 
                    desc: "Debug logging in production code was flagged for cleanup before release.",
                    color: "cyan"
                  }
                ].map((item, i) => (
                  <div key={i} className="p-6 rounded-xl border border-border bg-card/50 hover:border-primary/40 transition-colors">
                    <div className={cn("text-[10px] font-medium tracking-widest uppercase mb-2", `text-${item.color}-500`)}>
                      {item.label}
                    </div>
                    <h3 className="text-xl font-medium mb-2 text-foreground">{item.title}</h3>
                    <p className="text-muted-foreground text-sm">{item.desc}</p>
                  </div>
                ))}
              </div>
              <div className="glass-panel p-4 rounded-2xl border-border overflow-hidden">
                <ProofImageLightbox
                  src="/zaxion-action-screenshot.png"
                  alt="Zaxion in action: governance report with findings, context, and remediation"
                  caption="Live product UI — violation detail, observed context, and remediation steps"
                  imgClassName="rounded-lg shadow-2xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3 — 31 Policies */}
        <section className="py-32 border-b border-border">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center mb-20">
              <h2 className="text-4xl md:text-6xl font-normal mb-6 tracking-tight text-foreground">31 Policies</h2>
              <p className="text-xl text-muted-foreground">Coverage across security, quality, testing, and delivery rules.</p>
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
                <div key={i} className="glass-panel p-6 rounded-xl border-border flex flex-col items-center text-center group hover:border-primary/40 transition-colors">
                  <cat.icon className="h-8 w-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
                  <div className="text-2xl font-medium mb-1 text-foreground">{cat.count}</div>
                  <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{cat.name}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 4 — The Cost of Missing One Bug */}
        <section id="problem" className="py-32 bg-card/30 border-b border-border">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-normal mb-16 tracking-tight text-center text-foreground">The Cost of Missing One Bug</h2>
              <div className="space-y-12">
                {[
                  { title: "Senior engineers get stuck in repetitive review work", desc: "Manual review time is consumed by avoidable issues instead of system design and delivery." },
                  { title: "High-risk changes are easy to miss", desc: "Auth, payments, and data-layer updates can slip through when review depth changes from PR to PR." },
                  { title: "Standards vary by reviewer", desc: "Zaxion applies the same policy checks to every PR so review quality stays consistent." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-8 group">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl glass-panel border-border flex items-center justify-center text-primary font-medium group-hover:border-primary/50 transition-colors">
                      0{i+1}
                    </div>
                    <div>
                      <h3 className="text-2xl font-medium mb-3 group-hover:text-primary transition-colors text-foreground">{item.title}</h3>
                      <p className="text-muted-foreground text-lg leading-relaxed font-medium">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5 — The Zaxion Advantage */}
        <section id="advantage" className="py-32 border-b border-border">
          <div className="container mx-auto px-6">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-4xl md:text-6xl font-normal mb-24 text-center tracking-tight text-foreground">The Zaxion Advantage</h2>
              
              <div className="grid md:grid-cols-2 gap-16 items-center mb-32">
                <div className="space-y-8">
                  {[
                    { 
                      title: "Policy Simulator", 
                      desc: "Test policy changes on past PRs to preview impact before you enforce them.",
                      icon: Scale
                    },
                    { 
                      title: "Shadow Running", 
                      desc: "Run rules in monitor mode first, then enforce once your team is ready.",
                      icon: Ban
                    },
                    { 
                      title: "Immutable Audit Trail", 
                      desc: "Keep a tamper-resistant record of decisions for compliance and incident review.",
                      icon: Shield
                    },
                    { 
                      title: "Dynamic Risk Scoring", 
                      desc: "Adjust enforcement based on file sensitivity and risk profile automatically.",
                      icon: AlertTriangle
                    },
                    { 
                      title: "Semantic Code Understanding", 
                      desc: "AST-backed analysis reads code structure, not just text matches.",
                      icon: Code2
                    }
                  ].map((feature, i) => (
                    <div key={i} className="flex gap-6 group">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl glass-panel border-border flex items-center justify-center text-primary group-hover:border-primary/50 transition-colors">
                        <feature.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="text-xl font-medium mb-1 group-hover:text-primary transition-colors text-foreground">{feature.title}</h4>
                        <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="relative group">
                  <div className="absolute -inset-10 bg-primary/5 blur-[100px] rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                  <GlassCard className="p-4 relative z-10 overflow-hidden">
                    <ProofImageLightbox
                      src="/policy-simulator-preview.png"
                      alt="Policy Simulator: enforcement impact analysis on historical pull requests"
                      caption="Policy Simulator — projected block rate and historical impact table"
                      imgClassName="rounded-lg"
                    />
                    <div className="mt-4 p-4 bg-background/90 backdrop-blur-md rounded-lg border border-border relative z-20">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-[10px] font-mono text-primary uppercase">Simulator Active</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Visualizing the projected impact of 31 policies across 1,402 historical PRs.</p>
                    </div>
                  </GlassCard>
                </div>
              </div>

              {/* Live Audit Trail Integration */}
              <div className="mt-24 md:mt-32 p-6 md:p-12 rounded-2xl border border-border bg-card/30 relative overflow-hidden group shadow-sm">
                <div className="absolute top-0 right-0 p-8 opacity-5 hidden md:block">
                  <Scale className="h-64 w-64 text-foreground" />
                </div>
                
                <div className="grid lg:grid-cols-2 gap-12 md:gap-16 items-center relative z-10">
                  <div className="space-y-6 md:space-y-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-primary/10 border border-primary/20 text-[10px] font-mono text-primary uppercase tracking-widest">
                      Protocol Evidence
                    </div>
                    <h3 className="text-2xl md:text-4xl font-normal tracking-tight leading-tight text-foreground">
                      The Deterministic <br />
                      <span className="gradient-text">Audit Trail.</span>
                    </h3>
                    <p className="text-muted-foreground text-sm md:text-base leading-relaxed font-medium">
                      Zaxion does more than block or pass. It records what was checked, what failed, and why the final decision was made for every PR.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                      {[
                        "Deterministic Policy Evaluation",
                        "Signed Override Evidence",
                        "Immutable Audit Entry"
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-xs md:text-sm font-medium text-muted-foreground">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-background/40 rounded-xl border border-border p-4 md:p-6 backdrop-blur-sm shadow-xl overflow-x-auto">
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
        <section id="onboarding" className="py-32 bg-card/30 border-y border-border">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-normal mb-16 text-center tracking-tight text-foreground">How to Get Started</h2>
              <div className="grid md:grid-cols-4 gap-8">
                {[
                  { step: "1", title: "Install App", desc: "Install the Zaxion GitHub App for your organization." },
                  { step: "2", title: "Select Repos", desc: "Choose which repositories should run Zaxion checks." },
                  { step: "3", title: "Choose Policies", desc: "Start with core policies, then tune rules to your workflow." },
                  { step: "4", title: "Merge with Confidence", desc: "Each PR gets a clear pass, warn, or block decision." }
                ].map((item, i) => (
                  <div key={i} className="text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-medium mx-auto">
                      {item.step}
                    </div>
                    <h4 className="font-medium text-lg text-foreground">{item.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
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
                description: "Enforce policy checks on every pull request before code reaches your main branch.",
                icon: Code2,
                color: "cyan"
              },
              {
                title: "Team Accountability",
                description: "Every override and decision is logged with context so teams can review trade-offs clearly.",
                icon: Shield,
                color: "purple"
              },
              {
                title: "Knowledge Retention",
                description: "Convert PR decisions into reusable governance history your team can learn from.",
                icon: History,
                color: "pink"
              }
            ].map((feature, i) => (
              <GlassCard key={i} className="group h-full">
                <div className={cn(
                  "w-12 h-12 rounded-xl mb-6 flex items-center justify-center glass-panel border-border group-hover:border-primary/50 transition-colors",
                  `shadow-neon-${feature.color}/5`
                )}>
                  <feature.icon className={cn("h-6 w-6", `text-neon-${feature.color}`)} />
                </div>
                <h3 className="text-xl font-medium mb-4 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* SECTION 8 — Simple Call to Action */}
        <section className="container mx-auto px-6 py-24 md:py-32 border-t border-border">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-6xl font-normal tracking-tight mb-12 leading-tight text-foreground">
              Ready to review every PR <br />
              <span className="gradient-text">before it reaches production?</span>
            </h2>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
              <NeonButton color="cyan" size="lg" className="w-full md:w-auto px-12 h-14" onClick={() => window.location.href = 'https://github.com/apps/zaxion-governance/installations/new'}>
                Install GitHub App (Free)
              </NeonButton>
              
              <Link
                to="/docs"
                className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Read Documentation
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <p className="mt-16 text-[10px] font-medium text-muted-foreground uppercase tracking-[0.3em]">
              Fast setup • Clear PR decisions
            </p>
          </div>
        </section>
      </main> 

      {/* Simplified Footer */}
      <footer className="py-20 bg-background border-t border-border">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-end">
            <div className="space-y-6">
              <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <img src="/Zaxion landing page logo.png" alt="Zaxion" className="h-8 w-auto transition-transform duration-500 group-hover:scale-110" />
                <span className="text-xl font-medium tracking-tighter text-foreground">
                  ZAXION<span className="text-primary">.</span>
                </span>
              </div>
              <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                Zaxion is a pull request governance layer for engineering teams.
                It helps catch risky changes before merge and keeps a clear audit trail of decisions.
              </p>
            </div>
            <div className="text-right space-y-2">
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Version 7.0.0-Stable</div>
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mt-4">Support: support@zaxion.com</div>
            </div>
          </div>
          <div className="mt-20 pt-8 border-t border-border flex justify-between items-center">
            <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-[0.4em]">© 2026 Zaxion Inc. All Rights Reserved.</span>
            <div className="flex gap-8">
              <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-[0.2em]">Privacy Policy</span>
              <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-[0.2em]">Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;


