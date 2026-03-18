import { jest } from '@jest/globals';
import { GitHubReporterService } from '../../src/services/githubReporter.service.js';

// Mock dependencies
jest.mock('../../src/config/env.js', () => ({
  default: {
    GITHUB_CHECK_NAME: 'Zaxion Governance',
    FRONTEND_URL: 'http://test-frontend.com'
  }
}));

jest.mock('../../src/utils/logger.js', () => ({
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

describe('GitHubReporterService Summary Generation', () => {
  let reporter;
  let mockOctokit;

  beforeEach(() => {
    mockOctokit = {
      rest: {
        issues: {
          listComments: jest.fn().mockResolvedValue({ data: [] }),
          createComment: jest.fn().mockResolvedValue({}),
          updateComment: jest.fn().mockResolvedValue({})
        },
        checks: {
          listForRef: jest.fn().mockResolvedValue({ data: { check_runs: [] } }),
          create: jest.fn().mockResolvedValue({ data: { id: 123 } }),
          update: jest.fn().mockResolvedValue({ data: { id: 123 } })
        }
      }
    };
    reporter = new GitHubReporterService(mockOctokit);
  });

  it('should generate a concise summary with a deep link to the frontend', async () => {
    const decisionObject = {
      decision: 'BLOCK',
      facts: {
        hasCriticalChanges: true,
        totalChanges: 5,
        testFilesAdded: 0
      },
      advisor: {
        suggestedTestIntents: [{ file: 'foo.js', intent: 'test it' }]
      },
      prNumber: 10
    };

    await reporter.reportStatus('owner', 'repo', 'sha123', decisionObject, { prNumber: 10 });

    expect(mockOctokit.rest.issues.createComment).toHaveBeenCalled();
    const callArgs = mockOctokit.rest.issues.createComment.mock.calls[0][0];
    const body = callArgs.body;

    // Check for Sticky Marker
    expect(body).toContain('<!-- ZAXION_STICKY_COMMENT -->');

    // Check for Status Badge
    expect(body).toContain('🔴 BLOCK');

    // Check for Deep Link
    expect(body).toContain('[**📋 View Full Governance Report**](http://localhost:8080/pr/owner/repo/10)');

    // Check for Metrics (Concise)
    expect(body).toContain('- **Risk Analysis:** 🔴 Critical');
    expect(body).toContain('- **Changes:** 5 files');
    expect(body).toContain('- **Issues Found:** 1 (See full report for details)');

    // Check that detailed sections are NOT present in the comment
    expect(body).not.toContain('### 💡 Zaxion Advisor Insights'); // This was in the detailed report
    expect(body).not.toContain('Suggested Test Intents');
  });

  it('should handle PASS status correctly in summary', async () => {
    const decisionObject = {
      decision: 'PASS',
      facts: {
        hasCriticalChanges: false,
        totalChanges: 2
      },
      prNumber: 11
    };

    await reporter.reportStatus('owner', 'repo', 'sha123', decisionObject, { prNumber: 11 });

    const callArgs = mockOctokit.rest.issues.createComment.mock.calls[0][0];
    const body = callArgs.body;

    expect(body).toContain('🟢 PASS');
    expect(body).toContain('- **Risk Analysis:** 🟢 Safe');
  });
});
