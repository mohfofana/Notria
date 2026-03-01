import type { Request, Response } from "express";
import { CourseProgramService } from "../services/course-program.service.js";

export const CourseProgramController = {
  /**
   * GET /api/course-program/current
   * Get the current active program with all weeks and sessions.
   */
  async getCurrent(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const program = await CourseProgramService.getCurrentProgram(userId);

      if (!program) {
        return res.json({ success: true, data: null });
      }

      return res.json({ success: true, data: program });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch program";
      return res.status(400).json({ success: false, error: message });
    }
  },

  /**
   * GET /api/course-program/next-session
   * Get the next session to run according to strict program order.
   */
  async getNextSession(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const next = await CourseProgramService.getNextSession(userId);

      if (!next) {
        return res.json({
          success: true,
          data: { hasNextSession: false },
        });
      }

      return res.json({
        success: true,
        data: {
          hasNextSession: true,
          ...next,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch next session";
      return res.status(400).json({ success: false, error: message });
    }
  },

  /**
   * GET /api/course-program/week/:weekNumber
   * Get details for a specific week.
   */
  async getWeek(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const weekNumber = parseInt(String(req.params.weekNumber), 10);

      if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 4) {
        return res.status(400).json({ success: false, error: "Invalid week number (1-4)" });
      }

      const week = await CourseProgramService.getWeekDetails(userId, weekNumber);
      return res.json({ success: true, data: week });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch week";
      return res.status(400).json({ success: false, error: message });
    }
  },

  /**
   * PATCH /api/course-program/session/:sessionId/complete
   * Mark a session as completed.
   */
  async completeSession(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const sessionId = parseInt(String(req.params.sessionId), 10);
      const score = req.body.score != null ? parseInt(req.body.score, 10) : undefined;

      if (isNaN(sessionId)) {
        return res.status(400).json({ success: false, error: "Invalid session ID" });
      }

      const result = await CourseProgramService.completeSession(userId, sessionId, score);
      return res.json({ success: true, data: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to complete session";
      return res.status(400).json({ success: false, error: message });
    }
  },
};
