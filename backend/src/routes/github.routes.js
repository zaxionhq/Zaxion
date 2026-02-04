// src/routes/github.routes.js
import { Router } from "express";
import { requireGithub } from "../middleware/auth.js";
import githubControllerFactory from "../controllers/github.controller.js";
import authControllerFactory from "../controllers/auth.controller.js";
import { validate } from "../middleware/zodValidate.js";
import { listRepoFilesQuery, getRepoTreeQuery, createPrBody, executeOverrideBody } from "../schemas/github.schema.js";

export default function githubRoutesFactory(db) {
  const router = Router();
  const authController = authControllerFactory(db);
  const githubController = githubControllerFactory(db);

  // List authenticated user's repos
  router.get("/repos", requireGithub, githubController.listRepos);

  // List branches for a repo
  router.get(
    "/repos/:owner/:repo/branches",
    requireGithub,
    githubController.listBranches
  );

  // List files in a repo path
  router.get(
    "/repos/:owner/:repo/files",
    validate({ query: listRepoFilesQuery }),
    requireGithub,
    githubController.listRepoFiles
  );

  // Get recursive file tree
  router.get(
    "/repos/:owner/:repo/tree",
    validate({ query: getRepoTreeQuery }),
    requireGithub,
    githubController.getRepoTree
  );

  // Create PR with test cases
  router.get(
    "/repos/:owner/:repo/pr/:prNumber/decision",
    requireGithub,
    githubController.getLatestDecision
  );

  router.get(
    "/decisions/:decisionId",
    requireGithub,
    githubController.getDecisionById
  );

  router.post(
    "/repos/:owner/:repo/pr",
    validate({ body: createPrBody }),
    requireGithub,
    githubController.createPullRequestWithFiles
  );

  // Manual Override for PR Gate
  router.post(
    "/repos/:owner/:repo/pr/:prNumber/override",
    validate({ body: executeOverrideBody }),
    requireGithub,
    githubController.executeOverride
  );

  // Merge PR
  router.post(
    "/repos/:owner/:repo/pr/:prNumber/merge",
    requireGithub,
    githubController.mergePullRequest
  );

  return router;
}
