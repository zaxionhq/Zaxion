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
    const {
      policy_id,
      draft_rules,
      sample_strategy,
      sample_size,
      created_by,
      scope_override,
      target_repo_full_name,
      target_branch,
      days_back,
      is_sandbox = false // Default to false, but should be enforced by controller
    } = payload;

    // SANDBOX ENFORCEMENT
    if (!is_sandbox && process.env.NODE_ENV === 'production') {
       logger.warn("Attempted to run simulation in production without sandbox flag.");
       // In a real scenario, we might redirect to a read-only replica here.
       // For now, we log it.
    }

    logger.info({ policy_id, sample_strategy, sample_size, is_sandbox }, "PolicySimulation: Starting simulation");

    // 1. Collect Snapshots (Pillar 3.4.A)
    const snapshots = await this._collectSnapshots(sample_strategy, sample_size, {
      policy_id,
      scope_override,
      target_repo_full_name,
      target_branch,
      days_back,
    });

    // 2. Fetch Rules (if not provided as draft)
    let rules = draft_rules;
    if (!rules) {
      // Check if it's a Core Policy ID (e.g. SEC-001) or a DB UUID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(policy_id);
      
      if (isUuid) {
        const policy = await this.db.Policy.findByPk(policy_id);
        if (!policy) throw new Error("Policy not found");
        
        const version = await this.db.PolicyVersion.findOne({
          where: { policy_id, is_current: true }
        });
        if (!version) throw new Error("No active version found for policy");
        rules = version.rules_logic;
      } else {
        // It's a Core Policy ID, fetch from static definition
        const { CORE_POLICIES } = await import('../policies/corePolicies.js');
        const corePolicy = CORE_POLICIES.find(p => p.id === policy_id);
        if (!corePolicy) throw new Error(`Core Policy ${policy_id} not found`);
        
        // Map Core Policy to a rule structure the engine understands
        // Hardcore Policy Mode (Wave 4) logic: 
        // For simulation, we map the static core policy ID to the correct checker type.
        const policyMap = {
          'SEC-001': 'security_patterns',
          'SEC-002': 'security_patterns',
          'SEC-003': 'security_patterns',
          'SEC-004': 'dependency_scan',
          'SEC-005': 'security_patterns',
          'SEC-006': 'security_patterns',
          'SEC-007': 'security_patterns',
          'SEC-008': 'security_patterns',
          'REL-001': 'reliability',
          'COD-001': 'code_quality',
          'COD-002': 'documentation',
          'GOV-001': 'pr_size',
          'GOV-002': 'coverage',
        };

        rules = {
           type: policyMap[corePolicy.id] || "core_enforcement",
           id: corePolicy.id,
           severity: corePolicy.severity,
           // Force pattern matching context for security policies
           ...( (corePolicy.id === 'SEC-001' || corePolicy.id === 'SEC-002') && { patterns: 'all' }),
           // Default parameters for core policies if not provided
           ...(corePolicy.id === 'GOV-001' && { max_files: 20 }),
           ...(corePolicy.id === 'GOV-002' && { min_coverage_ratio: 0.8 }),
        };
      }
    }

    // 3. Generate Simulation Hash (Invariant 3)
    const simulation_hash = this._calculateSimHash(rules, snapshots.map(s => s.id));

    // If no snapshots, return a completed simulation with empty summary (no 500)
    if (snapshots.length === 0) {
      // For Core Policies, we might not want to create a DB record if we can't link it to a UUID policy_id
      // But let's see. If policy_id is 'SEC-001', PostgreSQL UUID column will fail.
      // So we must handle simulation creation differently for Core Policies or ensure schema supports it.
      // The schema likely has policy_id as UUID.
      
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(policy_id);
      
      const emptyResults = {
        summary: {
          total_snapshots: 0,
          consistent_count: 0,
          newly_blocked_count: 0,
          newly_passed_count: 0,
          fail_rate_change: '0.00%',
          friction_index: 'LOW',
          target_repo: target_repo_full_name || 'GLOBAL',
        },
        impacted_prs: [],
      };

      if (!isUuid) {
         // Return an ephemeral simulation result without saving to DB
         return {
           id: `sim-core-${Date.now()}`,
           policy_id,
           status: 'COMPLETED',
           created_by,
           results: emptyResults,
           createdAt: new Date().toISOString()
         };
      }

      const simulation = await this.db.PolicySimulation.create({
        simulation_hash,
        policy_id,
        draft_rules: rules, // Use the resolved rules
        engine_version: this.ENGINE_VERSION,
        sample_strategy,
        sample_size: 0,
        status: 'COMPLETED',
        created_by,
        results: emptyResults,
      });
      return simulation.toJSON();
    }

    // 3. Create Simulation Record
    let simulation;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(policy_id);

    if (isUuid) {
      simulation = await this.db.PolicySimulation.create({
        simulation_hash,
        policy_id,
        draft_rules: rules,
        engine_version: this.ENGINE_VERSION,
        sample_strategy,
        sample_size: snapshots.length,
        status: 'RUNNING',
        created_by
      });
    } else {
       // Ephemeral simulation object for Core Policies
       simulation = {
         id: `sim-core-${Date.now()}`,
         policy_id,
         draft_rules: rules,
         engine_version: this.ENGINE_VERSION,
         sample_strategy,
         sample_size: snapshots.length,
         status: 'RUNNING',
         created_by,
         update: async (data) => { Object.assign(simulation, data); return simulation; }, // Mock update
         toJSON: () => simulation
       };
    }

    try {
      // 4. Execute Simulation (The Snapshot Replayer)
      const results = await this._executeSimulation(simulation, snapshots, rules, target_repo_full_name);

      // 5. Update Record
      if (isUuid) {
        await simulation.update({
          status: 'COMPLETED',
          results
        });
      } else {
        simulation.status = 'COMPLETED';
        simulation.results = results;
      }

      return simulation.toJSON ? simulation.toJSON() : simulation;
    } catch (error) {
      logger.error({ error, simulation_id: simulation.id }, "PolicySimulation: Simulation failed");
      if (isUuid) {
        await simulation.update({ status: 'FAILED' });
      } else {
        simulation.status = 'FAILED';
      }
      throw error;
    }
  }

  /**
   * Pillar 3.4.A: The Snapshot Replayer Logic
   */
  async _executeSimulation(simulation, snapshots, draftRules, target_repo_full_name) {
    let newlyBlocked = 0;
    let newlyPassed = 0;
    let consistent = 0;
    let totalBlocked = 0;
    const impactedPrs = [];
    const perPrResults = [];
    const allViolations = [];
    const severityCounts = { BLOCK: 0, WARN: 0, OBSERVE: 0 };

    // Mock applied policy for the simulation (never persisted to DB)
    const mockAppliedPolicy = {
      policy_id: simulation.policy_id,
      policy_version_id: 'DRAFT',
      level: 'MANDATORY',
      rules_logic: draftRules,
      reason: 'Simulation Run'
    };

    for (const snapshot of snapshots) {
      const historicalDecision = await this.db.Decision.findOne({
        where: { fact_id: snapshot.id },
        order: [['createdAt', 'DESC']]
      });

      // Ensure snapshot data is in the format expected by the engine
      // The engine expects facts to have a 'data' property if it's a full snapshot object
      const factSnapshot = snapshot.data ? snapshot : { data: snapshot };

      const simResult = this.evaluationEngine.evaluate(factSnapshot, [mockAppliedPolicy]);
      const historicalResult = historicalDecision ? historicalDecision.result : 'UNKNOWN';
      const simVerdict = simResult.result;

      if (simVerdict === 'BLOCK') {
        totalBlocked++;
      }

      const pullRequest = snapshot.data?.pull_request;
      const violations = simResult.structured_violations || [];
      const passes = simResult.structured_passes || [];

      for (const v of violations) {
        severityCounts[v.severity] = (severityCounts[v.severity] || 0) + 1;
        allViolations.push({
          ...v,
          pr_number: snapshot.pr_number,
          repo: snapshot.repo_full_name,
          pr_title: pullRequest?.title || historicalDecision?.pr_title || `PR #${snapshot.pr_number}`,
        });
      }

      const prMeta = {
        pr_number: snapshot.pr_number,
        repo: snapshot.repo_full_name,
        verdict: simVerdict,
        rationale: simResult.rationale,
        pr_title: pullRequest?.title || historicalDecision?.pr_title || `PR #${snapshot.pr_number}`,
        author: pullRequest?.author?.username || historicalDecision?.author_handle || null,
        base_branch: snapshot.data?.pull_request?.base_branch || historicalDecision?.base_branch || null,
        historical_result: historicalResult,
        ingested_at: snapshot.ingested_at,
        violations,
        passes,
      };
      perPrResults.push(prMeta);

      if (historicalResult === 'PASS' && simVerdict === 'BLOCK') {
        newlyBlocked++;
        impactedPrs.push({ ...prMeta, change: 'PASS -> BLOCK' });
      } else if (historicalResult === 'BLOCK' && simVerdict === 'PASS') {
        newlyPassed++;
      } else {
        consistent++;
      }
    }

    const total = snapshots.length;
    const failRateChange = total > 0 ? ((newlyBlocked - newlyPassed) / total * 100).toFixed(2) : '0.00';
    const totalViolations = allViolations.length;

    // Simulation blocking logic: 
    // It should block if ANY PR in the sample would be blocked by the new policy,
    // OR if we are simulating a policy that specifically targets violations found in the snapshots.
    const policyWouldBlock = totalBlocked > 0 || newlyBlocked > 0;

    return {
      summary: {
        total_snapshots: total,
        consistent_count: consistent,
        newly_blocked_count: newlyBlocked,
        newly_passed_count: newlyPassed,
        total_blocked_count: totalBlocked,
        fail_rate_change: `${failRateChange}%`,
        friction_index: parseFloat(failRateChange) > 10 ? 'HIGH' : 'LOW',
        total_violations: totalViolations,
        violations_by_severity: severityCounts,
        policy_would_block: policyWouldBlock,
        policy_would_pass: total === 0 || (!policyWouldBlock),
        target_repo: target_repo_full_name || 'GLOBAL',
      },
      violations: allViolations,
      impacted_prs: impactedPrs.slice(0, 50),
      per_pr_results: perPrResults,
    };
  }

  /**
   * Sampling Strategy (Pillar 3.4.A)
   */
  async _collectSnapshots(strategy, size, { policy_id, scope_override, target_repo_full_name, target_branch, days_back }) {
    const where = {};
    const include = [];

    // If caller explicitly targets a repo, scope snapshots to that repo.
    if (target_repo_full_name) {
      where.repo_full_name = target_repo_full_name;
    }

    // Optional: only snapshots from the last N days
    if (days_back != null && days_back > 0) {
      const since = new Date();
      since.setDate(since.getDate() - Number(days_back));
      where.ingested_at = { [Op.gte]: since };
    }

    // If a branch is specified, join Decisions to filter by base_branch.
    if (target_branch) {
      include.push({
        model: this.db.Decision,
        as: 'decisions',
        required: true,
        where: { base_branch: target_branch },
      });
    }

    const options = {
      where,
      include,
      limit: Math.min(size || 100, 500),
      order: [['ingested_at', 'DESC']],
    };

    switch (strategy) {
      case 'TIME_BASED':
      case 'REPO_BASED':
      default:
        // For now all strategies share the same sampling, but this hook
        // allows future customizations per strategy.
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
