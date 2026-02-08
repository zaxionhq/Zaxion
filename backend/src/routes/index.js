// src/routes/index.js
import { Router } from "express";
// import authRoutes from "./auth.routes.js";
// import githubRoutes from "./github.routes.js";
// import testCaseRoutes from "./testcase.routes.js";
// import adminRoutes from "./admin.routes.js";
import v1ApiRoutesFactory from "./v1/index.js"; // Ensure .js extension is present

export default function routesFactory(db) {
  const router = Router();

  // Mount v1 API routes under /v1
  router.use("/v1", v1ApiRoutesFactory(db));

  // router.use("/auth", authRoutes);
  // router.use("/github", githubRoutes);
  // router.use("/testcases", testCaseRoutes);
  // router.use("/admin", adminRoutes);

  return router;
}
