// src/routes/chatbot.routes.js
import { Router } from "express";
import { authenticateJWT } from "../middleware/auth.js";
import * as chatbotController from "../controllers/chatbot.controller.js";
import { validate } from "../middleware/zodValidate.js";
import { chatMessageBody, coverageAnalysisBody } from "../schemas/chatbot.schema.js";

const router = Router();

// Chat with AI for test improvement
router.post(
  "/chat",
  validate({ body: chatMessageBody }),
  authenticateJWT,
  chatbotController.chatWithAI
);

// Analyze test coverage
router.post(
  "/coverage",
  validate({ body: coverageAnalysisBody }),
  authenticateJWT,
  chatbotController.analyzeTestCoverage
);

export default router;
