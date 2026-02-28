import { Router } from "express";

import { AdminController } from "../controllers/admin.controller.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);
router.use(requireRole(["admin"]));

router.get("/overview", AdminController.overview);
router.get("/users", AdminController.users);
router.patch("/users/:id/status", AdminController.updateUserStatus);
router.get("/activity", AdminController.activity);

export default router;
