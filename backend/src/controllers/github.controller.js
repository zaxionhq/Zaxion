// src/controllers/github.controller.js
import { Octokit } from "@octokit/rest";
import { decrypt } from "../utils/crypto.js";
import { getRepoTree as fetchRepoTreeService, listBranches as fetchBranchesService, listPulls, fetchPrFilesWithContent } from "../services/github.service.js";
import { FactIngestorService } from "../services/factIngestor.service.js";
import { formatPRBody } from "../services/prFormatter.service.js";
import { GitHubReporterService } from "../services/githubReporter.service.js";
import githubAppService from "../services/githubApp.service.js";
import { DecisionDTO } from "../dtos/decision.dto.js";
import { log, error, warn } from "../utils/logger.js";
import * as policyService from "../services/policy.service.js";
import * as codeAnalysis from "../services/codeAnalysis.service.js";
import { EvaluationEngineService } from "../services/evaluationEngine.service.js";

/**
 * Helper: create Octokit client with token
 */
function getOctokit(token) {
  if (!token) throw new Error("GitHub token missing");
  return new Octokit({ auth: token });
}

import { mapCorePolicyToRules } from "../utils/policyMapper.js";

/**
 * Controller for GitHub-related operations (Pillar 1).
 */
export default function githubControllerFactory(db) {
  return {
    /**
     * List authenticated user's repos
     * GET /api/github/repos
     */
    listRepos: async (req, res, next) => {
      try {
        const token = req.githubToken;
        const octokit = getOctokit(token);

        const { data } = await octokit.rest.repos.listForAuthenticatedUser({
          visibility: "all",
          per_page: 100,
        });

        const mapped = data.map((r) => ({
          id: r.id,
          name: r.name,
          full_name: r.full_name,
          private: r.private,
          default_branch: r.default_branch,
          owner: {
            login: r.owner.login
          },
        }));

        res.status(200).json(mapped);
      } catch (err) {
        error("listRepos error", err);
        next(err);
      }
    },

    /**
     * List branches for a repo
     * GET /api/github/repos/:owner/:repo/branches
     */
    listBranches: async (req, res, next) => {
      try {
        const { owner, repo } = req.params;
        const githubToken = req.githubToken;

        if (!githubToken) {
          return res.status(401).json({ error: "GitHub token missing" });
        }

        log(`[listBranches] owner: ${owner}, repo: ${repo}`);

        const branches = await fetchBranchesService(githubToken, owner, repo);
        res.status(200).json(branches);
      } catch (err) {
        error("listBranches error", err);
        if (err.status === 401) {
          return res.status(401).json({ error: "Unauthorized access to GitHub repository" });
        } else if (err.status === 404) {
          return res.status(404).json({ error: "Repository not found" });
        }
        next(err);
      }
    },

    /**
     * List files in a repo path
     * GET /api/github/repos/:owner/:repo/files?path=
     */
    listRepoFiles: async (req, res, next) => {
      try {
        const { owner, repo } = req.params;
        const path = req.query.path !== undefined ? req.query.path : "";
        const githubToken = req.githubToken;
        
        log(`[listRepoFiles] owner: ${owner}, repo: ${repo}, path: '${path}'`);
        
        if (!githubToken) {
          return res.status(401).json({ error: "GitHub token missing" });
        }
        
        const octokit = getOctokit(githubToken);

        const { data } = await octokit.rest.repos.getContent({
          owner,
          repo,
          path,
        });

        const files = Array.isArray(data) ? data.map(f => ({
          name: f.name,
          path: f.path,
          type: f.type,
          sha: f.sha,
          download_url: f.download_url
        })) : [{
          name: data.name,
          path: data.path,
          type: data.type,
          sha: data.sha,
          download_url: data.download_url
        }];

        res.status(200).json(files);
      } catch (err) {
        error("listRepoFiles error", err);
        if (err.status === 401) {
          return res.status(401).json({ error: "Unauthorized access to GitHub repository" });
        } else if (err.status === 404) {
          return res.status(404).json({ error: "Repository or path not found" });
        } else if (err.status === 403) {
          return res.status(403).json({ error: "Access forbidden to repository" });
        }
        next(err);
      }
    },

    /**
     * Get recursive repo tree
     * GET /api/github/repos/:owner/:repo/tree
     */
    getRepoTree: async (req, res, next) => {
      try {
        const { owner, repo } = req.params;
        const { branch, includeIgnored } = req.query;
        const githubToken = req.githubToken;

        const shouldIncludeIgnored = includeIgnored === 'true';

        if (!githubToken) {
          return res.status(401).json({ error: "GitHub token missing" });
        }

        log(`[getRepoTree] owner: ${owner}, repo: ${repo}, branch: ${branch || 'default'}, includeIgnored: ${shouldIncludeIgnored}`);
        
        const tree = await fetchRepoTreeService(githubToken, owner, repo, branch, shouldIncludeIgnored);
        
        res.status(200).json(tree);
      } catch (err) {
        error("getRepoTree error", err);
        if (err.status === 401) {
          return res.status(401).json({ error: "Unauthorized access to GitHub repository" });
        } else if (err.status === 404) {
          return res.status(404).json({ error: "Repository or branch not found" });
        } else if (err.status === 403) {
          return res.status(403).json({ error: "Access forbidden to repository" });
        }
        next(err);
      }
    },

    /**
     * Create PR with provided files.
     */
    createPullRequestWithFiles: async (req, res) => {
      try {
        const { owner, repo } = req.params;
        const { branchName: clientBranchName, title, body: prBody, files = [], baseBranch } = req.body;
        const token = req.githubToken;
        
        if (!token) {
          return res.status(401).json({ error: "GitHub token missing" });
        }
        
        const octokit = getOctokit(token);

        const repoRes = await octokit.rest.repos.get({ owner, repo });
        const defaultBranch = baseBranch || repoRes.data.default_branch;
        const branchName = clientBranchName || `auto/tests/${Date.now()}`;

        async function ensureBranchExists(branch) {
          try {
            await octokit.rest.git.getRef({ owner, repo, ref: `heads/${branch}` });
            return;
          } catch (err) {
            if (err.status === 404) {
              const ref = await octokit.rest.git.getRef({ owner, repo, ref: `heads/${defaultBranch}` });
              const sha = ref.data.object.sha;
              await octokit.rest.git.createRef({ owner, repo, ref: `refs/heads/${branch}`, sha });
              return;
            }
            throw err;
          }
        }

        await ensureBranchExists(branchName);

        for (const f of files) {
          const path = f.path;
          const content = typeof f.content === "string" ? f.content : JSON.stringify(f.content);
          const encoded = Buffer.from(content, "utf8").toString("base64");

          let sha;
          try {
            const existing = await octokit.rest.repos.getContent({ owner, repo, path, ref: branchName });
            sha = existing.data.sha;
          } catch (err) {
            if (err.status !== 404) {
              warn("getContent warning", err);
            }
          }

          const message = `chore(tests): add/update ${path}`;
          if (sha) {
            await octokit.rest.repos.createOrUpdateFileContents({
              owner, repo, path, message, content: encoded, branch: branchName, sha,
            });
          } else {
            await octokit.rest.repos.createOrUpdateFileContents({
              owner, repo, path, message, content: encoded, branch: branchName,
            });
          }
        }

        const existingPRs = await octokit.rest.pulls.list({
          owner, repo, state: "open", head: `${owner}:${branchName}`, base: defaultBranch,
        });

        if (existingPRs.data && existingPRs.data.length > 0) {
          return res.status(200).json({ pr: existingPRs.data[0], note: "existing" });
        }

        let finalBody = prBody || "Automated test generation PR";
        if (req.body.stats) {
          finalBody = formatPRBody(req.body.stats);
          if (prBody && prBody !== "Automated test generation PR") {
             finalBody += `\n\n### 📝 Additional Notes\n${prBody}`;
          }
        }

        const pr = await octokit.rest.pulls.create({
          owner, repo, title: title || `Add generated tests (${new Date().toISOString().split("T")[0]})`, head: branchName, base: defaultBranch, body: finalBody,
        });

        res.status(200).json({ pr: pr.data });
      } catch (err) {
        error("❌ Error creating PR:", err);
        if (err.status === 401) return res.status(401).json({ error: "Unauthorized access to GitHub repository" });
        if (err.status === 404) return res.status(404).json({ error: "Repository not found" });
        if (err.status === 403) return res.status(403).json({ error: "Access forbidden to repository" });
        if (err.status === 422) return res.status(422).json({ error: "Invalid request data" });
        return res.status(500).json({ error: "Failed to create pull request", details: err.message });
      }
    },

    /**
     * Get a specific PR decision by ID.
     * GET /api/v1/github/decisions/:decisionId
     */
    getDecisionById: async (req, res, next) => {
      try {
        const { decisionId } = req.params;
        
        const [decision] = await db.sequelize.query(
          `SELECT 
            d.*, 
            CASE WHEN o.id IS NOT NULL THEN 'OVERRIDDEN_PASS' ELSE d.decision END as decision,
            o.user_login as override_by, 
            o.override_reason, 
            o.created_at as overridden_at
           FROM pr_decisions d
           LEFT JOIN pr_overrides o ON d.id = o.pr_decision_id
           WHERE d.id = :decisionId 
           LIMIT 1`,
          {
            replacements: { decisionId },
            type: db.sequelize.QueryTypes.SELECT
          }
        );

        if (!decision) {
          return res.status(404).json({ error: "Decision not found" });
        }

        // Parse raw_data if it exists (Phase 6 structural requirement)
        if (decision.raw_data) {
          try {
            const parsed = typeof decision.raw_data === 'string' ? JSON.parse(decision.raw_data) : decision.raw_data;
            decision.facts = parsed.facts;
            decision.advisor = parsed.advisor;
            decision.violated_policy = parsed.violated_policy;
            decision.violation_reason = parsed.violation_reason;
            decision.violations = parsed.violations; // Extract structured violations from raw_data
          } catch (e) {
            warn("Failed to parse decision raw_data", e);
          }
        }

        res.status(200).json(DecisionDTO.toPublic(decision));
      } catch (err) {
        error("getDecisionById error", err);
        next(err);
      }
    },

    /**
     * Get the latest PR decision for a specific PR.
     * GET /api/v1/github/repos/:owner/:repo/pr/:prNumber/decision
     */
    getLatestDecision: async (req, res, next) => {
      try {
        const { owner, repo, prNumber } = req.params;
        
        const [decision] = await db.sequelize.query(
          `SELECT 
            d.*, 
            CASE WHEN o.id IS NOT NULL THEN 'OVERRIDDEN_PASS' ELSE d.decision END as decision,
            o.user_login as override_by, 
            o.override_reason, 
            o.created_at as overridden_at
           FROM pr_decisions d
           LEFT JOIN pr_overrides o ON d.id = o.pr_decision_id
           WHERE d.repo_owner = :owner AND d.repo_name = :repo AND d.pr_number = :prNumber 
           ORDER BY d.created_at DESC LIMIT 1`,
          {
            replacements: { owner, repo, prNumber },
            type: db.sequelize.QueryTypes.SELECT
          }
        );

        if (!decision) {
          return res.status(404).json({ error: "No PR decision found" });
        }

        // Parse raw_data if it exists (Phase 6 structural requirement)
        if (decision.raw_data) {
          try {
            const parsed = typeof decision.raw_data === 'string' ? JSON.parse(decision.raw_data) : decision.raw_data;
            decision.facts = parsed.facts;
            decision.advisor = parsed.advisor;
            decision.violated_policy = parsed.violated_policy;
            decision.violation_reason = parsed.violation_reason;
            decision.violations = parsed.violations; // Extract structured violations from raw_data
          } catch (e) {
            warn("Failed to parse latest decision raw_data", e);
          }
        }

        res.status(200).json(DecisionDTO.toPublic(decision));
      } catch (err) {
        error("getLatestDecision error", err);
        next(err);
      }
    },

    /**
     * Execute manual override for a PR decision.
     * POST /api/v1/github/repos/:owner/:repo/pr/:prNumber/override
     */
    executeOverride: async (req, res, next) => {
      const transaction = await db.sequelize.transaction();
      try {
        const { owner, repo, prNumber } = req.params;
        const { reason, category = 'BUSINESS_EXCEPTION', ttl_hours = 24, role = "REPO_ADMIN" } = req.body;
        const user = req.user; // from auth middleware

        if (!user) {
          return res.status(401).json({ error: "Authentication required for override" });
        }

        // 1. Find the latest decision for this PR
        const decision = await db.Decision.findOne({
          where: {
            // We need to map GitHub PR metadata to our internal Decision records
            // For now, we'll use a raw query or find by some metadata if available
            // Since our Decision model doesn't have repo/pr_number directly, 
            // we'll use the legacy pr_decisions table lookup if it still exists or 
            // use a more robust way to find the Phase 6 Decision record.
          },
          order: [['createdAt', 'DESC']],
          transaction
        });

        // Fallback to legacy pr_decisions for now if Decision model is empty or not linked
        const [legacyDecision] = await db.sequelize.query(
          `SELECT * FROM pr_decisions 
           WHERE repo_owner = :owner AND repo_name = :repo AND pr_number = :prNumber 
           ORDER BY created_at DESC LIMIT 1`,
          {
            replacements: { owner, repo, prNumber },
            type: db.sequelize.QueryTypes.SELECT,
            transaction
          }
        );

        if (!legacyDecision) {
          await transaction.rollback();
          return res.status(404).json({ error: "No PR decision found to override" });
        }

        // --- PHASE 4 HARDENING: Immutability Check ---
        const [existingOverride] = await db.sequelize.query(
          `SELECT id FROM pr_overrides WHERE pr_decision_id = :id LIMIT 1`,
          {
            replacements: { id: legacyDecision.id },
            type: db.sequelize.QueryTypes.SELECT,
            transaction
          }
        );

        if (existingOverride) {
          await transaction.rollback();
          return res.status(400).json({ 
            error: "Override already exists", 
            message: "This PR decision has already been overridden. Re-execution is blocked for replay protection." 
          });
        }

        if (legacyDecision.decision === "PASS") {
          await transaction.rollback();
          return res.status(400).json({ error: "PR already passed", message: "Manual override is not needed for a PASSing decision." });
        }

        // --- PHASE 4 HARDENING: Role-based Authorization ---
        const token = req.githubToken;
        if (!token) {
          await transaction.rollback();
          return res.status(401).json({ error: "GitHub token missing", message: "You must be authenticated with GitHub to perform overrides." });
        }

        const octokit = getOctokit(token);
        
        try {
          // Check user's permission level on the repository
          const { data: permissionData } = await octokit.rest.repos.getCollaboratorPermissionLevel({
            owner,
            repo,
            username: user.username || user.login || user.email,
          });

          const userPermission = permissionData.permission; // 'admin', 'maintain', 'write', 'triage', 'read'
          const authorizedRoles = ['admin', 'maintain'];
          
          if (!authorizedRoles.includes(userPermission)) {
            await transaction.rollback();
            return res.status(403).json({ 
              error: "Unauthorized Role", 
              message: `Your GitHub role '${userPermission}' is not authorized to override PR Gates. Required: Admin or Maintainer.` 
            });
          }

          log(`Override authorized: User ${user.username || user.login} has ${userPermission} permission on ${owner}/${repo}`);
          // Update the role used in the audit log to the actual GitHub role
          req.body.role = userPermission.toUpperCase();

        } catch (githubErr) {
          error("GitHub Permission Check Failed:", githubErr);
          await transaction.rollback();
          return res.status(500).json({ 
            error: "Authorization Error", 
            message: "Failed to verify GitHub permissions. Please try again later." 
          });
        }

        // 2. Log to overrides table (The Authoritative Ledger for Bypasses)
        const [overrideResult] = await db.sequelize.query(
          `INSERT INTO pr_overrides (pr_decision_id, user_login, override_reason, category, ttl_hours, created_at)
           VALUES (:decisionId, :userLogin, :reason, :category, :ttlHours, NOW())`,
          {
            replacements: {
              decisionId: legacyDecision.id,
              userLogin: user.username || user.login || user.email,
              reason: reason,
              category: category,
              ttlHours: ttl_hours
            },
            type: db.sequelize.QueryTypes.INSERT,
            transaction
          }
        );

        // 3. Sync to Governance Overrides (Phase 6 Pillar 2)
        // This ensures the override appears in the Audit Trail and Analytics
        try {
          const { createOverride } = await import('../services/override.service.js');
          
          // Find the corresponding Governance Decision
          const govDecision = await db.Decision.findOne({
            where: { github_check_run_id: legacyDecision.github_check_run_id },
            transaction
          });

          if (govDecision) {
            await createOverride(db, {
              decision_id: govDecision.id,
              evaluation_hash: govDecision.evaluation_hash,
              target_sha: legacyDecision.commit_sha,
              category: category,
              reason: reason,
              ttl_hours: ttl_hours
            }, user.id || user.login); // userId in system
            log(`[Override] Governance sync successful for Decision ${govDecision.id}`);
          } else {
            warn(`[Override] Governance Decision not found for check_run_id ${legacyDecision.github_check_run_id}. Sync skipped.`);
          }
        } catch (syncErr) {
          error("[Override] Governance sync failed:", syncErr.message);
          // Non-blocking for the PR Gate itself
        }

        // 4. Update GitHub Check Run & Commit Status
        // MANDATORY: Use GitHub App identity for reporting status.
        // GitHub requires the SAME identity that created the check to update it.
        // User tokens will create a separate "identity" that blocks the PR.
        let reportingOctokit = octokit;
        let identityType = "USER_OAUTH";

        try {
          log(`[Override] Attempting to assume App identity for ${owner}/${repo}...`);
          const installationId = await githubAppService.getInstallationIdForRepo(owner, repo);
          
          if (installationId) {
            const appToken = await githubAppService.getInstallationAccessToken(installationId);
            reportingOctokit = new Octokit({ auth: appToken });
            identityType = "GITHUB_APP";
            log(`[Override] Successfully assumed App identity (Installation: ${installationId})`);
          } else {
            // Hard failure for identity conflict (Phase B Hardening)
            const err = new Error(`GitHub App installation not found for ${owner}/${repo}. Status reporting requires the Zaxion App to be installed.`);
            err.status = 403;
            throw err;
          }
        } catch (appErr) {
          error("[Override] Identity switch failed:", appErr);
          await transaction.rollback();
          return res.status(appErr.status || 500).json({ 
            error: "Identity Conflict", 
            message: appErr.message,
            hint: "Please ensure the Zaxion GitHub App is installed on this repository. Status reporting cannot fall back to User Tokens without causing conflicts."
          });
        }

        const reporter = new GitHubReporterService(reportingOctokit);
        
        // Fetch current PR head SHA to ensure status is reported to the latest commit
        // GitHub branch protection requires the LATEST commit to have the passing status
        let headSha = legacyDecision.commit_sha;
        try {
          const { data: prData } = await octokit.rest.pulls.get({
            owner,
            repo,
            pull_number: prNumber
          });
          headSha = prData.head.sha;
          log(`[Override] Targeting latest PR head SHA: ${headSha} (Identity: ${identityType})`);
        } catch (prErr) {
          warn("[Override] Could not fetch latest PR head SHA, falling back to decision SHA:", prErr.message);
        }

        try {
          await reporter.reportStatus(
            owner,
            repo,
            headSha,
            "OVERRIDDEN_PASS",
            { 
              description: `Override (${category}) authorized by ${user.username || user.login || user.email}`,
              prNumber: prNumber,
              checkRunId: legacyDecision.github_check_run_id, // Precise PATCHing
              override_by: user.username || user.login || user.email,
              overridden_at: new Date().toISOString()
            }
          );
        } catch (reportErr) {
          error("[Override] Status reporting failed:", reportErr.message);
          await transaction.rollback();
          return res.status(500).json({
            error: "GitHub Update Failed",
            message: reportErr.message,
            identity: identityType,
            hint: "This usually means Zaxion (as an App) doesn't have permission to update the check run, or you are experiencing an Identity Conflict. Ensure the Zaxion GitHub App is installed on your repository."
          });
        }

        await transaction.commit();
        res.status(200).json({
          status: "SUCCESS",
          message: "PR Gate override executed successfully",
          decision: "OVERRIDDEN_PASS"
        });

      } catch (err) {
        await transaction.rollback();
        error("executeOverride error", err);
        next(err);
      }
    },

    /**
     * Merge a pull request.
     * POST /api/v1/github/repos/:owner/:repo/pr/:prNumber/merge
     */
    mergePullRequest: async (req, res, next) => {
      try {
        const { owner, repo, prNumber } = req.params;
        const token = req.githubToken;
        const user = req.user;

        if (!token) {
          return res.status(401).json({ error: "GitHub token missing" });
        }

        const octokit = getOctokit(token);

        // 1. Check if PR is mergeable and its current state
        const { data: pr } = await octokit.rest.pulls.get({
          owner,
          repo,
          pull_number: prNumber,
        });

        if (pr.merged) {
          return res.status(400).json({ error: "PR is already merged" });
        }

        if (pr.state === 'closed') {
          return res.status(400).json({ error: "PR is closed" });
        }

        // 2. Verify Zaxion Decision (PASS or OVERRIDDEN_PASS)
        const [decision] = await db.sequelize.query(
          `SELECT 
            CASE WHEN o.id IS NOT NULL THEN 'OVERRIDDEN_PASS' ELSE d.decision END as decision,
            d.id as pr_decision_id
           FROM pr_decisions d
           LEFT JOIN pr_overrides o ON d.id = o.pr_decision_id
           WHERE d.repo_owner = :owner AND d.repo_name = :repo AND d.pr_number = :prNumber 
           ORDER BY d.created_at DESC LIMIT 1`,
          {
            replacements: { owner, repo, prNumber },
            type: db.sequelize.QueryTypes.SELECT
          }
        );

        if (!decision) {
          return res.status(404).json({ error: "No Zaxion decision found for this PR" });
        }

        if (decision.decision !== 'PASS' && decision.decision !== 'OVERRIDDEN_PASS') {
          return res.status(403).json({ 
            error: "PR is blocked by Zaxion", 
            message: "PR must have a PASS or OVERRIDDEN_PASS status to be merged." 
          });
        }

        // 3. Perform the merge
        // We use a small delay if this was just overridden to give GitHub time to process the status check
        // However, the caller should usually wait for the UI to refresh.
        
        try {
          const mergeResponse = await octokit.rest.pulls.merge({
            owner,
            repo,
            pull_number: prNumber,
            merge_method: 'merge', // default to merge
            commit_title: `Zaxion Authorized Merge: PR #${prNumber}`,
            commit_message: `PR merged via Zaxion Governance Console by ${user.username || user.login || user.email}. Decision: ${decision.decision}.`
          });

          // Sync merge status to Governance Decision if it exists
          try {
            const decisionUpdate = await db.Decision.update(
              { is_merged: true, merged_at: new Date() },
              { 
                where: { 
                  id: decision.pr_decision_id
                } 
              }
            );

            // Audit the successful merge
            if (db.AuditEvent) {
              await db.AuditEvent.create({
                eventType: 'PR_MERGE',
                actorId: user.id,
                targetId: `${owner}/${repo}#${prNumber}`,
                action: 'MERGE_COMPLETED',
                metadata: {
                  decision_id: decision.pr_decision_id,
                  verdict: decision.decision,
                  sha: mergeResponse.data.sha
                }
              });
            }

            log(`[GitHubController] Merge synced for decision ${decision.pr_decision_id}. Rows affected: ${decisionUpdate[0]}`);
          } catch (syncErr) {
            warn(`[GitHubController] Failed to sync merge status: ${syncErr.message}`);
          }

          return res.status(200).json({
            status: "SUCCESS",
            message: "Pull request merged successfully",
            data: mergeResponse.data
          });
        } catch (mergeErr) {
          error("GitHub Merge API Error:", mergeErr);
          
          if (mergeErr.status === 405) {
            // Fetch PR details to provide a better error message
            const { data: prDetails } = await octokit.rest.pulls.get({ owner, repo, pull_number: prNumber });
            
            log(`[Merge Diagnostic] PR #${prNumber} state:`, {
              mergeable: prDetails.mergeable,
              mergeable_state: prDetails.mergeable_state,
              rebaseable: prDetails.rebaseable
            });

            // Fetch check runs and statuses to see what exactly is blocking
            const [{ data: checkRuns }, { data: statuses }] = await Promise.all([
              octokit.rest.checks.listForRef({ owner, repo, ref: prDetails.head.sha }),
              octokit.rest.repos.listCommitStatusesForRef({ owner, repo, ref: prDetails.head.sha })
            ]);

            log(`[Merge Diagnostic] Check Runs for ${prDetails.head.sha.substring(0,7)}:`, 
              checkRuns.check_runs.map(cr => `${cr.name}: ${cr.status}/${cr.conclusion}`)
            );
            log(`[Merge Diagnostic] Commit Statuses for ${prDetails.head.sha.substring(0,7)}:`, 
              statuses.map(s => `${s.context}: ${s.state}`)
            );

            const failingCheckNames = checkRuns.check_runs
              .filter(cr => cr.conclusion === 'failure' || cr.conclusion === 'action_required')
              .map(cr => cr.name);
            
            const failingStatusContexts = statuses
              .filter(s => s.state === 'failure' || s.state === 'error')
              .map(s => s.context);

            const instancesMap = new Map();
            [
              ...checkRuns.check_runs.map(cr => ({ 
                name: cr.name, 
                type: 'check', 
                conclusion: cr.conclusion, 
                app: cr.app?.name || 'unknown',
                id: cr.id 
              })),
              ...statuses.map(s => ({ 
                name: s.context, 
                type: 'status', 
                conclusion: s.state, 
                creator: s.creator?.login || 'unknown' 
              }))
            ].forEach(inst => {
              if (!instancesMap.has(inst.name)) instancesMap.set(inst.name, []);
              instancesMap.get(inst.name).push(inst);
            });

            const allFailingNames = [...new Set([...failingCheckNames, ...failingStatusContexts])];

            // DETECT GHOST CHECKS / IDENTITY CONFLICTS
            // Check if there's a required name that has BOTH a success and a failure
            const duplicateFailingCheck = allFailingNames.find(name => {
              const instances = instancesMap.get(name) || [];
              const hasSuccess = instances.some(i => i.conclusion === 'success');
              return instances.length > 1 && hasSuccess;
            });

            let detailedMessage = "PR analysis complete. One or more mandatory policies are blocking this merge.";

            if (duplicateFailingCheck) {
              const identities = (instancesMap.get(duplicateFailingCheck) || [])
                .map(i => `${i.type} by ${i.app || i.creator} (${i.conclusion})`)
                .join(', ');
              
              detailedMessage = `Merge blocked by an Identity Conflict. GitHub sees ${instancesMap.get(duplicateFailingCheck).length} different items named "${duplicateFailingCheck}": [${identities}]. Zaxion has passed, but another identity with the same name is failing. GitHub requires ALL items with this name to pass.`;
            } else if (prDetails.mergeable_state === 'blocked') {
              detailedMessage = "PR is blocked by GitHub branch protection rules. This could be due to missing reviews, failing status checks, or other requirements. Check the GitHub PR page for details.";
            }

            return res.status(405).json({
              error: "PR is not mergeable",
              message: detailedMessage,
              mergeable_state: prDetails.mergeable_state,
              diagnostics: {
                mergeable: prDetails.mergeable,
                head_sha: prDetails.head.sha.substring(0, 7),
                failing_checks: allFailingNames,
                has_ghost_checks: !!duplicateFailingCheck,
                identities: duplicateFailingCheck ? instancesMap.get(duplicateFailingCheck) : undefined
              }
            });
          }
        throw mergeErr;
      }

    } catch (err) {
      error("mergePullRequest error", err);
      if (err.status === 405) {
        return res.status(405).json({ error: "PR is not mergeable", message: err.message });
      }
      if (err.status === 403) {
        return res.status(403).json({ error: "Insufficient permissions to merge PR" });
      }
      next(err);
    }
  },

    /**
     * Fetch PRs from GitHub and ingest into FactSnapshots for policy simulation.
     * POST /api/v1/github/simulation/fetch-prs
     * Body: { repo_full_name, branch?, limit? }
     */
    fetchPrsForSimulation: async (req, res, next) => {
      try {
        const token = req.githubToken;
        if (!token) return res.status(401).json({ error: "GitHub token missing" });

        const { repo_full_name, branch, limit = 20 } = req.body || {};
        if (!repo_full_name) return res.status(400).json({ error: "repo_full_name is required" });

        const [owner, repo] = repo_full_name.split("/");
        if (!owner || !repo) return res.status(400).json({ error: "repo_full_name must be owner/repo" });

        const head = branch ? `${owner}:${branch}` : undefined;
        const prs = await listPulls(token, owner, repo, { state: "all", head, per_page: Math.min(Number(limit) || 20, 100) });

        const ingestor = new FactIngestorService(db, token);
        let ingested = 0;
        const failedPrs = [];

        for (const pr of prs) {
          try {
            const sha = pr.head?.sha;
            if (!sha) continue;
            await ingestor.ingest(repo_full_name, pr.number, sha, { fetchContent: true });
            ingested++;
          } catch (e) {
            warn("fetchPrsForSimulation: ingest failed for PR", pr.number, e.message);
            failedPrs.push({ pr: pr.number, error: e.message });
          }
        }

        if (failedPrs.length > 0) {
          return res.status(500).json({ 
            error: "Batch Fetch Failed", 
            message: `Failed to ingest ${failedPrs.length} PRs. Simulation cannot guarantee parity.`,
            details: failedPrs 
          });
        }

        res.status(200).json({ fetched: prs.length, ingested, repo_full_name, branch: branch || null });
      } catch (err) {
        error("fetchPrsForSimulation error", err);
        if (err.response?.status === 404) return res.status(404).json({ error: "Repository not found" });
        next(err);
      }
    },

    /**
     * Analyze a single GitHub PR by URL against a policy.
     * POST /api/v1/github/simulation/analyze-pr
     * Body: { policy_id, github_pr_url }
     */
    analyzePrByUrl: async (req, res, next) => {
      try {
        const token = req.githubToken;
        if (!token) return res.status(401).json({ error: "GitHub token required" });

        const { policy_id, github_pr_url } = req.body || {};
        if (!policy_id || !github_pr_url) {
          return res.status(400).json({ error: "policy_id and github_pr_url are required" });
        }

        const match = github_pr_url.match(/github\.com[/:](\w[-.\w]*)\/([^/]+)\/pull\/(\d+)/i);
        if (!match) {
          return res.status(400).json({ error: "Invalid GitHub PR URL. Use format: https://github.com/owner/repo/pull/123" });
        }
        const [, owner, repo, prNumberStr] = match;
        const repoFullName = `${owner}/${repo}`;
        const prNumber = parseInt(prNumberStr, 10);

        let policy;
        let draftRules = {};
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(policy_id);

        if (isUuid) {
          policy = await policyService.getPolicy(db, policy_id);
          if (!policy) return res.status(404).json({ error: "Policy not found" });
          const latestVersion = await policyService.getLatestPolicyVersion(db, policy_id);
          draftRules = latestVersion?.rules_logic || {};
          log("GitHubController: Resolved UUID Policy", { policy_id, draftRules });
        } else {
          // Core Policy Handling
          const { CORE_POLICIES } = await import('../policies/corePolicies.js');
          policy = CORE_POLICIES.find(p => p.id === policy_id);
          if (!policy) return res.status(404).json({ error: "Core Policy not found" });
          draftRules = mapCorePolicyToRules(policy.id, policy.severity);
          log("GitHubController: Resolved Core Policy Mapping", { policy_id, draftRules });
        }

        if (!draftRules || Object.keys(draftRules).length === 0) {
          return res.status(400).json({ error: "Policy has no rules to evaluate" });
        }

        const octokit = getOctokit(token);
        const { data: pr } = await octokit.pulls.get({ owner, repo, pull_number: prNumber });

        const results = await fetchPrFilesWithContent(token, owner, repo, prNumber, { maxFiles: 100 });
        // Handle both object return `{filesWithContent, parserSuccessRate}` and simple array `[...]`
        let filesWithContent = [];
        let parserSuccessRate = 1.0;
        if (Array.isArray(results)) {
          filesWithContent = results;
        } else if (results && results.filesWithContent) {
          filesWithContent = results.filesWithContent;
          parserSuccessRate = results.parserSuccessRate;
        }

        let snapshot;
        if (filesWithContent.length > 0) {
          snapshot = codeAnalysis.buildSyntheticSnapshotFromZip(filesWithContent);
        } else {
          // Gracefully handle PRs with no analyzable files.
          snapshot = codeAnalysis.buildSyntheticSnapshot({
            content: '',
            fileName: 'empty.ts',
            extension: '.ts',
            virtualPath: 'empty.ts',
          });
        }
        
        // Pass parser metrics into snapshot so simulation doesn't falsely fail strict mode
        snapshot.metadata = snapshot.metadata || {};
        snapshot.metadata.parser_success_rate = parserSuccessRate !== undefined ? parserSuccessRate : 1.0;
        // In simulations, we often don't have the full tree, so we degrade gracefully
        snapshot.evaluation_mode = 'BEST_EFFORT';

        // Attach PR metadata so results include proper repo / PR / title.
        snapshot.repo_full_name = repoFullName;
        snapshot.pr_number = prNumber;
        snapshot.data = snapshot.data || {};
        snapshot.data.pull_request = {
          ...(snapshot.data.pull_request || {}),
          title: pr.title,
          base_branch: pr.base?.ref || null,
          author: {
            github_user_id: pr.user?.id,
            username: pr.user?.login,
          },
        };

        const evaluationEngine = new EvaluationEngineService();
        const result = codeAnalysis.runCodeAnalysis(snapshot, draftRules, evaluationEngine);

        res.status(200).json({
          id: `pr-${repoFullName}-${prNumber}-${Date.now()}`,
          status: "COMPLETED",
          ...result,
          pr_title: pr.title,
          pr_number: prNumber,
          repo_full_name: repoFullName,
          createdAt: new Date().toISOString(),
        });
      } catch (err) {
        error("analyzePrByUrl error", err);
        if (err.response?.status === 404) return res.status(404).json({ error: "PR or repository not found" });
        next(err);
      }
    },

    analyzePRSimulation: async (req, res) => {
      try {
        const { prUrl, policyRules } = req.body;
        if (!prUrl) return res.status(400).json({ error: "Missing PR URL" });
        if (!policyRules) return res.status(400).json({ error: "Missing policy rules" });

        const [owner, repo, prNumber] = prUrl.split('/').slice(-3);
        const token = req.githubToken;
        if (!token) return res.status(401).json({ error: "GitHub token missing" });

        // Build policy config with mock defaults
        const policyConfig = {
          policy_id: "simulated_policy",
          policy_version_id: "sim_v1",
          level: "MANDATORY",
          rules_logic: policyRules
        };

        // Use the db instance passed to the factory instead of requiring models directly
        const octokit = getOctokit(token);

        const { FactIngestorService } = await import('../services/factIngestor.service.js');
        const { EvaluationEngineService } = await import('../services/evaluationEngine.service.js');
        const { PolicySimulationService } = await import('../services/policySimulation.service.js');

        const ingestor = new FactIngestorService(db);
        const evaluator = new EvaluationEngineService(db);
        const simulator = new PolicySimulationService(db, evaluator);

        // Fetch minimal PR data
        const { data: prData } = await octokit.rest.pulls.get({
          owner, repo, pull_number: parseInt(prNumber, 10)
        });

        // Use simulator to analyze a single PR URL dynamically
        const result = await simulator.simulateOnDemandUrl(prUrl, token, policyRules);

        return res.status(200).json({
          pr_details: {
            title: prData.title,
            number: prData.number,
            author: prData.user.login,
            base_branch: prData.base.ref
          },
          ...result
        });
      } catch (err) {
        warn("Simulation analysis failed:", err);
        return res.status(500).json({ error: err.message || "Failed to simulate policy on PR" });
      }
    }
  };
}
