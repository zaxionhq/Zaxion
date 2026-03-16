import { jest } from '@jest/globals';
import { PolicyEngineService } from '../../services/policyEngine.service.js';

describe('PolicyEngineService Consistency Test', () => {
  let octokit;
  let db;
  let service;

  beforeEach(() => {
    octokit = {
      repos: {
        getCollaboratorPermissionLevel: jest.fn().mockResolvedValue({ data: { permission: 'admin' } })
      }
    };
    db = {
      PolicyConfiguration: {
        findOne: jest.fn().mockResolvedValue(null) // All policies enabled
      }
    };
    service = new PolicyEngineService(octokit, db);
  });

  it('should block PR with hardcoded secrets (SEC-001)', async () => {
    const prContext = {
      totalChanges: 1,
      categories: { highRisk: [], tests: [], other: ['src/auth-service-config.js'] },
      files: [
        { 
          path: 'src/auth-service-config.js', 
          content: 'const token = "ghp_123456789012345678901234567890123456";',
          extension: 'js'
        }
      ],
      security: { secretsFound: [{ file: 'src/auth-service-config.js', pattern: 'GitHub PAT' }] }
    };

    const metadata = {
      owner: 'test-owner',
      repo: 'test-repo',
      prNumber: 4,
      baseBranch: 'main',
      prBody: 'Adding auth config',
      userLogin: 'test-user'
    };

    const result = await service.evaluate(prContext, metadata);
    
    expect(result.decision).toBe('BLOCK');
    expect(result.decisionReason).toContain('security pattern(s) found');
    expect(result.decisionReason).toContain('no-hardcoded-secrets');
  });

  it('should block PR with SQL injection (SEC-002)', async () => {
    const prContext = {
      totalChanges: 1,
      categories: { highRisk: [], tests: [], other: ['src/db.js'] },
      files: [
        { 
          path: 'src/db.js', 
          content: 'db.raw(`SELECT * FROM users WHERE id = ${id}`)',
          extension: 'js'
        }
      ]
    };

    const metadata = {
      owner: 'test-owner',
      repo: 'test-repo',
      prNumber: 5,
      baseBranch: 'main',
      prBody: 'Fixing db query',
      userLogin: 'test-user'
    };

    const result = await service.evaluate(prContext, metadata);
    
    expect(result.decision).toBe('BLOCK');
    expect(result.decisionReason).toContain('no-sql-injection');
  });

  it('should downgrade BLOCK to WARN on feature branches', async () => {
    const prContext = {
      totalChanges: 1,
      categories: { highRisk: [], tests: [], other: ['src/auth.js'] },
      files: [
        { path: 'src/auth.js', content: 'const key = "ghp_123456789012345678901234567890123456";', extension: 'js' }
      ]
    };

    const metadata = {
      owner: 'test-owner',
      repo: 'test-repo',
      prNumber: 6,
      baseBranch: 'feature-branch', // Not main
      prBody: 'WIP auth',
      userLogin: 'test-user'
    };

    const result = await service.evaluate(prContext, metadata);
    
    expect(result.decision).toBe('WARN');
    expect(result.decisionReason).toContain('Downgraded to WARN');
  });
});
