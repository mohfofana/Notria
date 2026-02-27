import { Request, Response } from "express";
import { ParentService } from "../services/parent.service.js";

export const ParentController = {
  async getDashboard(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const dashboard = await ParentService.getParentDashboard(userId);

      res.json({
        success: true,
        data: dashboard,
      });
    } catch (error: any) {
      console.error("Get parent dashboard error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to get parent dashboard",
      });
    }
  },

  async markNotificationRead(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { notificationId } = req.body;

      const result = await ParentService.markNotificationAsRead(userId, notificationId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("Mark notification read error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to mark notification as read",
      });
    }
  },
};
