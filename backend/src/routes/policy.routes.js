// src/routes/policy.routes.js
import { Router } from 'express';
import policyControllerFactory from '../controllers/policy.controller.js';
import { authenticateJWT } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';

export default function policyRoutesFactory(db) {
  const router = Router();
  const policyController = policyControllerFactory(db);

  // Policies CRUD
  router.post(
    '/',
    authenticateJWT,
    authorize(['user', 'admin']), // Assuming users can create policies for now, restrict later
    policyController.createPolicy
  );

  router.get(
    '/',
    authenticateJWT,
    authorize(['user', 'admin']),
    policyController.listPolicies
  );

  router.get(
    '/:id',
    authenticateJWT,
    authorize(['user', 'admin']),
    policyController.getPolicy
  );

  // Policy Versions (Immutable)
  router.post(
    '/:id/versions',
    authenticateJWT,
    authorize(['user', 'admin']),
    policyController.createPolicyVersion
  );

  router.get(
    '/:id/versions/:version',
    authenticateJWT,
    authorize(['user', 'admin']),
    policyController.getPolicyVersion
  );

  return router;
}
