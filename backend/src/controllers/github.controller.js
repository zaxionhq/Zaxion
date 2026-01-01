// src/controllers/github.controller.js
import { Octokit } from "@octokit/rest";
import { decrypt } from "../utils/crypto.js";
import { getRepoTree as fetchRepoTreeService, listBranches as fetchBranchesService } from "../services/github.service.js";
import { formatPRBody } from "../services/prFormatter.service.js";
import { GitHubReporterService } from "../services/githubReporter.service.js";

/**
 * Helper: create Octokit client with token
 */
function getOctokit(token) {
  if (!token) throw new Error("GitHub token missing");
  return new Octokit({ auth: token });
}

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
        console.error("listRepos error", err);
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

        console.log(`[listBranches] owner: ${owner}, repo: ${repo}`);

        const branches = await fetchBranchesService(githubToken, owner, repo);
        res.status(200).json(branches);
      } catch (err) {
        console.error("listBranches error", err);
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
        
        console.log(`[listRepoFiles] owner: ${owner}, repo: ${repo}, path: '${path}'`);
        
        if (!githubToken) {
          return res.status(401).json({ error: "GitHub token missing" });
        }
        
        const octokit = getOctokit(githubToken);

        const { data } = await octokit.rest.repos.getContent({
          owner,
          repo,
          path,
        });

        const files = Array.isArray(data)
          ? data.map((f) => ({
              name: f.name,
              path: f.path,
              type: f.type,
              sha: f.sha,
              size: f.size,
            }))
          : [{
              name: data.name,
              path: data.path,
              type: data.type,
              sha: data.sha,
              size: data.size,
              content: data.content,
              encoding: data.encoding,
            }];

        res.status(200).json(files);
      } catch (err) {
        console.error("listRepoFiles error", err);
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

        console.log(`[getRepoTree] owner: ${owner}, repo: ${repo}, branch: ${branch || 'default'}, includeIgnored: ${shouldIncludeIgnored}`);
        
        const tree = await fetchRepoTreeService(githubToken, owner, repo, branch, shouldIncludeIgnored);
        
        res.status(200).json(tree);
      } catch (err) {
        console.error("getRepoTree error", err);
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
              console.warn("getContent warning", err);
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
      } catch (error) {
        console.error("❌ Error creating PR:", error);
        if (error.status === 401) return res.status(401).json({ error: "Unauthorized access to GitHub repository" });
        if (error.status === 404) return res.status(404).json({ error: "Repository not found" });
        if (error.status === 403) return res.status(403).json({ error: "Access forbidden to repository" });
        if (error.status === 422) return res.status(422).json({ error: "Invalid request data" });
        return res.status(500).json({ error: "Failed to create pull request", details: error.message });
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
          `SELECT * FROM pr_decisions 
           WHERE repo_owner = :owner AND repo_name = :repo AND pr_number = :prNumber 
           ORDER BY created_at DESC LIMIT 1`,
          {
            replacements: { owner, repo, prNumber },
            type: db.sequelize.QueryTypes.SELECT
          }
        );

        if (!decision) {
          return res.status(404).json({ error: "No PR decision found" });
        }

        res.status(200).json(decision);
      } catch (err) {
        console.error("getLatestDecision error", err);
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
        const { reason, role = "REPO_ADMIN" } = req.body;
        const user = req.user; // from auth middleware

        if (!user) {
          return res.status(401).json({ error: "Authentication required for override" });
        }

        // 1. Find the latest decision for this PR
        const [decision] = await db.sequelize.query(
          `SELECT * FROM pr_decisions 
           WHERE repo_owner = :owner AND repo_name = :repo AND pr_number = :prNumber 
           ORDER BY created_at DESC LIMIT 1`,
          {
            replacements: { owner, repo, prNumber },
            type: db.sequelize.QueryTypes.SELECT,
            transaction
          }
        );

        if (!decision) {
          await transaction.rollback();
          return res.status(404).json({ error: "No PR decision found to override" });
        }

        // --- PHASE 4 HARDENING: Replay Protection ---
        if (decision.decision === "OVERRIDDEN_PASS") {
          await transaction.rollback();
          return res.status(400).json({ 
            error: "Override already exists", 
            message: "This PR decision has already been overridden. Re-execution is blocked for replay protection." 
          });
        }

        if (decision.decision === "PASS") {
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
            username: user.login || user.email,
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

          console.log(`Override authorized: User ${user.login} has ${userPermission} permission on ${owner}/${repo}`);
          // Update the role used in the audit log to the actual GitHub role
          req.body.role = userPermission.toUpperCase();

        } catch (githubErr) {
          console.error("GitHub Permission Check Failed:", githubErr);
          await transaction.rollback();
          return res.status(500).json({ 
            error: "Authorization Error", 
            message: "Failed to verify GitHub permissions. Please try again later." 
          });
        }

        // 2. Update decision status
        const rawData = JSON.parse(decision.raw_data);
        rawData.decision = "OVERRIDDEN_PASS";
        rawData.override = {
          executed: true,
          by: user.login || user.email,
          role,
          justification: reason,
          timestamp: new Date().toISOString()
        };

        await db.sequelize.query(
          `UPDATE pr_decisions 
           SET decision = 'OVERRIDDEN_PASS', raw_data = :rawData, updated_at = NOW()
           WHERE id = :id`,
          {
            replacements: { id: decision.id, rawData: JSON.stringify(rawData) },
            type: db.sequelize.QueryTypes.UPDATE,
            transaction
          }
        );

        // 3. Log to overrides table
        await db.sequelize.query(
          `INSERT INTO pr_overrides (pr_decision_id, user_login, override_reason, created_at)
           VALUES (:decisionId, :userLogin, :reason, NOW())`,
          {
            replacements: {
              decisionId: decision.id,
              userLogin: user.login || user.email,
              reason: reason
            },
            type: db.sequelize.QueryTypes.INSERT,
            transaction
          }
        );

        // 4. Update GitHub Check Run
        const token = req.githubToken;
        if (token) {
          const octokit = getOctokit(token);
          const reporter = new GitHubReporterService(octokit);
          await reporter.reportStatus(
            owner,
            repo,
            decision.commit_sha,
            "OVERRIDDEN_PASS",
            `Override authorized by ${user.login || user.email}`,
            `### ⚠️ Bypass Authorized\n\n**Justification:** ${reason}\n\n**Authorized by:** ${user.login || user.email} (${role})`
          );
        }

        await transaction.commit();
        res.status(200).json({
          status: "SUCCESS",
          message: "PR Gate override executed successfully",
          decision: "OVERRIDDEN_PASS"
        });

      } catch (err) {
        await transaction.rollback();
        console.error("executeOverride error", err);
        next(err);
      }
    }
  };
}
