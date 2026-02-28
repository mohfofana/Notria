import { eq, desc, and, gte, inArray } from "drizzle-orm";
import { db, schema } from "../db/index.js";

export const ParentService = {
  async getParentDashboard(userId: number) {
    let parent = await db.query.parents.findFirst({
      where: eq(schema.parents.userId, userId),
    });

    if (!parent) {
      const [createdParent] = await db.insert(schema.parents).values({ userId }).returning();
      parent = createdParent;
    }

    const parentStudents = await db.query.parentStudents.findMany({
      where: eq(schema.parentStudents.parentId, parent.id),
    });
    if (parentStudents.length === 0) return [];

    // Get recent activity for each student
    const dashboard = await Promise.all(
      parentStudents.map(async (parentStudent) => {
        const student = await db.query.students.findFirst({
          where: eq(schema.students.id, parentStudent.studentId),
        });
        if (!student) return null;

        const studentUser = await db.query.users.findFirst({
          where: eq(schema.users.id, student.userId),
        });
        if (!studentUser) return null;

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentSessions = await db.query.studySessions.findMany({
          where: and(
            eq(schema.studySessions.studentId, student.id),
            gte(schema.studySessions.createdAt, sevenDaysAgo)
          ),
          orderBy: desc(schema.studySessions.createdAt),
          limit: 5,
        });

        const currentStreak = student.currentStreak || 0;

        const today = new Date();
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);

        const todaysHomework = await db.query.homeworkSets.findMany({
          where: and(
            eq(schema.homeworkSets.studentId, student.id),
            gte(schema.homeworkSets.createdAt, startOfDay)
          ),
        });

        const homeworkSetIds = todaysHomework.map((set) => set.id);
        let exercisesBySet = new Map<number, Array<typeof schema.exercises.$inferSelect>>();
        if (homeworkSetIds.length > 0) {
          const exercises = await db.query.exercises.findMany({
            where: inArray(schema.exercises.homeworkSetId, homeworkSetIds),
          });
          exercisesBySet = exercises.reduce((acc, exercise) => {
            const setId = exercise.homeworkSetId;
            if (!setId) return acc;
            const list = acc.get(setId) || [];
            list.push(exercise);
            acc.set(setId, list);
            return acc;
          }, new Map<number, Array<typeof schema.exercises.$inferSelect>>());
        }

        const homeworkCompleted = todaysHomework.some((set) => {
          const exercises = exercisesBySet.get(set.id) || [];
          return exercises.length > 0 && exercises.every((ex) => ex.isCorrect !== null);
        });

        const notifications = await this.getRecentNotifications(student.id);

        return {
          student: {
            id: student.id,
            firstName: studentUser.firstName,
            lastName: studentUser.lastName,
            examType: student.examType,
            targetScore: student.targetScore,
          },
          stats: {
            currentStreak,
            recentSessions: recentSessions.length,
            homeworkCompleted,
          },
          recentActivity: recentSessions.map(session => ({
            id: session.id,
            subject: session.subject,
            durationMinutes: session.durationMinutes,
            score: session.score,
            createdAt: session.createdAt,
          })),
          notifications,
        };
      })
    );

    return dashboard.filter(Boolean);
  },

  async getRecentNotifications(studentId: number) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentSessions = await db.query.studySessions.findMany({
      where: and(
        eq(schema.studySessions.studentId, studentId),
        gte(schema.studySessions.createdAt, sevenDaysAgo)
      ),
      orderBy: desc(schema.studySessions.createdAt),
      limit: 5,
    });

    const notifications = recentSessions.map(session => ({
      id: `session-${session.id}`,
      type: "session_completed",
      message: `Séance ${session.subject} terminée - Score: ${session.score}/100`,
      createdAt: session.createdAt,
      read: false,
    }));

    const todaysHomework = await db.query.homeworkSets.findMany({
      where: and(
        eq(schema.homeworkSets.studentId, studentId),
        gte(schema.homeworkSets.createdAt, sevenDaysAgo)
      )
    });

    const homeworkSetIds = todaysHomework.map((set) => set.id);
    if (homeworkSetIds.length > 0) {
      const exercises = await db.query.exercises.findMany({
        where: inArray(schema.exercises.homeworkSetId, homeworkSetIds),
      });
      const grouped = exercises.reduce((acc, exercise) => {
        const setId = exercise.homeworkSetId;
        if (!setId) return acc;
        const list = acc.get(setId) || [];
        list.push(exercise);
        acc.set(setId, list);
        return acc;
      }, new Map<number, Array<typeof schema.exercises.$inferSelect>>());

      for (const set of todaysHomework) {
        const setExercises = grouped.get(set.id) || [];
        const completed = setExercises.length > 0 && setExercises.every((ex) => ex.isCorrect !== null);
        if (completed) {
          notifications.push({
            id: `homework-${set.id}`,
            type: "homework_completed",
            message: "Devoirs du jour terminés !",
            createdAt: set.createdAt,
            read: false,
          });
        }
      }
    }

    return notifications
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
  },

  async markNotificationAsRead(parentId: number, notificationId: string) {
    return { success: true };
  },
};
