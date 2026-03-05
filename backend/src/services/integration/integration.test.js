import { describe, it, expect, vi } from 'vitest';
import { AsyncDispatcherService } from './AsyncDispatcher.service.js';

describe('Pillar 3: Integration Surface', () => {
  const mockSlack = { postMessage: vi.fn() };
  const mockJira = { 
    findIssue: vi.fn(),
    createIssue: vi.fn(),
    addComment: vi.fn()
  };
  
  const dispatcher = new AsyncDispatcherService(mockSlack, mockJira);

  it('should send Slack alert for CRITICAL blocks', async () => {
    const decision = {
      repo: 'repo-1',
      prId: 101,
      status: 'BLOCK',
      severity: 'CRITICAL',
      violation: { policyId: 'SEC-001' }
    };

    await dispatcher.dispatch(decision);
    expect(mockSlack.postMessage).toHaveBeenCalled();
    expect(mockSlack.postMessage.mock.calls[0][0].text).toContain('Critical Block');
  });

  it('should create Jira ticket if none exists', async () => {
    mockJira.findIssue.mockResolvedValue(null);
    mockJira.createIssue.mockClear(); // Reset mock before test
    
    const decision = {
      repo: 'repo-1',
      prId: 102,
      status: 'BLOCK',
      severity: 'HIGH',
      violation: { policyId: 'QA-001' }
    };

    await dispatcher.dispatch(decision);
    expect(mockJira.createIssue).toHaveBeenCalled();
    expect(mockJira.createIssue.mock.calls[0][0].key).toContain('ZAX-repo-1-102');
  });

  it('should update Jira ticket if it already exists (Idempotency)', async () => {
    mockJira.findIssue.mockResolvedValue({ id: 'ISSUE-123' });
    mockJira.createIssue.mockClear(); // Reset mock before test
    
    const decision = {
      repo: 'repo-1',
      prId: 102,
      status: 'BLOCK',
      severity: 'HIGH',
      violation: { policyId: 'QA-001' }
    };

    await dispatcher.dispatch(decision);
    expect(mockJira.createIssue).not.toHaveBeenCalled();
    expect(mockJira.addComment).toHaveBeenCalledWith('ISSUE-123', expect.stringContaining('Still blocked'));
  });

  it('should NOT send Slack alert for non-critical blocks', async () => {
    mockSlack.postMessage.mockClear();
    
    const decision = {
      repo: 'repo-1',
      prId: 103,
      status: 'BLOCK',
      severity: 'MEDIUM', // Not CRITICAL
      violation: { policyId: 'LINT-001' }
    };

    await dispatcher.dispatch(decision);
    expect(mockSlack.postMessage).not.toHaveBeenCalled();
  });
});
