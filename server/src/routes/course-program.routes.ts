import { Router } from "express";
import { CourseProgramController } from "../controllers/course-program.controller.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = Router();

// All course program routes require authentication as student
router.use(authenticate);
router.use(requireRole(["student"]));

// Get current active program
router.get("/current", CourseProgramController.getCurrent);

// Get next session in strict program order
router.get("/next-session", CourseProgramController.getNextSession);

// Get specific week details
router.get("/week/:weekNumber", CourseProgramController.getWeek);

// Mark a session as completed
router.patch("/session/:sessionId/complete", CourseProgramController.completeSession);

export default router;
