import { Op } from 'sequelize';
import logger from '../logger.js';

/**
 * Phase 5 Pillar 2: Policy Resolution Service
 * Responsible for identifying which policies apply to a specific PR
 * based on its facts and the hierarchical resolution rules.
 */
export class PolicyResolverService {
  /**
   * @param {object} db - Sequelize db object containing models
   */
  constructor(db) {
    this.db = db;
  }

  /**
   * Resolve applicable policies for a given PR context
   * @param {string} orgId - UUID of the organization
   * @param {string} repoId - UUID of the repository
   * @param {string[]} changedPaths - List of raw changed file paths
   * @param {Date} snapshotTimestamp - Timestamp from FactSnapshot
   * @returns {Promise<object[]>} List of resolved policies
   */
  async resolve(orgId, repoId, changedPaths, snapshotTimestamp) {
    logger.info({ orgId, repoId, snapshotTimestamp }, "PolicyResolver: Resolving policies for PR");

    // Invariant 7: Path Normalization
    const normalizedPaths = changedPaths.map(p => this._normalizePath(p));

    // 1. Fetch Org-level Policies active at snapshot time
    const orgPolicies = await this._getApplicablePolicies(orgId, 'ORG', snapshotTimestamp);
    
    // 2. Fetch Repo-level Policies active at snapshot time
    const repoPolicies = await this._getApplicablePolicies(repoId, 'REPO', snapshotTimestamp);

    // 3. Combine and Filter by Path
    const allPolicies = [...orgPolicies, ...repoPolicies];
    const applicablePolicies = [];

    for (const policy of allPolicies) {
      const match = this._matchPaths(policy, normalizedPaths);
      if (match.isApplicable) {
        // Handle potentially multiple versions (though limit 1 is used in query)
        const version = policy.versions[0];
        applicablePolicies.push({
          policy_id: policy.id,
          policy_version_id: version.id,
          name: policy.name,
          level: version.enforcement_level,
          scope: policy.scope,
          resolution_path: match.triggerPath,
          reason: policy.scope === 'ORG' ? 'Org-level policy' : 'Repo-level policy',
          rules_logic: version.rules_logic
        });
      }
    }

    // 4. Deterministic Conflict Resolution (Pillar 5.2 Invariants)
    return this._resolveConflicts(applicablePolicies);
  }

  /**
   * Invariant 7: Path Normalization
   * Removes ./, handles case sensitivity consistently.
   */
  _normalizePath(p) {
    let normalized = p.trim().replace(/\\/g, '/'); // Convert windows to posix
    if (normalized.startsWith('./')) {
      normalized = normalized.slice(2);
    }
    return normalized.toLowerCase(); // Case-insensitive matching as per design
  }

  /**
   * Fetch policies for a specific target and scope, including the version active at the timestamp.
   */
  async _getApplicablePolicies(targetId, scope, timestamp) {
    return await this.db.Policy.findAll({
      where: {
        target_id: targetId,
        scope: scope
      },
      include: [{
        model: this.db.PolicyVersion,
        as: 'versions',
        where: {
          created_at: {
            [Op.lte]: timestamp
          }
        },
        order: [['version_number', 'DESC']],
        limit: 1
      }]
    });
  }

  /**
   * Matches changed paths against policy rules (include/exclude).
   */
  _matchPaths(policy, changedPaths) {
    const rules = policy.versions[0].rules_logic;
    const includePaths = (rules.include_paths || ['*']).map(p => this._normalizePath(p));
    const excludePaths = (rules.exclude_paths || []).map(p => this._normalizePath(p));

    // Check each changed path
    for (const path of changedPaths) {
      const isIncluded = includePaths.some(pattern => this._pathMatches(path, pattern));
      const isExcluded = excludePaths.some(pattern => this._pathMatches(path, pattern));

      if (isIncluded && !isExcluded) {
        return { isApplicable: true, triggerPath: path };
      }
    }

    return { isApplicable: false };
  }

  /**
   * Basic glob-like matching (deterministic as per Step 3.1)
   */
  _pathMatches(path, pattern) {
    if (pattern === '*') return true;
    if (pattern.endsWith('/*')) {
      const prefix = pattern.slice(0, -2);
      return path.startsWith(prefix);
    }
    return path === pattern;
  }

  /**
   * Resolves conflicts between policies (Step 3.4)
   */
  _resolveConflicts(policies) {
    const resolved = new Map();

    policies.forEach(p => {
      const existing = resolved.get(p.policy_id);
      if (!existing) {
        resolved.set(p.policy_id, p);
        return;
      }

      // Conflict Resolution (Step 3.4):
      // 1. Hierarchy: Org-level takes precedence over Repo-level
      if (p.scope === 'ORG' && existing.scope === 'REPO') {
        resolved.set(p.policy_id, p);
        return;
      }
      
      if (p.scope === existing.scope) {
        // 2. Strictness: MANDATORY > OVERRIDABLE > ADVISORY
        const levels = { 'MANDATORY': 3, 'OVERRIDABLE': 2, 'ADVISORY': 1 };
        if (levels[p.level] > levels[existing.level]) {
          resolved.set(p.policy_id, p);
          return;
        }

        // 3. Tie-breaker: Deterministic fallback using Policy UUID (alphabetical)
        if (levels[p.level] === levels[existing.level]) {
          if (p.policy_id.localeCompare(existing.policy_id) < 0) {
            resolved.set(p.policy_id, p);
          }
        }
      }
    });

    // Return sorted by policy_id for determinism
    return Array.from(resolved.values()).sort((a, b) => a.policy_id.localeCompare(b.policy_id));
  }
}
