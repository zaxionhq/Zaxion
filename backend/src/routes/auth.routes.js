// src/routes/auth.routes.js
import { Router } from "express";
import authControllerFactory from "../controllers/auth.controller.js";
import { validate } from "../middleware/zodValidate.js";
import { githubCallbackQuery } from "../schemas/auth.schema.js";
import { requireLoginSoft } from "../middleware/auth.js";

export default function authRoutesFactory(db) {
  const router = Router();
  const authController = authControllerFactory(db);

  // GitHub OAuth routes
  router.get("/github", authController.githubLogin);
  router.get("/github/callback", validate({ query: githubCallbackQuery }), authController.githubCallback);

  // Session routes
  router.post("/logout", requireLoginSoft, authController.logout); 
  router.post("/refresh", authController.refreshTokens); 
  router.get("/me", authController.me);

  return router;
}
