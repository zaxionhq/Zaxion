import * as analyticsService from '../services/governanceAnalytics.service.js';

/**
 * Phase 6 Pillar 4: Governance Analytics Controller
 */
export default function analyticsControllerFactory(db) {
  /**
   * GET /api/v1/analytics/governance/summary
   * Query: days (optional) - limit to last N days (7, 30)
   */
  async function getExecutiveSummary(req, res, next) {
    try {
      const days = req.query.days ? parseInt(req.query.days, 10) : undefined;
      const summary = await analyticsService.getExecutiveSummary(db, days ? { days } : {});
      res.json(summary);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/analytics/governance/repo?repo_full_name=owner/repo
   */
  async function getRepoMetrics(req, res, next) {
    try {
      const { repo_full_name } = req.query;
      if (!repo_full_name) {
        const error = new Error("Missing required query parameter: repo_full_name");
        error.statusCode = 400;
        throw error;
      }

      const metrics = await analyticsService.getRepoMetrics(db, repo_full_name);
      res.json(metrics);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/analytics/governance/decisions
   * Query: limit, offset, from (ISO date), to (ISO date)
   */
  async function listDecisions(req, res, next) {
    try {
      const { limit = 50, offset = 0, from, to } = req.query;
      const dateRange = (from || to) ? { from: from || undefined, to: to || undefined } : {};
      const decisions = await analyticsService.listDecisions(db, parseInt(limit, 10) || 50, parseInt(offset, 10) || 0, dateRange);
      res.json(decisions);
    } catch (error) {
      next(error);
    }
  }

  return {
    getExecutiveSummary,
    getRepoMetrics,
    listDecisions
  };
}
