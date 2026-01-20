import { Op } from 'sequelize';

/**
 * Records a new decision in the immutable ledger.
 * This is a downstream-only recording of an evaluation result.
 */
export async function recordDecision(db, payload) {
  const { policy_version_id, fact_id, result, rationale, override_id, previous_decision_id } = payload;

  const decision = await db.Decision.create({
    policy_version_id,
    fact_id,
    result,
    rationale,
    override_id,
    previous_decision_id,
  });

  // Increment metrics as a side-effect of recording a decision
  await updateMetrics(db, decision);

  return decision.toJSON();
}

/**
 * Updates DerivedPolicyMetric for a policy version.
 */
async function updateMetrics(db, decision) {
  const policyVersion = await db.PolicyVersion.findByPk(decision.policy_version_id);
  if (!policyVersion) return;

  const [metric] = await db.DerivedPolicyMetric.findOrCreate({
    where: {
      policy_id: policyVersion.policy_id,
      version_id: policyVersion.id,
    },
  });

  const updates = {
    total_evaluations: metric.total_evaluations + 1,
  };

  if (decision.result === 'BLOCK') {
    updates.total_blocks = metric.total_blocks + 1;
  }

  if (decision.override_id) {
    updates.total_overrides = metric.total_overrides + 1;
  }

  await metric.update(updates);
}

/**
 * Records a governance signal (informational event).
 */
export async function recordSignal(db, payload) {
  const { type, target_id, signal_level, metadata } = payload;

  const signal = await db.GovernanceSignal.create({
    type,
    target_id,
    signal_level,
    metadata,
  });

  return signal.toJSON();
}

/**
 * Increments the policy challenge count (human dispute/challenge).
 */
export async function recordPolicyChallenge(db, policyId, versionId) {
  const metric = await db.DerivedPolicyMetric.findOne({
    where: { policy_id: policyId, version_id: versionId },
  });

  if (metric) {
    await metric.increment('policy_challenge_count');
  }
}

/**
 * Pattern Detector: Identifies high override frequency (Bypass Velocity).
 * This is a neutral statistical observation.
 */
export async function detectBypassVelocity(db, targetId, timeframeHours = 24, threshold = 5) {
  const startTime = new Date(Date.now() - timeframeHours * 60 * 60 * 1000);

  const overrideCount = await db.Decision.count({
    where: {
      override_id: { [Op.ne]: null },
      createdAt: { [Op.gte]: startTime },
      // Assuming fact_id can be used to link to repo/org via external logic or if targetId is fact_id
      // In a real system, we'd join with the target metadata.
    },
  });

  if (overrideCount >= threshold) {
    await recordSignal(db, {
      type: 'BYPASS_VELOCITY',
      target_id: targetId,
      signal_level: 'ATTENTION',
      metadata: { override_count: overrideCount, timeframe_hours: timeframeHours, threshold },
    });
    return true;
  }

  return false;
}

/**
 * Retrieves metrics for a policy.
 */
export async function getPolicyMetrics(db, policyId) {
  return await db.DerivedPolicyMetric.findAll({
    where: { policy_id: policyId },
    order: [['createdAt', 'DESC']],
  });
}

/**
 * Retrieves decisions for a specific fact (e.g., a PR).
 */
export async function getFactHistory(db, factId) {
  return await db.Decision.findAll({
    where: { fact_id: factId },
    order: [['createdAt', 'ASC']],
    include: [
      { model: db.PolicyVersion, as: 'policyVersion' },
      { model: db.Override, as: 'override' },
    ],
  });
}
