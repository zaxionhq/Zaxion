import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  createSharedReport,
  getSharedReportByToken,
  listReportsByUser,
} from '../../src/services/sharedReport.service.js';

jest.unstable_mockModule('../../src/config/env.js', () => ({
  default: { FRONTEND_ORIGIN: 'https://app.test', FRONTEND_URL: 'https://app.test' },
}));

describe('sharedReport.service', () => {
  const mockDb = {
    SharedReport: {
      create: jest.fn(),
      findOne: jest.fn(),
      findAll: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('createSharedReport returns share_url', async () => {
    mockDb.SharedReport.create.mockResolvedValue({
      id: 'uuid-1',
      share_token: 'abc',
    });

    const out = await createSharedReport(mockDb, {
      type: 'founder_audit',
      payload: { owner: 'o', repo: 'r' },
      createdBy: 'user-1',
    });

    expect(out.share_url).toContain('/reports/');
    expect(out.share_token).toHaveLength(64);
    expect(mockDb.SharedReport.create).toHaveBeenCalled();
  });

  it('getSharedReportByToken returns expired for past expires_at', async () => {
    mockDb.SharedReport.findOne.mockResolvedValue({
      share_token: 'tok',
      revoked_at: null,
      expires_at: new Date('2020-01-01'),
      type: 'founder_audit',
      payload: {},
    });

    const out = await getSharedReportByToken(mockDb, 'tok');
    expect(out.expired).toBe(true);
  });

  it('listReportsByUser returns mapped reports with share_url', async () => {
    const future = new Date();
    future.setDate(future.getDate() + 7);
    mockDb.SharedReport.findAll.mockResolvedValue([
      {
        share_token: 'abc'.repeat(21).slice(0, 64),
        type: 'policy_simulation',
        meta: { repo: 'o/r' },
        created_at: new Date(),
        expires_at: future,
        revoked_at: null,
      },
    ]);

    const out = await listReportsByUser(mockDb, 'user-1');
    expect(out).toHaveLength(1);
    expect(out[0].share_url).toContain('/reports/');
    expect(out[0].is_active).toBe(true);
    expect(mockDb.SharedReport.findAll).toHaveBeenCalled();
  });

  it('listReportsByUser returns empty without userId', async () => {
    const out = await listReportsByUser(mockDb, null);
    expect(out).toEqual([]);
  });
});
