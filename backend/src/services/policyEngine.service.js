/**
 * Deterministic Policy Engine
 * Evaluates facts against rules. Handles Admin Overrides.
 */
import * as logger from "../utils/logger.js";
import { CORE_POLICIES } from "../policies/corePolicies.js";
import { mapCorePolicyToRules } from "../utils/policyMapper.js";
import { PolicyConfigurationService } from "./policyConfiguration.service.js";
import { EvaluationEngineService } from "./evaluationEngine.service.js";

export class PolicyEngineService {
  constructor(octokit, db) {
    this.octokit = octokit;
    this.db = db;
    this.configService = db ? new PolicyConfigurationService(db) : null;
    this.evaluationEngine = new EvaluationEngineService();
    this.POLICY_VERSION = 1;
  }

  /**
   * Evaluate PR Context and return a Decision Object
   * @param {object} prContext - Result from DiffAnalyzer
   * @param {object} metadata - { owner, repo, prNumber, baseBranch, prBody, userLogin, enabledPolicyIds }
   * @returns {Promise<object>} DecisionObject
   */
  async evaluate(prContext, metadata) {
    const { enabledPolicyIds = [] } = metadata;
    // --- PREPARE FACT SNAPSHOT ---
    // Mapping DiffAnalyzer output to the Fact Snapshot format expected by EvaluationEngineService
    const factSnapshot = {
      id: `live-${metadata.owner}-${metadata.repo}-${metadata.prNumber}`,
      data: {
        ...prContext,
        metadata: {
          base_branch: metadata.baseBranch,
          pr_body: metadata.prBody,
          author: metadata.userLogin,
          test_files_changed_count: prContext.categories?.tests?.length || 0,
        },
        changes: {
          total_files: prContext.totalChanges || 0,
          high_risk_files: prContext.categories?.highRisk || [],
          test_files: prContext.categories?.tests || [],
          files: prContext.files || []
        }
      }
    };

    // --- PREPARE APPLIED POLICIES ---
    const context = {
      org: metadata.owner,
      repo: `${metadata.owner}/${metadata.repo}`,
      branch: metadata.baseBranch
    };

    const appliedPolicies = [];

    for (const corePolicy of CORE_POLICIES) {
       // Check if policy is explicitly requested (for Founder Console)
       // OR if it's enabled in the standard configuration
       const isRequested = enabledPolicyIds.length > 0 && enabledPolicyIds.includes(corePolicy.id);
       
       const isEnabled = isRequested || (this.configService 
         ? await this.configService.isPolicyEnabled(corePolicy.id, context)
         : true);

       // If specific policies were requested but this isn't one of them, skip it
       if (enabledPolicyIds.length > 0 && !isRequested) {
         continue;
       }

       if (!isEnabled) {
         logger.log(`[PolicyEngine] Skipping disabled policy: ${corePolicy.id} for ${context.repo}:${context.branch}`);
         continue;
       }

       // Map Core Policy to the dynamic policy format (single source of truth with simulation / PR URL analysis)
       const rules = mapCorePolicyToRules(corePolicy.id, corePolicy.severity);

       appliedPolicies.push({
         policy_id: corePolicy.id,
         policy_version_id: `core-${corePolicy.id}-v1`,
         level: corePolicy.severity === 'CRITICAL' ? 'MANDATORY' : 'ADVISORY',
         rules_logic: {
           ...rules,
           severity: corePolicy.severity,
         }
       });
    }

    // --- EXECUTE EVALUATION ---
    const evaluation = this.evaluationEngine.evaluate(factSnapshot, appliedPolicies);

    // --- BRANCH PROTECTION LOGIC (Legacy override) ---
    const isMainBranch = ["main", "master", "prod", "production"].includes(metadata.baseBranch);
    
    let finalVerdict = evaluation.final_verdict;
    let rationale = evaluation.rationale;

    // Logic: If Blocked BUT not main branch -> Downgrade to WARN
    if (finalVerdict === 'BLOCK' && !isMainBranch) {
      finalVerdict = 'WARN';
      rationale = `**Downgraded to WARN (Non-protected branch).**\n\n${rationale}`;
    }

    // --- OVERRIDE LOGIC ---
    let overrideValid = false;
    let overrideActor = null;
    const overrideRegex = /\[override-gate:(.*?)\]/;
    const match = metadata.prBody ? metadata.prBody.match(overrideRegex) : null;

    if (match && finalVerdict === 'BLOCK') {
      const overrideReason = match[1].trim();
      if (overrideReason.length >= 10) {
        try {
          const { data: permissionLevel } = await this.octokit.repos.getCollaboratorPermissionLevel({
            owner: metadata.owner,
            repo: metadata.repo,
            username: metadata.userLogin
          });
          
          if (["admin", "maintainer"].includes(permissionLevel.permission)) {
            overrideValid = true;
            overrideActor = metadata.userLogin;
            finalVerdict = "OVERRIDDEN_PASS";
            rationale = `**OVERRIDE APPLIED** by @${metadata.userLogin}: "${overrideReason}"\n\n${rationale}`;
          }
        } catch (error) {
          logger.error("[PolicyEngine] Failed to check permissions:", error);
        }
      }
    }

    // Determine primary violation for UI display
    let violatedPolicy = null;
    let violationReason = null;

    if (evaluation.violations && evaluation.violations.length > 0) {
      // Prioritize BLOCKing violations, then WARNing
      const criticalViolation = evaluation.violations.find(v => v.severity === 'BLOCK') 
                             || evaluation.violations.find(v => v.severity === 'WARN')
                             || evaluation.violations[0];
      
      if (criticalViolation) {
        violatedPolicy = criticalViolation.rule_id || criticalViolation.checker;
        violationReason = criticalViolation.message;
      }
    }

    return {
      decision: finalVerdict,
      decisionReason: rationale,
      policy_version: this.POLICY_VERSION,
      violated_policy: violatedPolicy,
      violation_reason: violationReason,
      facts: {
        totalChanges: prContext.totalChanges,
        hasCriticalChanges: prContext.categories?.highRisk?.length > 0,
        testFilesAdded: prContext.categories?.tests?.length || 0,
        affectedAreas: prContext.categories?.highRisk || [],
        changedFiles: prContext.files.map(f => f.path)
      },
      policies: evaluation.policy_results.map(p => ({
        name: p.policy_type === 'core_enforcement' ? (CORE_POLICIES.find(cp => cp.id === p.policy_version_id.split('-')[1])?.name || p.policy_type) : p.policy_type,
        passed: p.verdict === 'PASS',
        severity: p.verdict,
        message: p.message,
        details: p.details
      })),
      violations: evaluation.violations, // Pass through the full structured violations from EvaluationEngine
      advisor: null // Will be enriched by PrAnalysisService
    };
  }
}
