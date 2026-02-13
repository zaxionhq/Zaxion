/**
 * Deterministic Policy Engine
 * Evaluates facts against rules. Handles Admin Overrides.
 */
import * as logger from "../utils/logger.js";

export class PolicyEngineService {
  constructor(octokit) {
    this.octokit = octokit;
    this.POLICY_VERSION = 1;
  }

  /**
   * Evaluate PR Context and return a Decision Object
   * @param {object} prContext - Result from DiffAnalyzer
   * @param {object} metadata - { owner, repo, prNumber, baseBranch, prBody, userLogin }
   * @returns {Promise<object>} DecisionObject
   */
  async evaluate(prContext, metadata) {
    const policies = [];
    let isBlocked = false;
    let isWarned = false;

    // --- POLICY 1: High-risk files require tests ---
    const highRiskFiles = prContext.categories.highRisk || [];
    const testFiles = prContext.categories.tests || [];
    
    const policy1 = {
      name: "High-risk Code Coverage",
      passed: true,
      severity: "BLOCK",
      message: "No high-risk files changed."
    };

    if (highRiskFiles.length > 0) {
      if (testFiles.length === 0) {
        policy1.passed = false;
        const displayedFiles = highRiskFiles.slice(0, 3).join(', ');
        const overflowCount = highRiskFiles.length - 3;
        const overflowText = overflowCount > 0 ? `... and ${overflowCount} more. Click ( ? ) for full list.` : '';
        policy1.message = `**FAILED:** Modified ${highRiskFiles.length} high-risk file(s) (${displayedFiles}${overflowText}) without adding tests.`;
        isBlocked = true;
      } else {
        policy1.message = `**PASSED:** High-risk changes covered by ${testFiles.length} test file(s).`;
      }
    }
    policies.push(policy1);

    // --- POLICY 2: Large PR warning ---
    const N_LARGE = 20;
    const policy2 = {
      name: "PR Size Check",
      passed: true,
      severity: "WARN",
      message: `PR size is within limits (${prContext.totalChanges} files).`
    };

    if (prContext.totalChanges > N_LARGE) {
      policy2.passed = false;
      policy2.message = `**WARNING:** Large PR detected (${prContext.totalChanges} files). Consider splitting into smaller chunks for better review.`;
      isWarned = true;
    }
    policies.push(policy2);

    // --- POLICY 3: Branch Protection Strategy ---
    const isMainBranch = ["main", "master", "prod", "production"].includes(metadata.baseBranch);
    const policy3 = {
      name: "Branch Protection",
      passed: true,
      severity: "INFO",
      message: isMainBranch ? "Targeting protected branch (Blocking Mode enabled)." : "Targeting feature branch (Warning Mode enabled)."
    };
    policies.push(policy3);

    // Logic: If Blocked BUT not main branch -> Downgrade to WARN
    if (isBlocked && !isMainBranch) {
      isBlocked = false;
      isWarned = true;
      policy1.severity = "WARN (Downgraded)";
      policy1.message += " (Allowed on feature branch)";
    }

    // --- OVERRIDE LOGIC ---
    let overrideValid = false;
    let overrideActor = null;
    const overrideRegex = /\[override-gate:(.*?)\]/;
    const match = metadata.prBody ? metadata.prBody.match(overrideRegex) : null;

    if (match && isBlocked) {
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
            isBlocked = false; // Override the block
            policies.push({
              name: "Admin Override",
              passed: true,
              severity: "INFO",
              message: `**OVERRIDE APPLIED** by @${metadata.userLogin}: "${overrideReason}"`
            });
          }
        } catch (error) {
          logger.error("[PolicyEngine] Failed to check permissions:", error);
        }
      }
    }

    // --- FINAL DECISION ---
    let finalDecision = "PASS";
    let decisionReason = "All policies passed.";
    let violatedPolicyName = null;
    let violationReason = null;
    
    if (isBlocked) {
      finalDecision = "BLOCK";
      const failingPolicy = policies.find(p => !p.passed && p.severity === "BLOCK");
      violatedPolicyName = failingPolicy?.name || "Policy Violation";
      violationReason = failingPolicy?.message || "Policy violation detected.";
      decisionReason = violationReason;
    } else if (isWarned) {
      finalDecision = "WARN";
      const warningPolicy = policies.find(p => !p.passed && p.severity === "WARN");
      violatedPolicyName = warningPolicy?.name || "Policy Warning";
      violationReason = warningPolicy?.message || "Policy warnings detected.";
      decisionReason = violationReason;
    }

    if (overrideValid) {
      finalDecision = "OVERRIDDEN_PASS";
      decisionReason = `Overridden by ${overrideActor}.`;
    }

    // UI Path to Resolution (This is a deterministic UI contract)
    const fixLink = `https://zaxion.app/workspace?repo=${metadata.repo}&owner=${metadata.owner}&pr=${metadata.prNumber}`;

    const decisionObject = {
      repo: `${metadata.owner}/${metadata.repo}`,
      prNumber: metadata.prNumber,
      decision: finalDecision,
      decisionReason: decisionReason.replace(/\*\*/g, ''), // Clean markdown for the field
      violated_policy: violatedPolicyName,
      violation_reason: violationReason?.replace(/\*\*/g, ''),
      policy_version: this.POLICY_VERSION,
      evaluationStatus: "FINAL",
      facts: {
        changedFiles: prContext.files || [],
        testFilesAdded: testFiles.length,
        affectedAreas: highRiskFiles.length > 0 ? highRiskFiles : (prContext.totalChanges > N_LARGE ? ["Repository Scope"] : []),
        totalChanges: prContext.totalChanges,
        isMainBranch: isMainBranch,
        hasCriticalChanges: highRiskFiles.length > 0
      },
      ui: {
        fix_link: fixLink
      },
      override: {
        allowed: true, // Configurable per repo in future
        requiredRole: "REPO_ADMIN",
        justificationRequired: true
      },
      timestamp: new Date().toISOString()
    };

    return decisionObject;
  }
}
