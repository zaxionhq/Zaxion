import { api } from '@/lib/api';

export type SharedReportType = 'founder_audit' | 'policy_simulation';

export async function createShareableReportLink(params: {
  type: SharedReportType;
  payload: unknown;
  reportHtml?: string;
  meta?: Record<string, unknown>;
  expiresInDays?: number;
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
