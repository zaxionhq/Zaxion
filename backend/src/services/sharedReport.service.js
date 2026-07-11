import crypto from 'crypto';
import env from '../config/env.js';

const DEFAULT_EXPIRY_DAYS = 30;

function generateShareToken() {
  return crypto.randomBytes(32).toString('hex');
}

function buildShareUrl(token) {
  const frontend = (env.FRONTEND_ORIGIN || env.FRONTEND_URL || 'http://localhost:8080').replace(/\/+$/, '');
  return `${frontend}/reports/${token}`;
}

/**
 * @param {object} db
 * @param {object} params
 * @param {string} params.type - founder_audit | policy_simulation
 * @param {object} params.payload
 * @param {string} [params.reportHtml]
 * @param {object} [params.meta]
 * @param {string} [params.createdBy]
 * @param {number} [params.expiresInDays]
 */
export async function createSharedReport(db, params) {
  const days = params.expiresInDays ?? DEFAULT_EXPIRY_DAYS;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);

  const shareToken = generateShareToken();
  const row = await db.SharedReport.create({
    share_token: shareToken,
    type: params.type,
    payload: params.payload,
    report_html: params.reportHtml ?? null,
    meta: params.meta ?? null,
    created_by: params.createdBy ?? null,
    expires_at: expiresAt,
  });

  return {
    id: row.id,
    share_token: shareToken,
    share_url: buildShareUrl(shareToken),
    expires_at: expiresAt.toISOString(),
  };
}

export async function getSharedReportByToken(db, token) {
  const row = await db.SharedReport.findOne({ where: { share_token: token } });
  if (!row) return null;
  if (row.revoked_at) return { expired: true, reason: 'revoked' };
  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    return { expired: true, reason: 'expired' };
  }
  return {
    type: row.type,
    payload: row.payload,
    report_html: row.report_html,
    meta: row.meta,
    generated_at: row.created_at,
    expires_at: row.expires_at,
  };
}

export async function revokeSharedReport(db, token, userId) {
  const row = await db.SharedReport.findOne({ where: { share_token: token } });
  if (!row) return false;
  if (row.created_by && userId && row.created_by !== userId) {
    const err = new Error('Not authorized to revoke this report');
    err.statusCode = 403;
    throw err;
  }
  await row.update({ revoked_at: new Date() });
  return true;
}

export async function listReportsByUser(db, userId) {
  if (!userId) return [];
  const rows = await db.SharedReport.findAll({
    where: { created_by: userId },
    order: [['created_at', 'DESC']],
    attributes: ['share_token', 'type', 'meta', 'created_at', 'expires_at', 'revoked_at'],
  });

  return rows.map((row) => ({
    share_token: row.share_token,
    share_url: buildShareUrl(row.share_token),
    type: row.type,
    meta: row.meta,
    created_at: row.created_at,
    expires_at: row.expires_at,
    revoked_at: row.revoked_at,
    is_active: !row.revoked_at && (!row.expires_at || new Date(row.expires_at) >= new Date()),
  }));
}
