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
          error_details: {
            name: err.name,
            message: err.message,
            stack: err.stack,
            code: err.code // If it's a custom error with a code
          },
          violations: []
        });
      }
    }

    // 3. Generate Deep Audit Summary
    const passedCount = results.filter(r => r.status === 'PASSED' || r.status === 'PASS').length;
    const blockedCount = results.filter(r => r.status === 'BLOCKED' || r.status === 'BLOCK').length;
    const warnCount = results.filter(r => r.status === 'WARNED' || r.status === 'WARN').length;
    const criticalCount = results.reduce((acc, r) => acc + (r.violations?.filter(v => v.severity === 'CRITICAL' || v.severity === 'HIGH' || v.severity === 'BLOCK').length || 0), 0);
    const autoPatchableCount = results.filter(r => r.isAutoPatchable).length;
    
    // Severity distribution for the summary
    const violationsBySeverity = {
      BLOCK: results.reduce((acc, r) => acc + (r.violations?.filter(v => v.severity === 'BLOCK' || v.severity === 'CRITICAL' || v.severity === 'HIGH').length || 0), 0),
      WARN: results.reduce((acc, r) => acc + (r.violations?.filter(v => v.severity === 'WARN').length || 0), 0),
      OBSERVE: results.reduce((acc, r) => acc + (r.violations?.filter(v => v.severity === 'OBSERVE' || v.severity === 'INFO').length || 0), 0),
    };
    const totalViolations = violationsBySeverity.BLOCK + violationsBySeverity.WARN + violationsBySeverity.OBSERVE;

    const score = Math.round((passedCount / results.length) * 100);
    let grade = 'F';
    if (score >= 90) grade = 'A';
    else if (score >= 80) grade = 'B';
    else if (score >= 70) grade = 'C';
    else if (score >= 60) grade = 'D';

    // 4. Generate Strategic Insights
    const riskAssessment = this.generateRiskAssessment(results, violationsBySeverity);
    const recommendations = this.getStrategicRecommendations(results, violationsBySeverity);

    return {
      owner,
      repo,
      totalAnalyzed: results.length,
      results,
      summary: {
        total_scanned: results.length,
        passed: passedCount,
        blocked: blockedCount,
        warned: warnCount,
        critical: criticalCount,
        autoPatchable: autoPatchableCount,
        score,
        grade,
        auditDate: new Date().toISOString(),
        violations_by_severity: violationsBySeverity,
        total_violations: totalViolations,
        blast_radius: (blockedCount / results.length), // Ratio of blocked to total
        risk_assessment: riskAssessment,
        recommendations: recommendations
      }
    };
  }

  /**
   * Generates a high-level risk assessment based on audit findings.
   */
  generateRiskAssessment(results, severityMap) {
    const total = results.length;
    const blockRate = severityMap.BLOCK / total;
    
    let level = 'LOW';
    let impact = 'Minimal impact on development velocity and security posture.';
    
    if (blockRate > 0.5 || severityMap.BLOCK > 10) {
      level = 'CRITICAL';
      impact = 'Systemic governance failure detected. High probability of security vulnerabilities and architectural drift.';
    } else if (blockRate > 0.2 || severityMap.BLOCK > 3) {
      level = 'HIGH';
      impact = 'Significant policy violations detected. Core modules are at risk of technical debt and security gaps.';
    } else if (severityMap.WARN > 5) {
      level = 'MODERATE';
      impact = 'Multiple non-blocking violations detected. Code quality is degrading over time.';
    }

    return { level, impact };
  }

  /**
   * Generates actionable strategic recommendations for leadership.
   */
  getStrategicRecommendations(results, severityMap) {
    const recs = [];
    
    if (severityMap.BLOCK > 0) {
      recs.push({
        priority: 'IMMEDIATE',
        action: 'Mandatory Policy Enforcement',
        detail: `Resolve ${severityMap.BLOCK} blocking violations in active PRs before merging to production.`
      });
    }

    // Check for specific common violations
    const allViolations = results.flatMap(r => r.violations || []);
    const hasSecrets = allViolations.some(v => v.rule_id === 'no_hardcoded_secrets');
    const hasArch = allViolations.some(v => v.rule_id === 'architectural_integrity');

    if (hasSecrets) {
      recs.push({
        priority: 'HIGH',
        action: 'Secrets Rotation & Manager Implementation',
        detail: 'Secrets detected in PR history. Rotate compromised tokens and migrate to a dedicated Secrets Manager (e.g., Vault, AWS Secrets Manager).'
      });
    }

    if (hasArch) {
      recs.push({
        priority: 'MEDIUM',
        action: 'Architecture Review',
        detail: 'Layer violations detected. Schedule an architecture review to align service boundaries and prevent circular dependencies.'
      });
    }

    if (recs.length === 0) {
      recs.push({
        priority: 'LOW',
        action: 'Continuous Monitoring',
        detail: 'Codebase is currently healthy. Continue using Zaxion to maintain governance standards.'
      });
    }

    return recs;
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
    const violations = (result.violations || []).map(v => ({
      rule_id: v.rule_id,
      explanation: v.message || v.explanation,
      file: v.file,
      line: v.line,
      severity: v.severity,
      current_value: v.actual,
      required_value: v.expected,
      remediation: v.remediation,
      code_context: v.code || v.context
    }));

    // Deterministic auto-patchable flag (if violation type is easily fixable)
    const patchableRuleIds = ['SECRET_EXPOSURE', 'MAGIC_NUMBER', 'HARDCODED_URL', 'CONSOLE_LOG'];
    const isAutoPatchable = violations.some(v => patchableRuleIds.includes(v.rule_id));

    return {
      prNumber,
      title: prData.title,
      url: prData.html_url,
      author: prData.user.login,
      avatarUrl: prData.user.avatar_url,
      baseBranch: prData.base.ref,
      headBranch: prData.head.ref,
      createdAt: prData.created_at,
      status: result.decision,
      reason: result.decisionReason || result.reason,
      violations,
      passes: (result.passes || []).map(p => ({
        rule_id: p.rule_id,
        message: p.message
      })),
      isAutoPatchable
    };
  }
}
