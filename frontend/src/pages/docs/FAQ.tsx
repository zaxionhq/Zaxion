import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const DocsFAQ = () => {
  return (
    <div className="space-y-12 text-foreground">
      <div className="space-y-6">
        <h1 className="text-4xl font-bold tracking-tight leading-tight">Frequently asked questions</h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
          Practical answers about installing and running Zaxion on GitHub. For the full doc map, start at{' '}
          <Link to="/docs" className="text-primary hover:underline font-medium">
            Documentation home
          </Link>
          .
        </p>
      </div>

      <div className="space-y-8">
        {[
          {
            question: 'How long does setup take?',
            answer:
              'Most teams get a first check running in about 5–15 minutes: install the GitHub App on a pilot repo, follow the branch protection checklist in the setup guide, and open a test PR.',
          },
          {
            question: 'What does pricing look like?',
            answer:
              'Zaxion is in active development; many teams use it on public and private repos during beta. For volume pricing, compliance reviews, or enterprise terms, email zaxionhq@gmail.com.',
          },
          {
            question: 'Do I need to self-host?',
            answer:
              'The product is built as hosted SaaS. If you need a dedicated deployment, VPC requirements, or SAML-only access, contact us—those are handled as enterprise engagements.',
          },
          {
            question: 'How do I sign in?',
            answer:
              'Use Sign in with GitHub (OAuth). SAML and other IdPs are not the default path today; ask us if that is a hard requirement for your org.',
          },
          {
            question: 'Can I customize policies?',
            answer:
              'Yes. Use the Governance dashboard and policy configuration docs to enable core rules, tune severity, and (where supported) add repository-level configuration. See Policy library and Rule types in the sidebar.',
          },
          {
            question: 'What if Zaxion blocks a PR incorrectly?',
            answer:
              'Use your documented override flow (for example PR body markers or maintainer actions, depending on how your org configured governance). Signed overrides and audit context are described under Audit & Ledger in the docs.',
          },
        ].map((item, i) => (
          <div key={i} className="space-y-2">
            <h3 className="text-lg font-bold text-foreground">{item.question}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
          </div>
        ))}
      </div>

      <div className="pt-8 border-t border-border flex flex-wrap gap-4">
        <Link
          to="/docs/troubleshooting"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-muted/50 hover:bg-muted border border-border text-foreground text-sm font-medium transition-colors"
        >
          Troubleshooting
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          to="/documentation"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-muted/50 hover:bg-muted border border-border text-foreground text-sm font-medium transition-colors"
        >
          Setup guide
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

export default DocsFAQ;
