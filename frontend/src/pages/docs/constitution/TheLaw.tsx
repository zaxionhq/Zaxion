import { ArrowRight, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import DocsAccordion from '../../../components/docs/DocsAccordion';

const TheLaw = () => {
  return (
    <div className="space-y-16">
      {/* Header Section */}
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-indigo-400 uppercase tracking-widest">
          Pillar 01
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white">
          The Law (Policy Layer)
        </h1>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
          The Law is the foundational layer of Zaxion governance. It consists of versioned, declarative policies that define the technical boundaries of your architecture.
        </p>
      </div>

      <section className="space-y-12">
        <div className="grid gap-8">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Canonical Immutability</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              In Zaxion, a "Law" is not a suggestion—it is a cryptographic commitment. Once a policy is promoted to the Canonical state, it becomes immutable.
            </p>
          </div>

          <div className="grid gap-4">
            <DocsAccordion 
              title="Version Control & Cryptographic Hashing" 
              subtitle="Integrity Protocol"
              defaultOpen={true}
            >
              <p>Every policy change generates a new version with a unique SHA-256 hash. This ensures that when you audit a PR from six months ago, you are seeing the exact rules that were used to judge it, not the "current" rules.</p>
              <div className="bg-black/40 rounded p-4 border border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase">
                  <Lock className="h-3 w-3" /> Integrity Check
                </div>
                <code className="text-[11px] text-indigo-300 block font-mono">
                  $ zaxion policy verify --id pol_7721<br />
                  &gt; Hash: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855<br />
                  &gt; Status: VERIFIED (CANONICAL)
                </code>
              </div>
            </DocsAccordion>

            <DocsAccordion 
              title="Declarative Syntax (Z-YAML)" 
              subtitle="The Grammar of Law"
            >
              <p>Policies are written in Z-YAML, a domain-specific extension of YAML designed for AST-based rule matching. It allows you to define constraints on imports, inheritance, and architectural patterns without writing custom scripts.</p>
              <div className="bg-black/40 rounded p-4 border border-white/5">
                <pre className="text-[11px] text-indigo-300 font-mono leading-relaxed">
{`version: 1.0
rules:
  - id: strict-layering
    level: block
    match:
      type: import
      from: "src/features/*"
      to: "src/internal/*"
    rationale: "Features must not depend on internal shared logic directly."`}
                </pre>
              </div>
            </DocsAccordion>

            <DocsAccordion 
              title="Global vs. Local Scoping" 
              subtitle="Jurisdiction"
            >
              <p>Laws can be applied at the Organization level (Global) or the Repository level (Local). Global laws represent "Company-wide Standards," while Local laws represent "Project-specific Architecture." In the event of a conflict, the more restrictive Law always takes precedence.</p>
            </DocsAccordion>
          </div>
        </div>
      </section>

      <div className="pt-12 border-t border-white/5 flex justify-between items-center">
        <Link 
          to="/docs/constitution" 
          className="text-xs font-bold text-slate-500 hover:text-slate-400 transition-colors"
        >
          Back to Constitution
        </Link>
        <Link 
          to="/docs/constitution/the-judgment" 
          className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Pillar 02: The Judgment
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
};

export default TheLaw;
