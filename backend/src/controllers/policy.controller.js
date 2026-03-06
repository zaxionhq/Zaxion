// src/controllers/policy.controller.js
import * as policyService from '../services/policy.service.js';
import { PolicySimulationService } from '../services/policySimulation.service.js';
import { EvaluationEngineService } from '../services/evaluationEngine.service.js';
import * as codeAnalysis from '../services/codeAnalysis.service.js';

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

  async function deletePolicy(req, res, next) {
    try {
      const { id } = req.params;
      if (!req.user?.id) {
        const error = new Error('User not authenticated');
        error.statusCode = 401;
        throw error;
      }
      const reason = (req.body && req.body.reason) || req.query?.reason || null;
      const policy = await policyService.deletePolicy(db, id, req.user.id, reason);
      res.status(200).json({ deleted: true, policy });
    } catch (error) {
      if (error.message === 'Policy not found') {
        error.statusCode = 404;
      } else if (error.message?.startsWith('Cannot delete system policy')) {
        error.statusCode = 403;
      }
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
      const {
        draft_rules,
        sample_strategy,
        sample_size,
        scope_override,
        target_repo_full_name,
        target_branch,
        days_back,
      } = req.body;
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
        created_by: userId,
        scope_override,
        target_repo_full_name,
        target_branch,
        days_back,
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

  /**
   * Analyze uploaded or pasted code against a policy (file upload / code paste).
   * POST /v1/policies/:id/analyze-code
   * Body: { mode: 'upload'|'paste', file?: { name, contentBase64 }, paste?: { code, virtualPath? } }
   */
  async function analyzeCode(req, res, next) {
    try {
      const { id: policyId } = req.params;
      const { mode, file, paste, zip } = req.body || {};
      if (!mode || !['upload', 'paste', 'zip'].includes(mode)) {
        return res.status(400).json({ error: 'mode must be "upload", "paste", or "zip"' });
      }

      const policy = await policyService.getPolicy(db, policyId);
      if (!policy) return res.status(404).json({ error: 'Policy not found' });
      const latestVersion = await policyService.getLatestPolicyVersion(db, policyId);
      const draftRules = latestVersion?.rules_logic || {};
      if (!draftRules || Object.keys(draftRules).length === 0) {
        return res.status(400).json({ error: 'Policy has no rules to evaluate' });
      }

      let syntheticSnapshot;
      if (mode === 'upload') {
        const decoded = codeAnalysis.validateAndDecodeUpload(file?.name, file?.contentBase64);
        syntheticSnapshot = codeAnalysis.buildSyntheticSnapshot({ ...decoded, fileName: decoded.fileName });
      } else if (mode === 'paste') {
        const decoded = codeAnalysis.validatePaste(paste?.code, paste?.virtualPath);
        syntheticSnapshot = codeAnalysis.buildSyntheticSnapshot({ content: decoded.content, virtualPath: decoded.virtualPath });
      } else {
        const decoded = codeAnalysis.validateAndDecodeZip(zip?.contentBase64);
        syntheticSnapshot = codeAnalysis.buildSyntheticSnapshotFromZip(decoded.files);
      }
      const result = codeAnalysis.runCodeAnalysis(syntheticSnapshot, draftRules, evaluationEngine);

      res.status(200).json({
        id: `code-${Date.now()}`,
        status: 'COMPLETED',
        ...result,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      if (error.statusCode === 400) return res.status(400).json({ error: error.message });
      next(error);
    }
  }

  return {
    createPolicy,
    listPolicies,
    getPolicy,
    deletePolicy,
    createPolicyVersion,
    getPolicyVersion,
    runSimulation,
    getSimulation,
    promoteDraft,
    analyzeCode,
  };
}
