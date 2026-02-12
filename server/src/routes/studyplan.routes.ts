import { Router } from "express";
import { StudyPlanController } from "../controllers/studyplan.controller.js";
import { authenticate, requireRole } from "../middleware/auth.js";

export const studyPlanRouter = Router();

studyPlanRouter.use(authenticate);
studyPlanRouter.use(requireRole(["student"]));

studyPlanRouter.get("/", StudyPlanController.getStudyPlan);
studyPlanRouter.get("/current-week", StudyPlanController.getCurrentWeek);
