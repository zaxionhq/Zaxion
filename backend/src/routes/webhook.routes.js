import { Router } from "express";
import { handleGitHubWebhook, handleMarketplaceWebhook, handleStripeWebhook } from "../controllers/webhook.controller.js";

export default function webhookRoutesFactory() {
  const router = Router();

  // POST /api/v1/webhooks/github
  router.post("/github", handleGitHubWebhook);

  // POST /api/v1/webhooks/marketplace
  router.post("/marketplace", handleMarketplaceWebhook);

  // POST /api/v1/webhooks/stripe
  router.post("/stripe", handleStripeWebhook);

  return router;
}
