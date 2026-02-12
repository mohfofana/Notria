import { eq } from "drizzle-orm";
import { getTopicsForSubject } from "@notria/shared";
import { db, schema } from "../db/index.js";
import type { Student } from "../db/schema.js";

export const StudyPlanService = {
  async generateStudyPlan(student: Student) {
    // 1. Calculate weeks until exam (BAC/BEPC in June)
    const now = new Date();
    let examYear = now.getFullYear();
    const examDate = new Date(examYear, 5, 15); // June 15
    if (examDate <= now) {
      examDate.setFullYear(examYear + 1);
    }

    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const totalWeeks = Math.max(4, Math.floor((examDate.getTime() - now.getTime()) / msPerWeek));

    // 2. Get priority subjects and their topics
    const prioritySubjects: string[] = (student.prioritySubjects as string[]) ?? [];
    if (prioritySubjects.length === 0) return null;

    const subjectTopics: { subject: string; topics: string[] }[] = [];
    for (const subject of prioritySubjects) {
      const topics = [...getTopicsForSubject(subject, student.examType as "BEPC" | "BAC")];
      // Fallback if no topics defined
      if (topics.length === 0) {
        for (let i = 1; i <= 6; i++) {
          topics.push(`Chapitre ${i}`);
        }
      }
      subjectTopics.push({ subject, topics });
    }

    // 3. Define 3 phases
    const phase1End = Math.floor(totalWeeks * 0.4);
    const phase2End = Math.floor(totalWeeks * 0.8);

    const phases = [
      { name: "Fondamentaux", startWeek: 1, endWeek: phase1End },
      { name: "Approfondissement", startWeek: phase1End + 1, endWeek: phase2End },
      { name: "Révisions", startWeek: phase2End + 1, endWeek: totalWeeks },
    ];

    // 4. Create the study plan record
    const [studyPlan] = await db.insert(schema.studyPlans).values({
      studentId: student.id,
      examDate,
      totalWeeks,
      currentWeek: 1,
      phases: JSON.stringify(phases),
    }).returning();

    // 5. Generate week entries with round-robin topics
    const weekEntries: Array<{
      studyPlanId: number;
      weekNumber: number;
      subject: string;
      topic: string;
      objective: string;
      status: "upcoming" | "in_progress" | "completed";
    }> = [];

    const topicIndex: Record<string, number> = {};
    for (const st of subjectTopics) {
      topicIndex[st.subject] = 0;
    }

    for (let week = 1; week <= totalWeeks; week++) {
      let phaseName = "Révisions";
      if (week <= phase1End) phaseName = "Fondamentaux";
      else if (week <= phase2End) phaseName = "Approfondissement";

      for (const st of subjectTopics) {
        const idx = topicIndex[st.subject] % st.topics.length;
        const topic = st.topics[idx];

        let objective: string;
        if (phaseName === "Fondamentaux") {
          objective = `Comprendre les bases de : ${topic}`;
        } else if (phaseName === "Approfondissement") {
          objective = `Approfondir et pratiquer : ${topic}`;
        } else {
          objective = `Réviser et consolider : ${topic}`;
        }

        weekEntries.push({
          studyPlanId: studyPlan.id,
          weekNumber: week,
          subject: st.subject,
          topic,
          objective,
          status: week === 1 ? "in_progress" : "upcoming",
        });

        topicIndex[st.subject]++;
      }
    }

    if (weekEntries.length > 0) {
      await db.insert(schema.studyPlanWeeks).values(weekEntries);
    }

    const weeks = await db.query.studyPlanWeeks.findMany({
      where: eq(schema.studyPlanWeeks.studyPlanId, studyPlan.id),
    });

    return { ...studyPlan, weeks };
  },
};
