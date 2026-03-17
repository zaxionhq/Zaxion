import React from 'react';
import { 
  Shield, 
  Settings, 
  Github, 
  CheckCircle2, 
  Terminal, 
  Code2, 
  ArrowRight, 
  AlertCircle,
  ExternalLink,
  BookOpen,
  Lock,
  Zap,
  Layout,
  FileCode
} from 'lucide-react';
import { Link } from 'react-router-dom';
import DocsStep from '../../components/docs/DocsStep';

const SetupGuide = () => {
  return (
    <div className="space-y-16 pb-20">
      {/* Header */}
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-mono text-indigo-400 uppercase tracking-[0.2em]">
          Official Setup Guide
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight text-white leading-tight">
          Zaxion Governance Setup
        </h1>
        <p className="text-xl text-slate-400 leading-relaxed max-w-3xl">
          Complete walkthrough to installing, configuring, and mastering Zaxion Governance in your organization. From the first click in the Marketplace to advanced automated workflows.
        </p>
      </div>

      {/* Quick Links / Table of Contents */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "1. Installation", icon: Github, href: "#installation" },
          { title: "2. Configuration", icon: Settings, href: "#configuration" },
          { title: "3. Rules & Policies", icon: Shield, href: "#rules" },
          { title: "4. Integration", icon: Zap, href: "#integration" },
        ].map((item, i) => (
          <a 
            key={i} 
            href={item.href}
            className="flex items-center gap-3 p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all group"
          >
            <item.icon className="h-5 w-5 text-indigo-400 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold text-slate-200">{item.title}</span>
          </a>
        ))}
      </div>

      {/* Section 1: Installation */}
      <section id="installation" className="space-y-8 scroll-mt-20">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Github className="h-5 w-5 text-indigo-400" />
          </div>
          <h2 className="text-3xl font-bold text-white">1. Installing Zaxion</h2>
        </div>
        
        <div className="prose prose-invert max-w-none space-y-6">
          <p className="text-slate-400 leading-relaxed">
            Zaxion lives where your code lives. The first step is to connect our governance engine to your GitHub organization.
          </p>
          
          <div className="space-y-6">
            <DocsStep number="01" title="Find us on GitHub Marketplace">
              Search for <strong>"Zaxion Governance"</strong> in the GitHub Marketplace. Select a plan that fits your team size (we offer a generous free tier for open source).
            </DocsStep>
            <DocsStep number="02" title="Select Repositories">
              You can choose to install Zaxion on <strong>All repositories</strong> or <strong>Select repositories</strong>. We recommend starting with a single "pilot" repository to refine your policies.
            </DocsStep>
            <DocsStep number="03" title="Authorize Permissions">
              Zaxion requires minimal permissions:
              <ul className="list-disc ml-6 mt-2 space-y-1 text-slate-500">
                <li><strong>Read</strong> access to code (to analyze diffs)</li>
                <li><strong>Read & Write</strong> access to Checks (to post pass/fail results)</li>
                <li><strong>Read & Write</strong> access to Pull Requests (to leave helpful comments)</li>
              </ul>
            </DocsStep>
          </div>
        </div>
      </section>

      {/* Section 2: Configuration */}
      <section id="configuration" className="space-y-8 scroll-mt-20">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Settings className="h-5 w-5 text-indigo-400" />
          </div>
          <h2 className="text-3xl font-bold text-white">2. Core Configuration</h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.01] space-y-4">
            <div className="flex items-center gap-2 text-indigo-400">
              <Shield className="h-4 w-4" />
              <h3 className="text-sm font-bold uppercase tracking-wider">Branch Protection</h3>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              In your GitHub Repo Settings, go to <strong>Branches</strong> → <strong>Branch protection rules</strong>. Add a rule for your main branch and check:
              <br /><br />
              <code className="text-xs bg-white/5 px-2 py-1 rounded text-slate-300">Require status checks to pass before merging</code>
              <br /><br />
              Search for <code className="text-xs bg-white/5 px-2 py-1 rounded text-indigo-300">Zaxion Governance</code> and select it.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.01] space-y-4">
            <div className="flex items-center gap-2 text-indigo-400">
              <Lock className="h-4 w-4" />
              <h3 className="text-sm font-bold uppercase tracking-wider">Access Controls</h3>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Configure who can sign <strong>Overrides</strong>. By default, only users with <code className="text-xs bg-white/5 px-2 py-1 rounded text-slate-300">Admin</code> or <code className="text-xs bg-white/5 px-2 py-1 rounded text-slate-300">Maintainer</code> permissions on GitHub can bypass a Zaxion block.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Rules & Recommendations */}
      <section id="rules" className="space-y-8 scroll-mt-20">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Shield className="h-5 w-5 text-indigo-400" />
          </div>
          <h2 className="text-3xl font-bold text-white">3. Governance Rules</h2>
        </div>

        <div className="space-y-8">
          <p className="text-slate-400">
            Recommendations based on your project's maturity:
          </p>
          
          <div className="grid gap-8">
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-slate-200">For Fast-Moving Startups</h4>
              <ul className="grid gap-4 sm:grid-cols-2">
                <li className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  <div>
                    <span className="block text-sm font-bold text-slate-300">PR Size Limit</span>
                    <span className="text-xs text-slate-500">Max 30 files. Keeps reviews fast and focused.</span>
                  </div>
                </li>
                <li className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  <div>
                    <span className="block text-sm font-bold text-slate-300">Secret Scanning</span>
                    <span className="text-xs text-slate-500">Always enable. Prevents accidental credential leaks.</span>
                  </div>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-bold text-slate-200">For Enterprise Compliance</h4>
              <ul className="grid gap-4 sm:grid-cols-2">
                <li className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-indigo-500 shrink-0" />
                  <div>
                    <span className="block text-sm font-bold text-slate-300">100% Coverage on Auth</span>
                    <span className="text-xs text-slate-500">Require tests for any changes in /src/auth.</span>
                  </div>
                </li>
                <li className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-indigo-500 shrink-0" />
                  <div>
                    <span className="block text-sm font-bold text-slate-300">No Circular Deps</span>
                    <span className="text-xs text-slate-500">Enforce architectural integrity org-wide.</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Advanced Workflows */}
      <section id="advanced" className="space-y-8 scroll-mt-20">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Zap className="h-5 w-5 text-indigo-400" />
          </div>
          <h2 className="text-3xl font-bold text-white">4. Advanced Workflows</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.01] space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Automated Testing Triggers</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Zaxion can automatically trigger specific test suites based on the files changed in a PR.
              <br /><br />
              <strong className="text-indigo-400">Example:</strong> If a file in <code className="text-xs bg-white/5 px-1 rounded text-slate-300">/src/payments</code> is modified, Zaxion will block the PR until it detects a corresponding new test file in <code className="text-xs bg-white/5 px-1 rounded text-slate-300">/__tests__/payments</code>.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.01] space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Deployment Approval Workflows</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Integrate Zaxion with your deployment pipeline. Use the Zaxion API to prevent a build from starting if the PR governance score is below 80%.
              <br /><br />
              <strong className="text-indigo-400">Enforcement:</strong> Combine with GitHub Environment protection to require the Zaxion check to pass before deploying to Production.
            </p>
          </div>
        </div>
      </section>

      {/* Section 5: Integration Examples */}
      <section id="integration" className="space-y-8 scroll-mt-20">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Layout className="h-5 w-5 text-indigo-400" />
          </div>
          <h2 className="text-3xl font-bold text-white">5. Workflow Integration</h2>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold text-slate-200">Frontend Implementation</h3>
          <p className="text-slate-400 text-sm">
            You can display Zaxion policy status directly in your internal admin dashboards or developer tools using our API.
          </p>
          
          <div className="bg-black/40 rounded-2xl border border-white/5 overflow-hidden">
            <div className="px-4 py-2 bg-white/5 border-b border-white/5 flex items-center justify-between">
              <div className="flex gap-1.5">
                <div className="h-2 w-2 rounded-full bg-red-500/50" />
                <div className="h-2 w-2 rounded-full bg-yellow-500/50" />
                <div className="h-2 w-2 rounded-full bg-green-500/50" />
              </div>
              <span className="text-[10px] font-mono text-slate-500">ZaxionStatus.tsx</span>
            </div>
            <div className="p-6 font-mono text-xs text-slate-300 overflow-x-auto">
              <pre>{`const ZaxionStatus = ({ owner, repo, prNumber }) => {
  const [decision, setDecision] = useState(null);

  useEffect(() => {
    fetch(\`/api/v1/github/repos/\${owner}/\${repo}/pr/\${prNumber}/decision\`)
      .then(res => res.json())
      .then(data => setDecision(data));
  }, [owner, repo, prNumber]);

  if (!decision) return <div>Loading Governance...</div>;

  return (
    <div className="p-4 border rounded-lg">
      <h3>Policy Verdict: {decision.decision}</h3>
      <p>Reason: {decision.decisionReason}</p>
      <a href={decision.resolution_url}>Review in Zaxion</a>
    </div>
  );
};`}</pre>
            </div>
          </div>
        </div>
      </section>

      {/* Troubleshooting */}
      <section className="p-8 rounded-3xl bg-red-500/[0.02] border border-red-500/10 space-y-6">
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="h-5 w-5" />
          <h2 className="text-lg font-bold">Troubleshooting</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-200">Check not appearing?</h4>
            <p className="text-xs text-slate-500">Ensure the Zaxion App has permission to access the specific repository. Check GitHub App settings → Installed Apps.</p>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-200">Override button disabled?</h4>
            <p className="text-xs text-slate-500">You must have 'Admin' or 'Maintainer' role on GitHub. Standard 'Write' access is not sufficient for security overrides.</p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <div className="flex flex-col items-center justify-center py-12 space-y-6 text-center border-t border-white/5">
        <h2 className="text-2xl font-bold text-white">Ready to automate your governance?</h2>
        <div className="flex gap-4">
          <Link 
            to="/governance" 
            className="px-8 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold transition-all shadow-lg shadow-indigo-500/20"
          >
            Go to Dashboard
          </Link>
          <Link 
            to="/docs/getting-started" 
            className="px-8 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold border border-white/10 transition-all"
          >
            Read Core Concepts
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SetupGuide;
