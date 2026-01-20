import { Router } from 'express';
import governanceMemoryControllerFactory from '../controllers/governanceMemory.controller.js';
import { authenticateJWT, authorize } from '../middleware/auth.middleware.js';

export default function governanceMemoryRoutesFactory(db) {
  const router = Router();
  const memoryController = governanceMemoryControllerFactory(db);

  // Record a decision (Downstream-only)
  router.post('/decisions', authenticateJWT, authorize(['admin', 'service']), memoryController.recordDecision);

  // Get metrics for a policy
  router.get('/policies/:policyId/metrics', authenticateJWT, authorize(['user', 'admin']), memoryController.getPolicyMetrics);

  // Get historical decisions for a fact (e.g., a PR)
  router.get('/facts/:factId/history', authenticateJWT, authorize(['user', 'admin']), memoryController.getFactHistory);

  // Record a human challenge/dispute
  router.post('/challenges', authenticateJWT, authorize(['user', 'admin']), memoryController.recordChallenge);

  return router;
}
