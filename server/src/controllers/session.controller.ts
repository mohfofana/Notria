import { Request, Response } from "express";
import { SessionService } from "../services/session.service.js";

export const SessionController = {
  async getTodaysSession(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const session = await SessionService.getTodaysSession(userId);

      if (!session) {
        return res.json({
          success: true,
          data: { hasSession: false },
        });
      }

      res.json({
        success: true,
        data: {
          hasSession: true,
          session: {
            id: session.session.id,
            subject: session.subject,
            startTime: session.startTime,
            durationMinutes: session.durationMinutes,
            conversationId: session.conversation.id,
          },
        },
      });
    } catch (error: any) {
      console.error("Get today's session error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to get today's session",
      });
    }
  },

  async startSession(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { sessionId } = req.body;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: "Session ID required",
        });
      }

      const result = await SessionService.startSession(userId, sessionId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("Start session error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to start session",
      });
    }
  },

  async getTodaysHomework(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const homework = await SessionService.getTodaysHomework(userId);

      res.json({
        success: true,
        data: {
          homework,
          count: homework.length,
        },
      });
    } catch (error: any) {
      console.error("Get today's homework error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to get today's homework",
      });
    }
  },
};
