import React from 'react';
import { ArrowRight, Terminal } from 'lucide-react';
import { Link } from 'react-router-dom';
import DocsCallout from '../../components/docs/DocsCallout';
import DocsStep from '../../components/docs/DocsStep';

const DocsTroubleshooting = () => {
  return (
    <div className="space-y-12">
      <div className="space-y-6">
        <h1 className="text-4xl font-bold tracking-tight text-white leading-tight">
          Troubleshooting
        </h1>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
          Common issues and how to fix them.
        </p>
      </div>

      <div className="space-y-8">
        {[
          {
            title: "Zaxion Not Running",
            problem: "No Zaxion checks appear on your PR.",
            solution: "Ensure the Zaxion GitHub App is installed on your repository."
          },
          {
            title: "Missing Configuration",
            problem: "Zaxion reports 'Configuration not found'.",
            solution: "Check that .zaxion.yaml exists in the root of your repository."
          },
          {
            title: "Policy Too Strict",
            problem: "Zaxion blocks a valid change.",
            solution: "Use the override command (/zaxion override) or update your policy configuration."
          }
        ].map((item, i) => (
          <div key={i} className="p-6 rounded-lg border border-white/5 bg-white/[0.01] space-y-4">
            <h3 className="text-lg font-bold text-slate-200">{item.title}</h3>
            <p className="text-sm text-slate-400"><strong>Problem:</strong> {item.problem}</p>
            <p className="text-sm text-slate-400"><strong>Solution:</strong> {item.solution}</p>
          </div>
        ))}
      </div>

      <div className="pt-8 border-t border-white/5 flex gap-4">
        <Link 
          to="/docs/overview" 
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-sm font-medium transition-colors"
        >
          Return to Overview
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

export default DocsTroubleshooting;
