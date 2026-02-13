// src/services/policy.service.js

export async function createPolicy(db, payload) {
  // Payload: { name, scope, target_id, owning_role }
  
  // If we are creating a policy that would effectively be a "System Policy" 
  // but with a better name, we can do it here. 
  // However, for now we just follow the standard creation.
  const policy = await db.Policy.create({
    name: payload.name === 'Internal Zaxion Policy' ? 'Zaxion Core Policy' : payload.name,
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
  
  // If a specific target_id (like a repo) is requested, we want to show:
  // 1. Policies specifically for that repo
  // 2. Global/Org-level policies (target_id = 'GLOBAL')
  if (target_id && target_id !== 'GLOBAL') {
    where[db.Sequelize.Op.or] = [
      { target_id: target_id },
      { target_id: 'GLOBAL' }
    ];
  } else {
    if (scope) where.scope = scope;
    if (target_id) where.target_id = target_id;
  }

  const policies = await db.Policy.findAll({
    where,
    include: [
      {
        model: db.PolicyVersion,
        as: 'versions',
        attributes: ['id', 'version_number', 'enforcement_level', 'rules_logic', 'description', 'createdAt'],
        order: [['version_number', 'DESC']],
        include: [
          {
            model: db.User,
            as: 'creator',
            attributes: ['username', 'displayName', 'email']
          }
        ]
      },
    ],
    order: [['name', 'ASC']],
  });
  
  return policies.map((p) => {
    const policy = p.toJSON();
    if (policy.versions && policy.versions.length > 0) {
      // For the inventory list, we might want the latest version's details at the top level
      policy.latest_version = policy.versions[0];
      policy.created_by = policy.versions[0].creator;
      // Use version description if policy description is missing
      policy.display_description = policy.description || policy.versions[0].description;
    }
    return policy;
  });
}

/**
 * Creates a new immutable version of a policy.
 * @param {object} db - Database instance
 * @param {string} policyId - UUID of the policy
 * @param {object} payload - { enforcement_level, rules_logic, parent_org_id }
 * @param {string} userId - UUID of the creator
 * @param {string} orgId - Optional organization ID for narrowing check
 */
export async function createPolicyVersion(db, policyId, payload, userId, orgId) {
  // 1. Check if policy exists
  const policy = await db.Policy.findByPk(policyId);
  if (!policy) {
    throw new Error('Policy not found');
  }

  // 2. Policy Hierarchy Validation (Narrowing Principle)
  // If this is a REPO policy, it must be stricter than the ORG policy
  if (policy.scope === 'REPO' && (orgId || payload.parent_org_id)) {
    const targetOrgId = orgId || payload.parent_org_id;
    const orgPolicy = await db.Policy.findOne({
      where: {
        name: policy.name,
        scope: 'ORG',
        target_id: targetOrgId
      },
      include: [{
        model: db.PolicyVersion,
        as: 'versions',
        order: [['version_number', 'DESC']],
        limit: 1
      }]
    });

    if (orgPolicy && orgPolicy.versions && orgPolicy.versions.length > 0) {
      const orgRules = orgPolicy.versions[0].rules_logic;
      const repoRules = payload.rules_logic;
      
      const narrowingError = validateNarrowing(orgRules, repoRules);
      if (narrowingError) {
        throw new Error(`Policy Narrowing Violation: ${narrowingError}`);
      }
    }
  }

  // 3. Determine next version number
  const lastVersion = await db.PolicyVersion.findOne({
    where: { policy_id: policyId },
    order: [['version_number', 'DESC']],
  });
  const nextVersionNumber = lastVersion ? lastVersion.version_number + 1 : 1;

  // 4. Create immutable version
  const version = await db.PolicyVersion.create({
    policy_id: policyId,
    version_number: nextVersionNumber,
    enforcement_level: payload.enforcement_level,
    rules_logic: payload.rules_logic,
    created_by: userId,
  });

  return version.toJSON();
}

/**
 * Ensures repo rules are stricter than org rules
 */
function validateNarrowing(orgRules, repoRules) {
  if (!orgRules || !repoRules) return null;

  // 1. Coverage Narrowing (min_tests must be >= parent)
  if (orgRules.type === 'coverage' && repoRules.type === 'coverage') {
    const orgMin = orgRules.min_tests || 1;
    const repoMin = repoRules.min_tests || 1;
    if (repoMin < orgMin) {
      return `Repo 'min_tests' (${repoMin}) cannot be weaker than Org 'min_tests' (${orgMin})`;
    }
  }

  // 2. PR Size Narrowing (max_files must be <= parent)
  if (orgRules.type === 'pr_size' && repoRules.type === 'pr_size') {
    const orgMax = orgRules.max_files || 20;
    const repoMax = repoRules.max_files || 20;
    if (repoMax > orgMax) {
      return `Repo 'max_files' (${repoMax}) cannot be weaker than Org 'max_files' (${orgMax})`;
    }
  }

  return null;
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
