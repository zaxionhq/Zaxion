// backend/src/services/admin.service.js
import { Octokit } from "@octokit/rest";
import { initDb } from "../models/index.js";
import { listPulls } from "./github.service.js";
import * as logger from "../utils/logger.js";
import env from "../config/env.js";

export class AdminService {
  constructor() {
    // We'll lazy-load PrAnalysisService to break circular dependency
    this.prAnalysisService = null;
  }

  async getPrAnalysisService() {
    if (!this.prAnalysisService) {
      const { PrAnalysisService } = await import("./prAnalysis.service.js");
      this.prAnalysisService = new PrAnalysisService();
    }
    return this.prAnalysisService;
  }

  /**
   * Parse a GitHub repository URL into owner and repo.
   * Supports:
   * - https://github.com/owner/repo
   * - http://github.com/owner/repo
   * - github.com/owner/repo
   * - owner/repo
   */
  parseRepoUrl(url) {
    if (!url) return null;
    
    // Remove protocol and host if present
    let cleanUrl = url.replace(/^(https?:\/\/)?(www\.)?github\.com\//i, "");
    
    // Remove trailing .git or slashes
    cleanUrl = cleanUrl.replace(/\.git$/i, "").replace(/\/+$/, "");
    
    const parts = cleanUrl.split("/");
    if (parts.length < 2) return null;
    
    return {
      owner: parts[0],
      repo: parts[1]
    };
  }

  /**
   * Perform bulk PR analysis for a repository with specific policies.
   * @param {string} repoUrl - The GitHub repo URL
   * @param {number} prCount - Number of recent PRs to analyze
   * @param {string[]} policyIds - Array of policy IDs to apply (empty for all)
   * @param {string} token - The Founder's GitHub token (or system PAT)
   */
  async analyzeRepoPrs(repoUrl, prCount, policyIds, token) {
    const repoContext = this.parseRepoUrl(repoUrl);
    if (!repoContext) {
      throw new Error("Invalid GitHub repository URL.");
    }

    const { owner, repo } = repoContext;
    logger.log(`[AdminService] Starting bulk analysis for ${owner}/${repo} (Count: ${prCount})`);

    // 1. Fetch recent PRs
    // We use listPulls from github.service.js
    const prs = await listPulls(token, owner, repo, { state: 'all', per_page: prCount });
    
    if (!prs || prs.length === 0) {
      return {
        message: `No Pull Requests found for ${owner}/${repo}.`,
        results: []
      };
    }

    const db = await initDb();
    const results = [];

    // 2. Iterate and analyze each PR
    // For bulk analysis, we bypass the standard queue and execute directly
    for (const pr of prs) {
      try {
        logger.log(`[AdminService] Analyzing PR #${pr.number} (${pr.head.sha})`);
        
        // We need to pass the custom policyIds to the evaluation engine
        // This requires a small modification to PrAnalysisService.execute or similar
        // For now, let's capture the intent:
        const analysisData = {
          owner,
          repo,
          prNumber: pr.number,
          headSha: pr.head.sha,
          baseRef: pr.base.ref,
          headRef: pr.head.ref,
          installationId: null, // We'll use the token provided
          customToken: token,
          customPolicies: policyIds // This will be used in the engine
        };

        // We'll perform the analysis. 
        // Note: PrAnalysisService is designed for single PRs. 
        // We'll return the decision object for each.
        const result = await this.executeAnalysis(analysisData, db);
        results.push({
          prNumber: pr.number,
          title: pr.title,
          url: pr.html_url,
          status: result.decision,
          reason: result.reason,
          violations: result.violations || []
        });
      } catch (err) {
        logger.error(`[AdminService] Failed to analyze PR #${pr.number}:`, err);
        results.push({
          prNumber: pr.number,
          title: pr.title,
          url: pr.html_url,
          status: 'ERROR',
          reason: err.message
        });
      }
    }

    return {
      owner,
      repo,
      totalAnalyzed: results.length,
      results
    };
  }

  /**
   * Internal helper to execute analysis with custom policy injection
   */
  async executeAnalysis(data, db) {
    // This is a specialized version of PrAnalysisService.execute 
    // that supports custom policies and direct token usage.
    const { owner, repo, prNumber, headSha, customToken, customPolicies } = data;
    
    // We'll manually instantiate the services to avoid side effects in the main service
    const { DiffAnalyzerService } = await import("./diffAnalyzer.service.js");
    const { PolicyEngineService } = await import("./policyEngine.service.js");
    const { AdvisorService } = await import("./advisor.service.js");
    const { LlmService } = await import("./llm.service.js");

    const octokit = new Octokit({ auth: customToken });
    const diffAnalyzer = new DiffAnalyzerService(customToken);
    const policyEngine = new PolicyEngineService(octokit, db);
    const advisor = new AdvisorService(new LlmService());

    // 1. Extract Facts
    const prContext = await diffAnalyzer.analyze(owner, repo, prNumber);
    
    // 2. Fetch PR Metadata
    const { data: prData } = await octokit.pulls.get({ owner, repo, pull_number: prNumber });
    const metadata = {
      owner,
      repo,
      prNumber,
      baseBranch: prData.base.ref,
      prBody: prData.body,
      userLogin: prData.user.login
    };

    // 3. Evaluate with Policy Injection
    // If customPolicies is provided, we'll filter the core policies
    const decision = await policyEngine.evaluate(prContext, metadata);
    
    // If customPolicies was specified, we filter the violations/results
    if (customPolicies && customPolicies.length > 0) {
      decision.violations = decision.violations.filter(v => customPolicies.includes(v.rule_id));
      // Re-evaluate the overall decision if it was BLOCKED by a policy NOT in the custom list
      if (decision.decision === 'BLOCKED' && decision.violations.length === 0) {
        decision.decision = 'PASSED';
        decision.reason = 'All selected policies passed.';
      }
    }

    return decision;
  }
}
