import type { Request, Response } from "express";
import { GuidedSessionService } from "../services/guided-session.service.js";
import { CourseProgramService } from "../services/course-program.service.js";

export const GuidedSessionController = {
  async start(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const rawProgramSessionId = req.body?.courseProgramSessionId;
      const courseProgramSessionId =
        typeof rawProgramSessionId === "number"
          ? rawProgramSessionId
          : typeof rawProgramSessionId === "string"
            ? parseInt(rawProgramSessionId, 10)
            : undefined;

      if (courseProgramSessionId && !Number.isNaN(courseProgramSessionId)) {
        const started = await CourseProgramService.startSession(userId, courseProgramSessionId);
        const result = await GuidedSessionService.start({
          topic: started.session.topic,
          title: started.session.title,
          description: started.session.description ?? undefined,
          type: started.session.type,
          durationMinutes: started.session.durationMinutes,
          objectives: (started.session.objectives as string[] | undefined) ?? [],
          content: (started.session.content as {
            keyConcepts?: string[];
            exercises?: string[];
            ragSources?: string[];
          } | undefined) ?? undefined,
          courseProgramSessionId: started.session.id,
        });
        return res.status(201).json(result);
      }

      const topic =
        typeof req.body?.topic === "string" && req.body.topic.trim().length > 0
          ? req.body.topic.trim()
          : "seance du jour";

      const result = await GuidedSessionService.start({ topic });
      return res.status(201).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to start session";
      return res.status(400).json({ error: message });
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

  async respond(req: Request, res: Response) {
    try {
      const result = await GuidedSessionService.respond(req.params.sessionId as string, {
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

  async complete(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const sessionId = req.params.sessionId as string;
      if (!GuidedSessionService.canComplete(sessionId)) {
        return res.status(400).json({
          error: "La session guidee n'est pas terminee. Termine le recap et l'exo final.",
        });
      }
      const context = GuidedSessionService.getSessionContext(sessionId);

      if (context.courseProgramSessionId) {
        await CourseProgramService.completeSession(userId, context.courseProgramSessionId);
      }

      GuidedSessionService.close(sessionId);
      return res.json({ success: true });
    } catch (error) {
      if (error instanceof Error && error.message === "SESSION_NOT_FOUND") {
        return res.status(404).json({ error: "Session not found" });
      }
      const message = error instanceof Error ? error.message : "Failed to complete session";
      return res.status(400).json({ error: message });
    }
  },
};
