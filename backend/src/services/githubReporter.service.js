/**
 * GitHub Check Run Reporter
 * Updates the PR UI on GitHub using the Checks API.
 */
import env from "../config/env.js";
import * as logger from "../utils/logger.js";

export class GitHubReporterService {
  constructor(octokit) {
    this.octokit = octokit;
    this.CHECK_NAME = env.GITHUB_CHECK_NAME || "Zaxion Governance";
    this.STICKY_MARKER = "<!-- ZAXION_STICKY_COMMENT -->";
  }

  /**
   * Report status to GitHub Checks API and maintain a sticky PR comment
   * @param {string} owner 
   * @param {string} repo 
   * @param {string} headSha 
   * @param {object} decisionObject - Full deterministic decision
   * @param {object} metadata - Extra context (prNumber, checkRunId, etc)
   * @returns {Promise<number|null>} The check_run_id created or updated
   */
  async reportStatus(owner, repo, headSha, decisionObject, metadata = {}) {
    const decisionState = typeof decisionObject === 'string' ? decisionObject : decisionObject.decision;
    const description = typeof decisionObject === 'string' ? metadata.description || "" : decisionObject.decisionReason;
    const prNumber = metadata.prNumber || decisionObject.prNumber;
    const explicitCheckRunId = metadata.checkRunId;

    let status = "completed";
    let conclusion = "neutral";
    let title = "Gateway Analysis";
    let badge = "⚪";
    
    // State Mapping
    switch (decisionState) {
      case "PENDING":
        status = "in_progress";
        conclusion = null;
        title = "Analyzing Risk...";
        badge = "⏳";
        break;
      case "BLOCK":
        status = "completed";
        conclusion = "failure";
        title = "Gateway Blocked";
        badge = "🔴";
        break;
      case "PASS":
        status = "completed";
        conclusion = "success";
        title = "Gateway Passed";
        badge = "🟢";
        break;
      case "WARN":
        status = "completed";
        conclusion = "neutral";
        title = "Gateway Warning";
        badge = "🟡";
        break;
      case "OVERRIDDEN_PASS":
        status = "completed";
        conclusion = "success";
        title = "⚠️ Bypass Authorized";
        badge = "🔓";
        break;
      default:
        status = "completed";
        conclusion = "failure";
        title = "System Error";
        badge = "❌";
    }

    // 0. Build Concise Summary Output (Concise Mode for Comment)
    const frontendUrl = env.FRONTEND_URL || "http://localhost:8080";
    const deepLink = `${frontendUrl}/pr/${owner}/${repo}/${prNumber}`;
    
    // Concise Summary for Sticky Comment
    let summary = `### ${title}\n\n`;
    
    // Always provide the deep link prominently
    summary += `[**📋 View Full Governance Report**](${deepLink})\n\n`;
    
    if (typeof decisionObject === 'object' && decisionObject !== null && decisionObject.decision) {
      if (decisionObject.facts) {
        // Only key stats in the summary
        const issueCount = (decisionObject.advisor?.suggestedTestIntents?.length || 0);
        summary += `- **Status:** ${badge} ${decisionState}\n`;
        summary += `- **Risk Analysis:** ${decisionObject.facts.hasCriticalChanges ? '🔴 Critical' : '🟢 Safe'}\n`;
        summary += `- **Changes:** ${decisionObject.facts.totalChanges || 0} files\n`;
        if (issueCount > 0) {
           summary += `- **Issues Found:** ${issueCount} (See full report for details)\n`;
        }
      }
    } else {
      // Handle string-only decisions (like OVERRIDDEN_PASS)
      summary += `> ${description}\n\n`;
      if (metadata.override_by) {
        summary += `**Authorized By:** ${metadata.override_by}\n`;
      }
    }

    summary += `\n---\n*Visit the [Full Report](${deepLink}) for detailed metrics, findings, and interactive remediation.*`;

    // Detailed Text for Check Run
    let text = `## 🛡️ Zaxion Policy Evaluation Report\n`;
    text += `**Decision:** ${decisionState}\n`;
    text += `**Timestamp:** ${new Date().toISOString()}\n\n`;
    
    if (typeof decisionObject === 'object' && decisionObject !== null && decisionObject.decision) {
      text += `**Policy Version:** \`${decisionObject.policy_version || 'unknown'}\`\n\n`;

      // 1. Policy Violation Breakdown Table (Requirement 1, 2, 3)
      if (decisionObject.violations && decisionObject.violations.length > 0) {
        text += `### 📋 Policy Violation Breakdown\n`;
        text += `| File | Policy | Line(s) | Description | Required Action | Observed Change |\n`;
        text += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
        
        decisionObject.violations.forEach(v => {
          const file = v.file || "N/A";
          const policy = v.rule_id || "N/A";
          const line = v.line || "N/A";
          const description = v.message || "N/A";
          const requiredAction = v.remediation?.steps ? v.remediation.steps.join("<br>") : (v.remediation || "N/A");
          const observedChange = v.current_value || "N/A";
          
          text += `| \`${file}\` | \`${policy}\` | ${line} | ${description} | ${requiredAction} | \`${observedChange}\` |\n`;
        });
        text += `\n`;
      }

      // 2. Plain English Rationale (Requirement 4)
      text += `### 💡 Plain English Rationale\n`;
      if (decisionObject.violations && decisionObject.violations.length > 0) {
        // Collect unique explanations from all violations
        const uniqueExplanations = [...new Set(decisionObject.violations.map(v => v.explanation).filter(Boolean))];
        if (uniqueExplanations.length > 0) {
          uniqueExplanations.forEach(exp => {
            text += `> ${exp}\n\n`;
          });
        } else if (decisionObject.advisor?.rationale) {
          text += `> ${decisionObject.advisor.rationale}\n\n`;
        } else {
          text += `> ${decisionObject.decisionReason || "No detailed rationale available."}\n\n`;
        }
      } else {
        text += `> All security protocols satisfied. No policy violations detected.\n\n`;
      }

      if (decisionObject.facts) {
        text += `### 📊 Facts Observed\n`;
        text += `- **Total Changes:** ${decisionObject.facts.totalChanges || 0} files\n`;
        text += `- **High Risk Changes:** ${decisionObject.facts.hasCriticalChanges ? '✅ Yes' : '❌ No'}\n`;
        text += `- **Tests Added:** ${decisionObject.facts.testFilesAdded || 0}\n\n`;
      }

      if (decisionObject.advisor && decisionObject.advisor.status !== "ERROR") {
        if (decisionObject.advisor.suggestedTestIntents?.length > 0) {
          text += `**Suggested Test Intents:**\n`;
          decisionObject.advisor.suggestedTestIntents.forEach(intent => {
            text += `- [ ] **${intent.file}**: ${intent.intent}\n`;
          });
          text += `\n`;
        }
      }
    } else {
       text += `> ${description}\n\n`;
    }

    // --- STICKY COMMENT LOGIC ---
    if (prNumber) {
      try {
        // USE THE CONCISE SUMMARY for the comment body
        const commentBody = `${this.STICKY_MARKER}\n## 🛡️ Zaxion Policy Status: ${badge} **${decisionState}**\n\n${summary}`;

        // 1. List comments to find existing sticky
        const { data: comments } = await this.octokit.rest.issues.listComments({
          owner,
          repo,
          issue_number: prNumber
        });

        const existingComment = comments.find(c => c.body.includes(this.STICKY_MARKER));

        if (existingComment) {
          // 2. Update existing comment
          await this.octokit.rest.issues.updateComment({
            owner,
            repo,
            comment_id: existingComment.id,
            body: commentBody
          });
          logger.log(`[GitHubReporter] Sticky comment updated for PR #${prNumber}`);
        } else {
          // 3. Create new comment if none exists
          await this.octokit.rest.issues.createComment({
            owner,
            repo,
            issue_number: prNumber,
            body: commentBody
          });
          logger.log(`[GitHubReporter] New sticky comment created for PR #${prNumber}`);
        }
      } catch (commentErr) {
        logger.warn(`[GitHubReporter] Failed to manage sticky comment: ${commentErr.message}`);
      }
    }

    let checkRunId = explicitCheckRunId;

    // 1. Check Runs API
    try {
      let checkRunsToUpdate = [];
      
      // We always fetch existing check runs for this SHA to ensure we clear any "Ghost Checks"
      try {
        const { data: { check_runs } } = await this.octokit.rest.checks.listForRef({
          owner,
          repo,
          ref: headSha,
          check_name: this.CHECK_NAME
        });
        checkRunsToUpdate = check_runs.filter(cr => cr.name === this.CHECK_NAME);
      } catch (listErr) {
        logger.warn(`[GitHubReporter] Failed to list check runs for ${headSha}: ${listErr.message}`);
      }

      // If we have an explicit ID but it wasn't in the list (e.g., reported on a different SHA previously), 
      // add it to the update queue
      if (explicitCheckRunId && !checkRunsToUpdate.some(c => c.id === explicitCheckRunId)) {
        checkRunsToUpdate.push({ id: explicitCheckRunId });
      }

      if (checkRunsToUpdate.length > 0) {
        logger.log(`[GitHubReporter] Found ${checkRunsToUpdate.length} check runs to update for ${this.CHECK_NAME}`);
        
        let updateCount = 0;
        for (const check of checkRunsToUpdate) {
          const updateParams = {
            owner,
            repo,
            check_run_id: check.id,
            status,
            output: {
              title,
              summary,
              text
            }
          };

          if (status === "completed") {
            updateParams.conclusion = conclusion;
          }

          try {
            logger.log(`[GitHubReporter] Attempting PATCH on check run ${check.id} with conclusion ${conclusion}...`);
            const { data: updatedCheck } = await this.octokit.rest.checks.update(updateParams);
            checkRunId = updatedCheck.id;
            updateCount++;
            logger.log(`[GitHubReporter] Successfully updated check run ${check.id} to ${conclusion}`);
          } catch (updateErr) {
            logger.warn(`[GitHubReporter] Failed to update check run ${check.id} (status: ${updateErr.status}).`);
            
            // If we are performing an override, we MUST update the existing check.
            // Creating a new one will cause an identity conflict in GitHub's eyes.
            if (decisionState === "OVERRIDDEN_PASS") {
              const errorMsg = `Identity Conflict: Zaxion found the required check run (${check.id}) but could not update it. This usually happens if the GitHub App identity doesn't match the one that created the check. GitHub Status: ${updateErr.status}`;
              logger.error(`[GitHubReporter] ${errorMsg}`);
              throw new Error(errorMsg);
            }
          }
        }

        // If we found checks but failed to update any of them, and this IS NOT an override, 
        // then we fallback to creating a new one. For overrides, we already threw an error above.
        if (updateCount === 0 && decisionState !== "OVERRIDDEN_PASS") {
          logger.log(`[GitHubReporter] No checks were updated. Creating new check run as fallback.`);
          const createParams = {
            owner,
            repo,
            name: this.CHECK_NAME,
            head_sha: headSha,
            status,
            output: {
              title,
              summary,
              text
            }
          };
          if (status === "completed") createParams.conclusion = conclusion;
          const { data: newCheck } = await this.octokit.rest.checks.create(createParams);
          checkRunId = newCheck.id;
        }
      } else {
        // No existing checks found for this SHA, create a new one
        logger.log(`[GitHubReporter] No existing check runs found for SHA ${headSha.substring(0, 7)}. Creating new check run...`);
        const createParams = {
          owner,
          repo,
          name: this.CHECK_NAME,
          head_sha: headSha,
          status,
          output: {
            title,
            summary,
            text
          }
        };
        if (status === "completed") createParams.conclusion = conclusion;
        
        const { data: createdCheck } = await this.octokit.rest.checks.create(createParams);
        checkRunId = createdCheck.id;
        logger.log(`[GitHubReporter] Created fresh check run ${checkRunId} for ${headSha}`);
      }
    } catch (checkErr) {
      logger.error("[GitHubReporter] Check Runs API failed:", checkErr.response?.data || checkErr.message);
      // Re-throw so the controller knows it failed
      throw checkErr;
    }

    // 2. Commit Status API (Disabled)
    // Removed to prevent duplicate entries (one CheckRun, one CommitStatus) with same name on PR.
    // CheckRuns are the modern standard and are what the user has configured in branch protection.

    return checkRunId;
  }
}
