import React from 'react';
import { Cpu, ArrowRight, Code2, Microscope, Network, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import DocsCallout from '../../components/docs/DocsCallout';

const DocsASTAnalysis = () => {
  return (
    <div className="space-y-20">
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          Technical Engine
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white leading-tight">
          AST Analysis Engine
        </h1>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
          The core of Zaxion's intelligence is a high-performance Abstract Syntax Tree (AST) parser. By analyzing code at the structural level, we extract facts that regex-based tools miss.
        </p>
      </div>

      <DocsCallout type="tip" title="Why AST Matters">
        Regex-based tools can't distinguish between a variable name and a string literal. Zaxion's AST engine understands the scope, context, and semantic meaning of every token in your codebase.
      </DocsCallout>

      <div className="grid sm:grid-cols-2 gap-12">
        <div className="space-y-4">
          <div className="h-10 w-10 rounded border border-white/10 bg-white/[0.02] flex items-center justify-center">
            <Code2 className="h-5 w-5 text-indigo-400/70" />
          </div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-tight">Structural Awareness</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Unlike simple string matching, Zaxion understands the context of a symbol—whether it's a function call, a variable declaration, or a decorator.
          </p>
        </div>

        <div className="space-y-4">
          <div className="h-10 w-10 rounded border border-white/10 bg-white/[0.02] flex items-center justify-center">
            <Microscope className="h-5 w-5 text-indigo-400/70" />
          </div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-tight">Cross-Language Normalization</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Our engine normalizes facts across TypeScript, JavaScript, and Python into a canonical schema for policy evaluation.
          </p>
        </div>
      </div>

      <section className="space-y-10">
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600">The Extraction Pipeline</h2>
          <p className="text-sm text-slate-500">Transforming source code into verifiable institutional facts.</p>
        </div>

        <div className="grid gap-6">
          <div className="relative p-6 rounded border border-white/5 bg-[#0a0a0a] overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/20 group-hover:bg-indigo-500/40 transition-colors" />
            <div className="flex gap-6 items-start">
              <div className="h-10 w-10 rounded bg-white/5 flex items-center justify-center shrink-0">
                <Network className="h-5 w-5 text-slate-400" />
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-200">Fact Graph Generation</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Zaxion constructs a directed acyclic graph (DAG) of your code's structure. It maps how functions relate to modules, and how modules relate to architectural layers.
                </p>
                <div className="bg-black/40 rounded p-3 font-mono text-[10px] text-indigo-300/70 border border-white/5">
                  Symbol(AuthService) → DependsOn(UserRepo) → Violates(LayerConstraint)
                </div>
              </div>
            </div>
          </div>

          <div className="relative p-6 rounded border border-white/5 bg-[#0a0a0a] overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/20 group-hover:bg-indigo-500/40 transition-colors" />
            <div className="flex gap-6 items-start">
              <div className="h-10 w-10 rounded bg-white/5 flex items-center justify-center shrink-0">
                <Zap className="h-5 w-5 text-slate-400" />
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-200">Semantic Fact Extraction</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Beyond syntax, Zaxion extracts semantic metadata such as cyclomatic complexity, visibility scopes, and decorator-driven behavior.
                </p>
                <div className="grid grid-cols-2 gap-4 bg-black/40 rounded p-3 font-mono text-[9px] text-slate-500 border border-white/5">
                  <div className="space-y-1">
                    <div className="text-indigo-400/60 uppercase tracking-tighter">Properties</div>
                    <div>complexity: 12</div>
                    <div>is_exported: true</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-indigo-400/60 uppercase tracking-tighter">Visibility</div>
                    <div>scope: internal</div>
                    <div>access: private</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="pt-12 border-t border-white/5">
        <Link 
          to="/docs/risk-model" 
          className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Risk-Proportional Model
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
};

export default DocsASTAnalysis;
