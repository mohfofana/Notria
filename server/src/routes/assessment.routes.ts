import { Router } from "express";
import { AssessmentController } from "../controllers/assessment.controller.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = Router();

// All assessment routes require authentication
router.use(authenticate);
router.use(requireRole(["student"]));

// Assessment overview for exam section
router.get("/overview", AssessmentController.getOverview);

// Start assessment
router.post("/start", AssessmentController.startAssessment);

// Get next question
router.get("/question", AssessmentController.getNextQuestion);

// Submit answer
router.post("/answer", AssessmentController.submitAnswer);

// Get latest results
router.get("/results", AssessmentController.getResults);

export default router;
