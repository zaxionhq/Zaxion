import { Op } from 'sequelize';
import logger from '../logger.js';

/**
 * Phase 6 Pillar 4: Governance Analytics & Trust Signals
 * Provides executive-level visibility into the governance lifecycle.
 */

/**
 * Get core metrics for a specific repository.
 * @param {object} db - Database instance
 * @param {string} repoFullName - Full name of the repository (e.g., "owner/repo")
 * @returns {Promise<object>} Trust signals (Trust Score, Bypass Velocity, Friction)
 */
export async function getRepoMetrics(db, repoFullName) {
  try {
    // 1. Fetch all decisions for this repo via FactSnapshot
    const decisions = await db.Decision.findAll({
      include: [
        {
          model: db.FactSnapshot,
          as: 'factSnapshot',
          where: { repo_full_name: repoFullName },
          attributes: []
        }
      ]
    });

    const totalDecisions = decisions.length;
    if (totalDecisions === 0) {
      return { trustScore: 1.0, bypassVelocity: 0, frictionIndex: 0, totalDecisions: 0 };
    }

    const totalOverrides = decisions.filter(d => d.override_id !== null).length;
    const totalBlocks = decisions.filter(d => d.result === 'BLOCK').length;

    // 2. Calculate Trust Signals
    // Trust Score: 1.0 means no overrides. 0.0 means everything is overridden.
    const trustScore = 1 - (totalOverrides / totalDecisions);

    // Bypass Velocity: Frequency of overrides
    const bypassVelocity = totalDecisions > 0 ? (totalOverrides / totalDecisions) : 0;

    // Friction Index: (Time to Resolve Block) / (Total Block Count)
    // For simplicity, we calculate average resolution time for blocks that eventually passed
    const frictionIndex = await _calculateFrictionIndex(db, repoFullName);

    return {
      repo_full_name: repoFullName,
      totalDecisions,
      totalBlocks,
      totalOverrides,
      trustScore: parseFloat(trustScore.toFixed(2)),
      bypassVelocity: parseFloat(bypassVelocity.toFixed(2)),
      frictionIndex: parseFloat(frictionIndex.toFixed(2)),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error({ error, repoFullName }, "Analytics: Failed to fetch repo metrics");
    throw error;
  }
}

/**
 * Get high-level executive summary for all governance activity.
 */
export async function getExecutiveSummary(db) {
  try {
    const totalDecisions = await db.Decision.count();
    const totalOverrides = await db.Override.count();
    const totalBlocks = await db.Decision.count({ where: { result: 'BLOCK' } });
    const totalPolicies = await db.Policy.count();

    const globalTrustScore = totalDecisions > 0 ? 1 - (totalOverrides / totalDecisions) : 1.0;

    // Hotspot Map: Repos with most violations (BLOCK result)
    const hotspots = await db.Decision.findAll({
      attributes: [
        [db.sequelize.col('factSnapshot.repo_full_name'), 'repo'],
        [db.sequelize.fn('COUNT', db.sequelize.col('Decision.id')), 'count'],
        [db.sequelize.col('policyVersion.policy.name'), 'policy_name'],
        [db.sequelize.col('policyVersion.version_number'), 'version'],
        [db.sequelize.col('policyVersion.creator.username'), 'created_by']
      ],
      where: { result: 'BLOCK' },
      include: [
        { model: db.FactSnapshot, as: 'factSnapshot', attributes: [] },
        { 
          model: db.PolicyVersion, 
          as: 'policyVersion', 
          attributes: [],
          include: [
            { model: db.Policy, as: 'policy', attributes: [] },
            { model: db.User, as: 'creator', attributes: [] }
          ]
        }
      ],
      group: [
        'factSnapshot.repo_full_name', 
        'policyVersion.id', 
        'policyVersion.policy.id', 
        'policyVersion.creator.id'
      ],
      order: [[db.sequelize.literal('count'), 'DESC']],
      limit: 5,
      raw: true
    });

    return {
      trustScore: parseFloat(globalTrustScore.toFixed(2)),
      bypassVelocity: totalDecisions > 0 ? parseFloat((totalOverrides / totalDecisions).toFixed(2)) : 0,
      frictionIndex: 0, // Placeholder for global friction
      totalDecisions,
      totalBlocks,
      totalOverrides,
      totalPolicies,
      hotspots,
      alerts: await _checkAlertingThresholds(db),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error({ error }, "Analytics: Failed to fetch executive summary");
    throw error;
  }
}

/**
 * List all governance decisions for exploration.
 */
export async function listDecisions(db, limit = 50, offset = 0) {
  try {
    const decisions = await db.Decision.findAll({
      include: [
        {
          model: db.FactSnapshot,
          as: 'factSnapshot',
          attributes: ['repo_full_name', 'pr_number']
        },
        {
          model: db.Override,
          as: 'override',
          required: false,
          attributes: ['id', 'status', 'category'],
          include: [
            {
              model: db.OverrideSignature,
              as: 'signatures',
              attributes: ['justification', 'actor_id', 'createdAt'],
              order: [['createdAt', 'DESC']],
              include: [
                {
                  model: db.User,
                  as: 'actor',
                  attributes: ['username', 'displayName']
                }
              ]
            }
          ]
        },
        // Also check if this decision is the target of an override in the Overrides table
        {
          model: db.Override,
          as: 'decisionOverride',
          required: false,
          attributes: ['id', 'status', 'category'],
          include: [
            {
              model: db.OverrideSignature,
              as: 'signatures',
              attributes: ['justification', 'actor_id', 'createdAt'],
              order: [['createdAt', 'DESC']],
              include: [
                {
                  model: db.User,
                  as: 'actor',
                  attributes: ['username', 'displayName']
                }
              ]
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    return decisions.map(d => {
      const [owner, name] = (d.factSnapshot?.repo_full_name || '').split('/');
      
      // Merge override data from both potential sources
      const overrideData = d.override || d.decisionOverride;
      
      // Safety check: Filter out rejected or expired overrides from the "OVERRIDDEN" badge
      const isActiveOverride = overrideData && (overrideData.status === 'APPROVED' || overrideData.status === 'REVOKED');
      
      return {
        id: d.id,
        repo_owner: owner || 'unknown',
        repo_name: name || 'unknown',
        pr_number: d.factSnapshot?.pr_number,
        result: d.result,
        override_id: isActiveOverride ? (d.override_id || overrideData?.id) : null,
        override: isActiveOverride ? {
          id: overrideData.id,
          status: overrideData.status,
          category: overrideData.category,
          justification: overrideData.signatures?.[0]?.justification,
          actor: overrideData.signatures?.[0]?.actor?.displayName || overrideData.signatures?.[0]?.actor?.username
        } : null,
        created_at: d.createdAt
      };
    });
  } catch (error) {
    logger.error({ error }, "Analytics: Failed to list decisions");
    throw error;
  }
}

/**
 * Internal helper to check for governance alerts.
 * Identifies policies with high bypass velocity (> 5%).
 */
async function _checkAlertingThresholds(db) {
  const ALERTS_THRESHOLD = 0.05; // 5%
  const alerts = [];

  const policyPerformance = await db.Decision.findAll({
    attributes: [
      'policy_version_id',
      [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'total'],
      [db.sequelize.fn('COUNT', db.sequelize.col('override_id')), 'overrides']
    ],
    group: ['policy_version_id'],
    raw: true
  });

  for (const perf of policyPerformance) {
    const total = parseInt(perf.total, 10);
    const overrides = parseInt(perf.overrides, 10);
    const velocity = total > 0 ? (overrides / total) : 0;

    if (velocity > ALERTS_THRESHOLD) {
      alerts.push({
        policy_version_id: perf.policy_version_id,
        severity: 'HIGH',
        message: `High Bypass Velocity detected: ${(velocity * 100).toFixed(1)}% of decisions are being overridden.`,
        current_velocity: velocity,
        threshold: ALERTS_THRESHOLD
      });
    }
  }

  return alerts;
}

/**
 * Internal helper to calculate Friction Index.
 * Measures average time (in hours) to move from BLOCK to PASS/Override for the same PR.
 */
async function _calculateFrictionIndex(db, repoFullName) {
  // This is a simplified version. A real implementation would track the timeline per PR.
  // For now, we'll return a placeholder or a basic calculation if data exists.
  const blocks = await db.Decision.findAll({
    where: { result: 'BLOCK' },
    include: [{ 
      model: db.FactSnapshot, 
      as: 'factSnapshot', 
      where: { repo_full_name: repoFullName } 
    }],
    order: [['createdAt', 'ASC']]
  });

  if (blocks.length === 0) return 0;

  let totalResolutionTime = 0;
  let resolvedCount = 0;

  for (const block of blocks) {
    const resolution = await db.Decision.findOne({
      where: {
        fact_id: { [Op.ne]: block.fact_id }, // Next evaluation
        createdAt: { [Op.gt]: block.createdAt },
        result: { [Op.in]: ['PASS', 'WARN'] }
      },
      include: [{ 
        model: db.FactSnapshot, 
        as: 'factSnapshot', 
        where: { 
          repo_full_name: repoFullName,
          pr_number: block.factSnapshot.pr_number 
        } 
      }],
      order: [['createdAt', 'ASC']]
    });

    if (resolution) {
      const diffMs = resolution.createdAt - block.createdAt;
      totalResolutionTime += diffMs / (1000 * 60 * 60); // Hours
      resolvedCount++;
    }
  }

  return resolvedCount > 0 ? (totalResolutionTime / resolvedCount) : 0;
}
