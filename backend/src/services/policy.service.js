// src/services/policy.service.js

export async function createPolicy(db, payload) {
  // Payload: { name, scope, target_id, owning_role }
  const policy = await db.Policy.create({
    name: payload.name,
    scope: payload.scope,
    target_id: payload.target_id,
    owning_role: payload.owning_role,
  });
  return policy.toJSON();
}

export async function getPolicy(db, id) {
  const policy = await db.Policy.findByPk(id, {
    include: [
      {
        model: db.PolicyVersion,
        as: 'versions',
        attributes: ['version_number', 'enforcement_level', 'created_at'],
        order: [['version_number', 'DESC']],
        limit: 1, // Just get the latest version info for summary
      },
    ],
  });
  return policy ? policy.toJSON() : null;
}

export async function listPolicies(db, scope, target_id) {
  const where = {};
  if (scope) where.scope = scope;
  if (target_id) where.target_id = target_id;

  const policies = await db.Policy.findAll({
    where,
    order: [['name', 'ASC']],
  });
  return policies.map((p) => p.toJSON());
}

/**
 * Creates a new immutable version of a policy.
 * @param {object} db - Database instance
 * @param {string} policyId - UUID of the policy
 * @param {object} payload - { enforcement_level, rules_logic }
 * @param {string} userId - UUID of the creator
 */
export async function createPolicyVersion(db, policyId, payload, userId) {
  // 1. Check if policy exists
  const policy = await db.Policy.findByPk(policyId);
  if (!policy) {
    throw new Error('Policy not found');
  }

  // 2. Determine next version number
  const lastVersion = await db.PolicyVersion.findOne({
    where: { policy_id: policyId },
    order: [['version_number', 'DESC']],
  });
  const nextVersionNumber = lastVersion ? lastVersion.version_number + 1 : 1;

  // 3. Create immutable version
  const version = await db.PolicyVersion.create({
    policy_id: policyId,
    version_number: nextVersionNumber,
    enforcement_level: payload.enforcement_level,
    rules_logic: payload.rules_logic,
    created_by: userId,
  });

  return version.toJSON();
}

export async function getPolicyVersion(db, policyId, versionNumber) {
  const version = await db.PolicyVersion.findOne({
    where: {
      policy_id: policyId,
      version_number: versionNumber,
    },
    include: [
      {
        model: db.User,
        as: 'creator',
        attributes: ['id', 'email'], // Don't expose sensitive user info
      },
    ],
  });
  return version ? version.toJSON() : null;
}

export async function getLatestPolicyVersion(db, policyId) {
  const version = await db.PolicyVersion.findOne({
    where: { policy_id: policyId },
    order: [['version_number', 'DESC']],
    include: [
      {
        model: db.User,
        as: 'creator',
        attributes: ['id', 'email'],
      },
    ],
  });
  return version ? version.toJSON() : null;
}
