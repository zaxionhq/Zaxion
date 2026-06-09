import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { GitHubReporterService } from '../../../src/services/githubReporter.service.js';
import { buildScanProgress } from '../../../src/services/incremental/policyReportMapper.service.js';

describe('GitHubReporterService.reportProgress', () => {
  const env = process.env;

  beforeEach(() => {
    process.env.INCR_SCAN_PROGRESS_UI_ENABLED = 'true';
  });

  afterEach(() => {
    process.env = { ...env };
  });

  it('updates in_progress check run with checklist markdown', async () => {
    const update = jest.fn().mockResolvedValue({ data: { id: 99 } });
    const octokit = { rest: { checks: { update } } };
    const reporter = new GitHubReporterService(octokit);

    const scanProgress = buildScanProgress({
      policyResults: [{ policy_type: 'no_hardcoded_secrets', verdict: 'PASS' }],
      overallDecision: 'PENDING',
      scanStatus: 'RUNNING',
    });

    await reporter.reportProgress('o', 'r', 'sha', 42, scanProgress);

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        check_run_id: 42,
        status: 'in_progress',
        output: expect.objectContaining({
          title: 'Analyzing…',
          summary: expect.stringContaining('Hardcoded secrets scan'),
        }),
      })
    );
  });
});
