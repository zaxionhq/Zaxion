import { Op } from 'sequelize';
import logger from '../logger.js';

/**
 * Phase 6 Pillar 2: Override Service (The Signature)
 * Manages governance-aware overrides with cryptographic binding and temporal expiry.
 */

/**
 * Creates a signed override for a specific decision.
 * Invariant 2: Evaluation Hash Binding
 * Invariant 4: Temporal Expiry
 * 
 * @param {object} db - Sequelize DB instance
 * @param {object} payload - Override data
 * @param {string} userId - ID of the actor signing the override
 * @returns {Promise<object>} The created override with its signature
 */
export async function createOverride(db, payload, userId) {
  const { 
    decision_id, 
    evaluation_hash, 
    target_sha, 
    category, 
    reason, 
    ttl_hours = 4 
  } = payload;

  logger.info({ decision_id, userId, category }, "OverrideService: Creating signed override");

  // 1. Fetch the decision to verify it exists and get policy_version_id
  const decision = await db.Decision.findByPk(decision_id);
  if (!decision) {
    throw new Error(`Decision record ${decision_id} not found`);
  }

  // 2. Validate hash binding (Step 3.2)
  if (decision.evaluation_hash !== evaluation_hash) {
    throw new Error("Evaluation hash mismatch: Override must be bound to the exact state of the decision");
  }

  // 3. Calculate expiry (Step 3.4)
  const expires_at = new Date();
  expires_at.setHours(expires_at.getHours() + ttl_hours);

  return await db.sequelize.transaction(async (t) => {
    // 4. Create the Override record
    const override = await db.Override.create({
      decision_id,
      policy_version_id: decision.policy_version_id,
      evaluation_hash,
      target_sha,
      category,
      status: 'APPROVED',
      expires_at
    }, { transaction: t });

    // 5. Create the initial Signature (Step 2)
    const signature = await db.OverrideSignature.create({
      override_id: override.id,
      actor_id: userId,
      role_at_signing: 'AUTHORIZED_OVERRIDER', // In real system, resolve from RBAC
      justification: reason,
      commit_sha: target_sha
    }, { transaction: t });

    // 6. Update the decision record with the override link
    await decision.update({ override_id: override.id }, { transaction: t });

    return {
      ...override.toJSON(),
      signature: signature.toJSON()
    };
  });
}

/**
 * Validates if an override is currently applicable and active.
 * Invariant 1: Scope Confinement
 * Invariant 2: Evaluation Hash Binding
 * Invariant 4: Temporal Expiry
 */
export async function isValidOverride(db, overrideId, context) {
  const { current_sha, current_hash } = context;

  const override = await db.Override.findByPk(overrideId, {
    include: [{ model: db.OverrideRevocation, as: 'revocation' }]
  });

  if (!override) return false;

  // 1. Check status
  if (override.status !== 'APPROVED') return false;

  // 2. Check Temporal Expiry (Invariant 4)
  if (new Date() > new Date(override.expires_at)) {
    await override.update({ status: 'EXPIRED' });
    return false;
  }

  // 3. Check Scope Confinement (Invariant 1)
  if (current_sha && override.target_sha !== current_sha) return false;

  // 4. Check Evaluation Hash Binding (Invariant 2)
  if (current_hash && override.evaluation_hash !== current_hash) return false;

  // 5. Check Revocation (Step 4.C)
  if (override.revocation) {
    await override.update({ status: 'REVOKED' });
    return false;
  }

  return true;
}

/**
 * Revokes an existing override early (The Kill-Switch).
 * Step 4.C: Manual Revocation
 */
export async function revokeOverride(db, overrideId, revokerId, reason) {
  logger.warn({ overrideId, revokerId }, "OverrideService: Revoking override");

  return await db.sequelize.transaction(async (t) => {
    const override = await db.Override.findByPk(overrideId, { transaction: t });
    if (!override) throw new Error("Override not found");

    const revocation = await db.OverrideRevocation.create({
      override_id: overrideId,
      revoked_by_actor_id: revokerId,
      reason
    }, { transaction: t });

    await override.update({ status: 'REVOKED' }, { transaction: t });

    return revocation.toJSON();
  });
}

/**
 * Lists overrides for a specific target SHA or decision.
 */
export async function listOverrides(db, filters = {}) {
  const { target_sha, decision_id } = filters;
  const where = {};
  
  if (target_sha) where.target_sha = target_sha;
  if (decision_id) where.decision_id = decision_id;

  const overrides = await db.Override.findAll({
    where,
    include: [
      { model: db.OverrideSignature, as: 'signatures' },
      { model: db.OverrideRevocation, as: 'revocation' }
    ],
    order: [['createdAt', 'DESC']]
  });

  return overrides.map(o => o.toJSON());
}
