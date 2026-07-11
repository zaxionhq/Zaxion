import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import reportsControllerFactory from '../controllers/reports.controller.js';

export default function reportsRoutesFactory(db) {
  const router = Router();
  const controller = reportsControllerFactory(db);

  router.get('/', authenticateJWT, controller.listReports);
  router.get('/:token', controller.getReport);
  router.post('/', authenticateJWT, controller.createReport);
  router.delete('/:token', authenticateJWT, controller.revokeReport);

  return router;
}
