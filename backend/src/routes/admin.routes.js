import { Router } from "express";
import { getTodos } from "../controllers/admin.controller.js";
import { authenticateJWT } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";

const router = Router();

// Developer visible TODO list for prioritized items (Admin only)
router.get("/todos", authenticateJWT, authorize(['admin']), getTodos);

export default router;
