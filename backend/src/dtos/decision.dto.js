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
      decision: decision.decision, // PASS, BLOCK, OVERRIDDEN_PASS, etc.
      rationale: decision.rationale,
      created_at: decision.created_at,
      updated_at: decision.updated_at,
      
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
