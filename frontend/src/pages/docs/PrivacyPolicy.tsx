import React from 'react';
import { Shield, Eye, Lock, FileText, Globe, Database } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="space-y-16">
      {/* Header Section */}
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          Legal & Privacy
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white">
          Privacy Policy
        </h1>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
          At Zaxion, privacy is not a feature—it is a core architectural invariant. We operate on a zero-retention model to protect your institutional intellectual property.
        </p>
      </div>

      {/* Main Content */}
      <div className="grid gap-12">
        <section className="space-y-6">
          <div className="flex items-center gap-3 text-white">
            <Eye className="h-5 w-5 text-neon-cyan" />
            <h2 className="text-xl font-bold">1. Zero-Retention Data Policy</h2>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Zaxion utilizes a <strong>"Fetch-Analyze-Discard"</strong> pattern. When a Pull Request is evaluated:
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-500 ml-4">
            <li>The source code diff is pulled into volatile memory (RAM).</li>
            <li>Structural analysis (AST parsing) is performed in milliseconds.</li>
            <li>The code is immediately wiped from memory.</li>
            <li><strong>We never store your source code on our disks.</strong></li>
          </ul>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-3 text-white">
            <Database className="h-5 w-5 text-neon-cyan" />
            <h2 className="text-xl font-bold">2. What We Do Store</h2>
          </div>
          <p className="text-slate-400 leading-relaxed">
            To provide governance tracking, we only store the <strong>metadata</strong> of the decision:
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-500 ml-4">
            <li>PR Metadata (PR Number, Author, Repository Name).</li>
            <li>Governance Verdict (PASS/BLOCK/WARN).</li>
            <li>Policy Violation Reason (e.g., "Missing tests in /auth").</li>
            <li>Cryptographic Integrity Hashes for audit trails.</li>
          </ul>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-3 text-white">
            <Lock className="h-5 w-5 text-neon-cyan" />
            <h2 className="text-xl font-bold">3. Security Standards</h2>
          </div>
          <p className="text-slate-400 leading-relaxed">
            All stored metadata is encrypted at rest using <strong>AES-256</strong>. Data in transit is secured via <strong>TLS 1.3</strong>. Access to our internal databases is strictly limited to the core infrastructure components.
          </p>
        </section>

        <section className="space-y-6 border-t border-white/5 pt-12">
          <div className="flex items-center gap-3 text-white">
            <Globe className="h-5 w-5 text-neon-cyan" />
            <h2 className="text-xl font-bold">4. Third-Party Services</h2>
          </div>
          <p className="text-slate-400 leading-relaxed text-sm">
            Zaxion uses Gemini AI for generating educational feedback. All prompts sent to the AI are ephemeral and are not used for training. We do not sell or share your data with any other third parties.
          </p>
        </section>
      </div>

      {/* Footer Note */}
      <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5">
        <p className="text-xs text-slate-500 italic text-center">
          Last Updated: March 1, 2026 • Zaxion Governance Protocol
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
