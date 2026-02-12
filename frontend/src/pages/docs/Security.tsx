import React from 'react';
import { Shield, Lock, Eye, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const DocsSecurity = () => {
  return (
    <div className="space-y-12">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-neon-cyan/10 border border-neon-cyan/20 text-[10px] font-mono text-neon-cyan uppercase tracking-widest">
          Security Model
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
          Trust & <span className="gradient-text">Integrity.</span>
        </h1>
        <p className="text-xl text-white/40 leading-relaxed font-medium max-w-2xl">
          Zaxion is built on a foundation of cryptographic security and stateless analysis, ensuring that governance decisions are as secure as the code they protect.
        </p>
      </div>

      <section className="space-y-12">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: "Encryption at Rest",
              desc: "All protocol metadata, including policy configurations and decision logs, are encrypted using industry-standard AES-256.",
              icon: Lock
            },
            {
              title: "TLS in Transit",
              desc: "Every interaction with the Zaxion API and GitHub webhooks is protected by mandatory TLS 1.3 encryption.",
              icon: Shield
            },
            {
              title: "Zero-Knowledge Parsing",
              desc: "Zaxion analyzes code structure without executing it, preventing accidental execution of untrusted code during analysis.",
              icon: Eye
            }
          ].map((item, i) => (
            <div key={i} className="space-y-4">
              <div className="h-10 w-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                <item.icon className="h-5 w-5 text-white/60" />
              </div>
              <h3 className="font-bold text-lg">{item.title}</h3>
              <p className="text-xs text-white/40 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="p-8 rounded-xl border border-white/5 bg-white/[0.01] space-y-6">
          <h2 className="text-2xl font-black tracking-tight">Security Guarantees</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              "Stateless Analysis Pipeline",
              "Isolated Execution Environments",
              "Strict Token Scoping",
              "Audit-Ready Decision Logs",
              "Protocol Version Pinning",
              "Encrypted Webhook Signatures"
            ].map((guarantee, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-neon-cyan shrink-0" />
                <span className="text-sm font-medium text-white/60">{guarantee}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="pt-12 border-t border-white/5">
        <Link 
          to="/docs/overview" 
          className="inline-flex items-center gap-2 group text-neon-cyan font-bold tracking-tight hover:underline"
        >
          Back to Protocol Overview
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
};

export default DocsSecurity;
