import { Router } from "express";
import { ChatController } from "../controllers/chat.controller.js";
import { authenticate, requireRole } from "../middleware/auth.js";

export const chatRouter = Router();

chatRouter.use(authenticate);
chatRouter.use(requireRole(["student"]));

chatRouter.post("/", ChatController.create);
chatRouter.get("/", ChatController.list);
chatRouter.get("/:id", ChatController.get);
chatRouter.delete("/:id", ChatController.archive);
chatRouter.post("/:id/messages", ChatController.sendMessage);
