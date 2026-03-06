// src/routes/policy.routes.js
import { Router } from 'express';
import policyControllerFactory from '../controllers/policy.controller.js';
import { authenticateJWT } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';

export default function policyRoutesFactory(db) {
  const router = Router();
  const policyController = policyControllerFactory(db);
  const isProd = process.env.NODE_ENV === 'production';

  // In non-production environments, we allow both 'user' and 'admin' roles
  // to access admin-only features so local development and demos are easier.
  const adminOnlyRoles = isProd ? ['admin'] : ['admin', 'user'];

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

  router.delete(
    '/:id',
    authenticateJWT,
    authorize(['user', 'admin']),
    policyController.deletePolicy
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

  // Phase 6 Pillar 3: Policy Simulations
  router.post(
    '/:id/simulate',
    authenticateJWT,
    authorize(adminOnlyRoles),
    policyController.runSimulation
  );

  // Analyze uploaded/pasted code against a policy (no GitHub token required)
  router.post(
    '/:id/analyze-code',
    authenticateJWT,
    authorize(adminOnlyRoles),
    policyController.analyzeCode
  );

  router.get(
    '/simulations/:simId',
    authenticateJWT,
    authorize(adminOnlyRoles),
    policyController.getSimulation
  );

  router.post(
    '/simulations/:simId/promote',
    authenticateJWT,
    authorize(adminOnlyRoles),
    policyController.promoteDraft
  );

  return router;
}
