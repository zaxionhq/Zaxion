import * as analyticsService from '../services/governanceAnalytics.service.js';

/**
 * Phase 6 Pillar 4: Governance Analytics Controller
 */
export default function analyticsControllerFactory(db) {
  /**
   * GET /api/v1/analytics/governance/summary
   */
  async function getExecutiveSummary(req, res, next) {
    try {
      const summary = await analyticsService.getExecutiveSummary(db);
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
   */
  async function listDecisions(req, res, next) {
    try {
      const { limit = 50, offset = 0 } = req.query;
      const decisions = await analyticsService.listDecisions(db, parseInt(limit), parseInt(offset));
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
