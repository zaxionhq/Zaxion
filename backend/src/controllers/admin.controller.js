// backend/src/controllers/admin.controller.js
import { AdminService } from "../services/admin.service.js";
import * as logger from "../utils/logger.js";

const adminControllerFactory = (db) => {
  const adminService = new AdminService();

  async function bulkAnalyzeRepo(req, res) {
    try {
      const {
        targetMode = "repository",
        repoUrl,
        prCount = 5,
        prNumbers = [],
        prUrls = [],
        policyIds = [],
      } = req.body;
      const user = req.user;
      const token = req.githubToken;

      if (targetMode === "repository" || targetMode === "repo_prs") {
        if (!repoUrl) {
          return res.status(400).json({ error: "Repository URL is required." });
        }
      }

      if (targetMode === "repo_prs") {
        const numbers = adminService.parsePrNumbers(prNumbers);
        if (numbers.length === 0) {
          return res.status(400).json({ error: "At least one valid PR number is required." });
        }
      }

      if (targetMode === "pr_urls") {
        const parsed = adminService.parsePrUrlsList(prUrls);
        if (parsed.length === 0) {
          return res.status(400).json({ error: "At least one valid GitHub PR URL is required." });
        }
      }

      logger.log(`[AdminController] User ${user.username} initiated bulk analysis (mode: ${targetMode})`);

      const results = await adminService.bulkAnalyze(
        { targetMode, repoUrl, prCount, prNumbers, prUrls, policyIds },
        token
      );

      return res.status(200).json({
        success: true,
        data: results,
      });
    } catch (err) {
      logger.error("[AdminController] bulkAnalyzeRepo error:", err);
      const status = err.message?.includes("required") || err.message?.includes("Invalid") ? 400 : 500;
      return res.status(status).json({
        error: "Bulk analysis failed.",
        message: err.message,
      });
    }
  }

  async function getAdminStatus(req, res) {
    try {
      return res.status(200).json({
        success: true,
        admin: {
          username: req.user.username,
          role: req.user.role,
          is_founder: true,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      logger.error("[AdminController] getAdminStatus error:", err);
      return res.status(500).json({ error: "Failed to fetch admin status." });
    }
  }

  return {
    bulkAnalyzeRepo,
    getAdminStatus,
  };
};

export default adminControllerFactory;
