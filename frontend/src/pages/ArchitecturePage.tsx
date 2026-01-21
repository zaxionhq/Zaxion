import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Lock, 
  Cpu, 
  Zap, 
  ArrowLeft,
  Scale,
  History,
  Ban,
  Timer,
  FileText
} from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { NeonButton } from '@/components/ui/neon-button';

const ArchitecturePage = () => {
  const navigate = useNavigate();

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
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
            <img src="/zaxion-full.png" alt="Zaxion" className="h-12 w-auto object-contain brightness-0 invert" />
          </div>
          <NeonButton variant="glass" color="cyan" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to System
          </NeonButton>
        </div>
      </nav>

      <main className="relative z-10 pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-5xl">
          {/* Whitepaper Header */}
          <header className="mb-24">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel text-[10px] font-black tracking-[0.2em] uppercase mb-8 border-white/10 text-white/60"
            >
              <FileText className="h-3 w-3" />
              Technical Whitepaper
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-black mb-8 tracking-tighter leading-none"
            >
              The Governance <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-purple">Manifesto</span>
            </motion.h1>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-6 mb-12"
            >
              <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-mono">
                <Timer className="h-3 w-3 text-neon-cyan" />
                <span className="text-white/40">Phase 4 Status:</span>
                <span className="text-neon-cyan">DESIGN LOCK</span>
              </div>
              <div className="h-4 w-px bg-white/10" />
              <div className="text-xs font-mono text-white/30 uppercase tracking-widest">
                Last Updated: 2026-01-21
              </div>
            </motion.div>
          </header>

          {/* 1. Positioning */}
          <section className="mb-32">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <div className="w-8 h-px bg-neon-cyan" />
              Strategic Positioning
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <p className="text-xl text-white/60 leading-relaxed font-light">
                Zaxion is not a productivity tool. It is an <span className="text-white font-medium">intentional friction engine</span> designed to protect the integrity of mission-critical systems. 
                While modern CI/CD focuses on velocity, Zaxion focuses on <span className="text-white font-medium">accountability</span>.
              </p>
              <p className="text-white/40 leading-relaxed">
                We believe that complex code changes should not be easy to merge. They should be verified, documented, and signed. 
                By signaling "This system is opinionated," we filter for builders who value engineering rigor over blind speed.
              </p>
            </div>
          </section>

          {/* 2. Separation of Powers */}
          <section className="mb-32">
            <GlassCard className="p-12 border-neon-purple/20">
              <h2 className="text-3xl font-black mb-12 text-center">Division of Powers</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-white/5 -translate-y-1/2" />
                
                {[
                  {
                    title: "The Law",
                    desc: "Deterministic rules that define merge criteria. A passive registry of what is allowed.",
                    icon: Scale,
                    color: "cyan"
                  },
                  {
                    title: "The Exception",
                    desc: "Cryptographically signed overrides. Recording human intent when the law is bypassed.",
                    icon: Lock,
                    color: "purple"
                  },
                  {
                    title: "The Memory",
                    desc: "A historical ledger of outcomes, binding the Law to the Exception immutably.",
                    icon: History,
                    color: "pink"
                  }
                ].map((pillar, i) => (
                  <div key={i} className="relative z-10 bg-[#020617] p-6 text-center">
                    <pillar.icon className={`w-10 h-10 text-neon-${pillar.color} mx-auto mb-6`} />
                    <h4 className="text-xl font-bold mb-4">{pillar.title}</h4>
                    <p className="text-sm text-white/40 leading-relaxed">{pillar.desc}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </section>

          {/* 3. The Pillars (Deep Dive) */}
          <section className="mb-32">
            <h2 className="text-2xl font-bold mb-12 flex items-center gap-3">
              <div className="w-8 h-px bg-neon-purple" />
              The Three Pillars
            </h2>
            <div className="space-y-12">
              <div className="flex flex-col md:flex-row gap-12 items-start">
                <div className="md:w-1/3">
                  <div className="text-xs font-black tracking-widest text-neon-cyan mb-2">PILLAR 01</div>
                  <h3 className="text-2xl font-bold mb-4">Policy Registry</h3>
                  <p className="text-sm text-white/40">The source of truth for organizational standards.</p>
                </div>
                <div className="md:w-2/3 p-8 rounded-2xl bg-white/[0.02] border border-white/5 text-white/60 leading-relaxed">
                  Policies are declarative, versioned snapshots of "The Law". They are owned by human roles and enforced by AST-based deterministic logic. 
                  A policy does not guess; it calculates against AST patterns to ensure critical paths (Auth, Billing, Core Logic) are never left unverified.
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-12 items-start">
                <div className="md:w-1/3">
                  <div className="text-xs font-black tracking-widest text-neon-purple mb-2">PILLAR 02</div>
                  <h3 className="text-2xl font-bold mb-4">Accountability Registry</h3>
                  <p className="text-sm text-white/40">The human signature in the machine.</p>
                </div>
                <div className="md:w-2/3 p-8 rounded-2xl bg-white/[0.02] border border-white/5 text-white/60 leading-relaxed">
                  When a policy is bypassed, an Override Signature is generated. This is not a "skip" button; it is a non-repudiable audit event. 
                  It binds the Actor, the Timestamp, the Justification, and the exact Code State into an immutable record. Responsibility is never anonymous.
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-12 items-start">
                <div className="md:w-1/3">
                  <div className="text-xs font-black tracking-widest text-neon-pink mb-2">PILLAR 03</div>
                  <h3 className="text-2xl font-bold mb-4">Decision & Pattern Engine</h3>
                  <p className="text-sm text-white/40">Longitudinal governance memory.</p>
                </div>
                <div className="md:w-2/3 p-8 rounded-2xl bg-white/[0.02] border border-white/5 text-white/60 leading-relaxed">
                  The Memory pillar observes the interaction between the Law and the Exception. It detects "Bypass Velocity" and "Policy Drift", 
                  turning raw signals into governance patterns that inform future policy updates. The system learns from human decisions, not black-box AI.
                </div>
              </div>
            </div>
          </section>

          {/* 4. Non-Goals (Boundary) */}
          <section className="mb-32">
            <h2 className="text-2xl font-bold mb-12 flex items-center gap-3 text-red-400">
              <div className="w-8 h-px bg-red-400/50" />
              Explicit Non-Goals
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: "No Black-Box Gating", desc: "AI does not decide merge status. Only deterministic policies can block a PR." },
                { title: "No Automated Punishment", desc: "Zaxion is an accountability tool, not a performance tracking system." },
                { title: "No Friction Removal", desc: "We do not aim to make bypassing the system 'easy'. Friction is a feature." },
                { title: "No AI Self-Correction", desc: "The system never updates its own rules. Human authority is absolute." }
              ].map((item, i) => (
                <div key={i} className="p-6 rounded-xl bg-red-400/5 border border-red-400/10 flex gap-4">
                  <Ban className="w-5 h-5 text-red-400 shrink-0" />
                  <div>
                    <h4 className="font-bold text-white mb-1">{item.title}</h4>
                    <p className="text-sm text-white/40">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 5. Phase Status */}
          <section className="py-24 border-t border-white/5 text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-4xl font-black mb-6 italic">"Intentional. Opinionated. Non-Rushed."</h2>
              <p className="text-white/40 mb-12">
                Zaxion is currently in Phase 4. We are building the data layer and APIs of accountability. 
                Until Phase 5 is locked, the system is a contract, not a product.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <div className="px-6 py-3 rounded-full bg-white/5 border border-white/10 text-xs font-mono">
                  Phase 5: Authority Definition (Incoming)
                </div>
                <div className="px-6 py-3 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-white/30">
                  Phase 6/7: Docs + API Reference (Planned)
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-12 border-t border-white/5">
        <div className="container mx-auto px-6 text-center">
          <NeonButton color="cyan" onClick={() => navigate('/login')}>
            Enter the System
            <Zap className="ml-2 h-4 w-4" />
          </NeonButton>
        </div>
      </footer>
    </div>
  );
};

export default ArchitecturePage;
