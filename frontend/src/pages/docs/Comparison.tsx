import React from 'react';
import { Link } from 'react-router-dom';
import { Scale } from 'lucide-react';

const rows: { dimension: string; zaxion: string; coderabbit: string; sonarqube: string; ghAdvanced: string; snyk: string }[] = [
  {
    dimension: 'Primary model',
    zaxion: 'Deterministic policy engine with optional AI explanations',
    coderabbit: 'AI-first PR review and summaries',
    sonarqube: 'Static analysis and quality gates',
    ghAdvanced: 'Secret, dependency, and code scanning',
    snyk: 'Vulnerability-focused code and dependency analysis',
  },
  {
    dimension: 'Pass / Warn / Block enforcement',
    zaxion: 'Yes — PR gate with explicit verdicts',
    coderabbit: 'Suggestions and comments; not a hard gate by default',
    sonarqube: 'Quality gate (configurable fail conditions)',
    ghAdvanced: 'Blocking on security findings when configured',
    snyk: 'PR checks for vulnerabilities',
  },
  {
    dimension: 'Policy simulation (historical)',
    zaxion: 'Yes — Policy Impact Simulator on past PRs and code samples',
    coderabbit: 'Limited / different focus',
    sonarqube: 'Branch and project analysis',
    ghAdvanced: 'No historical policy replay',
    snyk: 'No policy simulation',
  },
  {
    dimension: 'Shareable read-only reports',
    zaxion: 'Yes — time-limited public links',
    coderabbit: 'Varies by plan',
    sonarqube: 'Export reports from dashboard',
    ghAdvanced: 'No shareable audit reports',
    snyk: 'Limited reporting exports',
  },
  {
    dimension: 'Audit trail & overrides',
    zaxion: 'Decision history, signed overrides, governance ledger',
    coderabbit: 'Review thread history',
    sonarqube: 'Project history and quality trends',
    ghAdvanced: 'GitHub audit log',
    snyk: 'Issue and fix history',
  },
  {
    dimension: 'Custom policy-as-code',
    zaxion: 'Yes — JSON rules, core + custom policies',
    coderabbit: 'No custom policy engine',
    sonarqube: 'Quality profiles and rules',
    ghAdvanced: 'CodeQL custom queries',
    snyk: 'Policy rules for vulnerabilities',
  },
  {
    dimension: 'GitHub-native PR checks',
    zaxion: 'Yes',
    coderabbit: 'Yes',
    sonarqube: 'Yes (via CI integration)',
    ghAdvanced: 'Yes',
    snyk: 'Yes',
  },
];

const Comparison = () => (
  <div className="space-y-12 text-foreground">
    <div className="space-y-4">
      <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-[10px] font-mono text-primary uppercase tracking-wider">
        <Scale className="h-3 w-3" />
        Comparison
      </div>
      <h1 className="text-4xl font-bold tracking-tight">How Zaxion compares</h1>
      <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
        Zaxion focuses on <strong className="text-foreground">deterministic PR governance</strong> — pass, warn, or block
        before merge — with policy simulation and shareable audit reports. Other tools excel at AI review, quality metrics,
        or security scanning. Many teams use Zaxion alongside them rather than as a replacement for everything.
      </p>
    </div>

    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm min-w-[720px]">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="text-left p-4 font-semibold">Dimension</th>
            <th className="text-left p-4 font-semibold text-primary">Zaxion</th>
            <th className="text-left p-4 font-semibold">CodeRabbit</th>
            <th className="text-left p-4 font-semibold">SonarQube</th>
            <th className="text-left p-4 font-semibold">GitHub Advanced Security</th>
            <th className="text-left p-4 font-semibold">Snyk Code</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.dimension} className="border-b border-border/60 hover:bg-muted/10">
              <td className="p-4 font-medium align-top">{row.dimension}</td>
              <td className="p-4 text-muted-foreground align-top">{row.zaxion}</td>
              <td className="p-4 text-muted-foreground align-top">{row.coderabbit}</td>
              <td className="p-4 text-muted-foreground align-top">{row.sonarqube}</td>
              <td className="p-4 text-muted-foreground align-top">{row.ghAdvanced}</td>
              <td className="p-4 text-muted-foreground align-top">{row.snyk}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <p className="text-xs text-muted-foreground">
      Comparisons reflect typical product positioning as of 2026. Feature sets change — verify on each vendor&apos;s site for
      your requirements. See also{' '}
      <Link to="/docs/shared-reports" className="text-primary hover:underline">Shared Reports</Link> and{' '}
      <Link to="/docs/quick-start" className="text-primary hover:underline">Quick Start</Link>.
    </p>
  </div>
);

export default Comparison;
