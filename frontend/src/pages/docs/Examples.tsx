import React from 'react';
import { ArrowRight, Terminal } from 'lucide-react';
import { Link } from 'react-router-dom';
import DocsCallout from '../../components/docs/DocsCallout';
import DocsStep from '../../components/docs/DocsStep';

const DocsExamples = () => {
  return (
    <div className="space-y-12">
      <div className="space-y-6">
        <h1 className="text-4xl font-bold tracking-tight text-white leading-tight">
          Examples & Recipes
        </h1>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
          Practical examples of Zaxion policies and configurations.
        </p>
      </div>

      <div className="space-y-8">
        <h2 className="text-2xl font-bold text-white">Policy Configuration</h2>
        
        <div className="space-y-6">
          <div className="bg-black/20 p-6 rounded-lg border border-white/5 space-y-4">
            <h3 className="text-lg font-bold text-slate-200">1. Test Coverage Guard</h3>
            <p className="text-sm text-slate-400">Require tests for all new code in specific directories.</p>
            <div className="p-4 rounded bg-black border border-white/10 font-mono text-xs text-slate-300 overflow-x-auto">
              <pre>{`policies:
  - name: "Require Tests for Auth"
    type: "coverage"
    paths: ["src/auth/**", "src/security/**"]
    min_tests: 1
    action: "block"
    message: "Critical: Authentication code must be tested."`}</pre>
            </div>
          </div>

          <div className="bg-black/20 p-6 rounded-lg border border-white/5 space-y-4">
            <h3 className="text-lg font-bold text-slate-200">2. PR Size Limit</h3>
            <p className="text-sm text-slate-400">Prevent overly large PRs that are hard to review.</p>
            <div className="p-4 rounded bg-black border border-white/10 font-mono text-xs text-slate-300 overflow-x-auto">
              <pre>{`policies:
  - name: "PR Size Warning"
    type: "pr_size"
    threshold: 50
    action: "warn"
    message: "Consider splitting this PR into smaller changes."`}</pre>
            </div>
          </div>

          <div className="bg-black/20 p-6 rounded-lg border border-white/5 space-y-4">
            <h3 className="text-lg font-bold text-slate-200">3. Protected Files</h3>
            <p className="text-sm text-slate-400">Prevent modifications to sensitive configuration files unless approved.</p>
            <div className="p-4 rounded bg-black border border-white/10 font-mono text-xs text-slate-300 overflow-x-auto">
              <pre>{`policies:
  - name: "Protect Production Config"
    type: "path_protection"
    paths: ["config/production.json", ".env.production"]
    action: "block"
    message: "Changes to production configuration require admin approval."`}</pre>
            </div>
          </div>

          <div className="bg-black/20 p-6 rounded-lg border border-white/5 space-y-4">
            <h3 className="text-lg font-bold text-slate-200">4. Dependency Risk Policy</h3>
            <p className="text-sm text-slate-400">
              Block adding vulnerable package versions in <code className="bg-white/10 px-1 rounded text-indigo-300">package.json</code>.
            </p>
            <div className="p-4 rounded bg-black border border-white/10 font-mono text-xs text-slate-300 overflow-x-auto">
              <pre>{`policies:
  - name: "Dependency Risk Policy"
    type: "dependency_risk"
    vulnerable:
      lodash: "<4.17.21"
      axios: "<0.21.2"
      moment: "<2.29.2"
    action: "block"
    message: "Vulnerable dependency detected. Please upgrade to a safe version."`}</pre>
            </div>
            <div className="text-[11px] text-slate-500">
              What it flags: <em>Adding</em> dependencies like <code>\"lodash\": \"^4.17.20\"</code> in a PR.
            </div>
          </div>

          <div className="bg-black/20 p-6 rounded-lg border border-white/5 space-y-4">
            <h3 className="text-lg font-bold text-slate-200">5. Secret Detection Policy</h3>
            <p className="text-sm text-slate-400">
              Block hardcoded secrets like AWS keys, Stripe keys, or GitHub tokens in diffs.
            </p>
            <div className="p-4 rounded bg-black border border-white/10 font-mono text-xs text-slate-300 overflow-x-auto">
              <pre>{`policies:
  - name: "Secret Detection Policy"
    type: "secret_detection"
    patterns:
      - "AKIA[0-9A-Z]{16}"       # AWS Access Key
      - "SK[0-9a-fA-F]{32}"     # Stripe Secret Key
      - "ghp_[a-zA-Z0-9]{36}"   # GitHub Personal Access Token
    action: "block"
    message: "Hardcoded secret detected. Remove and rotate the credential."`}</pre>
            </div>
            <div className="text-[11px] text-slate-500">
              What it flags: New lines like <code>const key = "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"</code> added in code or config.
            </div>
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-white/5 flex gap-4">
        <Link 
          to="/docs/faq" 
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-sm font-medium transition-colors"
        >
          Frequently Asked Questions
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

export default DocsExamples;
