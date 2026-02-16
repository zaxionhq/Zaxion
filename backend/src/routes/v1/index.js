// src/routes/v1/index.js
import { Router } from "express";
import authRoutesFactory from "../auth.routes.js";
import githubRoutesFactory from "../github.routes.js"; // Import githubRoutesFactory
import testcaseRoutesFactory from "../testcase.routes.js"; // Import testcaseRoutesFactory
import policyRoutesFactory from "../policy.routes.js";
import overrideRoutesFactory from "../override.routes.js";
import governanceMemoryRoutesFactory from "../governanceMemory.routes.js";
import analyticsRoutesFactory from "../governanceAnalytics.routes.js";
import chatbotRoutes from "../chatbot.routes.js";
import webhookRoutesFactory from "../webhook.routes.js";
import waitlistRoutesFactory from "../waitlist.routes.js";
import diagnosticsRoutes from "../diagnostics.routes.js";

export default function v1ApiRoutesFactory(db) {
  const router = Router();

  router.use("/auth", authRoutesFactory(db));
  router.use("/github", githubRoutesFactory(db)); // Use githubRoutesFactory
  router.use("/testcases", testcaseRoutesFactory(db)); // Use testcaseRoutesFactory
  router.use("/policies", policyRoutesFactory(db));
  router.use("/overrides", overrideRoutesFactory(db));
  router.use("/governance-memory", governanceMemoryRoutesFactory(db));
  router.use("/analytics/governance", analyticsRoutesFactory(db));
  router.use("/chatbot", chatbotRoutes);
  router.use("/webhooks", webhookRoutesFactory());
  router.use("/waitlist", waitlistRoutesFactory(db));
  router.use("/diagnostics", diagnosticsRoutes);

  return router;
}