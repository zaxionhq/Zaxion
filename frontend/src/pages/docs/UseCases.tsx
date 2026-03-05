import React, { useState } from 'react';
import { ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';

type UseCase = {
  title: string;
  problem: string;
  solution: string;
  result: string;
};

const UseCaseItem = ({ item }: { item: UseCase }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.01] overflow-hidden transition-all">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 hover:bg-white/[0.02] transition-colors text-left"
      >
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-200">{item.title}</h3>
          {!isOpen && (
            <p className="text-sm text-slate-500 line-clamp-1">{item.problem}</p>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-slate-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-slate-500" />
        )}
      </button>
      
      {isOpen && (
        <div className="px-6 pb-6 pt-0 space-y-4 border-t border-white/5 bg-black/20">
          <div className="pt-4 space-y-3">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-indigo-400">The Problem</span>
              <p className="text-sm text-slate-400 mt-1">{item.problem}</p>
            </div>
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-indigo-400">Zaxion Solution</span>
              <p className="text-sm text-slate-400 mt-1">{item.solution}</p>
            </div>
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-indigo-400">The Result</span>
              <p className="text-sm text-slate-400 mt-1">{item.result}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DocsUseCases = () => {
  return (
    <div className="space-y-12">
      <div className="space-y-6">
        <h1 className="text-4xl font-bold tracking-tight text-white leading-tight">
          Common Use Cases
        </h1>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
          Learn how Zaxion helps you solve real-world development challenges.
        </p>
      </div>

      <div className="space-y-4">
        {[
          {
            title: "Prevent Mega-PRs",
            problem: "Large PRs are hard to review and hide bugs. They often sit stale for days because no one wants to review 50+ files at once.",
            solution: "Configure a 'pr_size' policy to warn on PRs > 20 files and block on PRs > 50 files.",
            result: "Developers naturally break work into smaller, reviewable chunks. Code review velocity increases by 40%."
          },
          {
            title: "Enforce Testing on Critical Code",
            problem: "Bugs slip into authentication or payment logic because developers forget to add tests or 'promise to add them later'.",
            solution: "Set a 'coverage' policy that requires at least 1 test file modification whenever files in src/auth/ or src/billing/ are touched.",
            result: "No more unverified code in critical paths. Production incidents related to auth drop significantly."
          },
          {
            title: "Protect Sensitive Files",
            problem: "Accidental changes to configuration files (like package-lock.json or production configs) can take down the site.",
            solution: "Use a 'path_protection' policy to BLOCK changes to config/production.json unless the PR is approved by the DevOps team.",
            result: "Production stability is protected from accidental or unauthorized configuration drift."
          },
          {
            title: "Standardize Tech Stack",
            problem: "Developers introduce random libraries or file types (e.g., Python scripts in a Node repo) without discussion.",
            solution: "Use an 'allowed_extensions' policy to only permit .js, .ts, .json, and .md files.",
            result: "The codebase remains consistent and free of 'shadow IT' scripts or unapproved languages."
          },
          {
            title: "Enforce Migration Deadlines",
            problem: "The team agreed to stop using a deprecated library (e.g., 'moment.js'), but people keep adding new imports.",
            solution: "Create a 'pattern_ban' policy that blocks any new lines of code containing 'import moment'.",
            result: "Technical debt is actively prevented from growing. The migration actually happens."
          }
        ].map((item, i) => (
          <UseCaseItem key={i} item={item} />
        ))}
      </div>

      <div className="pt-8 border-t border-white/5 flex gap-4">
        <Link 
          to="/docs/examples" 
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-sm font-medium transition-colors"
        >
          View Examples
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

export default DocsUseCases;
