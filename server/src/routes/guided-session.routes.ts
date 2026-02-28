import { Router } from "express";
import { GuidedSessionController } from "../controllers/guided-session.controller.js";

const router = Router();

router.post("/start", GuidedSessionController.start);
router.get("/:sessionId", GuidedSessionController.getCurrent);
router.post("/:sessionId/respond", GuidedSessionController.respond);

export default router;
