// src/routes/waitlist.routes.js
import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as waitlistController from "../controllers/waitlist.controller.js";
import { authenticateJWT } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";

const waitlistLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 requests per hour
  message: {
    success: false,
    message: "Too many protocol registration attempts. Please wait one hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export default function waitlistRoutesFactory(db) {
  const router = Router();

  // Public: Join waitlist
  router.post("/", waitlistLimiter, waitlistController.joinWaitlist);

  // Admin: Get all entries
  router.get("/", authenticateJWT, authorize(['admin']), waitlistController.getWaitlist);

  return router;
}
