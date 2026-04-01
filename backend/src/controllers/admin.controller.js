// backend/src/controllers/admin.controller.js
import { AdminService } from "../services/admin.service.js";
import * as logger from "../utils/logger.js";

/**
 * Controller for Admin/Founder operations.
 */
const adminControllerFactory = (db) => {
  const adminService = new AdminService();

  async function bulkAnalyzeRepo(req, res) {
    try {
      const { repoUrl, prCount = 5, policyIds = [] } = req.body;
      const user = req.user;
      const token = req.githubToken; // From auth middleware

      if (!repoUrl) {
        return res.status(400).json({ error: "Repository URL is required." });
      }

      logger.log(`[AdminController] User ${user.username} initiated bulk analysis for ${repoUrl}`);

      const results = await adminService.analyzeRepoPrs(repoUrl, prCount, policyIds, token);
      
      return res.status(200).json({
        success: true,
        data: results
      });
    } catch (err) {
      logger.error("[AdminController] bulkAnalyzeRepo error:", err);
      return res.status(500).json({ 
        error: "Bulk analysis failed.", 
        message: err.message 
      });
    }
  }

  async function getAdminStatus(req, res) {
    try {
      // If they reach here, they've passed the authorizeFounder middleware
      return res.status(200).json({
        success: true,
        admin: {
          username: req.user.username,
          role: req.user.role,
          is_founder: true,
          timestamp: new Date().toISOString()
        }
      });
    } catch (err) {
      logger.error("[AdminController] getAdminStatus error:", err);
      return res.status(500).json({ error: "Failed to fetch admin status." });
    }
  }

  return {
    bulkAnalyzeRepo,
    getAdminStatus
  };
};

export default adminControllerFactory;
