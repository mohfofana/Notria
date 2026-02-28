import { Router } from "express";
import { ParentController } from "../controllers/parent.controller.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = Router();

// All parent routes require authentication
router.use(authenticate);
router.use(requireRole(["parent"]));

// Get parent dashboard
router.get("/dashboard", ParentController.getDashboard);

// Mark notification as read
router.post("/notifications/read", ParentController.markNotificationRead);

export default router;
