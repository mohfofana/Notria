import { Router } from "express";
import { AssessmentController } from "../controllers/assessment.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

// All assessment routes require authentication
router.use(authenticate);

// Start assessment
router.post("/start", AssessmentController.startAssessment);

// Get next question
router.get("/question", AssessmentController.getNextQuestion);

// Submit answer
router.post("/answer", AssessmentController.submitAnswer);

// Get latest results
router.get("/results", AssessmentController.getResults);

export default router;
