import { describe, it, expect } from '@jest/globals';
import {
  buildScanProgress,
  renderScanProgressMarkdown,
  aggregateCheckRow,
} from '../../../src/services/incremental/policyReportMapper.service.js';

describe('policyReportMapper', () => {
  it('builds all-pass scan progress', () => {
    const sp = buildScanProgress({
      policyResults: [
        { policy_type: 'no_hardcoded_secrets', verdict: 'PASS' },
        { policy_type: 'no_sql_injection', verdict: 'PASS' },
      ],
      overallDecision: 'PASS',
      deepLink: 'https://app.test/pr/o/r/1',
    });
    expect(sp.scan_status).toBe('COMPLETED');
    expect(sp.overall_label).toBe('Passed');
    const secrets = sp.sections
      .flatMap((s) => s.checks)
      .find((c) => c.id === 'hardcoded_secrets');
    expect(secrets.state).toBe('passed');
    expect(secrets.summary).toBe('No issues');
  });

  it('marks failed secrets row on BLOCK', () => {
    const sp = buildScanProgress({
      policyResults: [{ policy_type: 'no_hardcoded_secrets', verdict: 'BLOCK' }],
      overallDecision: 'BLOCK',
    });
    const secrets = sp.sections.flatMap((s) => s.checks).find((c) => c.id === 'hardcoded_secrets');
    expect(secrets.state).toBe('failed');
  });

  it('renders markdown with section headers', () => {
    const md = renderScanProgressMarkdown(
      buildScanProgress({
        policyResults: [],
        overallDecision: 'PASS',
        deepLink: 'https://app.test/pr/x/y/2',
      })
    );
    expect(md).toContain('Zaxion Security & Governance Report');
    expect(md).toContain('**Security**');
    expect(md).toContain('View full report');
  });

  it('aggregateCheckRow returns skipped when flagged', () => {
    const agg = aggregateCheckRow(['reliability'], [], true);
    expect(agg.state).toBe('skipped');
  });
});
