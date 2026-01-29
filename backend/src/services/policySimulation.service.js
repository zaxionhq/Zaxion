import crypto from 'crypto';
import logger from '../logger.js';
import { Op } from 'sequelize';

/**
 * Phase 6 Pillar 3: Policy Evolution & Simulation (The Blast Radius)
 * Prevents "Policy Shock" by simulating draft policy changes against historical facts.
 */
export class PolicySimulationService {
  /**
   * @param {object} db - Sequelize DB instance
   * @param {object} evaluationEngine - The Judge (Pillar 5.3)
   */
  constructor(db, evaluationEngine) {
    this.db = db;
    this.evaluationEngine = evaluationEngine;
    this.ENGINE_VERSION = '1.0.0';
  }

  /**
   * Run a simulation of a draft policy version against historical snapshots.
   * Invariant 2: Snapshot Replayability
   * Invariant 3: Simulation Determinism
   * 
   * @param {object} payload - Simulation parameters
   * @returns {Promise<object>} The simulation record
   */
  async runSimulation(payload) {
    const { policy_id, draft_rules, sample_strategy, sample_size, created_by } = payload;

    logger.info({ policy_id, sample_strategy, sample_size }, "PolicySimulation: Starting simulation");

    // 1. Collect Snapshots (Pillar 3.4.A)
    const snapshots = await this._collectSnapshots(sample_strategy, sample_size, policy_id);
    if (snapshots.length === 0) {
      throw new Error("No historical snapshots found for simulation");
    }

    // 2. Generate Simulation Hash (Invariant 3)
    const simulation_hash = this._calculateSimHash(draft_rules, snapshots.map(s => s.id));

    // 3. Create Simulation Record
    const simulation = await this.db.PolicySimulation.create({
      simulation_hash,
      policy_id,
      draft_rules,
      engine_version: this.ENGINE_VERSION,
      sample_strategy,
      sample_size: snapshots.length,
      status: 'RUNNING',
      created_by
    });

    try {
      // 4. Execute Simulation (The Snapshot Replayer)
      const results = await this._executeSimulation(simulation, snapshots, draft_rules);

      // 5. Update Record
      await simulation.update({
        status: 'COMPLETED',
        results
      });

      return simulation.toJSON();
    } catch (error) {
      logger.error({ error, simulation_id: simulation.id }, "PolicySimulation: Simulation failed");
      await simulation.update({ status: 'FAILED' });
      throw error;
    }
  }

  /**
   * Pillar 3.4.A: The Snapshot Replayer Logic
   */
  async _executeSimulation(simulation, snapshots, draftRules) {
    let newlyBlocked = 0;
    let newlyPassed = 0;
    let consistent = 0;
    const impactedPrs = [];

    // Mock applied policy for the simulation
    const mockAppliedPolicy = {
      policy_id: simulation.policy_id,
      policy_version_id: 'DRAFT', // Simulation identifier
      level: 'MANDATORY',
      rules_logic: draftRules,
      reason: 'Simulation Run'
    };

    for (const snapshot of snapshots) {
      // 1. Get historical decision for this snapshot (if any)
      const historicalDecision = await this.db.Decision.findOne({
        where: { fact_id: snapshot.id, policy_version_id: { [Op.ne]: 'DRAFT' } },
        order: [['createdAt', 'DESC']]
      });

      // 2. Run deterministic evaluation
      const simResult = this.evaluationEngine.evaluate(snapshot, [mockAppliedPolicy]);

      // 3. Compare with history (Blast Radius Reporting)
      const historicalResult = historicalDecision ? historicalDecision.result : 'UNKNOWN';
      const simVerdict = simResult.result;

      if (historicalResult === 'PASS' && simVerdict === 'BLOCK') {
        newlyBlocked++;
        impactedPrs.push({
          pr_number: snapshot.pr_number,
          repo: snapshot.repo_full_name,
          change: 'PASS -> BLOCK',
          rationale: simResult.rationale
        });
      } else if (historicalResult === 'BLOCK' && simVerdict === 'PASS') {
        newlyPassed++;
      } else {
        consistent++;
      }
    }

    const total = snapshots.length;
    const failRateChange = ((newlyBlocked - newlyPassed) / total * 100).toFixed(2);

    return {
      summary: {
        total_snapshots: total,
        consistent_count: consistent,
        newly_blocked_count: newlyBlocked,
        newly_passed_count: newlyPassed,
        fail_rate_change: `${failRateChange}%`,
        friction_index: parseFloat(failRateChange) > 10 ? 'HIGH' : 'LOW'
      },
      impacted_prs: impactedPrs.slice(0, 50) // Limit detailed reporting
    };
  }

  /**
   * Sampling Strategy (Pillar 3.4.A)
   */
  async _collectSnapshots(strategy, size, policyId) {
    const options = {
      limit: size,
      order: [['ingested_at', 'DESC']]
    };

    switch (strategy) {
      case 'TIME_BASED':
        // Last N snapshots globally or for this policy's target if known
        return await this.db.FactSnapshot.findAll(options);
      case 'REPO_BASED':
        // Implementation would filter by repo_full_name if policy is REPO scoped
        return await this.db.FactSnapshot.findAll(options);
      default:
        return await this.db.FactSnapshot.findAll(options);
    }
  }

  /**
   * Invariant 3: Simulation Determinism
   */
  _calculateSimHash(rules, snapshotIds) {
    const input = JSON.stringify({
      rules,
      snapshots: snapshotIds.sort(),
      engine: this.ENGINE_VERSION
    });
    return crypto.createHash('sha256').update(input).digest('hex');
  }

  /**
   * Pillar 3.5: Promotion Workflow
   * Promotes a successfully simulated draft to an active policy version.
   */
  async promoteDraft(db, simulationId, adminId) {
    const simulation = await db.PolicySimulation.findByPk(simulationId);
    if (!simulation || simulation.status !== 'COMPLETED') {
      throw new Error("Cannot promote an incomplete or missing simulation");
    }

    // Blast Radius Guardrail (Step 3.5)
    const friction = simulation.results.summary.friction_index;
    if (friction === 'HIGH') {
      logger.warn({ simulationId }, "PolicySimulation: Promoting high-friction policy change");
      // In real system, would check for VP_APPROVAL flag here
    }

    return await db.sequelize.transaction(async (t) => {
      // 1. Find the current latest version number
      const latestVersion = await db.PolicyVersion.findOne({
        where: { policy_id: simulation.policy_id },
        order: [['version_number', 'DESC']],
        transaction: t
      });

      const nextVersionNumber = (latestVersion?.version_number || 0) + 1;

      // 2. Create the new active version (Step 4)
      const newVersion = await db.PolicyVersion.create({
        policy_id: simulation.policy_id,
        version_number: nextVersionNumber,
        enforcement_level: 'MANDATORY', // Default to active
        rules_logic: simulation.draft_rules,
        created_by: adminId
      }, { transaction: t });

      return newVersion.toJSON();
    });
  }
}
