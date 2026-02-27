import { Router } from "express";
import { SessionController } from "../controllers/session.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

// All session routes require authentication
router.use(authenticate);

// Get today's session
router.get("/today", SessionController.getTodaysSession);

// Start a session
router.post("/start", SessionController.startSession);

// Get today's homework
router.get("/homework/today", SessionController.getTodaysHomework);

export default router;
