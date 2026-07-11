import * as sharedReportService from '../services/sharedReport.service.js';

export default function reportsControllerFactory(db) {
  async function createReport(req, res, next) {
    try {
      const { type, payload, report_html: reportHtml, meta, expires_in_days: expiresInDays } = req.body;
      if (!type || !payload) {
        return res.status(400).json({ error: 'type and payload are required' });
      }
      if (!['founder_audit', 'policy_simulation'].includes(type)) {
        return res.status(400).json({ error: 'Invalid report type' });
      }

      const result = await sharedReportService.createSharedReport(db, {
        type,
        payload,
        reportHtml,
        meta,
        createdBy: req.user?.id,
        expiresInDays: expiresInDays,
      });

      return res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async function getReport(req, res, next) {
    try {
      const { token } = req.params;
      const report = await sharedReportService.getSharedReportByToken(db, token);
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      if (report.expired) {
        return res.status(410).json({ error: 'Report link has expired or been revoked', reason: report.reason });
      }
      return res.json(report);
    } catch (err) {
      next(err);
    }
  }

  async function listReports(req, res, next) {
    try {
      const reports = await sharedReportService.listReportsByUser(db, req.user?.id);
      return res.json({ reports });
    } catch (err) {
      next(err);
    }
  }

  async function revokeReport(req, res, next) {
    try {
      const { token } = req.params;
      const ok = await sharedReportService.revokeSharedReport(db, token, req.user?.id);
      if (!ok) return res.status(404).json({ error: 'Report not found' });
      return res.json({ ok: true });
    } catch (err) {
      if (err.statusCode === 403) return res.status(403).json({ error: err.message });
      next(err);
    }
  }

  return { createReport, listReports, getReport, revokeReport };
}
