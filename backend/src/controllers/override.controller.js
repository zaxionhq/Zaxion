// src/controllers/override.controller.js
import * as overrideService from '../services/override.service.js';

export default function overrideControllerFactory(db) {
  async function createOverride(req, res, next) {
    try {
      const { subject_ref, policy_version_id } = req.body;

      if (!subject_ref || !subject_ref.type || !subject_ref.external_id || !policy_version_id) {
        const error = new Error('Missing required fields: subject_ref (type, external_id), policy_version_id');
        error.statusCode = 400;
        throw error;
      }

      const override = await overrideService.createOverride(db, { subject_ref, policy_version_id });
      res.status(201).json(override);
    } catch (error) {
      next(error);
    }
  }

  async function addSignature(req, res, next) {
    try {
      const { id: overrideId } = req.params;
      const { role_at_signing, justification, commit_sha } = req.body;
      const userId = req.user ? req.user.id : null;

      if (!userId) {
        const error = new Error('User not authenticated');
        error.statusCode = 401;
        throw error;
      }

      if (!role_at_signing || !justification || !commit_sha) {
        const error = new Error('Missing required fields: role_at_signing, justification, commit_sha');
        error.statusCode = 400;
        throw error;
      }

      const signature = await overrideService.addSignature(db, overrideId, { role_at_signing, justification, commit_sha }, userId);
      res.status(201).json(signature);
    } catch (error) {
      next(error);
    }
  }

  async function getOverride(req, res, next) {
    try {
      const { id } = req.params;
      const override = await overrideService.getOverrideWithSignatures(db, id);
      if (!override) {
        const error = new Error('Override not found');
        error.statusCode = 404;
        throw error;
      }
      res.json(override);
    } catch (error) {
      next(error);
    }
  }

  async function listOverrides(req, res, next) {
    try {
      const { external_id } = req.query;
      const overrides = await overrideService.listOverrides(db, external_id);
      res.json(overrides);
    } catch (error) {
      next(error);
    }
  }

  return {
    createOverride,
    addSignature,
    getOverride,
    listOverrides,
  };
}
