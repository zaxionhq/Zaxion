// src/routes/v1/index.js
import { Router } from "express";
import authRoutesFactory from "../auth.routes.js";
import githubRoutesFactory from "../github.routes.js"; // Import githubRoutesFactory
import testcaseRoutesFactory from "../testcase.routes.js"; // Import testcaseRoutesFactory
import policyRoutesFactory from "../policy.routes.js";
import overrideRoutesFactory from "../override.routes.js";
import chatbotRoutes from "../chatbot.routes.js";
import webhookRoutesFactory from "../webhook.routes.js";

export default function v1ApiRoutesFactory(db) {
  const router = Router();
  // console.log('v1ApiRoutesFactory called. db.User:', db.User ? 'defined' : 'undefined', 'db.RefreshToken:', db.RefreshToken ? 'defined' : 'undefined');

  router.use("/auth", authRoutesFactory(db));
  router.use("/github", githubRoutesFactory(db)); // Use githubRoutesFactory
  router.use("/testcases", testcaseRoutesFactory(db)); // Use testcaseRoutesFactory
  router.use("/policies", policyRoutesFactory(db));
  router.use("/overrides", overrideRoutesFactory(db));
  router.use("/chatbot", chatbotRoutes);
  router.use("/webhooks", webhookRoutesFactory());

  return router;
}