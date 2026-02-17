import express from "express";
import { getQueueStatus, sendTestEmail, cleanQueue, checkNetwork } from "../controllers/diagnostics.controller.js";

const router = express.Router();

router.get("/queue-status", getQueueStatus);
router.get("/test-email", sendTestEmail);
router.post("/clean-queue", cleanQueue);
router.get("/check-network", checkNetwork);

export default router;
