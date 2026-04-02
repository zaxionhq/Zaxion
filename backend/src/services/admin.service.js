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
    let prs = [];
    try {
      prs = await listPulls(token, owner, repo, { state: 'all', per_page: prCount });
    } catch (err) {
      logger.error(`[AdminService] Failed to fetch PRs for ${owner}/${repo}:`, err.message);
      throw new Error(`Failed to fetch PRs from GitHub: ${err.message}`);
    }
    
    if (!prs || prs.length === 0) {
      return {
        owner,
        repo,
        message: `No Pull Requests found for ${owner}/${repo}.`,
        totalAnalyzed: 0,
        results: [],
        summary: { score: 'N/A', grade: '?' }
      };
    }

    const db = await initDb();
    const results = [];

    // 2. Iterate and analyze each PR
    for (const pr of prs) {
      try {
        logger.log(`[AdminService] Analyzing PR #${pr.number} (${pr.head.sha})`);
        
        const analysisData = {
          owner,
          repo,
          prNumber: pr.number,
          headSha: pr.head.sha,
          baseRef: pr.base.ref,
          headRef: pr.head.ref,
          installationId: null,
          customToken: token,
          customPolicies: policyIds
        };

        const analysisResult = await this.executeAnalysis(analysisData, db);
        results.push(analysisResult);
      } catch (err) {
        logger.error(`[AdminService] Failed to analyze PR #${pr.number}:`, err);
        results.push({
          prNumber: pr.number,
          title: pr.title,
          url: pr.html_url,
          status: 'ERROR',
          reason: err.message,
          violations: []
        });
      }
    }

    // 3. Generate Deep Audit Summary
    const passedCount = results.filter(r => r.status === 'PASSED').length;
    const blockedCount = results.filter(r => r.status === 'BLOCKED').length;
    const warnCount = results.filter(r => r.status === 'WARNED').length;
    
    const score = Math.round((passedCount / results.length) * 100);
    let grade = 'F';
    if (score >= 90) grade = 'A';
    else if (score >= 80) grade = 'B';
    else if (score >= 70) grade = 'C';
    else if (score >= 60) grade = 'D';

    return {
      owner,
      repo,
      totalAnalyzed: results.length,
      results,
      summary: {
        passed: passedCount,
        blocked: blockedCount,
        warned: warnCount,
        score,
        grade,
        auditDate: new Date().toISOString()
      }
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
      userLogin: prData.user.login,
      enabledPolicyIds: customPolicies
    };

    // 3. Evaluate with Policy Injection
    const result = await policyEngine.evaluate(prContext, metadata);
    
    // 4. Transform to Frontend-friendly format
    return {
      prNumber,
      title: prData.title,
      url: prData.html_url,
      status: result.decision,
      reason: result.decisionReason || result.reason,
      violations: (result.violations || []).map(v => ({
        rule_id: v.rule_id,
        explanation: v.message || v.explanation,
        file: v.file,
        line: v.line
      }))
    };
  }
}
