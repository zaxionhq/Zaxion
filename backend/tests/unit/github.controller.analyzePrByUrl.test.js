import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mockPullsGet = jest.fn();
const mockFetchPrFilesWithContent = jest.fn();
const mockBuildSyntheticSnapshotFromZip = jest.fn();
const mockRunCodeAnalysis = jest.fn();

jest.unstable_mockModule('@octokit/rest', () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    pulls: { get: mockPullsGet },
  })),
}));

jest.unstable_mockModule('../../src/services/github.service.js', () => ({
  getRepoTree: jest.fn(),
  listBranches: jest.fn(),
  listPulls: jest.fn(),
  fetchPrFilesWithContent: mockFetchPrFilesWithContent,
}));

jest.unstable_mockModule('../../src/services/codeAnalysis.service.js', () => ({
  buildSyntheticSnapshotFromZip: mockBuildSyntheticSnapshotFromZip,
  buildSyntheticSnapshot: jest.fn(),
  runCodeAnalysis: mockRunCodeAnalysis,
}));

jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

const githubControllerFactory = (await import('../../src/controllers/github.controller.js')).default;

describe('github.controller analyzePrByUrl', () => {
  let req;
  let res;
  let next;
  let controller;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = githubControllerFactory({});

    req = {
      githubToken: 'gh-token',
      body: {
        policy_id: 'SEC-001',
        github_pr_url: 'https://github.com/acme/app/pull/42',
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    mockPullsGet.mockResolvedValue({
      data: {
        title: 'Fix auth bug',
        base: { ref: 'main' },
        user: { id: 1, login: 'dev1' },
      },
    });

    mockFetchPrFilesWithContent.mockResolvedValue({
      filesWithContent: [{ path: 'src/auth.ts', content: 'export {}' }],
      parserSuccessRate: 1.0,
    });

    mockBuildSyntheticSnapshotFromZip.mockReturnValue({
      data: {},
      metadata: {},
    });

    mockRunCodeAnalysis.mockReturnValue({
      result: 'PASS',
      violations: [],
    });
  });

  it('returns report_html on successful PR analysis', async () => {
    await controller.analyzePrByUrl(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.json.mock.calls[0][0];
    expect(payload.report_html).toBeDefined();
    expect(typeof payload.report_html).toBe('string');
    expect(payload.report_html).toContain('<!DOCTYPE html>');
    expect(payload.report_html).toContain('Policy Test Report');
    expect(payload.pr_number).toBe(42);
    expect(payload.repo_full_name).toBe('acme/app');
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid PR URL', async () => {
    req.body.github_pr_url = 'https://example.com/not-a-pr';

    await controller.analyzePrByUrl(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('Invalid GitHub PR URL') })
    );
  });

  it('returns 401 when GitHub token is missing', async () => {
    req.githubToken = null;

    await controller.analyzePrByUrl(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'GitHub token required' });
  });
});
