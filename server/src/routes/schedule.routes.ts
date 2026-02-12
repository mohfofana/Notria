import { Router } from "express";
import { ScheduleController } from "../controllers/schedule.controller.js";
import { authenticate, requireRole } from "../middleware/auth.js";

export const scheduleRouter = Router();

scheduleRouter.use(authenticate);
scheduleRouter.use(requireRole(["student"]));

scheduleRouter.post("/setup", ScheduleController.setupSchedule);
scheduleRouter.get("/", ScheduleController.getSchedules);
scheduleRouter.get("/sessions", ScheduleController.getUpcomingSessions);
