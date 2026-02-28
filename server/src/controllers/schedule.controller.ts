import type { Request, Response } from "express";
import { eq, and, gte } from "drizzle-orm";
import { scheduleSetupSchema } from "@notria/shared";
import { db, schema } from "../db/index.js";

function getNextDayOfWeek(from: Date, dayOfWeek: number, weekOffset: number): Date {
  const result = new Date(from);
  const currentDay = result.getDay();
  let daysToAdd = dayOfWeek - currentDay;
  if (daysToAdd <= 0) daysToAdd += 7;
  result.setDate(result.getDate() + daysToAdd + weekOffset * 7);
  result.setHours(0, 0, 0, 0);
  return result;
}

export const ScheduleController = {
  async setupSchedule(req: Request, res: Response) {
    const parsed = scheduleSetupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Données invalides", details: parsed.error.flatten() });
    }

    const userId = req.user!.userId;
    const student = await db.query.students.findFirst({ where: eq(schema.students.userId, userId) });
    if (!student) return res.status(404).json({ error: "Student not found" });

    const { daysOfWeek, startTime, durationMinutes } = parsed.data;
    const duration = parseInt(durationMinutes);

    // Clear existing schedules
    await db.delete(schema.scheduledSessions).where(eq(schema.scheduledSessions.studentId, student.id));
    await db.delete(schema.schedules).where(eq(schema.schedules.studentId, student.id));

    // Create schedule records
    const scheduleRecords = [];
    for (const dayOfWeek of daysOfWeek) {
      const [record] = await db.insert(schema.schedules).values({
        studentId: student.id,
        dayOfWeek,
        startTime,
        durationMinutes: duration,
      }).returning();
      scheduleRecords.push(record);
    }

    // Generate sessions for next 4 weeks based on study plan
    const studyPlan = await db.query.studyPlans.findFirst({
      where: eq(schema.studyPlans.studentId, student.id),
    });

    if (studyPlan) {
      const currentWeekEntries = await db.query.studyPlanWeeks.findMany({
        where: and(
          eq(schema.studyPlanWeeks.studyPlanId, studyPlan.id),
          eq(schema.studyPlanWeeks.weekNumber, studyPlan.currentWeek),
        ),
      });

      const sessions: Array<{ studentId: number; scheduleId: number; date: Date; subject: string; topic: string | null; status: "upcoming" }> = [];
      const today = new Date();
      for (let weekOffset = 0; weekOffset < 4; weekOffset++) {
        for (const scheduleRecord of scheduleRecords) {
          const date = getNextDayOfWeek(today, scheduleRecord.dayOfWeek, weekOffset);
          const entryIdx = currentWeekEntries.length > 0
            ? sessions.length % currentWeekEntries.length
            : -1;
          const entry = entryIdx >= 0 ? currentWeekEntries[entryIdx] : null;

          sessions.push({
            studentId: student.id,
            scheduleId: scheduleRecord.id,
            date,
            subject: entry?.subject ?? "Révisions",
            topic: entry?.topic ?? null,
            status: "upcoming" as const,
          });
        }
      }

      if (sessions.length > 0) {
        await db.insert(schema.scheduledSessions).values(sessions);
      }
    }

    // Map duration to dailyTime and mark onboarding as completed
    const dailyTimeMap: Record<string, string> = { "30": "30min", "45": "30min", "60": "1h" };
    const dailyTime = dailyTimeMap[durationMinutes] ?? "30min";

    await db.update(schema.students)
      .set({ dailyTime, onboardingCompleted: true, updatedAt: new Date() })
      .where(eq(schema.students.id, student.id));

    return res.status(201).json({ schedules: scheduleRecords });
  },

  async getSchedules(req: Request, res: Response) {
    const userId = req.user!.userId;
    const student = await db.query.students.findFirst({ where: eq(schema.students.userId, userId) });
    if (!student) return res.status(404).json({ error: "Student not found" });

    const schedules = await db.query.schedules.findMany({
      where: and(eq(schema.schedules.studentId, student.id), eq(schema.schedules.isActive, true)),
    });

    return res.json({ schedules });
  },

  async getUpcomingSessions(req: Request, res: Response) {
    const userId = req.user!.userId;
    const student = await db.query.students.findFirst({ where: eq(schema.students.userId, userId) });
    if (!student) return res.status(404).json({ error: "Student not found" });

    const sessions = await db.query.scheduledSessions.findMany({
      where: and(
        eq(schema.scheduledSessions.studentId, student.id),
        gte(schema.scheduledSessions.date, new Date()),
      ),
    });

    return res.json({ sessions });
  },
};
