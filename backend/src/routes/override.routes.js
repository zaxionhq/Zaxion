// src/routes/override.routes.js
import { Router } from 'express';
import overrideControllerFactory from '../controllers/override.controller.js';
import { authenticateJWT } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';

export default function overrideRoutesFactory(db) {
  const router = Router();
  const overrideController = overrideControllerFactory(db);

  // Overrides Registry
  router.post(
    '/',
    authenticateJWT,
    authorize(['user', 'admin']),
    overrideController.createOverride
  );

  router.get(
    '/',
    authenticateJWT,
    authorize(['user', 'admin']),
    overrideController.listOverrides
  );

  router.get(
    '/:id',
    authenticateJWT,
    authorize(['user', 'admin']),
    overrideController.getOverride
  );

  // Signatures (Accountability Fingerprints)
  router.post(
    '/:id/signatures',
    authenticateJWT,
    authorize(['user', 'admin']),
    overrideController.addSignature
  );

  return router;
}
