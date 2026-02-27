import { Router } from "express";
import { ParentController } from "../controllers/parent.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

// All parent routes require authentication
router.use(authenticate);

// Get parent dashboard
router.get("/dashboard", ParentController.getDashboard);

// Mark notification as read
router.post("/notifications/read", ParentController.markNotificationRead);

export default router;
