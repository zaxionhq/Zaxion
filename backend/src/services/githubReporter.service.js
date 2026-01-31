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
   * @param {object} metadata - Extra context (prNumber, etc)
   */
  async reportStatus(owner, repo, headSha, decisionObject, metadata = {}) {
    const decisionState = typeof decisionObject === 'string' ? decisionObject : decisionObject.decision;
    const description = typeof decisionObject === 'string' ? metadata.description || "" : decisionObject.decisionReason;
    const prNumber = metadata.prNumber || decisionObject.prNumber;

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
    let summary = description;
    let text = "";

    if (typeof decisionObject === 'object') {
      const frontendUrl = process.env.FRONTEND_URL || "https://git-code-guru.app";
      // Deep link to Decision Resolution Console
      const deepLink = `${frontendUrl}/pr/${owner}/${repo}/${prNumber}`;
      
      summary = `### ${title}\n${description}\n\n[🔍 Fix with Zaxion](${deepLink})`;

      // Build detailed policy breakdown
      text = `## 🛡️ Zaxion Policy Evaluation Report\n`;
      text += `**Policy Version:** \`${decisionObject.policy_version || 'unknown'}\`\n`;
      text += `**Decision:** ${decisionState}\n`;
      text += `**Timestamp:** ${new Date().toISOString()}\n\n`;

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

      text += `---\n*This report was generated automatically by Zaxion-PR GATE. Decisions are deterministic and based on project-defined policies.*`;
    }

    try {
      // 1. Check if a Check Run already exists
      const { data: { check_runs } } = await this.octokit.checks.listForRef({
        owner,
        repo,
        ref: headSha,
        check_name: this.CHECK_NAME
      });

      const existingCheck = check_runs.find(cr => cr.name === this.CHECK_NAME);

      if (existingCheck) {
        const updateParams = {
          owner,
          repo,
          check_run_id: existingCheck.id,
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

        await this.octokit.checks.update(updateParams);
      } else {
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

        await this.octokit.checks.create(createParams);
      }
    } catch (error) {
      console.error("[GitHubReporter] Failed to report status:", error);
    }
  }
}
