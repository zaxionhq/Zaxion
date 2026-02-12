import React from 'react';
import { Cpu, ArrowRight, Code2, Microscope } from 'lucide-react';
import { Link } from 'react-router-dom';

const DocsASTAnalysis = () => {
  return (
    <div className="space-y-16">
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          Technical Engine
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white">
          AST Analysis Engine
        </h1>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
          The core of Zaxion's intelligence is a high-performance Abstract Syntax Tree (AST) parser. By analyzing code at the structural level, we extract facts that regex-based tools miss.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-12">
        <div className="space-y-4">
          <div className="h-8 w-8 rounded border border-white/10 bg-white/[0.02] flex items-center justify-center">
            <Code2 className="h-4 w-4 text-slate-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-tight">Structural Awareness</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Unlike simple string matching, Zaxion understands the context of a symbol—whether it's a function call, a variable declaration, or a decorator.
          </p>
        </div>

        <div className="space-y-4">
          <div className="h-8 w-8 rounded border border-white/10 bg-white/[0.02] flex items-center justify-center">
            <Microscope className="h-4 w-4 text-slate-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-tight">Cross-Language Fact Extraction</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Our engine normalizes facts across TypeScript, JavaScript, and Python into a canonical schema for policy evaluation.
          </p>
        </div>
      </div>

      <section className="space-y-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600">Extracted Fact Schema</h2>
        <div className="bg-[#0a0a0a] rounded border border-white/5 p-6 font-mono text-[10px] text-slate-500">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-indigo-400 mb-2">// Symbols</p>
              <ul className="space-y-1">
                <li>functions[]</li>
                <li>classes[]</li>
                <li>imports[]</li>
                <li>decorators[]</li>
              </ul>
            </div>
            <div>
              <p className="text-indigo-400 mb-2">// Metadata</p>
              <ul className="space-y-1">
                <li>complexity_score</li>
                <li>dependency_count</li>
                <li>is_exported</li>
                <li>line_range</li>
              </ul>
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
