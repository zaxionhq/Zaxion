import { Router } from 'express';
import analyticsControllerFactory from '../controllers/governanceAnalytics.controller.js';
import { authenticateJWT } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';

/**
 * Phase 6 Pillar 4: Governance Analytics Routes
 */
export default function analyticsRoutesFactory(db) {
  const router = Router();
  const controller = analyticsControllerFactory(db);

  // All analytics routes require authentication and admin/auditor roles
  router.use(authenticateJWT);
  router.use(authorize(['admin', 'auditor']));

  router.get('/summary', controller.getExecutiveSummary);
  router.get('/repo', controller.getRepoMetrics);

  return router;
}
