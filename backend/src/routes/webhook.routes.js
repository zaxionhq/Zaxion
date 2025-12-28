import { Router } from "express";
import { handleGitHubWebhook } from "../controllers/webhook.controller.js";

export default function webhookRoutesFactory() {
  const router = Router();

  // POST /api/v1/webhooks/github
  router.post("/github", handleGitHubWebhook);

  return router;
}
