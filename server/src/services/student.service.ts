import { eq } from "drizzle-orm";

import { db, schema } from "../db/index.js";
import { StudyPlanService } from "./studyplan.service.js";

export const StudentService = {
  async getByUserId(userId: number) {
    return db.query.students.findFirst({ where: eq(schema.students.userId, userId) });
  },

  async onboardingStep1(userId: number, input: {
    examType: "BEPC" | "BAC";
    grade: "3eme" | "terminale";
    series?: "A1" | "A2" | "C" | "D";
    school?: string;
  }) {
    let student = await db.query.students.findFirst({ where: eq(schema.students.userId, userId) });

    if (student) {
      const [updated] = await db
        .update(schema.students)
        .set({
          examType: input.examType,
          grade: input.grade,
          series: input.examType === "BAC" ? input.series ?? null : null,
          school: input.school || null,
          updatedAt: new Date(),
        })
        .where(eq(schema.students.id, student.id))
        .returning();

      student = updated;
    } else {
      const [created] = await db
        .insert(schema.students)
        .values({
          userId,
          country: "Côte d'Ivoire",
          examType: input.examType,
          grade: input.grade,
          series: input.examType === "BAC" ? input.series ?? null : null,
          school: input.school || null,
        })
        .returning();

      student = created;
    }

    return student;
  },

  async onboardingStep2(userId: number, input: { prioritySubjects: string[] }) {
    const student = await db.query.students.findFirst({ where: eq(schema.students.userId, userId) });
    if (!student) return null;

    const [updated] = await db
      .update(schema.students)
      .set({
        prioritySubjects: input.prioritySubjects,
        updatedAt: new Date(),
      })
      .where(eq(schema.students.id, student.id))
      .returning();

    return updated;
  },

  async onboardingStep3(userId: number, input: { targetScore: number; dailyTime: "15min" | "30min" | "1h" }) {
    const student = await db.query.students.findFirst({ where: eq(schema.students.userId, userId) });
    if (!student) return null;

    const [updated] = await db
      .update(schema.students)
      .set({
        targetScore: input.targetScore,
        dailyTime: input.dailyTime,
        updatedAt: new Date(),
      })
      .where(eq(schema.students.id, student.id))
      .returning();

    const studyPlan = await StudyPlanService.generateStudyPlan(updated);

    return { student: updated, studyPlan };
  },
};
