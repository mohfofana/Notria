import { Router } from "express";
import { GuidedSessionController } from "../controllers/guided-session.controller.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);
router.use(requireRole(["student"]));

router.post("/start", GuidedSessionController.start);
router.get("/:sessionId", GuidedSessionController.getCurrent);
router.post("/:sessionId/respond", GuidedSessionController.respond);
router.post("/:sessionId/complete", GuidedSessionController.complete);

export default router;
