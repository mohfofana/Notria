import type { Request, Response } from "express";
import { eq, and } from "drizzle-orm";
import { db, schema } from "../db/index.js";

export const StudyPlanController = {
  async getStudyPlan(req: Request, res: Response) {
    const userId = req.user!.userId;
    const student = await db.query.students.findFirst({ where: eq(schema.students.userId, userId) });
    if (!student) return res.status(404).json({ error: "Student not found" });

    const studyPlan = await db.query.studyPlans.findFirst({
      where: eq(schema.studyPlans.studentId, student.id),
    });
    if (!studyPlan) return res.status(404).json({ error: "Aucun programme trouvé" });

    const weeks = await db.query.studyPlanWeeks.findMany({
      where: eq(schema.studyPlanWeeks.studyPlanId, studyPlan.id),
    });

    return res.json({ studyPlan: { ...studyPlan, weeks } });
  },

  async getCurrentWeek(req: Request, res: Response) {
    const userId = req.user!.userId;
    const student = await db.query.students.findFirst({ where: eq(schema.students.userId, userId) });
    if (!student) return res.status(404).json({ error: "Student not found" });

    const studyPlan = await db.query.studyPlans.findFirst({
      where: eq(schema.studyPlans.studentId, student.id),
    });
    if (!studyPlan) return res.status(404).json({ error: "Aucun programme trouvé" });

    const entries = await db.query.studyPlanWeeks.findMany({
      where: and(
        eq(schema.studyPlanWeeks.studyPlanId, studyPlan.id),
        eq(schema.studyPlanWeeks.weekNumber, studyPlan.currentWeek),
      ),
    });

    return res.json({
      weekNumber: studyPlan.currentWeek,
      totalWeeks: studyPlan.totalWeeks,
      entries,
    });
  },
};
