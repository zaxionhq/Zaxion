// src/controllers/github.controller.js
import { Octokit } from "@octokit/rest";
import { decrypt } from "../utils/crypto.js";
import { getRepoTree as fetchRepoTreeService, listBranches as fetchBranchesService } from "../services/github.service.js";
import { formatPRBody } from "../services/prFormatter.service.js";

/**
 * Helper: create Octokit client with token
 */
function getOctokit(token) {
  if (!token) throw new Error("GitHub token missing");
  return new Octokit({ auth: token });
}

/**
 * List authenticated user's repos
 * GET /api/github/repos
 */
export async function listRepos(req, res, next) {
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
}

/**
 * List branches for a repo
 * GET /api/github/repos/:owner/:repo/branches
 */
export async function listBranches(req, res, next) {
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
}

/**
 * List files in a repo path
 * GET /api/github/repos/:owner/:repo/files?path=
 */
export async function listRepoFiles(req, res, next) {
  try {
    const { owner, repo } = req.params;
    // Ensure path is explicitly set to empty string if undefined
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
    // Handle specific GitHub API errors
    if (err.status === 401) {
      return res.status(401).json({ error: "Unauthorized access to GitHub repository" });
    } else if (err.status === 404) {
      return res.status(404).json({ error: "Repository or path not found" });
    } else if (err.status === 403) {
      return res.status(403).json({ error: "Access forbidden to repository" });
    }
    // For other errors, pass to error handler
    next(err);
  }
}

/**
 * Get recursive repo tree
 * GET /api/github/repos/:owner/:repo/tree
 */
export async function getRepoTree(req, res, next) {
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
}


/**
 * Create PR with provided files.
 * POST /api/github/repos/:owner/:repo/pull-requests
 * Body:
 *  { branchName, title, body, files: [{ path, content }], baseBranch? }
 *
 * Behavior:
 *  - If branch doesn't exist -> create it from default branch
 *  - Create/update files on that branch
 *  - If an open PR exists with same head/base -> return it (idempotent)
 *  - Otherwise create a new PR
 */
export async function createPullRequestWithFiles(req, res) {
  try {
    const { owner, repo } = req.params;
    const { branchName: clientBranchName, title, body: prBody, files = [], baseBranch } = req.body;
    const token = req.githubToken;
    
    if (!token) {
      return res.status(401).json({ error: "GitHub token missing" });
    }
    
    const octokit = getOctokit(token);

    // fetch repo to get default branch
    const repoRes = await octokit.rest.repos.get({ owner, repo });
    const defaultBranch = baseBranch || repoRes.data.default_branch;
    const branchName = clientBranchName || `auto/tests/${Date.now()}`;

    // Helper to check/create branch
    async function ensureBranchExists(branch) {
      // check if branch ref exists
      try {
        await octokit.rest.git.getRef({ owner, repo, ref: `heads/${branch}` });
        return;
      } catch (err) {
        // not found -> create
        if (err.status === 404) {
          // get default branch sha
          const ref = await octokit.rest.git.getRef({ owner, repo, ref: `heads/${defaultBranch}` });
          const sha = ref.data.object.sha;
          await octokit.rest.git.createRef({ owner, repo, ref: `refs/heads/${branch}`, sha });
          return;
        }
        throw err;
      }
    }

    await ensureBranchExists(branchName);

    // Upload files: create or update each file on the branch
    for (const f of files) {
      const path = f.path;
      const content = typeof f.content === "string" ? f.content : JSON.stringify(f.content);
      const encoded = Buffer.from(content, "utf8").toString("base64");

      // Check if file exists in repo on that branch (to decide create/update)
      let sha;
      try {
        const existing = await octokit.rest.repos.getContent({ owner, repo, path, ref: branchName });
        sha = existing.data.sha;
      } catch (err) {
        if (err.status !== 404) {
          console.warn("getContent warning", err);
        }
      }

      // Upsert the file
      const message = `chore(tests): add/update ${path}`;
      if (sha) {
        await octokit.rest.repos.createOrUpdateFileContents({
          owner,
          repo,
          path,
          message,
          content: encoded,
          branch: branchName,
          sha,
        });
      } else {
        await octokit.rest.repos.createOrUpdateFileContents({
          owner,
          repo,
          path,
          message,
          content: encoded,
          branch: branchName,
        });
      }
    }

    // Check for existing open PR for same head/base
    const existingPRs = await octokit.rest.pulls.list({
      owner,
      repo,
      state: "open",
      head: `${owner}:${branchName}`,
      base: defaultBranch,
    });

    if (existingPRs.data && existingPRs.data.length > 0) {
      return res.status(200).json({ pr: existingPRs.data[0], note: "existing" });
    }

    // Create PR
    let finalBody = prBody || "Automated test generation PR";
    
    // Use formatter if stats are provided
    if (req.body.stats) {
      finalBody = formatPRBody(req.body.stats);
      // Append original body if it has custom content (not just the default)
      if (prBody && prBody !== "Automated test generation PR") {
         finalBody += `\n\n### 📝 Additional Notes\n${prBody}`;
      }
    }

    const pr = await octokit.rest.pulls.create({
      owner,
      repo,
      title: title || `Add generated tests (${new Date().toISOString().split("T")[0]})`,
      head: branchName,
      base: defaultBranch,
      body: finalBody,
    });

    res.status(200).json({ pr: pr.data });
  } catch (error) {
    console.error("❌ Error creating PR:", error);
    
    // Handle specific GitHub API errors
    if (error.status === 401) {
      return res.status(401).json({ error: "Unauthorized access to GitHub repository" });
    } else if (error.status === 404) {
      return res.status(404).json({ error: "Repository not found" });
    } else if (error.status === 403) {
      return res.status(403).json({ error: "Access forbidden to repository" });
    } else if (error.status === 422) {
      return res.status(422).json({ error: "Invalid request data" });
    }
    
    // For other errors, return 500
    return res.status(500).json({ error: "Failed to create pull request", details: error.message });
  }
}
