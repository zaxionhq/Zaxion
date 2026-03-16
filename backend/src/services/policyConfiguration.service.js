/**
 * Policy Configuration Service
 * Handles hierarchical policy enabling/disabling across scopes.
 */
import { CORE_POLICIES } from '../policies/corePolicies.js';

export class PolicyConfigurationService {
  constructor(db) {
    this.db = db;
    this.PolicyConfiguration = db.PolicyConfiguration;
  }

  /**
   * Get effective status of a policy for a given context
   * @param {string} policyId - ID of the core policy (e.g., SEC-001)
   * @param {object} context - { org, repo, branch }
   * @returns {Promise<boolean>} isEnabled
   */
  async isPolicyEnabled(policyId, context = {}) {
    const { org, repo, branch } = context;

    // Check hierarchy: BRANCH -> REPO -> ORG -> GLOBAL
    // If ANY scope disables the policy, it's disabled.
    // However, usually, more specific scope overrides more general.
    // But the requirement says "selectively disable", implying default is enabled.
    
    // Let's find any disabling entry in the hierarchy.
    // If we find a 'GLOBAL' disabling, it's disabled everywhere unless re-enabled?
    // Actually, the requirement says "selectively disable any individual core policy".
    // "hierarchical selector (repository -> organization -> branch -> global)"
    
    // Logic: Find the most specific configuration.
    // 1. Branch (repo:branch)
    // 2. Repo (owner/repo)
    // 3. Org (owner)
    // 4. Global (null)

    const scopes = [];
    if (repo && branch) scopes.push({ scope: 'BRANCH', target_id: `${repo}:${branch}` });
    if (repo) scopes.push({ scope: 'REPO', target_id: repo });
    if (org) scopes.push({ scope: 'ORG', target_id: org });
    scopes.push({ scope: 'GLOBAL', target_id: null });

    for (const s of scopes) {
      const config = await this.PolicyConfiguration.findOne({
        where: {
          policy_id: policyId,
          scope: s.scope,
          target_id: s.target_id
        },
        order: [['createdAt', 'DESC']]
      });

      if (config) {
        return config.is_enabled;
      }
    }

    // Default is enabled
    return true;
  }

  /**
   * List all core policies with their effective status for a given scope
   */
  async listPoliciesWithStatus(context = {}, userId) {
    const results = [];
    for (const policy of CORE_POLICIES) {
      const isEnabled = await this.isPolicyEnabled(policy.id, context);
      
      // Get the specific config if it exists for this exact scope
      const { org, repo, branch, scope, target_id } = context;
      const currentScope = scope || 'GLOBAL';
      const currentTargetId = target_id || null;

      const config = await this.PolicyConfiguration.findOne({
        where: {
          policy_id: policy.id,
          scope: currentScope,
          target_id: currentTargetId
        }
      });

      results.push({
        ...policy,
        is_enabled: isEnabled,
        is_disabled_at_current_scope: config ? !config.is_enabled : false,
        config: config || null
      });
    }
    return results;
  }

  /**
   * Disable a policy at a specific scope
   */
  async disablePolicy(policyId, scope, targetId, userId, reason) {
    // Validation: prevent disabling mandatory compliance rules
    const policy = CORE_POLICIES.find(p => p.id === policyId);
    if (!policy) throw new Error('Policy not found');

    if (policy.category === 'Security' && policy.severity === 'CRITICAL') {
      // Allow disabling only with a very strong reason? 
      // For now, let's follow the requirement: "prevent disabling policies that would break mandatory compliance rules"
      // Let's say CRITICAL Security policies are mandatory.
      throw new Error(`Policy ${policyId} (${policy.name}) is a mandatory compliance rule and cannot be disabled.`);
    }

    // Upsert configuration
    const [config, created] = await this.PolicyConfiguration.findOrCreate({
      where: {
        policy_id: policyId,
        scope,
        target_id: targetId
      },
      defaults: {
        is_enabled: false,
        user_id: userId,
        reason
      }
    });

    if (!created) {
      config.is_enabled = false;
      config.user_id = userId;
      config.reason = reason;
      await config.save();
    }

    return config;
  }

  /**
   * Enable a policy at a specific scope
   */
  async enablePolicy(policyId, scope, targetId, userId) {
    const config = await this.PolicyConfiguration.findOne({
      where: {
        policy_id: policyId,
        scope,
        target_id: targetId
      }
    });

    if (config) {
      config.is_enabled = true;
      config.user_id = userId;
      await config.save();
    } else {
      // If no config exists, it's already enabled by default. 
      // But we can create an explicit 'enabled' record if needed.
      await this.PolicyConfiguration.create({
        policy_id: policyId,
        scope,
        target_id: targetId,
        is_enabled: true,
        user_id: userId,
        reason: 'Re-enabled'
      });
    }

    return { success: true };
  }

  /**
   * Get audit trail for a policy
   */
  async getAuditTrail(policyId) {
    return await this.PolicyConfiguration.findAll({
      where: { policy_id: policyId },
      include: [{ association: 'user', attributes: ['username', 'email', 'displayName'] }],
      order: [['createdAt', 'DESC']]
    });
  }
}
