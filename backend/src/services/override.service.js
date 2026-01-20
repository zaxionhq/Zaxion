// src/services/override.service.js

/**
 * Creates an override request (the intent to bypass).
 */
export async function createOverride(db, payload) {
  // payload: { subject_ref: { type, external_id }, policy_version_id }
  const override = await db.Override.create({
    subject_ref: payload.subject_ref,
    policy_version_id: payload.policy_version_id,
    status: 'PENDING',
  });
  return override.toJSON();
}

/**
 * Adds a human signature to an override request.
 * Includes integrity constraints per Pillar 2 design.
 */
export async function addSignature(db, overrideId, payload, userId) {
  // payload: { role_at_signing, justification, commit_sha }
  
  // 1. Fetch the override
  const override = await db.Override.findByPk(overrideId);
  if (!override) throw new Error('Override request not found');
  
  if (override.status === 'EXPIRED') {
    throw new Error('Cannot sign an expired override');
  }

  // 2. Integrity Constraint: Justification length (already in model, but good to check)
  if (!payload.justification || payload.justification.length < 10) {
    throw new Error('Justification must be at least 10 characters long');
  }

  // 3. Create the signature
  const signature = await db.OverrideSignature.create({
    override_id: overrideId,
    actor_id: userId,
    role_at_signing: payload.role_at_signing,
    justification: payload.justification,
    commit_sha: payload.commit_sha,
  });

  // 4. Update override status to APPROVED (fact: a valid signature exists)
  await override.update({ status: 'APPROVED' });

  return signature.toJSON();
}

/**
 * Marks overrides as EXPIRED if the commit SHA no longer matches.
 * This is a passive fact recording, not enforcement.
 */
export async function invalidateOverridesForPR(db, external_id, current_commit_sha) {
  const overrides = await db.Override.findAll({
    where: {
      'subject_ref.external_id': external_id,
      status: 'APPROVED',
    },
    include: [{
      model: db.OverrideSignature,
      as: 'signatures',
      order: [['createdAt', 'DESC']],
      limit: 1
    }]
  });

  for (const override of overrides) {
    const lastSignature = override.signatures[0];
    if (lastSignature && lastSignature.commit_sha !== current_commit_sha) {
      await override.update({ status: 'EXPIRED' });
    }
  }
}

export async function getOverrideWithSignatures(db, id) {
  const override = await db.Override.findByPk(id, {
    include: [
      {
        model: db.OverrideSignature,
        as: 'signatures',
        include: [{
          model: db.User,
          as: 'actor',
          attributes: ['id', 'email', 'displayName']
        }]
      },
      {
        model: db.PolicyVersion,
        as: 'policyVersion'
      }
    ],
    order: [[{ model: db.OverrideSignature, as: 'signatures' }, 'createdAt', 'DESC']]
  });
  return override ? override.toJSON() : null;
}

export async function listOverrides(db, external_id) {
  const where = {};
  if (external_id) {
    where['subject_ref.external_id'] = external_id;
  }

  const overrides = await db.Override.findAll({
    where,
    order: [['createdAt', 'DESC']],
  });
  return overrides.map(o => o.toJSON());
}
