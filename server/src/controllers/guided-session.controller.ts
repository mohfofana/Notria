import type { Request, Response } from "express";
import { GuidedSessionService } from "../services/guided-session.service.js";

export const GuidedSessionController = {
  async start(req: Request, res: Response) {
    const topic =
      typeof req.body?.topic === "string" && req.body.topic.trim().length > 0
        ? req.body.topic.trim()
        : "seance du jour";

    try {
      const result = await GuidedSessionService.start(topic);
      return res.status(201).json(result);
    } catch {
      return res.status(500).json({ error: "Failed to start session" });
    }
  },

  getCurrent(req: Request, res: Response) {
    try {
      const result = GuidedSessionService.getCurrent(req.params.sessionId as string);
      return res.json(result);
    } catch (error) {
      if (error instanceof Error && error.message === "SESSION_NOT_FOUND") {
        return res.status(404).json({ error: "Session not found" });
      }
      return res.status(500).json({ error: "Failed to get session" });
    }
  },

  respond(req: Request, res: Response) {
    try {
      const result = GuidedSessionService.respond(req.params.sessionId as string, {
        choiceId: typeof req.body?.choiceId === "string" ? req.body.choiceId : undefined,
        response:
          typeof req.body?.response === "string" || typeof req.body?.response === "number"
            ? req.body.response
            : undefined,
      });
      return res.json(result);
    } catch (error) {
      if (error instanceof Error && error.message === "SESSION_NOT_FOUND") {
        return res.status(404).json({ error: "Session not found" });
      }
      return res.status(500).json({ error: "Failed to process response" });
    }
  },
};
