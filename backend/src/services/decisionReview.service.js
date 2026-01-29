import logger from '../logger.js';
import crypto from 'crypto';

/**
 * Phase 6 Pillar 1: Decision Review Service (The Glass Box)
 * Transforms raw JSON artifacts into a Human-Readable Evidence Chain.
 * Invariant 1: Explanation Immutability (Read-only projection)
 * Invariant 2: Mechanical Traceability (Fact linking)
 */
export class DecisionReviewService {
  /**
   * @param {object} db - Sequelize DB instance
   */
  constructor(db) {
    this.db = db;
    this.ENGINE_VERSION = '1.0.0';
  }

  /**
   * Generate a Decision Review Object (The Explanation Record)
   * This is a read-only projection derived from persisted artifacts.
   * 
   * @param {string} decisionId - UUID of the decision to review
   * @returns {Promise<object>} The Decision Review Object
   */
  async getDecisionReview(decisionId) {
    logger.info({ decisionId }, "DecisionReview: Generating review projection");

    // 1. Fetch the primary decision record
    const decision = await this.db.Decision.findByPk(decisionId, {
      include: [
        { 
          model: this.db.PolicyVersion, 
          as: 'policyVersion',
          include: [{ model: this.db.Policy, as: 'policy' }]
        },
        { 
          model: this.db.Override, 
          as: 'override',
          include: [
            { 
              model: this.db.OverrideSignature, 
              as: 'signatures',
              include: [{ model: this.db.User, as: 'actor' }]
            },
            {
              model: this.db.OverrideRevocation,
              as: 'revocation',
              include: [{ model: this.db.User, as: 'revoker' }]
            }
          ]
        }
      ]
    });

    if (!decision) {
      throw new Error(`Decision record ${decisionId} not found`);
    }

    // 2. Fetch the corresponding FactSnapshot
    const snapshot = await this.db.FactSnapshot.findByPk(decision.fact_id);
    if (!snapshot) {
      throw new Error(`FactSnapshot ${decision.fact_id} not found for decision ${decisionId}`);
    }

    // 3. Construct the Timeline (Pillar 1.2)
    const timeline = this._buildTimeline(decision, snapshot);

    // 4. Calculate Integrity (Pillar 1.4.B)
    const integrity = this._verifyIntegrity(decision, snapshot);

    // 5. Build the Final Projection
    return {
      review_id: `REV-${decision.id.substring(0, 8).toUpperCase()}`,
      decision_id: decision.id,
      verdict_summary: decision.result,
      repo_info: {
        full_name: snapshot.repo_full_name,
        pr_number: snapshot.pr_number,
        commit_sha: snapshot.commit_sha
      },
      timeline,
      integrity,
      override_info: decision.override ? this._formatOverride(decision.override) : null,
      metadata: {
        generated_at: new Date().toISOString(),
        snapshot_version: snapshot.snapshot_version
      }
    };
  }

  /**
   * Pillar 1.2: Construction of the Evidence Chain Timeline
   */
  _buildTimeline(decision, snapshot) {
    const steps = [];

    // Step 1: Fact Ingestion
    steps.push({
      step: "FACT_INGESTION",
      timestamp: snapshot.ingested_at,
      status: "COMPLETE",
      evidence: [`snapshot_id:${snapshot.id}`]
    });

    // Step 2: Policy Resolution
    // Note: In Phase 5, Decision model records the primary policy_version_id
    steps.push({
      step: "POLICY_RESOLUTION",
      timestamp: decision.createdAt,
      applied_policies: 1, // Phase 5 records 1:1 decision-to-policy mapping
      policy_version_ids: [decision.policy_version_id]
    });

    // Step 3: Judgment Execution
    const violations = [];
    if (decision.result !== 'PASS') {
      // Re-map rationale to violations if possible
      // In Phase 6, we'll have structured violation records in the Decision model
      // For Phase 5 fallback, we display the rationale as a primary violation
      violations.push({
        policy_id: decision.policyVersion.policy_id,
        policy_name: decision.policyVersion.policy.name,
        checker_id: decision.policyVersion.rules_logic?.type || 'unknown',
        rationale: decision.rationale,
        // Drill-down mapping (Pillar 1.4.A)
        actual_value: this._extractFactValue(snapshot.data, decision.policyVersion.rules_logic?.type)
      });
    }

    steps.push({
      step: "JUDGMENT_EXECUTION",
      timestamp: decision.createdAt,
      violations
    });

    return steps;
  }

  /**
   * Pillar 1.4.A: The Drill-Down Engine
   * Maps violated policy types to actual values in the FactSnapshot
   */
  _extractFactValue(data, checkerType) {
    if (!data) return 'N/A';
    
    switch (checkerType) {
      case 'coverage':
        return data.metadata?.test_files_changed_count ?? 0;
      case 'pr_size':
        return data.changes?.total_files ?? 0;
      case 'security_path':
        return data.changes?.files?.map(f => f.path).filter(p => p.includes('auth') || p.includes('config')).join(', ') || 'None';
      default:
        return 'Details in rationale';
    }
  }

  /**
   * Pillar 1.4.B: The Integrity Reporter
   * Verifies that hash(Snapshot + Policy) == evaluation_hash
   */
  _verifyIntegrity(decision, snapshot) {
    const storedHash = decision.evaluation_hash;
    if (!storedHash) {
      return { evaluation_hash_verified: false, reason: "No hash stored" };
    }

    // Re-calculate hash (Pillar 1.4.B)
    const currentHash = this._calculateHash(snapshot, decision.policyVersion);
    const verified = (currentHash === storedHash);

    return {
      evaluation_hash_verified: verified,
      signed_by: "ZAXION_JUDGE_V1",
      stored_hash: storedHash,
      calculated_hash: currentHash
    };
  }

  /**
   * Deterministic Hash Calculation (Shared with Judge)
   */
  _calculateHash(snapshot, policyVersion) {
    const input = JSON.stringify({
      facts: snapshot.data,
      policies: [{ id: policyVersion.id, rules: policyVersion.rules_logic }],
      version: this.ENGINE_VERSION
    });
    return crypto.createHash('sha256').update(input).digest('hex');
  }

  /**
   * Pillar 1.3.4: Enforcement Separation
   * Displays override metadata without softening the original block
   */
  _formatOverride(override) {
    return {
      id: override.id,
      status: override.status,
      category: override.category,
      expires_at: override.expires_at,
      signatures: override.signatures?.map(sig => ({
        actor: sig.actor?.username || 'System',
        role: sig.role_at_signing,
        justification: sig.justification,
        timestamp: sig.createdAt
      })) || [],
      revocation: override.revocation ? {
        revoked_by: override.revocation.revoker?.username || 'System',
        revoked_at: override.revocation.revoked_at,
        reason: override.revocation.reason
      } : null
    };
  }
}
