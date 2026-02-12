import React from 'react';
import { Shield, Lock, Eye, CheckCircle2, ArrowRight, Server } from 'lucide-react';
import { Link } from 'react-router-dom';
import DocsAccordion from '../../components/docs/DocsAccordion';

const DocsSecurity = () => {
  return (
    <div className="space-y-16">
      {/* Header Section */}
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          Institutional Security
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

        <div className="space-y-6">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600">Security Protocols</h2>
          <div className="grid gap-4">
            <DocsAccordion 
              title="Protocol 01: Stateless Analysis Pipeline" 
              subtitle="Computation Boundary"
            >
              <div id="stateless-pipeline" className="scroll-mt-20">
                <p className="text-sm text-slate-400 leading-relaxed mb-4">
                  The analysis pipeline is built on a zero-persistence architecture. Every evaluation event is treated as an isolated transaction with no temporal coupling to previous or future runs.
                </p>
                <div className="bg-black/40 rounded p-4 border border-white/5 space-y-4">
                  <p className="text-sm">Zaxion's evaluation engine is entirely stateless. No code is stored permanently in our analysis environments. Each PR evaluation occurs in a volatile, ephemeral container that is destroyed immediately after the verdict is issued.</p>
                  <div className="bg-black/40 rounded p-4 border border-white/5 space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase">
                      <Server className="h-3 w-3" /> Runtime Isolation
                    </div>
                    <p className="text-[11px] text-slate-500 italic">"The memory of the machine is wiped between every judgment, ensuring zero cross-contamination of institutional IP."</p>
                  </div>
                </div>
              </div>
            </DocsAccordion>

            <DocsAccordion 
              title="Protocol 02: Zero-Execution Analysis" 
              subtitle="AST Extraction vs. Runtime"
            >
              <div id="zero-execution" className="scroll-mt-20">
                <p className="text-sm text-slate-400 leading-relaxed mb-4">
                  Zaxion eliminates the primary attack vector of modern CI/CD by decoupling structural analysis from code execution. We verify integrity without ever "running" the source.
                </p>
                <div className="bg-black/40 rounded p-4 border border-white/5 space-y-4">
                  <p className="text-sm">Unlike traditional CI tools that run your tests or build scripts, Zaxion never executes your code. It treats code as data, extracting the Abstract Syntax Tree (AST) to verify architectural integrity. This prevents malicious code injection from compromising the analysis engine.</p>
                </div>
              </div>
            </DocsAccordion>

            <DocsAccordion 
              title="Protocol 03: Cryptographic Decision Logs" 
              subtitle="Verifiable Audits"
            >
              <div id="audit-integrity" className="scroll-mt-20">
                <p className="text-sm text-slate-400 leading-relaxed mb-4">
                  Decision integrity is enforced through cryptographic signatures, creating an immutable chain of custody for every architectural verdict issued by the protocol.
                </p>
                <div className="bg-black/40 rounded p-4 border border-white/5 space-y-4">
                  <p className="text-sm">Every decision is signed using an institutional key. This ensures that audit trails cannot be tampered with by developers or administrators. If a decision log is modified, the signature check will fail, alerting governance officers to a breach in institutional integrity.</p>
                </div>
              </div>
            </DocsAccordion>
          </div>
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
