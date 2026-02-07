// src/dtos/decision.dto.js

/**
 * Data Transfer Object for PR Decisions.
 * Ensures only safe, public data is sent to the frontend.
 */
export class DecisionDTO {
  /**
   * Transforms a raw database decision row into a public-safe object.
   * @param {Object} decision - Raw row from pr_decisions table.
   * @returns {Object} - Publicly safe decision object.
   */
  static toPublic(decision) {
    if (!decision) return null;

    return {
      id: decision.id,
      pr_number: decision.pr_number,
      repo_owner: decision.repo_owner,
      repo_name: decision.repo_name,
      commit_sha: decision.commit_sha,
      policy_version: decision.policy_version,
      decision: decision.decision, // PASS, BLOCK, OVERRIDDEN_PASS, etc.
      rationale: decision.rationale,
      created_at: decision.created_at,
      updated_at: decision.updated_at,
      
      // Public Evidence for UI (Phase 6 structural requirements)
      facts: decision.facts || {
        totalChanges: 0,
        testFilesAdded: 0,
        affectedAreas: [],
        hasCriticalChanges: false,
        changedFiles: [],
        isMainBranch: false
      },
      
      // Advisor Insights (Redacted for Enterprise)
      advisor: decision.advisor ? {
        riskAssessment: {
          riskLevel: decision.advisor.riskAssessment?.riskLevel || "HIGH"
        },
        rationale: decision.advisor.rationale // The "Plain English" explanation
      } : null,

      // UI/Policies context
      policies: decision.policies || [],
      violation_reason: decision.violation_reason || null,
      violated_policy: decision.violated_policy || null,

      // Override details (from JOIN)
      override_by: decision.override_by || null,
      override_reason: decision.override_reason || null,
      overridden_at: decision.overridden_at || null,

      // Metadata for UI context
      is_overridden: !!decision.overridden_at,
      
      // EXPLICITLY REDACTED:
      // raw_data: decision.raw_data,
      // evaluation_hash: decision.evaluation_hash,
      // github_check_run_id: decision.github_check_run_id
    };
  }

  /**
   * Transforms an array of decisions.
   */
  static toPublicList(decisions) {
    if (!Array.isArray(decisions)) return [];
    return decisions.map(d => this.toPublic(d));
  }
}
