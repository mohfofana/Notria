import type { Request, Response } from "express";

import { AdminService } from "../services/admin.service.js";
import { AIMetricsService } from "../observability/ai-metrics.service.js";

export const AdminController = {
  async overview(_req: Request, res: Response) {
    try {
      const data = await AdminService.getOverview();
      return res.json({ success: true, data });
    } catch (error: any) {
      console.error("Admin overview error:", error);
      return res.status(500).json({ success: false, error: "Failed to load overview" });
    }
  },

  async users(req: Request, res: Response) {
    try {
      const role = req.query.role as "student" | "parent" | "admin" | undefined;
      const search = typeof req.query.search === "string" ? req.query.search : undefined;
      const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : undefined;
      const data = await AdminService.listUsers({ role, search, limit });
      return res.json({ success: true, data });
    } catch (error: any) {
      console.error("Admin users error:", error);
      return res.status(500).json({ success: false, error: "Failed to load users" });
    }
  },

  async updateUserStatus(req: Request, res: Response) {
    try {
      const userId = Number(req.params.id);
      const isActive = req.body?.isActive === true;

      if (!Number.isFinite(userId)) {
        return res.status(400).json({ success: false, error: "Invalid user id" });
      }

      const updated = await AdminService.updateUserStatus(userId, isActive);
      if (!updated) {
        return res.status(404).json({ success: false, error: "User not found" });
      }

      return res.json({ success: true, data: updated });
    } catch (error: any) {
      console.error("Admin update user status error:", error);
      return res.status(500).json({ success: false, error: "Failed to update user status" });
    }
  },

  async activity(req: Request, res: Response) {
    try {
      const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : 20;
      const data = await AdminService.getActivity(limit);
      return res.json({ success: true, data });
    } catch (error: any) {
      console.error("Admin activity error:", error);
      return res.status(500).json({ success: false, error: "Failed to load activity" });
    }
  },

  async aiMetrics(_req: Request, res: Response) {
    try {
      const snapshot = AIMetricsService.snapshot();
      const alerts = snapshot.prompts
        .filter((prompt) => prompt.calls >= 5 && prompt.fallbackRate >= 0.3)
        .map((prompt) => ({
          type: "high_fallback_rate",
          prompt: `${prompt.promptId}@${prompt.version}`,
          fallbackRate: prompt.fallbackRate,
          calls: prompt.calls,
        }));

      return res.json({ success: true, data: { snapshot, alerts } });
    } catch (error: any) {
      console.error("Admin ai metrics error:", error);
      return res.status(500).json({ success: false, error: "Failed to load AI metrics" });
    }
  },

  async exportUsersCsv(req: Request, res: Response) {
    try {
      const role = req.query.role as "student" | "parent" | "admin" | undefined;
      const search = typeof req.query.search === "string" ? req.query.search : undefined;
      const data = await AdminService.listUsers({ role, search, limit: 5000 });

      const rows = [
        ["id", "firstName", "lastName", "phone", "role", "isActive", "createdAt"].join(","),
        ...data.map((user) =>
          [
            user.id,
            JSON.stringify(user.firstName),
            JSON.stringify(user.lastName),
            JSON.stringify(user.phone),
            user.role,
            user.isActive ? "true" : "false",
            new Date(user.createdAt).toISOString(),
          ].join(","),
        ),
      ];

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename=\"notria-users-${Date.now()}.csv\"`);
      return res.status(200).send(rows.join("\n"));
    } catch (error: any) {
      console.error("Admin export users csv error:", error);
      return res.status(500).json({ success: false, error: "Failed to export users" });
    }
  },
};
