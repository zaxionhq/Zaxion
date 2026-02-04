/**
 * GitHub Check Run Reporter
 * Updates the PR UI on GitHub using the Checks API.
 */
export class GitHubReporterService {
  constructor(octokit) {
    this.octokit = octokit;
    this.CHECK_NAME = "Zaxion/pr-gate";
  }

  /**
   * Report status to GitHub Checks API with rich intelligence
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
    
    // State Mapping
    switch (decisionState) {
      case "PENDING":
        status = "in_progress";
        conclusion = null;
        title = "Analyzing Risk...";
        break;
      case "BLOCK":
        status = "completed";
        conclusion = "failure";
        title = "Gateway Blocked";
        break;
      case "PASS":
        status = "completed";
        conclusion = "success";
        title = "Gateway Passed";
        break;
      case "WARN":
        status = "completed";
        conclusion = "neutral";
        title = "Gateway Warning";
        break;
      case "OVERRIDDEN_PASS":
        status = "completed";
        conclusion = "success";
        title = "⚠️ Bypass Authorized";
        break;
      default:
        status = "completed";
        conclusion = "failure";
        title = "System Error";
    }

    // 0. Build Rich Markdown Output (Step 3: Enriched Reporting)
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8080";
    const deepLink = `${frontendUrl}/pr/${owner}/${repo}/${prNumber}`;
    
    let summary = description;
    let text = `## 🛡️ Zaxion Policy Evaluation Report\n`;
    text += `**Decision:** ${decisionState}\n`;
    text += `**Timestamp:** ${new Date().toISOString()}\n\n`;

    if (typeof decisionObject === 'object' && decisionObject !== null && decisionObject.decision) {
      summary = `### ${title}\n${description}\n\n[🔍 Fix with Zaxion](${deepLink})`;
      
      text += `**Policy Version:** \`${decisionObject.policy_version || 'unknown'}\`\n`;

      if (decisionObject.facts) {
        text += `### 📊 Facts Observed\n`;
        text += `- **Total Changes:** ${decisionObject.facts.totalChanges || 0} files\n`;
        text += `- **High Risk Changes:** ${decisionObject.facts.hasCriticalChanges ? '✅ Yes' : '❌ No'}\n`;
        text += `- **Tests Added:** ${decisionObject.facts.testFilesAdded || 0}\n\n`;
      }

      if (decisionObject.advisor && decisionObject.advisor.status !== "ERROR") {
        text += `### 💡 Zaxion Advisor Insights (Non-Gating)\n`;
        text += `> ${decisionObject.advisor.rationale}\n\n`;
        
        if (decisionObject.advisor.suggestedTestIntents?.length > 0) {
          text += `**Suggested Test Intents:**\n`;
          decisionObject.advisor.suggestedTestIntents.forEach(intent => {
            text += `- [ ] **${intent.file}**: ${intent.intent}\n`;
          });
          text += `\n`;
        }
      }
    } else {
      // Handle string-only decisions (like OVERRIDDEN_PASS) or partial objects
      summary = `### ${title}\n${description}\n\n[📋 View Audit Log](${deepLink})`;
      text += `> ${description}\n\n`;
      text += `*This decision was manually authorized by an administrator and recorded in the Zaxion Governance ledger.*\n`;
      
      if (metadata.overridden_at) {
        text += `**Authorized At:** ${metadata.overridden_at}\n`;
      }
      if (metadata.override_by) {
        text += `**Authorized By:** ${metadata.override_by}\n`;
      }
    }

    text += `---\n*This report was generated automatically by Zaxion-PR GATE. Decisions are deterministic and based on project-defined policies.*`;

    let checkRunId = explicitCheckRunId;

    // 1. Check Runs API
    try {
      let checkRunsToUpdate = [];
      
      if (explicitCheckRunId) {
        checkRunsToUpdate.push({ id: explicitCheckRunId });
      } else {
        // Find ALL check runs with the same name to avoid "Ghost Checks" blocking the PR
        const { data: { check_runs } } = await this.octokit.rest.checks.listForRef({
          owner,
          repo,
          ref: headSha,
          check_name: this.CHECK_NAME
        });
        checkRunsToUpdate = check_runs.filter(cr => cr.name === this.CHECK_NAME);
      }

      if (checkRunsToUpdate.length > 0) {
        console.log(`[GitHubReporter] Found ${checkRunsToUpdate.length} check runs to update for ${this.CHECK_NAME}`);
        
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
            const { data: updatedCheck } = await this.octokit.rest.checks.update(updateParams);
            checkRunId = updatedCheck.id;
            updateCount++;
            console.log(`[GitHubReporter] Successfully updated check run ${check.id} to ${conclusion}`);
          } catch (updateErr) {
            console.warn(`[GitHubReporter] Failed to update check run ${check.id} (status: ${updateErr.status}).`);
          }
        }

        // If we found checks but failed to update any of them, or if we need a fresh one
        if (updateCount === 0) {
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
          console.log(`[GitHubReporter] Created new check run ${checkRunId} as fallback.`);
        }
      } else {
        // No existing check runs found, create a new one
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

        if (status === "completed") {
          createParams.conclusion = conclusion;
        }

        const { data: newCheck } = await this.octokit.rest.checks.create(createParams);
        checkRunId = newCheck.id;
        console.log(`[GitHubReporter] Created new check run for ${headSha.substring(0, 7)}: ${conclusion}`);
      }
    } catch (error) {
      console.error("[GitHubReporter] Failed to report Check Run status:", error.message);
    }

    // 2. Commit Status API (Disabled)
    // Removed to prevent duplicate entries (one CheckRun, one CommitStatus) with same name on PR.
    // CheckRuns are the modern standard and are what the user has configured in branch protection.

    return checkRunId;
  }
}
