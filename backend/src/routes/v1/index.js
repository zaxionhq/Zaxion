// src/routes/v1/index.js
import { Router } from "express";
import authRoutesFactory from "../auth.routes.js";
import githubRoutesFactory from "../github.routes.js"; // Import githubRoutesFactory
import testcaseRoutesFactory from "../testcase.routes.js"; // Import testcaseRoutesFactory
import adminRoutes from "../admin.routes.js";
import chatbotRoutes from "../chatbot.routes.js";

export default function v1ApiRoutesFactory(db) {
  const router = Router();
  // console.log('v1ApiRoutesFactory called. db.User:', db.User ? 'defined' : 'undefined', 'db.RefreshToken:', db.RefreshToken ? 'defined' : 'undefined');

  router.use("/auth", authRoutesFactory(db));
  router.use("/github", githubRoutesFactory(db)); // Use githubRoutesFactory
  router.use("/testcases", testcaseRoutesFactory(db)); // Use testcaseRoutesFactory
  router.use("/admin", adminRoutes);
  router.use("/chatbot", chatbotRoutes);

  return router;
}