import React from 'react';
import { Shield, Lock, Eye, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const DocsSecurity = () => {
  return (
    <div className="space-y-16">
      {/* Header Section */}
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          Security
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white">
          Security Model
        </h1>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
          Zaxion is designed for institutional-grade environments. Our security model focuses on cryptographic integrity, stateless execution, and zero-leak analysis.
        </p>
      </div>

      <section className="space-y-12">
        <div className="grid sm:grid-cols-3 gap-12">
          {[
            {
              title: "Encryption at Rest",
              desc: "Protocol metadata and decision logs are encrypted using AES-256 standards.",
              icon: Lock
            },
            {
              title: "TLS in Transit",
              desc: "All interactions with the Zaxion API are protected by TLS 1.3 encryption.",
              icon: Shield
            },
            {
              title: "Zero-Knowledge",
              desc: "Structural analysis occurs without code execution, preventing untrusted execution.",
              icon: Eye
            }
          ].map((item, i) => (
            <div key={i} className="space-y-4">
              <div className="h-8 w-8 rounded border border-white/10 bg-white/[0.02] flex items-center justify-center">
                <item.icon className="h-4 w-4 text-slate-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-tight">{item.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="p-8 rounded border border-white/5 bg-white/[0.01] space-y-6">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600">Institutional Guarantees</h2>
          <div className="grid sm:grid-cols-2 gap-y-4 gap-x-12">
            {[
              "Stateless Analysis Pipeline",
              "Isolated Evaluation Environments",
              "Strict Token Scoping",
              "Audit-Ready Decision Logs",
              "Protocol Version Pinning",
              "Encrypted Webhook Signatures"
            ].map((guarantee, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                <span className="text-xs font-medium text-slate-400">{guarantee}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="pt-12 border-t border-white/5">
        <Link 
          to="/docs/deterministic-evaluation" 
          className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Deterministic Evaluation
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
};

export default DocsSecurity;
