// src/routes/testcase.routes.js
import { Router } from "express";
import testcaseControllerFactory from "../controllers/testcase.controller.js";
import { requireGithub, authenticateJWT } from "../middleware/auth.js"; // Use authenticateJWT
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/zodValidate.js";
import {
  generateTestsBody,
  generateSummariesBody,
  generateCodeBody,
  createTestcaseBody,
  updateTestcaseBody,
  executeTestsBody,
} from "../schemas/testcase.schema.js";

export default function testcaseRoutesFactory(db) {
  const router = Router();
  const testcaseController = testcaseControllerFactory(db); // Instantiate testcaseController

  /**
   * Execute generated tests in a sandbox environment.
   * body: { testCode: string, sourceCode: string, language: string, framework: string }
   */
  router.post(
    "/execute",
    authenticateJWT,
    validate({ body: executeTestsBody }),
    authorize(['user', 'admin']),
    testcaseController.executeTests
  );

  // Mock test generation endpoint removed - using real AI generation instead

  /**
   * AI: generate summaries for a set of files
   * body: { files: [{path, language, content?}], repo?: {owner, repo} }
   */
  router.post(
    "/generate/summaries",
    authenticateJWT,
    validate({ body: generateSummariesBody }),
    authorize(['user', 'admin']),
    testcaseController.generateSummaries
  );

  /**
   * AI: from a chosen summary, generate code
   * body: { summaryId, files, framework? }
   */
  router.post(
    "/generate/code",
    authenticateJWT,
    validate({ body: generateCodeBody }),
    authorize(['user', 'admin']),
    testcaseController.generateCode
  );

  // DB CRUD (optional for persistence)
  router.post(
    "/",
    authenticateJWT,
    validate({ body: createTestcaseBody }),
    authorize(['user', 'admin']),
    testcaseController.create
  );

  router.get("/", authenticateJWT, authorize(['user', 'admin']), testcaseController.list);
  router.get("/:id", authenticateJWT, authorize(['user', 'admin']), testcaseController.getById);
  router.put(
    "/:id",
    authenticateJWT,
    validate({ body: updateTestcaseBody, params: null }),
    authorize(['user', 'admin']),
    testcaseController.update
  );
  router.delete("/:id", authenticateJWT, authorize(['user', 'admin']), testcaseController.remove);

  return router;
}
