// backend/src/services/admin.service.js
import { Octokit } from "@octokit/rest";
import { initDb } from "../models/index.js";
import { listPulls } from "./github.service.js";
import * as logger from "../utils/logger.js";

export const MAX_BULK_PRS = 50;

const PR_URL_REGEX = /github\.com[/:](\w[-.\w]*)\/([^/]+)\/pull\/(\d+)/i;

export class AdminService {
  constructor() {
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
   */
  parseRepoUrl(url) {
    if (!url) return null;

    let cleanUrl = url.replace(/^(https?:\/\/)?(www\.)?github\.com\//i, "");
    cleanUrl = cleanUrl.replace(/\.git$/i, "").replace(/\/+$/, "");

    const parts = cleanUrl.split("/").filter(Boolean);
    if (parts.length < 2) return null;

    return {
      owner: parts[0],
      repo: parts[1],
    };
  }

  /**
   * Parse a GitHub PR URL into owner, repo, and PR number.
   */
  parsePrUrl(url) {
    if (!url || typeof url !== "string") return null;
    const match = url.trim().match(PR_URL_REGEX);
    if (!match) return null;
    const [, owner, repo, prNumberStr] = match;
    return {
      owner,
      repo,
      number: parseInt(prNumberStr, 10),
    };
  }

  /**
   * Parse comma/space/newline-separated PR numbers.
   */
  parsePrNumbers(input) {
    if (!input) return [];
    if (Array.isArray(input)) {
      return [...new Set(input.map((n) => parseInt(String(n), 10)).filter((n) => Number.isFinite(n) && n > 0))];
    }
    const str = String(input);
    return [...new Set(
      str.split(/[\s,]+/)
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => Number.isFinite(n) && n > 0)
    )];
  }

  /**
   * Parse one or more PR URLs from string or array.
   */
  parsePrUrlsList(input) {
    const raw = Array.isArray(input) ? input : String(input || "").split(/\r?\n/);
    const parsed = [];
    const seen = new Set();

    for (const line of raw) {
      const trimmed = String(line).trim();
      if (!trimmed) continue;
      const pr = this.parsePrUrl(trimmed);
      if (!pr) continue;
      const key = `${pr.owner}/${pr.repo}#${pr.number}`;
      if (seen.has(key)) continue;
      seen.add(key);
      parsed.push(pr);
    }

    return parsed;
  }

  /**
   * Route bulk analysis by target mode.
   */
  async bulkAnalyze(options, token) {
    const {
      targetMode = "repository",
      repoUrl,
      prCount = 5,
      prNumbers = [],
      prUrls = [],
      policyIds = [],
    } = options;

    if (targetMode === "repository") {
      if (!repoUrl) throw new Error("Repository URL is required.");
      return this.analyzeRepoPrs(repoUrl, prCount, policyIds, token, { targetMode: "repository" });
    }

    if (targetMode === "repo_prs") {
      if (!repoUrl) throw new Error("Repository URL is required.");
      const numbers = this.parsePrNumbers(prNumbers);
      if (numbers.length === 0) throw new Error("At least one valid PR number is required.");
      return this.analyzeSpecificPrNumbers(repoUrl, numbers, policyIds, token);
    }

    if (targetMode === "pr_urls") {
      const parsed = this.parsePrUrlsList(prUrls);
      if (parsed.length === 0) throw new Error("At least one valid GitHub PR URL is required.");
      return this.analyzePrUrls(parsed, policyIds, token);
    }

    throw new Error(`Invalid targetMode: ${targetMode}`);
  }

  async analyzeRepoPrs(repoUrl, prCount, policyIds, token, meta = {}) {
    const repoContext = this.parseRepoUrl(repoUrl);
    if (!repoContext) {
      throw new Error("Invalid GitHub repository URL.");
    }

    const { owner, repo } = repoContext;
    const cappedCount = Math.min(Math.max(1, prCount), MAX_BULK_PRS);
    logger.log(`[AdminService] Starting bulk analysis for ${owner}/${repo} (Count: ${cappedCount})`);

    let prs = [];
    try {
      prs = await listPulls(token, owner, repo, { state: "all", per_page: cappedCount });
    } catch (err) {
      logger.error(`[AdminService] Failed to fetch PRs for ${owner}/${repo}:`, err.message);
      throw new Error(`Failed to fetch PRs from GitHub: ${err.message}`);
    }

    if (!prs || prs.length === 0) {
      return {
        owner,
        repo,
        targetMode: meta.targetMode || "repository",
        repos: [`${owner}/${repo}`],
        message: `No Pull Requests found for ${owner}/${repo}.`,
        totalAnalyzed: 0,
        results: [],
        summary: { score: "N/A", grade: "?" },
      };
    }

    return this.analyzePrList(prs.map((pr) => ({
      owner,
      repo,
      number: pr.number,
      title: pr.title,
      html_url: pr.html_url,
      headSha: pr.head.sha,
      baseRef: pr.base.ref,
      headRef: pr.head.ref,
    })), policyIds, token, {
      targetMode: meta.targetMode || "repository",
      displayOwner: owner,
      displayRepo: repo,
    });
  }

  async analyzeSpecificPrNumbers(repoUrl, prNumbers, policyIds, token) {
    const repoContext = this.parseRepoUrl(repoUrl);
    if (!repoContext) {
      throw new Error("Invalid GitHub repository URL.");
    }

    const { owner, repo } = repoContext;
    const numbers = this.parsePrNumbers(prNumbers).slice(0, MAX_BULK_PRS);
    if (numbers.length === 0) {
      throw new Error("At least one valid PR number is required.");
    }

    const octokit = new Octokit({ auth: token });
    const prEntries = [];

    for (const num of numbers) {
      try {
        const { data: pr } = await octokit.pulls.get({ owner, repo, pull_number: num });
        prEntries.push({
          owner,
          repo,
          number: pr.number,
          title: pr.title,
          html_url: pr.html_url,
          headSha: pr.head.sha,
          baseRef: pr.base.ref,
          headRef: pr.head.ref,
        });
      } catch (err) {
        logger.error(`[AdminService] Failed to fetch PR #${num} for ${owner}/${repo}:`, err.message);
        prEntries.push({
          owner,
          repo,
          number: num,
          title: `PR #${num}`,
          html_url: `https://github.com/${owner}/${repo}/pull/${num}`,
          error: err.message,
        });
      }
    }

    return this.analyzePrList(prEntries, policyIds, token, {
      targetMode: "repo_prs",
      displayOwner: owner,
      displayRepo: repo,
    });
  }

  async analyzePrUrls(parsedUrls, policyIds, token) {
    const capped = parsedUrls.slice(0, MAX_BULK_PRS);
    const octokit = new Octokit({ auth: token });
    const prEntries = [];

    for (const parsed of capped) {
      const { owner, repo, number } = parsed;
      try {
        const { data: pr } = await octokit.pulls.get({ owner, repo, pull_number: number });
        prEntries.push({
          owner,
          repo,
          number: pr.number,
          title: pr.title,
          html_url: pr.html_url,
          headSha: pr.head.sha,
          baseRef: pr.base.ref,
          headRef: pr.head.ref,
        });
      } catch (err) {
        logger.error(`[AdminService] Failed to fetch PR ${owner}/${repo}#${number}:`, err.message);
        prEntries.push({
          owner,
          repo,
          number,
          title: `PR #${number}`,
          html_url: `https://github.com/${owner}/${repo}/pull/${number}`,
          error: err.message,
        });
      }
    }

    const repos = [...new Set(prEntries.map((p) => `${p.owner}/${p.repo}`))];
    const isMultiRepo = repos.length > 1;
    const first = prEntries[0];

    return this.analyzePrList(prEntries, policyIds, token, {
      targetMode: "pr_urls",
      displayOwner: isMultiRepo ? "multi-repo" : first?.owner,
      displayRepo: isMultiRepo ? "various" : first?.repo,
      repos,
    });
  }

  async analyzePrList(prEntries, policyIds, token, meta = {}) {
    const db = await initDb();
    const results = [];

    for (const pr of prEntries) {
      if (pr.error) {
        results.push({
          prNumber: pr.number,
          title: pr.title,
          url: pr.html_url,
          status: "ERROR",
          reason: pr.error,
          violations: [],
        });
        continue;
      }

      try {
        logger.log(`[AdminService] Analyzing PR #${pr.number} (${pr.owner}/${pr.repo})`);

        const analysisData = {
          owner: pr.owner,
          repo: pr.repo,
          prNumber: pr.number,
          headSha: pr.headSha,
          baseRef: pr.baseRef,
          headRef: pr.headRef,
          installationId: null,
          customToken: token,
          customPolicies: policyIds,
        };

        const analysisResult = await this.executeAnalysis(analysisData, db);
        results.push(analysisResult);
      } catch (err) {
        logger.error(`[AdminService] Failed to analyze PR #${pr.number}:`, err);
        results.push({
          prNumber: pr.number,
          title: pr.title,
          url: pr.html_url,
          status: "ERROR",
          reason: err.message,
          error_details: {
            name: err.name,
            message: err.message,
            stack: err.stack,
            code: err.code,
          },
          violations: [],
        });
      }
    }

    const repos = meta.repos || [...new Set(prEntries.map((p) => `${p.owner}/${p.repo}`))];
    const summary = this.buildSummary(results);

    return {
      owner: meta.displayOwner || prEntries[0]?.owner || "",
      repo: meta.displayRepo || prEntries[0]?.repo || "",
      targetMode: meta.targetMode || "repository",
      repos,
      totalAnalyzed: results.length,
      results,
      summary,
    };
  }

  buildSummary(results) {
    if (!results.length) {
      return { score: "N/A", grade: "?" };
    }

    const passedCount = results.filter((r) => r.status === "PASSED" || r.status === "PASS").length;
    const blockedCount = results.filter((r) => r.status === "BLOCKED" || r.status === "BLOCK").length;
    const warnCount = results.filter((r) => r.status === "WARNED" || r.status === "WARN").length;
    const criticalCount = results.reduce(
      (acc, r) => acc + (r.violations?.filter((v) => v.severity === "CRITICAL" || v.severity === "HIGH" || v.severity === "BLOCK").length || 0),
      0
    );
    const autoPatchableCount = results.filter((r) => r.isAutoPatchable).length;

    const violationsBySeverity = {
      BLOCK: results.reduce(
        (acc, r) => acc + (r.violations?.filter((v) => v.severity === "BLOCK" || v.severity === "CRITICAL" || v.severity === "HIGH").length || 0),
        0
      ),
      WARN: results.reduce((acc, r) => acc + (r.violations?.filter((v) => v.severity === "WARN").length || 0), 0),
      OBSERVE: results.reduce(
        (acc, r) => acc + (r.violations?.filter((v) => v.severity === "OBSERVE" || v.severity === "INFO").length || 0),
        0
      ),
    };
    const totalViolations = violationsBySeverity.BLOCK + violationsBySeverity.WARN + violationsBySeverity.OBSERVE;

    const score = Math.round((passedCount / results.length) * 100);
    let grade = "F";
    if (score >= 90) grade = "A";
    else if (score >= 80) grade = "B";
    else if (score >= 70) grade = "C";
    else if (score >= 60) grade = "D";

    const riskAssessment = this.generateRiskAssessment(results, violationsBySeverity);
    const recommendations = this.getStrategicRecommendations(results, violationsBySeverity);

    return {
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
      blast_radius: blockedCount / results.length,
      risk_assessment: riskAssessment,
      recommendations,
    };
  }

  generateRiskAssessment(results, severityMap) {
    const total = results.length;
    const blockRate = severityMap.BLOCK / total;

    let level = "LOW";
    let impact = "Minimal impact on development velocity and security posture.";

    if (blockRate > 0.5 || severityMap.BLOCK > 10) {
      level = "CRITICAL";
      impact = "Systemic governance failure detected. High probability of security vulnerabilities and architectural drift.";
    } else if (blockRate > 0.2 || severityMap.BLOCK > 3) {
      level = "HIGH";
      impact = "Significant policy violations detected. Core modules are at risk of technical debt and security gaps.";
    } else if (severityMap.WARN > 5) {
      level = "MODERATE";
      impact = "Multiple non-blocking violations detected. Code quality is degrading over time.";
    }

    return { level, impact };
  }

  getStrategicRecommendations(results, severityMap) {
    const recs = [];

    if (severityMap.BLOCK > 0) {
      recs.push({
        priority: "IMMEDIATE",
        action: "Mandatory Policy Enforcement",
        detail: `Resolve ${severityMap.BLOCK} blocking violations in active PRs before merging to production.`,
      });
    }

    const allViolations = results.flatMap((r) => r.violations || []);
    const hasSecrets = allViolations.some((v) => v.rule_id === "no_hardcoded_secrets");
    const hasArch = allViolations.some((v) => v.rule_id === "architectural_integrity");

    if (hasSecrets) {
      recs.push({
        priority: "HIGH",
        action: "Secrets Rotation & Manager Implementation",
        detail: "Secrets detected in PR history. Rotate compromised tokens and migrate to a dedicated Secrets Manager (e.g., Vault, AWS Secrets Manager).",
      });
    }

    if (hasArch) {
      recs.push({
        priority: "MEDIUM",
        action: "Architecture Review",
        detail: "Layer violations detected. Schedule an architecture review to align service boundaries and prevent circular dependencies.",
      });
    }

    if (recs.length === 0) {
      recs.push({
        priority: "LOW",
        action: "Continuous Monitoring",
        detail: "Codebase is currently healthy. Continue using Zaxion to maintain governance standards.",
      });
    }

    return recs;
  }

  async executeAnalysis(data, db) {
    const { owner, repo, prNumber, customToken, customPolicies } = data;

    const { DiffAnalyzerService } = await import("./diffAnalyzer.service.js");
    const { PolicyEngineService } = await import("./policyEngine.service.js");
    const { AdvisorService } = await import("./advisor.service.js");
    const { LlmService } = await import("./llm.service.js");
    const { ViolationExplainerService } = await import("./violationExplainer.service.js");

    const octokit = new Octokit({ auth: customToken });
    const diffAnalyzer = new DiffAnalyzerService(customToken);
    const policyEngine = new PolicyEngineService(octokit, db);
    const llm = new LlmService();
    const advisor = new AdvisorService(llm);
    const violationExplainer = new ViolationExplainerService(llm);

    const prContext = await diffAnalyzer.analyze(owner, repo, prNumber);

    const { data: prData } = await octokit.pulls.get({ owner, repo, pull_number: prNumber });
    const metadata = {
      owner,
      repo,
      prNumber,
      baseBranch: prData.base.ref,
      prBody: prData.body,
      userLogin: prData.user.login,
      enabledPolicyIds: customPolicies,
    };

    const result = await policyEngine.evaluate(prContext, metadata);

    const explained = await violationExplainer.explainViolations({
      decision: result,
      prContext,
      violations: result.violations,
    });
    if (explained.enriched) {
      result.violations = explained.violations;
      if (explained.decision_summary) result.decisionReason = explained.decision_summary;
    }

    const violations = (result.violations || []).map((v) => ({
      rule_id: v.rule_id,
      explanation: v.ai_explanation || v.message || v.explanation,
      file: v.file,
      line: v.line,
      severity: v.severity,
      current_value: v.actual,
      required_value: v.expected,
      remediation: v.remediation,
      code_context: v.code || v.context,
    }));

    const patchableRuleIds = ["SECRET_EXPOSURE", "MAGIC_NUMBER", "HARDCODED_URL", "CONSOLE_LOG"];
    const isAutoPatchable = violations.some((v) => patchableRuleIds.includes(v.rule_id));

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
      passes: (result.passes || []).map((p) => ({
        rule_id: p.rule_id,
        message: p.message,
      })),
      isAutoPatchable,
    };
  }
}
