import * as memoryService from '../services/governanceMemory.service.js';

export default function governanceMemoryControllerFactory(db) {
  async function recordDecision(req, res, next) {
    try {
      const decision = await memoryService.recordDecision(db, req.body);
      res.status(201).json(decision);
    } catch (error) {
      next(error);
    }
  }

  async function getPolicyMetrics(req, res, next) {
    try {
      const { policyId } = req.params;
      const metrics = await memoryService.getPolicyMetrics(db, policyId);
      res.status(200).json(metrics);
    } catch (error) {
      next(error);
    }
  }

  async function getFactHistory(req, res, next) {
    try {
      const { factId } = req.params;
      const history = await memoryService.getFactHistory(db, factId);
      res.status(200).json(history);
    } catch (error) {
      next(error);
    }
  }

  async function recordChallenge(req, res, next) {
    try {
      const { policyId, versionId } = req.body;
      await memoryService.recordPolicyChallenge(db, policyId, versionId);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  }

  return {
    recordDecision,
    getPolicyMetrics,
    getFactHistory,
    recordChallenge,
  };
}
