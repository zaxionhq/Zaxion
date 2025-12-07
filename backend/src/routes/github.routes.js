// src/routes/github.routes.js
import { Router } from "express";
import { requireGithub } from "../middleware/auth.js";
import * as githubController from "../controllers/github.controller.js";
import authControllerFactory from "../controllers/auth.controller.js"; // Import authControllerFactory
import { validate } from "../middleware/zodValidate.js";
import { listRepoFilesQuery, getRepoTreeQuery, createPrBody } from "../schemas/github.schema.js";

export default function githubRoutesFactory(db) {
  const router = Router();
  const authController = authControllerFactory(db); // Instantiate authController

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
  router.post(
    "/repos/:owner/:repo/pr",
    validate({ body: createPrBody }),
    requireGithub,
    githubController.createPullRequestWithFiles
  );

  return router;
}
