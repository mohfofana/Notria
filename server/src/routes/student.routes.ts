import { Router } from "express";
import { StudentController } from "../controllers/student.controller.js";
import { authenticate, requireRole } from "../middleware/auth.js";

export const studentRouter = Router();

studentRouter.use(authenticate);
studentRouter.use(requireRole(["student"]));

studentRouter.get("/me", StudentController.getProfile);
studentRouter.post("/onboarding/step-1", StudentController.onboardingStep1);
studentRouter.post("/onboarding/step-2", StudentController.onboardingStep2);
studentRouter.post("/onboarding/step-3", StudentController.onboardingStep3);
