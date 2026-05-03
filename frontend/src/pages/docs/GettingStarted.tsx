import React from 'react';
import {
  ArrowRight,
  Terminal,
  CheckCircle2,
  Shield,
  Github,
  LayoutDashboard,
  BookOpen,
  Clock,
  Code2,
  User,
  Users,
  Lock,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import DocsStep from '../../components/docs/DocsStep';
import DocsInlineFAQ from '../../components/docs/DocsInlineFAQ';

const DocsGettingStarted = () => {
  return (
    <div className="w-full space-y-20 text-foreground transition-colors duration-300">
      {/* Hero */}
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-bold text-primary uppercase tracking-widest">
          Documentation home
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
          Zaxion documentation
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl">
          Zaxion is <strong className="text-foreground font-semibold">pull request governance for GitHub</strong>: it analyzes
          each PR against your policies and reports pass, warn, or block before merge—with a deterministic evaluation pipeline
          and an audit trail you can review in the dashboard.
        </p>
        <p className="text-sm text-muted-foreground max-w-3xl">
          <strong className="text-foreground">You need:</strong> a GitHub account, permission to install the Zaxion GitHub App on
          your org or repo, and (for protected branches) branch protection configured to require the Zaxion check when you want
          merge blocking.
        </p>
      </div>

      {/* Start here — three tracks */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">Start here</h2>
        <p className="text-muted-foreground text-sm max-w-2xl">
          Pick the path that matches what you are trying to do first.
        </p>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: 'Install on GitHub',
              desc: 'Connect the GitHub App, choose repos, and understand required permissions and branch protection.',
              icon: Github,
              links: [
                { label: 'Full setup guide', to: '/documentation#installation' },
                { label: 'GitHub App setup', to: '/docs/implementation/github-integration' },
              ],
            },
            {
              title: 'Use the dashboard',
              desc: 'Log in with GitHub, explore policies, simulations, and decisions for your organization.',
              icon: LayoutDashboard,
              links: [
                { label: 'Open Governance', to: '/governance' },
                { label: 'Quick start (5 min)', to: '/docs/quick-start' },
                { label: 'Policy Rules (JSON)', to: '/docs/examples' },
                { label: 'Rule types', to: '/docs/rules' },
              ],
            },
            {
              title: 'How decisions work',
              desc: 'Learn the protocol: fact extraction, policy evaluation, verdicts, overrides, and audit history.',
              icon: BookOpen,
              links: [
                { label: 'Protocol overview', to: '/docs/overview' },
                { label: 'Deterministic evaluation', to: '/docs/deterministic-evaluation' },
              ],
            },
          ].map((card) => (
            <div
              key={card.title}
              className="p-6 rounded-2xl border border-border bg-card/50 space-y-4 hover:border-primary/30 transition-colors shadow-sm flex flex-col"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <card.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-base font-bold text-foreground">{card.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">{card.desc}</p>
              <ul className="space-y-2 pt-2">
                {card.links.map((l) => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1"
                    >
                      {l.label}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* By role */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">By role</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: 'Developer',
              icon: User,
              bullets: [
                { label: 'Use cases & examples', to: '/docs/use-cases' },
                { label: 'Examples & JSON rules', to: '/docs/examples' },
                { label: 'Troubleshooting', to: '/docs/troubleshooting' },
              ],
            },
            {
              title: 'Team lead',
              icon: Users,
              bullets: [
                { label: 'Policy library', to: '/docs/policies' },
                { label: 'Policy Rules (JSON)', to: '/docs/examples' },
                { label: 'Rule types', to: '/docs/rules' },
                { label: 'Policy creation', to: '/docs/policy-creation' },
              ],
            },
            {
              title: 'Security & compliance',
              icon: Lock,
              bullets: [
                { label: 'Security model', to: '/docs/security' },
                { label: 'Audit trail', to: '/docs/audit-trail' },
                { label: 'Signed overrides', to: '/docs/signed-overrides' },
              ],
            },
          ].map((col) => (
            <div key={col.title} className="rounded-2xl border border-border bg-muted/20 p-6 space-y-4">
              <div className="flex items-center gap-2 text-foreground font-bold">
                <col.icon className="h-4 w-4 text-primary" />
                {col.title}
              </div>
              <ul className="space-y-2 text-sm">
                {col.bullets.map((b) => (
                  <li key={b.to}>
                    <Link to={b.to} className="text-primary hover:underline font-medium">
                      {b.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* By time */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">By time available</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              label: 'About 5 minutes',
              desc: 'Install, one repo, first check.',
              icon: Clock,
              to: '/docs/quick-start',
              cta: 'Quick start',
            },
            {
              label: 'About 30 minutes',
              desc: 'Branch protection, policies, and team workflow.',
              icon: Sparkles,
              to: '/documentation',
              cta: 'Setup guide',
            },
            {
              label: 'Deep dive',
              desc: 'AST facts, risk model, enforcement lifecycle.',
              icon: Code2,
              to: '/docs/ast-analysis',
              cta: 'Technical docs',
            },
          ].map((row) => (
            <Link
              key={row.label}
              to={row.to}
              className="flex flex-col p-6 rounded-2xl border border-border bg-card/40 hover:border-primary/40 hover:bg-card/60 transition-all group"
            >
              <div className="flex items-center gap-2 text-primary mb-2">
                <row.icon className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">{row.label}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4 flex-1">{row.desc}</p>
              <span className="text-sm font-bold text-primary inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                {row.cta}
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          After the technical primer, continue with{' '}
          <Link to="/docs/risk-model" className="text-primary hover:underline font-medium">
            Risk scoring
          </Link>{' '}
          and{' '}
          <Link to="/docs/enforcement-lifecycle" className="text-primary hover:underline font-medium">
            Enforcement lifecycle
          </Link>
          .
        </p>
      </section>

      {/* Trust strip */}
      <section className="rounded-2xl border border-border bg-muted/15 p-8 space-y-4">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          What Zaxion sees (and does not)
        </h2>
        <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground max-w-3xl">
          <li>
            Zaxion works from <strong className="text-foreground">PR metadata and code changes</strong> (diffs, files, and
            structured analysis) to evaluate policies—not from running your application in arbitrary ways.
          </li>
          <li>
            The security model is described in detail in{' '}
            <Link to="/docs/security" className="text-primary hover:underline font-medium">
              Security model
            </Link>
            ; privacy practices are in{' '}
            <Link to="/docs/privacy" className="text-primary hover:underline font-medium">
              Privacy policy
            </Link>
            .
          </li>
          <li>
            For private repositories, use the GitHub App with least-privilege scopes appropriate to checks and PR feedback.
          </li>
        </ul>
      </section>

      {/* Deploy & configure (condensed prior narrative) */}
      <section className="space-y-10 pt-6 border-t border-border">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Deploy & configure in the product</h2>
          <p className="text-muted-foreground text-sm max-w-2xl">
            These steps happen inside the <Link to="/governance" className="text-primary hover:underline font-medium">Governance</Link>{' '}
            dashboard after you can sign in. For installation and GitHub settings, use the{' '}
            <Link to="/documentation" className="text-primary hover:underline font-medium">
              setup guide
            </Link>
            .
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {[
            {
              title: '1. Define policies',
              desc: 'Translate standards into executable rules—templates, core library, and custom configuration.',
              icon: Shield,
            },
            {
              title: '2. Simulate impact',
              desc: 'Test rules against PRs or snippets before tightening enforcement.',
              icon: CheckCircle2,
            },
            {
              title: '3. Enforce & audit',
              desc: 'Enable checks on repos, review decisions, and use overrides with accountability.',
              icon: Terminal,
            },
          ].map((item, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl border border-border bg-card/50 space-y-4 hover:border-primary/30 transition-colors shadow-sm"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-base font-bold text-foreground/90">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <DocsStep number="01" title="Access the Governance dashboard" to="/governance">
            Sign in with GitHub. This is your home for policies, simulations, analytics, and audit context.
          </DocsStep>
          <DocsStep number="02" title="Create or enable policies" to="/governance/policy-library">
            Use the policy library and configuration guides to match your risk tolerance. Start from core policies or templates.
          </DocsStep>
          <DocsStep number="03" title="Run a simulation" to="/governance">
            Use the policy simulator where available to see how a rule would affect sample PRs or uploads before you block merges.
          </DocsStep>
          <DocsStep number="04" title="Track decisions" to="/governance">
            Review outcomes and overrides so your team keeps a clear record of what shipped and why.
          </DocsStep>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between p-8 rounded-2xl border border-primary/20 bg-primary/5 gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-lg font-bold text-foreground">Ready to wire GitHub?</h3>
            <p className="text-sm text-muted-foreground font-medium">
              Follow the full setup guide and branch protection checklist.
            </p>
          </div>
          <Link
            to="/documentation"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
          >
            Open setup guide
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <DocsInlineFAQ
        title="Getting started – FAQ"
        items={[
          {
            question: 'How do I log in?',
            answer: (
              <>
                Use <strong className="text-foreground">Sign in with GitHub</strong> on the Zaxion app. Your GitHub identity is
                used to access the Governance dashboard according to your repository permissions.
              </>
            ),
          },
          {
            question: 'Do you offer SAML, self-hosted, or a fixed-length enterprise trial?',
            answer: (
              <>
                Zaxion today is focused on <strong className="text-foreground">hosted SaaS</strong> and{' '}
                <strong className="text-foreground">GitHub OAuth</strong> for sign-in.{' '}
                <strong className="text-foreground">SAML, dedicated deployments, and custom trials</strong> are discussed with
                teams as part of enterprise onboarding—contact us at{' '}
                <a href="mailto:zaxionhq@gmail.com" className="text-primary hover:underline">
                  zaxionhq@gmail.com
                </a>{' '}
                with your requirements.
              </>
            ),
          },
          {
            question: 'How do I invite my engineering team?',
            answer: (
              <>
                Teammates need access to the same GitHub org/repos and should sign in to Zaxion with their GitHub accounts.
                Fine-grained roles evolve with your plan; use <strong className="text-foreground">Governance → Settings</strong>{' '}
                for available options.
              </>
            ),
          },
          {
            question: 'Can I use Zaxion on private repositories?',
            answer: (
              <>
                Yes. Install the <strong className="text-foreground">Zaxion GitHub App</strong> on the repositories you want
                governed. We analyze PR content needed for checks; see the{' '}
                <Link to="/docs/security" className="text-primary hover:underline font-medium">
                  Security model
                </Link>{' '}
                and{' '}
                <Link to="/docs/privacy" className="text-primary hover:underline font-medium">
                  Privacy policy
                </Link>{' '}
                for how data is handled.
              </>
            ),
          },
        ]}
      />
    </div>
  );
};

export default DocsGettingStarted;
