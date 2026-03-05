import React from 'react';
import { ArrowRight, Terminal } from 'lucide-react';
import { Link } from 'react-router-dom';
import DocsCallout from '../../components/docs/DocsCallout';
import DocsStep from '../../components/docs/DocsStep';

const DocsFAQ = () => {
  return (
    <div className="space-y-12">
      <div className="space-y-6">
        <h1 className="text-4xl font-bold tracking-tight text-white leading-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
          Common questions about setting up and using Zaxion.
        </p>
      </div>

      <div className="space-y-8">
        {[
          {
            question: "How long does setup take?",
            answer: "Typically 5 minutes or less. Install the GitHub App, add a .zaxion.yaml file to your repo, and you're done."
          },
          {
            question: "What is the pricing?",
            answer: "Zaxion is currently in beta and free for open-source projects. Enterprise plans are available for larger organizations."
          },
          {
            question: "Do I need to host it myself?",
            answer: "No. Zaxion is a hosted SaaS solution. However, we offer a self-hosted option for enterprise customers."
          },
          {
            question: "Can I customize policies?",
            answer: "Yes! Policies are defined in a simple YAML file (.zaxion.yaml) in your repository."
          },
          {
            question: "What if Zaxion makes a mistake?",
            answer: "If Zaxion blocks a PR incorrectly, you can use the override command (e.g., /zaxion override) to bypass the check."
          }
        ].map((item, i) => (
          <div key={i} className="space-y-2">
            <h3 className="text-lg font-bold text-slate-200">{item.question}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{item.answer}</p>
          </div>
        ))}
      </div>

      <div className="pt-8 border-t border-white/5 flex gap-4">
        <Link 
          to="/docs/troubleshooting" 
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-sm font-medium transition-colors"
        >
          Troubleshooting Guide
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

export default DocsFAQ;
