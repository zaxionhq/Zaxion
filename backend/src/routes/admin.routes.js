// backend/src/routes/admin.routes.js
import { Router } from 'express';
import adminControllerFactory from '../controllers/admin.controller.js';
import { authenticateJWT } from '../middleware/auth.js';
import { authorizeFounder } from '../middleware/authorizeFounder.js';

export default function adminRoutesFactory(db) {
  const router = Router();
  const adminController = adminControllerFactory(db);

  // All admin routes are strictly limited to the Founder/Superuser
  router.get(
    '/status',
    authenticateJWT,
    authorizeFounder,
    adminController.getAdminStatus
  );

  router.post(
    '/bulk-analyze',
    authenticateJWT,
    authorizeFounder,
    adminController.bulkAnalyzeRepo
  );

  return router;
}
