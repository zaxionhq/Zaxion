import { api } from '@/lib/api';

export type SharedReportType = 'founder_audit' | 'policy_simulation';

export type ShareExpiryDays = 1 | 7 | 30 | 90;

export interface SharedReportListItem {
  share_token: string;
  share_url: string;
  type: SharedReportType;
  meta?: Record<string, unknown>;
  created_at: string;
  expires_at: string | null;
  revoked_at: string | null;
  is_active: boolean;
}

export async function createShareableReportLink(params: {
  type: SharedReportType;
  payload: unknown;
  reportHtml?: string;
  meta?: Record<string, unknown>;
  expiresInDays?: ShareExpiryDays;
}): Promise<string> {
  const res = await api.post<{ share_url: string }>('/v1/reports', {
    type: params.type,
    payload: params.payload,
    report_html: params.reportHtml,
    meta: params.meta,
    expires_in_days: params.expiresInDays ?? 30,
  });
  return res.share_url;
}

export async function listMySharedReports(): Promise<SharedReportListItem[]> {
  const res = await api.get<{ reports: SharedReportListItem[] }>('/v1/reports');
  return res.reports ?? [];
}

export async function revokeSharedReport(token: string): Promise<void> {
  await api.delete(`/v1/reports/${token}`);
}
