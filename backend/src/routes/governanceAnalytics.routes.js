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

  // All analytics routes require authentication and user/admin roles
  router.use(authenticateJWT);
  router.use(authorize(['user', 'admin', 'auditor']));

  router.get('/summary', controller.getExecutiveSummary);
  router.get('/repo', controller.getRepoMetrics);
  router.get('/decisions', controller.listDecisions);

  return router;
}
