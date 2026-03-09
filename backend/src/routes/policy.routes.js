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
  const adminOnlyRoles = isProd ? ['admin'] : ['admin', 'user', 'maintainer'];
  const maintainerRoles = isProd ? ['admin', 'maintainer'] : ['admin', 'user', 'maintainer'];

  // Policies CRUD
  router.post(
    '/',
    authenticateJWT,
    authorize(['user', 'admin', 'maintainer']), // Assuming users can create policies for now, restrict later
    policyController.createPolicy
  );

  router.get(
    '/',
    authenticateJWT,
    authorize(['user', 'admin', 'maintainer']),
    policyController.listPolicies
  );

  router.get(
    '/:id',
    authenticateJWT,
    authorize(['user', 'admin', 'maintainer']),
    policyController.getPolicy
  );

  router.delete(
    '/:id',
    authenticateJWT,
    authorize(['user', 'admin', 'maintainer']),
    policyController.deletePolicy
  );

  // Approval Workflow
  router.post(
    '/:id/submit',
    authenticateJWT,
    authorize(['user', 'admin', 'maintainer']),
    policyController.submitPolicy
  );

  router.post(
    '/:id/approve',
    authenticateJWT,
    authorize(maintainerRoles),
    policyController.approvePolicy
  );

  router.post(
    '/:id/enable',
    authenticateJWT,
    authorize(maintainerRoles),
    policyController.enablePolicy
  );

  // Policy Versions (Immutable)
  router.post(
    '/:id/versions',
    authenticateJWT,
    authorize(['user', 'admin', 'maintainer']),
    policyController.createPolicyVersion
  );

  router.get(
    '/:id/versions/:version',
    authenticateJWT,
    authorize(['user', 'admin', 'maintainer']),
    policyController.getPolicyVersion
  );

  // Phase 6 Pillar 3: Policy Simulations
  router.post(
    '/:id/simulate',
    authenticateJWT,
    authorize(maintainerRoles),
    policyController.runSimulation
  );

  // Analyze uploaded/pasted code against a policy (no GitHub token required)
  router.post(
    '/:id/analyze-code',
    authenticateJWT,
    authorize(maintainerRoles),
    policyController.analyzeCode
  );

  // Phase 7: AI-powered policy translation (Natural Language -> JSON)
  router.post(
    '/translate-natural-language',
    authenticateJWT,
    authorize(adminOnlyRoles),
    policyController.translateNaturalLanguage
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
