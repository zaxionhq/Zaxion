import express from "express";
import { getQueueStatus, sendTestEmail } from "../controllers/diagnostics.controller.js";

const router = express.Router();

router.get("/queue-status", getQueueStatus);
router.get("/test-email", sendTestEmail);

export default router;
