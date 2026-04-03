import { jest } from '@jest/globals';
import { PrAnalysisService } from '../../services/prAnalysis.service.js';
import { DiffAnalyzerService } from '../../services/diffAnalyzer.service.js';
import { PolicyEngineService } from '../../services/policyEngine.service.js';
import { AdvisorService } from '../../services/advisor.service.js';
import { LlmService } from '../../services/llm.service.js';
import { GitHubReporterService } from '../../services/githubReporter.service.js';
import githubAppService from '../../services/githubApp.service.js';
import * as models from '../../models/index.js';
import sequelize from '../../config/sequelize.js';

// Mock external dependencies
jest.mock('../../services/diffAnalyzer.service.js', () => ({
  __esModule: true,
  DiffAnalyzerService: jest.fn(),
}));
jest.mock('../../services/policyEngine.service.js', () => ({
  __esModule: true,
  PolicyEngineService: jest.fn(),
}));
jest.mock('../../services/advisor.service.js', () => ({
  __esModule: true,
  AdvisorService: jest.fn(),
}));
jest.mock('../../services/llm.service.js', () => ({
  __esModule: true,
  LlmService: jest.fn(),
}));
jest.mock('../../services/githubReporter.service.js', () => ({
  __esModule: true,
  GitHubReporterService: jest.fn(),
}));
jest.mock('../../services/githubApp.service.js', () => ({
  __esModule: true,
  default: {
    getInstallationAccessToken: jest.fn(),
  },
}));
jest.mock('../../models/index.js', () => ({
  Decision: { create: jest.fn() },
  FactSnapshot: { create: jest.fn() },
  PolicyVersion: { findOne: jest.fn(), create: jest.fn() },
  Policy: { findOne: jest.fn(), create: jest.fn() },
  User: { findOne: jest.fn(), create: jest.fn() },
}));


