/**
 * GitHub Check Run Reporter
 * Updates the PR UI on GitHub using the Checks API.
 */
export class GitHubReporterService {
  constructor(octokit) {
    this.octokit = octokit;
    this.CHECK_NAME = "git-code-guru/pr-gate";
  }

  /**
   * Report status to GitHub Checks API
   * @param {string} owner 
   * @param {string} repo 
   * @param {string} headSha 
   * @param {string} decisionState - PENDING, PASS, BLOCK, WARN, OVERRIDDEN_PASS
   * @param {string} description - Summary text
   * @param {object} details - Optional detailed markdown output
   */
  async reportStatus(owner, repo, headSha, decisionState, description, details = "") {
    let status = "completed";
    let conclusion = "neutral";
    let title = "Gateway Analysis";
    
    // State Mapping
    switch (decisionState) {
      case "PENDING":
        status = "in_progress";
        conclusion = null; // Conclusion is null when in_progress
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
        conclusion = "failure"; // Fail closed on unknown state
        title = "System Error";
        description = "Unknown decision state.";
    }

    try {
      // 1. Check if a Check Run already exists for this SHA and name
      const { data: { check_runs } } = await this.octokit.checks.listForRef({
        owner,
        repo,
        ref: headSha,
        check_name: this.CHECK_NAME
      });

      const existingCheck = check_runs.find(cr => cr.name === this.CHECK_NAME);

      if (existingCheck) {
        // Update existing check
        const updateParams = {
          owner,
          repo,
          check_run_id: existingCheck.id,
          status,
          output: {
            title,
            summary: description,
            text: details
          }
        };

        // GitHub forbids 'conclusion' when status is not 'completed'
        if (status === "completed") {
          updateParams.conclusion = conclusion;
        }

        await this.octokit.checks.update(updateParams);
        console.log(`[GitHubReporter] Updated check ${existingCheck.id} to ${decisionState} for ${owner}/${repo}`);
      } else {
        // Create new check
        const createParams = {
          owner,
          repo,
          name: this.CHECK_NAME,
          head_sha: headSha,
          status,
          output: {
            title,
            summary: description,
            text: details
          }
        };

        // Only add conclusion if we are starting in a completed state (rare but possible)
        if (status === "completed") {
          createParams.conclusion = conclusion;
        }

        await this.octokit.checks.create(createParams);
        console.log(`[GitHubReporter] Created new check for ${owner}/${repo} SHA:${headSha.substring(0, 7)}`);
      }
    } catch (error) {
      console.error("[GitHubReporter] Failed to report status:", error);
      throw error; // Propagate error so worker can handle fail-closed if needed
    }
  }
}
