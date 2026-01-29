import logger from '../logger.js';

/**
 * Phase 5 Pillar 4: Decision Handoff (Boundary Layer)
 * Bridges the Decision Producer with Governance Memory (Pillar 3) and GitHub.
 */
export class DecisionHandoffService {
  /**
   * @param {object} db - Sequelize DB instance
   * @param {object} governanceMemoryService - Service to record decisions (Phase 4, Pillar 3)
   * @param {object} githubReporterService - Service to update GitHub Check Runs
   */
  constructor(db, governanceMemoryService, githubReporterService) {
    this.db = db;
    this.governanceMemoryService = governanceMemoryService;
    this.githubReporterService = githubReporterService;
  }

  /**
   * Handoff an evaluation result to the governance system and GitHub.
   * Invariant 3: Causal Decision Publication (Record first, report second)
   * Invariant 4: No Logic Leakage
   * 
   * @param {object} payload - The handoff payload
   * @param {object} payload.evaluation_result - Output from Pillar 5.3
   * @param {string} payload.override_id - UUID of human override (optional)
   * @param {object} payload.github_context - Context for reporting (owner, repo, sha, prNumber)
   * @returns {object} Final Decision Record
   */
  async handoff(payload) {
    const { evaluation_result, override_id, github_context } = payload;
    
    logger.info({ 
      evalId: evaluation_result.fact_snapshot_id, 
      overrideId: override_id 
    }, "DecisionHandoff: Starting handoff process");

    // 1. Override Applier (Step 3.3)
    // Map evaluation result to final status based on presence of override
    const finalStatus = this._calculateFinalStatus(evaluation_result.result, override_id);

    // 2. Pillar 3 Integration (Invariant 1 & Step 3.1)
    // We must record the decision BEFORE emitting external status
    let decisionRecord;
    try {
      decisionRecord = await this.governanceMemoryService.recordDecision(this.db, {
        policy_version_id: evaluation_result.applied_policies[0]?.policy_version_id, // Primary policy for record
        fact_id: evaluation_result.fact_snapshot_id,
        result: evaluation_result.result,
        rationale: evaluation_result.rationale,
        override_id: override_id,
        final_status: finalStatus, // Our derived status
        evaluation_hash: evaluation_result.evaluation_hash // Pillar 1.3: Link integrity hash
      });
      
      logger.info({ decisionId: decisionRecord.id }, "DecisionHandoff: Decision successfully recorded in Pillar 3");
    } catch (error) {
      logger.error({ error, evalId: evaluation_result.fact_snapshot_id }, "DecisionHandoff: Failed to record decision in Pillar 3. Aborting publication.");
      throw new Error(`Causal Decision Publication Failure: Decision must be recorded before reporting. ${error.message}`);
    }

    // 3. GitHub Check Run Reporter (Step 3.2)
    // Now that it's recorded, we can inform the external world
    try {
      await this.githubReporterService.reportStatus(
        github_context.owner,
        github_context.repo,
        github_context.sha,
        {
          decision: finalStatus,
          decisionReason: evaluation_result.rationale,
          prNumber: github_context.prNumber,
          policy_version: evaluation_result.engine_version,
          violated_policies: evaluation_result.violated_policies,
          evaluation_hash: evaluation_result.evaluation_hash
        }
      );
      logger.info("DecisionHandoff: Successfully reported status to GitHub");
    } catch (error) {
      // Invariant 3: We don't fail the whole handoff if reporting fails, 
      // but we log it heavily because the "Truth" is already in Pillar 3.
      logger.error({ error }, "DecisionHandoff: Failed to report status to GitHub. Truth is preserved in Pillar 3.");
    }

    return {
      id: decisionRecord.id,
      evaluation_result_id: evaluation_result.fact_snapshot_id,
      final_status: finalStatus,
      recorded_at: new Date().toISOString()
    };
  }

  /**
   * Logic to determine the final status reported to the outside world.
   * Step 3.3: Override Applier
   */
  _calculateFinalStatus(evaluationResult, overrideId) {
    if (evaluationResult === 'PASS') return 'SUCCESS';
    
    // If blocked but we have a valid override ID, we report success
    if (evaluationResult === 'BLOCK' && overrideId) {
      return 'SUCCESS'; // In Phase 6, we'd label this OVERRIDDEN_PASS for GitHub
    }

    if (evaluationResult === 'BLOCK') return 'FAILURE';
    if (evaluationResult === 'WARN') return 'NEUTRAL';

    return 'FAILURE'; // Default to safe failure
  }
}
