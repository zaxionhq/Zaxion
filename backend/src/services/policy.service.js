

export async function listDeletedPolicies(db) {
  const policies = await db.Policy.findAll({
    where: {
      deleted_at: { [db.Sequelize.Op.ne]: null }
    },
    include: [
      {
        model: db.User,
        as: 'deletedBy',
        attributes: ['id', 'username', 'role']
      }
    ],
    order: [['deleted_at', 'DESC']]
  });
  return policies.map(p => p.toJSON());
}

export async function createPolicy(db, payload) {
  // Payload: { name, scope, target_id, owning_role, created_by, status, description }
  
  const policy = await db.Policy.create({
    name: payload.name === 'Internal Zaxion Policy' ? 'Zaxion Core Policy' : payload.name,
    scope: payload.scope,
    target_id: payload.target_id,
    owning_role: payload.owning_role,
    created_by: payload.created_by,
    status: payload.status || 'DRAFT',
    is_enabled: false,
    description: payload.description,
  });
  return policy.toJSON();
}

export async function updatePolicy(db, id, updates) {
  const policy = await db.Policy.findByPk(id);
  if (!policy) throw new Error('Policy not found');
  await policy.update(updates);
  return policy.toJSON();
}

export async function getPolicy(db, id) {
  const policy = await db.Policy.findByPk(id, {
    include: [
      {
        model: db.PolicyVersion,
        as: 'versions',
        attributes: ['version_number', 'enforcement_level', 'createdAt'],
        order: [['version_number', 'DESC']],
        limit: 1, // Just get the latest version info for summary
      },
    ],
  });
  return policy ? policy.toJSON() : null;
}

export async function listPolicies(db, scope, target_id) {
  const where = { deleted_at: null };
  
  // If a specific target_id (like a repo) is requested, we want to show:
  // 1. Policies specifically for that repo
  // 2. Global/Org-level policies (target_id = 'GLOBAL')
  if (target_id && target_id !== 'GLOBAL') {
    where[db.Sequelize.Op.or] = [
      { target_id: target_id, deleted_at: null },
      { target_id: 'GLOBAL', deleted_at: null }
    ];
  } else {
    if (scope) where.scope = scope;
    if (target_id) where.target_id = target_id;
  }

  const policies = await db.Policy.findAll({
    where,
    include: [
      {
        model: db.User,
        as: 'creator',
        attributes: ['id', 'username', 'role']
      },
      {
        model: db.User,
        as: 'approver',
        attributes: ['id', 'username']
      },
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
      // Use policy creator if available, else fallback to version creator
      policy.created_by = policy.creator || policy.versions[0].creator;
      // Use policy approver
      policy.approved_by = policy.approver;
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

/** System policy names that cannot be deleted by users. */
const PROTECTED_POLICY_NAMES = ['Zaxion Core Policy', 'Internal Zaxion Policy'];

/**
 * Soft-deletes a user/admin-created policy and records an immutable audit trail.
 * System policies (e.g. Zaxion Core Policy) cannot be deleted.
 * @param {object} db - Database instance
 * @param {string} policyId - UUID of the policy
 * @param {string} deletedByUserId - UUID of the user performing the deletion
 * @param {string|null} reason - Optional human-readable deletion reason
 * @returns {Promise<object>} The soft-deleted policy (as JSON with deletion metadata)
 */
export async function deletePolicy(db, policyId, deletedByUserId, reason = null) {
  const policy = await db.Policy.findByPk(policyId, {
    include: [
      {
        model: db.PolicyVersion,
        as: 'versions',
      },
    ],
  });
  if (!policy) {
    throw new Error('Policy not found');
  }
  if (PROTECTED_POLICY_NAMES.includes(policy.name)) {
    throw new Error(`Cannot delete system policy: ${policy.name}`);
  }

  const { Op } = db.Sequelize;
  const sequelize = db.sequelize || db.Policy.sequelize;

  return sequelize.transaction(async (t) => {
    const json = policy.toJSON();
    const versions = json.versions || [];
    const versionIds = versions.map((v) => v.id);

    // Compute snapshot metrics for immutable audit record
    const rulesCount = versions.reduce((acc, v) => {
      const rl = v.rules_logic || {};
      const rules = Array.isArray(rl.rules) ? rl.rules : [];
      return acc + rules.length;
    }, 0);

    let decisionsCount = 0;
    let violationsCount = 0;
    if (versionIds.length > 0 && db.Decision) {
      decisionsCount = await db.Decision.count({
        where: { policy_version_id: { [Op.in]: versionIds } },
        transaction: t,
      });
      violationsCount = await db.Decision.count({
        where: {
          policy_version_id: { [Op.in]: versionIds },
          result: { [Op.ne]: 'PASS' },
        },
        transaction: t,
      });
    }

    const deletedAt = new Date();

    // Immutable audit trail row
    await db.PolicyDeletionAudit.create(
      {
        policy_id: policy.id,
        deleted_by_user_id: deletedByUserId,
        deleted_at: deletedAt,
        deletion_reason: reason,
        policy_name_snapshot: policy.name,
        policy_rules_count_snapshot: rulesCount,
        decisions_count_snapshot: decisionsCount,
        violations_count_snapshot: violationsCount,
      },
      { transaction: t }
    );

    // Soft-delete policy and its versions (preserve all relations)
    await db.Policy.update(
      {
        deleted_at: deletedAt,
        deleted_by_user_id: deletedByUserId,
        deletion_reason: reason,
      },
      {
        where: { id: policyId },
        transaction: t,
      }
    );

    if (versionIds.length > 0) {
      await db.PolicyVersion.update(
        { deleted_at: deletedAt },
        {
          where: { id: { [Op.in]: versionIds } },
          transaction: t,
        }
      );
    }

    return {
      ...json,
      deleted_at: deletedAt.toISOString(),
      deleted_by_user_id: deletedByUserId,
      deletion_reason: reason,
    };
  });
}
