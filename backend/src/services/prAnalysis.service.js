import sequelize from "../config/sequelize.js";
import { Octokit } from "@octokit/rest";
import { DiffAnalyzerService } from "./diffAnalyzer.service.js";
import { PolicyEngineService } from "./policyEngine.service.js";
import { GitHubReporterService } from "./githubReporter.service.js";
import githubAppService from "./githubApp.service.js";
import env from "../config/env.js";

export class PrAnalysisService {
  /**
   * Core logic: Analyze a PR and save/report decision
   * @param {Object} data - { owner, repo, prNumber, headSha, baseRef, headRef, installationId }
   */
  async execute(data) {
    const { owner, repo, prNumber, headSha, baseRef, installationId } = data;
    const traceId = `${installationId || 'PAT'}:${headSha}`;
    console.log(`[PrAnalysisService] [trace:${traceId}] pr: #${prNumber} action: START_ANALYSIS`);

    // 0. Step 0: Authentication (GitHub App or PAT)
    const token = await githubAppService.getInstallationAccessToken(installationId);
    const octokit = new Octokit({ auth: token });
    
    // Initialize sub-services with the dynamic token/octokit
    const diffAnalyzer = new DiffAnalyzerService(token);
    const policyEngine = new PolicyEngineService(octokit);
    const reporter = new GitHubReporterService(octokit);

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
        // Hard Lock: If we already have a FINAL decision, never allow a re-evaluation
        // This prevents "policy drift" if the engine version changed since the first analysis.
        if (existingDecision.decision !== 'PENDING') {
          console.log(`[PrAnalysisService] [trace:${traceId}] action: IDEMPOTENT_HIT status: FINAL version: ${existingDecision.policy_version}`);
          await reporter.reportStatus(owner, repo, headSha, existingDecision.decision, existingDecision.reason);
          await t.commit();
          return;
        }
        
        // If it was stuck in PENDING, we can continue to re-evaluate it once.
        console.log(`[PrAnalysisService] [trace:${traceId}] action: RECOVERING_STUCK_PENDING`);
      }

      // 2. Step 2: Initialize State (PENDING)
      if (!existingDecision) {
        try {
          await sequelize.query(
            `INSERT INTO pr_decisions (repo_owner, repo_name, pr_number, commit_sha, policy_version, decision, reason, raw_data, started_at)
             VALUES (:owner, :repo, :prNumber, :headSha, :policyVersion, 'PENDING', 'Queued for analysis...', '{}', NOW())`,
            {
              replacements: { 
                owner, 
                repo, 
                prNumber, 
                headSha, 
                policyVersion: policyEngine.VERSION
              },
              type: sequelize.QueryTypes.INSERT,
              transaction: t
            }
          );
        } catch (insertError) {
          // If a race condition occurred and another worker inserted the row, catch the unique constraint violation
          if (insertError.name === 'SequelizeUniqueConstraintError' || insertError.parent?.code === '23505') {
            console.log(`[PrAnalysisService] [trace:${traceId}] action: INSERT_RACE_DETECTED recovering...`);
            // The row now exists, so we re-fetch it outside the catch block by letting the code proceed
          } else {
            throw insertError;
          }
        }
      }
      await t.commit();

      // If we had a race condition or just inserted, re-verify the state
      const [finalExistingDecision] = await sequelize.query(
        `SELECT * FROM pr_decisions WHERE repo_owner = :owner AND repo_name = :repo AND pr_number = :prNumber AND commit_sha = :headSha LIMIT 1`,
        {
          replacements: { owner, repo, prNumber, headSha },
          type: sequelize.QueryTypes.SELECT
        }
      );

      if (finalExistingDecision && finalExistingDecision.decision !== 'PENDING') {
        console.log(`[PrAnalysisService] [trace:${traceId}] action: POST_RACE_IDEMPOTENT_HIT status: FINAL version: ${finalExistingDecision.policy_version}`);
        await reporter.reportStatus(owner, repo, headSha, finalExistingDecision.decision, finalExistingDecision.reason);
        return;
      }

      // Report PENDING to GitHub
      await reporter.reportStatus(owner, repo, headSha, "PENDING", "Queued for analysis...");

      // 3. Step 3: Execution Pipeline
      // A. Fetch & Analyze Diff
      const prContext = await diffAnalyzer.analyze(owner, repo, prNumber);

      // B. Evaluate Policy
      const { data: prDetails } = await octokit.pulls.get({ owner, repo, pull_number: prNumber });
      
      const decisionObject = await policyEngine.evaluate(prContext, {
        owner,
        repo,
        prNumber,
        baseBranch: baseRef,
        prBody: prDetails.body || "",
        userLogin: prDetails.user.login
      });

      // C. Update DB with Final Decision
      // We only update if the decision is still the one we initialized or if we are finishing a PENDING one.
      const [, affectedRows] = await sequelize.query(
        `UPDATE pr_decisions 
         SET decision = :decision, reason = :reason, raw_data = :rawData, updated_at = NOW()
         WHERE repo_owner = :owner AND repo_name = :repo AND pr_number = :prNumber AND commit_sha = :headSha
         AND policy_version = :policyVersion`, // HARD LOCK: Never update if policy_version changed mid-flight
        {
          replacements: {
            decision: decisionObject.decision,
            reason: decisionObject.reason,
            rawData: JSON.stringify(decisionObject.raw_data),
            policyVersion: decisionObject.policy_version,
            owner,
            repo,
            prNumber,
            headSha
          },
          type: sequelize.QueryTypes.UPDATE
        }
      );

      // FATAL SIGNAL: If no rows were updated, it means the policy version changed while we were analyzing.
      // This is an "Elite Level" safety check to detect version drift/races.
      if (affectedRows === 0) {
        // Fetch current DB state for detailed logging
        const [currentRecord] = await sequelize.query(
          `SELECT policy_version FROM pr_decisions WHERE repo_owner = :owner AND repo_name = :repo AND pr_number = :prNumber AND commit_sha = :headSha LIMIT 1`,
          { replacements: { owner, repo, prNumber, headSha }, type: sequelize.QueryTypes.SELECT }
        );

        const errorMsg = `POLICY_VERSION_RACE_DETECTED: Decision for SHA ${headSha} rejected. Expected version: ${decisionObject.policy_version}. Actual DB version: ${currentRecord?.policy_version || 'NOT_FOUND'}.`;
        console.error(`[PrAnalysisService] [trace:${traceId}] ${errorMsg}`);
        
        const raceError = new Error(errorMsg);
        raceError.code = 'POLICY_VERSION_RACE';
        throw raceError;
      }

      // D. Report Final Status to GitHub
      await reporter.reportStatus(owner, repo, headSha, decisionObject.decision, decisionObject.reason);
      
      console.log(`[PrAnalysisService] [trace:${traceId}] pr: #${prNumber} action: COMPLETED_ANALYSIS decision: ${decisionObject.decision}`);

    } catch (error) {
      console.error(`[PrAnalysisService] Failed: ${error.message}`);
      
      // Fail-Closed Logic
      try {
        if (reporter) {
          if (error.code === 'POLICY_VERSION_RACE') {
            // Internal policy races are not the developer's fault. 
            // We report ERROR/NEUTRAL instead of BLOCK to avoid annoying teams.
            await reporter.reportStatus(owner, repo, headSha, "WARN", "System Error: Policy version drift detected. Please re-trigger analysis.");
          } else {
            // Fail-Closed: For unknown errors, we BLOCK for safety
            await reporter.reportStatus(owner, repo, headSha, "BLOCK", "System Error: Analysis failed. Blocking for safety.");
          }
        }
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
