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
import { GlassCard } from '@/components/ui/glass-card';
import { NeonButton } from '@/components/ui/neon-button';
import { cn } from '@/lib/utils';

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
    <div className="min-h-screen bg-[#020617] text-white selection:bg-neon-cyan/30 overflow-x-hidden">
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
            <a href="#problem" className="text-sm font-medium text-white/60 hover:text-neon-cyan transition-colors">The Problem</a>
            <a href="#architecture" className="text-sm font-medium text-white/60 hover:text-neon-cyan transition-colors">Architecture</a>
            <NeonButton variant="glass" color="cyan" className="px-6 py-2 text-sm" onClick={() => navigate('/waitlist')}>
              Join Waitlist
            </NeonButton>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-32">
        {/* SECTION 1 — Hero */}
        <section className="container mx-auto px-6 mb-32">
          <div className="flex flex-col items-center text-center">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel text-[10px] font-black tracking-[0.2em] uppercase mb-8 border-neon-cyan/30 text-neon-cyan shadow-neon-cyan/10 shadow-lg"
            >
              <Lock className="h-3 w-3" />
              Constitutional Governance Layer
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl md:text-8xl font-black tracking-tight mb-8 leading-[0.9]"
            >
              Stop shipping <br />
              <span className="gradient-text">high-risk code.</span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mb-8"
            >
              <p className="text-xl md:text-2xl font-bold text-white/80">
                Zaxion is not an AI reviewer. 
                <span className="text-neon-cyan ml-2">It is a governance system for engineering decisions.</span>
              </p>
            </motion.div>
    
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-white/40 max-w-2xl mb-12 leading-relaxed font-medium"
            >
              Moving beyond static analysis and black-box AI feedback. Zaxion provides a deterministic, auditable framework for enforcing organizational standards and recording immutable intent.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center gap-4"
            >
              <NeonButton color="cyan" size="lg" className="px-12 h-14 text-lg" onClick={() => navigate('/waitlist')}>
                Join the Private Waitlist
                <ArrowRight className="h-5 w-5 ml-2 inline" />
              </NeonButton>
              <p className="text-[10px] font-black tracking-[0.2em] uppercase text-white/30">
                Invite-only • No spam • Early design partners
              </p>
            </motion.div>

            {/* Floating Hero Image/Panel */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="mt-24 w-full max-w-5xl mx-auto"
            >
              <GlassCard className="p-1 bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 rounded-[2rem]" hoverEffect={false}>
                <div className="bg-[#020617] rounded-[1.9rem] overflow-hidden aspect-video relative group">
                  <div className="absolute inset-0 bg-gradient-to-t from-neon-purple/10 to-transparent" />
                  <div className="absolute top-0 left-0 right-0 h-12 bg-white/5 border-b border-white/5 flex items-center px-6 gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                    <div className="ml-4 px-3 py-1 rounded-md bg-white/5 text-[10px] text-white/40 font-mono">
                      zaxion-guard / governance-registry
                    </div>
                  </div>
                  <div className="p-12 flex flex-col items-center justify-center h-full space-y-8">
                    <div className="flex gap-4">
                      <div className="w-16 h-16 rounded-2xl glass-panel flex items-center justify-center">
                        <Github className="h-8 w-8 text-white/40" />
                      </div>
                      <div className="flex items-center">
                        <div className="w-12 h-[2px] bg-gradient-to-r from-white/10 to-neon-cyan" />
                        <div className="w-4 h-4 rounded-full bg-neon-cyan shadow-neon-cyan shadow-lg" />
                      </div>
                      <div className="w-20 h-20 rounded-3xl bg-white/5 border-2 border-white/10 flex items-center justify-center shadow-2xl group-hover:border-neon-cyan/50 transition-all overflow-hidden">
                        <img src="/zaxion-logo.png" alt="Zaxion Logo" className="h-full w-full object-cover scale-150" />
                      </div>
                      <div className="flex items-center">
                        <div className="w-4 h-4 rounded-full bg-neon-purple shadow-neon-purple shadow-lg" />
                        <div className="w-12 h-[2px] bg-gradient-to-l from-white/10 to-neon-purple" />
                      </div>
                      <div className="w-16 h-16 rounded-2xl glass-panel flex items-center justify-center">
                        <Cpu className="h-8 w-8 text-white/40" />
                      </div>
                    </div>
                    <div className="text-center space-y-2">
                      <div className="text-2xl font-bold tracking-tight text-white">Binding Decision Matrix...</div>
                      <div className="text-white/40 text-sm font-mono">Immutable policy link: 0x4f...a92</div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </section>

        {/* SECTION 2 — The Broken Status Quo */}
        <section id="problem" className="py-32 bg-white/[0.01] border-y border-white/5">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-black mb-16 tracking-tight">Why PR Quality Gates Fail at Scale</h2>
              <div className="space-y-12">
                {[
                  { title: "Static rules don’t understand context", desc: "Linters and legacy tools block everything or nothing, ignoring the risk profile of the specific change." },
                  { title: "AI reviewers lack accountability", desc: "LLM-generated comments provide noise without responsibility. Who owns the decision when the AI is wrong?" },
                  { title: "Overrides erase history", desc: "Emergency 'skip' buttons are common. But where is the record of why it was skipped and who signed off?" },
                  { title: "Managers lack causal visibility", desc: "Dashboard charts show 'velocity' but hide the causal chain of why specific high-risk debt was allowed." }
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="flex gap-6 items-start group"
                  >
                    <div className="w-1 h-12 bg-white/10 group-hover:bg-neon-cyan transition-colors shrink-0 mt-1" />
                    <div>
                      <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                      <p className="text-white/40 text-lg leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
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
              <p className="text-white font-medium italic">It is the lack of decision ownership, traceability, and institutional memory.</p>
              <p>Zaxion stops being a tool and becomes a system by anchoring every PR evaluation to a versioned constitutional record.</p>
            </div>
          </div>
        </section>

        {/* SECTION 4 — Zaxion’s Constitutional Architecture */}
        <section id="architecture" className="py-32 bg-white/[0.01]">
          <div className="container mx-auto px-6">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-black mb-16 text-center">The Architecture of Authority</h2>
              <div className="grid md:grid-cols-3 gap-16">
                {[
                  {
                    title: "Law (Policies)",
                    icon: Scale,
                    color: "cyan",
                    desc: "Deterministic, versioned rules that define what is acceptable. Policies are declarative contracts that remove the 'guessing' from quality gating."
                  },
                  {
                    title: "Exception (Overrides)",
                    icon: Lock,
                    color: "purple",
                    desc: "When a gate must be bypassed, Zaxion requires an immutable human signature. Responsibility is assigned to a specific actor with a logged justification."
                  },
                  {
                    title: "Memory (Decisions)",
                    icon: History,
                    color: "pink",
                    desc: "Every signal, gate outcome, and override is bound into a longitudinal ledger. The system remembers why debt was allowed, forever."
                  }
                ].map((pillar, i) => (
                  <div key={i} className="space-y-6">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center glass-panel", `text-neon-${pillar.color}`)}>
                      <pillar.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-2xl font-bold">{pillar.title}</h3>
                    <p className="text-white/40 leading-relaxed">{pillar.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5 — Narrative Flow */}
        <section className="py-32 container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black mb-16 text-center">What Actually Happens When a PR Is Evaluated</h2>
            <div className="relative space-y-12">
              <div className="absolute left-6 top-0 bottom-0 w-px bg-white/5" />
              {[
                "PR evaluation is triggered by an external engine (Zaxion Worker).",
                "A deterministic decision is produced based on the risk surface.",
                "A specific Policy Version is bound to the PR state.",
                "If blocked, a human Override must be cryptographically signed.",
                "The entire causal chain is recorded immutably in the Governance Ledger."
              ].map((step, i) => (
                <div key={i} className="flex gap-12 items-center relative">
                  <div className="w-12 h-12 rounded-full glass-panel flex items-center justify-center font-mono font-bold text-neon-cyan shrink-0 z-10">
                    {i + 1}
                  </div>
                  <p className="text-xl text-white/60">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 6 — What Zaxion Is NOT */}
        <section className="py-32 bg-red-500/[0.02] border-y border-white/5">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl font-black mb-16 tracking-tight text-red-400">What Zaxion is NOT</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  { title: "Not a Linter", desc: "We don't care about your semicolons." },
                  { title: "Not an AI Judge", desc: "AI assists; it does not decide." },
                  { title: "Not an Auto-Enforcer", desc: "Human authority is always absolute." },
                  { title: "Not a Scoring System", desc: "We provide signals, not gamified points." }
                ].map((item, i) => (
                  <div key={i} className="p-6 rounded-2xl glass-panel border-red-500/10">
                    <Ban className="h-6 w-6 text-red-500/50 mx-auto mb-4" />
                    <h4 className="font-bold mb-2">{item.title}</h4>
                    <p className="text-xs text-white/30">{item.desc}</p>
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

        {/* SECTION 8 — Readiness & Maturity Statement */}
        <section className="py-32 bg-white/[0.01] border-t border-white/5">
          <div className="container mx-auto px-6 text-center">
            <div className="max-w-2xl mx-auto p-12 rounded-3xl glass-panel border-white/10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-neon-cyan mb-6">
                <AlertTriangle className="h-3 w-3" />
                PHASE 4: ARCHITECTURAL MATURITY
              </div>
              <h2 className="text-2xl font-bold mb-6">Maturity Statement</h2>
              <p className="text-white/40 leading-relaxed italic">
                "Zaxion is currently in architectural maturity phase. Enforcement and dashboards follow locked contracts to ensure long-term stability and auditability."
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 9 — Final CTA */}
        <section className="container mx-auto px-6 py-32">
          <div className="relative bg-[#020617] rounded-[2.5rem] p-12 md:p-24 flex flex-col items-center text-center border border-white/5 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-neon-cyan/5 to-transparent rounded-[2.5rem]" />
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative z-10"
            >
              <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-8">
                Ready to evaluate Zaxion <br />
                <span className="gradient-text">in your workflow?</span>
              </h2>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                <NeonButton color="cyan" size="lg" className="px-10" onClick={() => navigate('/waitlist')}>
                  Join the Private Waitlist
                </NeonButton>
                
                <a 
                  href="#architecture" 
                  className="group flex items-center gap-2 text-sm font-bold text-white/40 hover:text-white transition-colors"
                >
                  Read the Governance Model
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>

              <p className="mt-12 text-sm text-white/20 font-medium">
                Private beta launching soon. Early teams get priority.
              </p>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="container mx-auto px-6 py-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-white/20 text-sm font-medium">
          © 2026 Zaxion Guard. All rights reserved.
        </div>
        <div className="flex gap-8">
          <a href="#" className="text-white/20 hover:text-white transition-colors text-sm">Privacy</a>
          <a href="#" className="text-white/20 hover:text-white transition-colors text-sm">Terms</a>
          <a href="#" className="text-white/20 hover:text-white transition-colors text-sm">Twitter</a>
          <a href="#" className="text-white/20 hover:text-white transition-colors text-sm">GitHub</a>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

