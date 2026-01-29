// src/controllers/policy.controller.js
import * as policyService from '../services/policy.service.js';
import { PolicySimulationService } from '../services/policySimulation.service.js';
import { EvaluationEngineService } from '../services/evaluationEngine.service.js';

export default function policyControllerFactory(db) {
  const evaluationEngine = new EvaluationEngineService();
  const simulationService = new PolicySimulationService(db, evaluationEngine);

  async function createPolicy(req, res, next) {
    try {
      const { name, scope, target_id, owning_role } = req.body;

      // Basic validation
      if (!name || !scope || !target_id || !owning_role) {
        const error = new Error('Missing required fields: name, scope, target_id, owning_role');
        error.statusCode = 400;
        throw error;
      }

      const policy = await policyService.createPolicy(db, { name, scope, target_id, owning_role });
      res.status(201).json(policy);
    } catch (error) {
      next(error);
    }
  }

  async function listPolicies(req, res, next) {
    try {
      const { scope, target_id } = req.query;
      const policies = await policyService.listPolicies(db, scope, target_id);
      res.json(policies);
    } catch (error) {
      next(error);
    }
  }

  async function getPolicy(req, res, next) {
    try {
      const { id } = req.params;
      const policy = await policyService.getPolicy(db, id);
      if (!policy) {
        const error = new Error('Policy not found');
        error.statusCode = 404;
        throw error;
      }
      res.json(policy);
    } catch (error) {
      next(error);
    }
  }

  async function createPolicyVersion(req, res, next) {
    try {
      const { id: policyId } = req.params;
      const { enforcement_level, rules_logic } = req.body;
      const userId = req.user ? req.user.id : null;

      if (!userId) {
        const error = new Error('User not authenticated');
        error.statusCode = 401;
        throw error;
      }

      if (!enforcement_level) {
        const error = new Error('Missing required field: enforcement_level');
        error.statusCode = 400;
        throw error;
      }

      const version = await policyService.createPolicyVersion(db, policyId, { enforcement_level, rules_logic }, userId);
      res.status(201).json(version);
    } catch (error) {
      next(error);
    }
  }

  async function getPolicyVersion(req, res, next) {
    try {
      const { id: policyId, version: versionNumber } = req.params;
      const version = await policyService.getPolicyVersion(db, policyId, parseInt(versionNumber, 10));
      
      if (!version) {
        const error = new Error('Policy version not found');
        error.statusCode = 404;
        throw error;
      }
      res.json(version);
    } catch (error) {
      next(error);
    }
  }

  // Phase 6 Pillar 3: Policy Simulations
  async function runSimulation(req, res, next) {
    try {
      const { id: policyId } = req.params;
      const { draft_rules, sample_strategy, sample_size } = req.body;
      const userId = req.user ? req.user.id : null;

      if (!userId) {
        const error = new Error('User not authenticated');
        error.statusCode = 401;
        throw error;
      }

      const simulation = await simulationService.runSimulation({
        policy_id: policyId,
        draft_rules,
        sample_strategy,
        sample_size,
        created_by: userId
      });

      res.status(202).json(simulation);
    } catch (error) {
      next(error);
    }
  }

  async function getSimulation(req, res, next) {
    try {
      const { simId } = req.params;
      const simulation = await db.PolicySimulation.findByPk(simId);
      if (!simulation) {
        const error = new Error('Simulation not found');
        error.statusCode = 404;
        throw error;
      }
      res.json(simulation);
    } catch (error) {
      next(error);
    }
  }

  async function promoteDraft(req, res, next) {
    try {
      const { simId } = req.params;
      const userId = req.user ? req.user.id : null;

      if (!userId) {
        const error = new Error('User not authenticated');
        error.statusCode = 401;
        throw error;
      }

      const newVersion = await simulationService.promoteDraft(db, simId, userId);
      res.status(201).json(newVersion);
    } catch (error) {
      next(error);
    }
  }

  return {
    createPolicy,
    listPolicies,
    getPolicy,
    createPolicyVersion,
    getPolicyVersion,
    runSimulation,
    getSimulation,
    promoteDraft
  };
}
