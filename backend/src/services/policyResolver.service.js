import { Op } from 'sequelize';
import logger from '../logger.js';
import { evaluatePolicyApplicability, normalizePath, pathMatchesGlob } from '../utils/pathScope.utils.js';

/**
 * Resolves which custom DB policies apply to a PR based on scope, status, and path rules.
 */
export class PolicyResolverService {
  constructor(db) {
    this.db = db;
  }

  /**
   * @param {object} params
   * @param {string} params.owner - GitHub org/user login
   * @param {string} params.repo - Full repo name owner/repo
   * @param {string[]} params.changedPaths
   * @param {Date} params.timestamp
   * @param {string[]} [params.enabledPolicyIds] - Optional UUID filter (founder audit)
   */
  async resolve({ owner, repo, changedPaths, timestamp, enabledPolicyIds = [] }) {
    logger.info({ owner, repo, timestamp }, 'PolicyResolver: Resolving policies for PR');

    const normalizedPaths = (changedPaths || []).map((p) => normalizePath(p));

    const orgPolicies = await this._getApplicablePolicies(owner, 'ORG', timestamp);
    const globalPolicies = await this._getApplicablePolicies('GLOBAL', 'ORG', timestamp);
    const repoPolicies = await this._getApplicablePolicies(repo, 'REPO', timestamp);

    const allPolicies = [...globalPolicies, ...orgPolicies, ...repoPolicies];
    const applicablePolicies = [];

    for (const policy of allPolicies) {
      if (!policy.versions?.length) continue;

      if (enabledPolicyIds.length > 0 && !enabledPolicyIds.includes(policy.id)) {
        continue;
      }

      const rules = policy.versions[0].rules_logic || {};
      const applicability = evaluatePolicyApplicability({
        rules,
        changedPaths: normalizedPaths,
      });

      if (applicability.applicable) {
        const version = policy.versions[0];
        applicablePolicies.push({
          policy_id: policy.id,
          policy_version_id: version.id,
          name: policy.name,
          level: version.enforcement_level,
          scope: policy.scope,
          resolution_path: applicability.triggerPath,
          reason: policy.scope === 'ORG' ? 'Org-level policy' : 'Repo-level policy',
          rules_logic: version.rules_logic,
          policy_scope: 'custom',
        });
      }
    }

    return this._resolveConflicts(applicablePolicies);
  }

  /**
   * @deprecated Use normalizePath from pathScope.utils
   */
  _normalizePath(p) {
    return normalizePath(p);
  }

  async _getApplicablePolicies(targetId, scope, timestamp) {
    const rows = await this.db.Policy.findAll({
      where: {
        target_id: targetId,
        scope,
        status: 'APPROVED',
        is_enabled: true,
        deleted_at: null,
      },
      include: [{
        model: this.db.PolicyVersion,
        as: 'versions',
        where: {
          createdAt: { [Op.lte]: timestamp },
        },
        required: false,
        order: [['version_number', 'DESC']],
        limit: 1,
      }],
    });

    return rows.filter((p) => p.versions?.length > 0);
  }

  /**
   * Matches changed paths against policy rules (include/exclude) via shared util.
   */
  _matchPaths(policy, changedPaths) {
    const rules = policy.versions[0].rules_logic || {};
    const result = evaluatePolicyApplicability({ rules, changedPaths });
    return {
      isApplicable: result.applicable,
      triggerPath: result.triggerPath,
      skipReasons: result.skipReasons,
    };
  }

  _pathMatches(path, pattern) {
    return pathMatchesGlob(path, pattern);
  }

  _resolveConflicts(policies) {
    const resolved = new Map();

    policies.forEach((p) => {
      const existing = resolved.get(p.policy_id);
      if (!existing) {
        resolved.set(p.policy_id, p);
        return;
      }

      if (p.scope === 'ORG' && existing.scope === 'REPO') {
        resolved.set(p.policy_id, p);
        return;
      }

      if (p.scope === existing.scope) {
        const levels = { MANDATORY: 3, OVERRIDABLE: 2, ADVISORY: 1 };
        if (levels[p.level] > levels[existing.level]) {
          resolved.set(p.policy_id, p);
          return;
        }
        if (levels[p.level] === levels[existing.level]) {
          if (p.policy_id.localeCompare(existing.policy_id) < 0) {
            resolved.set(p.policy_id, p);
          }
        }
      }
    });

    return Array.from(resolved.values()).sort((a, b) => a.policy_id.localeCompare(b.policy_id));
  }
}
