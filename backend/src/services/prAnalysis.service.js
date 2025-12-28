import sequelize from "../config/sequelize.js";
import { Octokit } from "@octokit/rest";
import { DiffAnalyzerService } from "./diffAnalyzer.service.js";
import { PolicyEngineService } from "./policyEngine.service.js";
import { GitHubReporterService } from "./githubReporter.service.js";
import env from "../config/env.js";

export class PrAnalysisService {
  constructor() {
    const githubToken = env.get("GITHUB_TOKEN");
    this.octokit = new Octokit({ auth: githubToken });
    this.diffAnalyzer = new DiffAnalyzerService(githubToken);
    this.policyEngine = new PolicyEngineService(this.octokit);
    this.reporter = new GitHubReporterService(this.octokit);
  }

  /**
   * Core logic: Analyze a PR and save/report decision
   * @param {Object} data - { owner, repo, prNumber, headSha, baseRef, headRef, installationId }
   */
  async execute(data) {
    const { owner, repo, prNumber, headSha, baseRef } = data;
    console.log(`[PrAnalysisService] Executing analysis for ${owner}/${repo} PR #${prNumber}`);

    // Transaction for DB operations
    // Note: We use a transaction for the initial check/insert to prevent race conditions
    const t = await sequelize.transaction();

    try {
      // 1. Step 1: Idempotency (The Healing Layer)
      const [existingDecision] = await sequelize.query(
        `SELECT * FROM pr_decisions WHERE repo_owner = :owner AND repo_name = :repo AND pr_number = :prNumber AND commit_sha = :headSha LIMIT 1`,
        {
          replacements: { owner, repo, prNumber, headSha },
          type: sequelize.QueryTypes.SELECT,
          transaction: t
        }
      );

      if (existingDecision) {
        console.log(`[PrAnalysisService] Idempotent hit for ${headSha}. Re-reporting status.`);
        await this.reporter.reportStatus(owner, repo, headSha, existingDecision.decision, existingDecision.reason);
        await t.commit();
        return;
      }

      // 2. Step 2: Initialize State (PENDING)
      await sequelize.query(
        `INSERT INTO pr_decisions (repo_owner, repo_name, pr_number, commit_sha, policy_version, decision, reason, raw_data)
         VALUES (:owner, :repo, :prNumber, :headSha, 'v1.0.0', 'PENDING', 'Queued for analysis...', '{}')`,
        {
          replacements: { owner, repo, prNumber, headSha },
          type: sequelize.QueryTypes.INSERT,
          transaction: t
        }
      );
      await t.commit();

      // Report PENDING to GitHub
      await this.reporter.reportStatus(owner, repo, headSha, "PENDING", "Queued for analysis...");

      // 3. Step 3: Execution Pipeline
      // A. Fetch & Analyze Diff
      const prContext = await this.diffAnalyzer.analyze(owner, repo, prNumber);

      // B. Evaluate Policy
      const { data: prDetails } = await this.octokit.pulls.get({ owner, repo, pull_number: prNumber });
      
      const decisionObject = await this.policyEngine.evaluate(prContext, {
        owner,
        repo,
        prNumber,
        baseBranch: baseRef,
        prBody: prDetails.body || "",
        userLogin: prDetails.user.login
      });

      // C. Update DB with Final Decision
      await sequelize.query(
        `UPDATE pr_decisions 
         SET decision = :decision, reason = :reason, raw_data = :rawData, updated_at = NOW()
         WHERE repo_owner = :owner AND repo_name = :repo AND pr_number = :prNumber AND commit_sha = :headSha`,
        {
          replacements: {
            decision: decisionObject.decision,
            reason: decisionObject.reason,
            rawData: JSON.stringify(decisionObject.raw_data),
            owner,
            repo,
            prNumber,
            headSha
          },
          type: sequelize.QueryTypes.UPDATE
        }
      );

      // D. Report Final Status to GitHub
      await this.reporter.reportStatus(owner, repo, headSha, decisionObject.decision, decisionObject.reason);
      
      console.log(`[PrAnalysisService] Completed analysis: ${decisionObject.decision}`);

    } catch (error) {
      console.error(`[PrAnalysisService] Failed: ${error.message}`);
      
      // Fail-Closed: If system fails, we BLOCK the PR to be safe
      try {
        await this.reporter.reportStatus(owner, repo, headSha, "BLOCK", "System Error: Analysis failed. Blocking for safety.");
      } catch (e) {
        console.error("Failed to report error status:", e.message);
      }
      
      // Rollback transaction if still active
      if (!t.finished) {
        await t.rollback();
      }
      throw error;
    }
  }
}