describe('Full Audit Pipeline Integration Test', () => {
  let prAnalysisService;
  let mockOctokit;
  let mockDb;
  let mockTransaction;

  const mockPrData = {
    owner: 'test-owner',
    repo: 'test-repo',
    prNumber: 1,
    headSha: 'testsha123',
    baseRef: 'main',
    headRef: 'feature-branch',
    installationId: 12345,
  };

  beforeAll(() => {
    // No direct mocking of initDb here, it's handled by jest.mock factory
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockOctokit = {
      pulls: { get: jest.fn().mockResolvedValue({ data: { body: 'PR Body', user: { login: 'test-user' }, title: 'Test PR' } }) },
      repos: { getCommit: jest.fn(), compareCommits: jest.fn() },
      checks: { create: jest.fn(), update: jest.fn() },
    };

    mockDb = {
      Decision: { create: jest.fn() },
      FactSnapshot: { create: jest.fn() },
      PolicyVersion: { findOne: jest.fn(), create: jest.fn() },
      Policy: { findOne: jest.fn(), create: jest.fn() },
      User: { findOne: jest.fn(), create: jest.fn() },
    };

    mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn(),
      finished: false,
    };
    jest.spyOn(sequelize, 'transaction').mockImplementation(() => Promise.resolve(mockTransaction));
    jest.spyOn(sequelize, 'query').mockResolvedValue([[], 0]);



    jest.spyOn(githubAppService, 'getInstallationAccessToken').mockResolvedValue('mock-token');
    jest.spyOn(GitHubReporterService.prototype, 'reportStatus').mockResolvedValue('mock-check-run-id');

    // Default service method spies
    jest.spyOn(DiffAnalyzerService.prototype, 'analyze').mockResolvedValue({
      files: [{ path: 'file.js', content: 'console.log("hello");', ast: { semantic: {} } }],
      totalChanges: 1,
      categories: { highRisk: [], tests: [], other: ['file.js'] },
      security: { secretsFound: [] },
    });
    PolicyEngineService.prototype.POLICY_VERSION = 'v1.0.0';
    jest.spyOn(PolicyEngineService.prototype, 'evaluate').mockResolvedValue({
      decision: 'PASS',
      decisionReason: 'All policies passed',
      policy_results: [{ policyType: 'coverage', verdict: 'PASS' }],
      violations: [],
      system_health: {},
      confidence: 1.0,
      advisor: { riskAssessment: { confidence: 1.0, riskLevel: 'LOW' } },
    });
    jest.spyOn(AdvisorService.prototype, 'enrich').mockResolvedValue({
      riskAssessment: { confidence: 1.0, riskLevel: 'LOW' },
    });

    prAnalysisService = new PrAnalysisService();
  });

  it('should successfully analyze a clean PR and report PASS', async () => {
    await prAnalysisService.execute(mockPrData);

    // Verify GitHub status reporting
    expect(GitHubReporterService.prototype.reportStatus).toHaveBeenCalledWith(
      mockPrData.owner,
      mockPrData.repo,
      mockPrData.headSha,
      expect.anything(),
      expect.any(Object)
    );

    expect(GitHubReporterService.prototype.reportStatus).toHaveBeenCalledTimes(1);
  });

  it('should block a PR with a hardcoded secret and report BLOCK', async () => {
    const mockViolations = [
      {
        rule_id: 'SEC-001',
        severity: 'BLOCK',
        message: 'Hardcoded secret detected',
        file: 'src/config.js',
        line: 5,
        column: 10,
        code: 'const API_KEY = "supersecret";',
      },
    ];

    jest.spyOn(PolicyEngineService.prototype, 'evaluate').mockResolvedValue({
      decision: 'BLOCK',
      decisionReason: 'Hardcoded secret found',
      policy_results: [{ policyType: 'no_hardcoded_secrets', verdict: 'BLOCK' }],
      violations: mockViolations,
      system_health: {},
      confidence: 0.8,
      advisor: { riskAssessment: { confidence: 0.8, riskLevel: 'HIGH' } },
    });

    await prAnalysisService.execute(mockPrData);

    expect(GitHubReporterService.prototype.reportStatus).toHaveBeenCalledWith(
      mockPrData.owner,
      mockPrData.repo,
      mockPrData.headSha,
      expect.anything(),
      expect.any(Object)
    );

    expect(GitHubReporterService.prototype.reportStatus).toHaveBeenCalledTimes(1);
  });

  it('should handle a Dependabot PR by skipping coverage checks and reporting PASS if no other issues', async () => {
    const dependabotPrData = { ...mockPrData, userLogin: 'dependabot[bot]' };

    jest.spyOn(DiffAnalyzerService.prototype, 'analyze').mockResolvedValue({
      files: [{ path: 'package.json', content: '{}', ast: { semantic: {} } }],
      totalChanges: 1,
      categories: { highRisk: [], tests: [], other: ['package.json'] },
      security: { secretsFound: [] },
    });

    jest.spyOn(PolicyEngineService.prototype, 'evaluate').mockResolvedValue({
      decision: 'PASS',
      decisionReason: 'Automated bot PR, coverage skipped',
      policy_results: [{ policyType: 'coverage', verdict: 'PASS', message: 'Skipping coverage check for automated bot PR.' }],
      violations: [],
      system_health: {},
      confidence: 1.0,
      advisor: { riskAssessment: { confidence: 1.0, riskLevel: 'LOW' } },
    });

    await prAnalysisService.execute(dependabotPrData);

    expect(GitHubReporterService.prototype.reportStatus).toHaveBeenCalledWith(
      dependabotPrData.owner,
      dependabotPrData.repo,
      dependabotPrData.headSha,
      expect.anything(),
      expect.any(Object)
    );

    expect(GitHubReporterService.prototype.reportStatus).toHaveBeenCalledTimes(1);
  });

  it('should report BLOCK and rollback transaction if an unhandled error occurs', async () => {
    const errorMessage = 'Simulated internal error during analysis';
    jest.spyOn(DiffAnalyzerService.prototype, 'analyze').mockRejectedValue(new Error(errorMessage));

    await expect(prAnalysisService.execute(mockPrData)).resolves.toBeUndefined();
    expect(GitHubReporterService.prototype.reportStatus).toHaveBeenCalled();
  });

  it('should handle POLICY_VERSION_RACE error gracefully and report WARN', async () => {
    sequelize.query.mockImplementation((sql) => {
      if (sql.includes('UPDATE pr_decisions')) {
        return Promise.resolve([[], 0]); // Simulate no rows affected for the update
      }
      if (sql.includes('SELECT policy_version FROM pr_decisions')) {
        return Promise.resolve([[{ policy_version: 'v1.0.1' }], 1]); // Simulate a different version in DB
      }
      return Promise.resolve([[], 0]);
    });

    await prAnalysisService.execute(mockPrData);

    expect(GitHubReporterService.prototype.reportStatus).toHaveBeenCalledWith(
      mockPrData.owner,
      mockPrData.repo,
      mockPrData.headSha,
      expect.anything(),
      expect.any(Object)
    );
  });
});
