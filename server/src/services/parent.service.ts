import { eq, desc, and, gte, inArray, isNull } from "drizzle-orm";
import { db, schema } from "../db/index.js";

const INVITE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomInviteCode(length: number) {
  let code = "";
  for (let i = 0; i < length; i += 1) {
    const index = Math.floor(Math.random() * INVITE_CHARS.length);
    code += INVITE_CHARS[index];
  }
  return code;
}

async function generateUniqueParentInviteCode() {
  while (true) {
    const code = randomInviteCode(8);
    const existing = await db.query.parents.findFirst({
      where: eq(schema.parents.inviteCode, code),
    });
    if (!existing) return code;
  }
}

export const ParentService = {
  async getParentDashboard(userId: number) {
    let parent = await db.query.parents.findFirst({
      where: eq(schema.parents.userId, userId),
    });

    if (!parent) {
      const inviteCode = await generateUniqueParentInviteCode();
      const [createdParent] = await db.insert(schema.parents).values({ userId, inviteCode }).returning();
      parent = createdParent;
    } else if (!parent.inviteCode) {
      const inviteCode = await generateUniqueParentInviteCode();
      const [updatedParent] = await db
        .update(schema.parents)
        .set({ inviteCode, updatedAt: new Date() })
        .where(eq(schema.parents.id, parent.id))
        .returning();
      parent = updatedParent;
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

        const notifications = await this.getRecentNotifications(parent.id, student.id);
        const weeklyTimeline = recentSessions.map((session) => ({
          id: session.id,
          day: new Date(session.createdAt).toLocaleDateString("fr-FR", { weekday: "short" }),
          subject: session.subject,
          minutes: session.durationMinutes,
          score: session.score,
        }));
        const recentExercises = await db.query.exercises.findMany({
          where: and(
            eq(schema.exercises.studentId, student.id),
            gte(schema.exercises.createdAt, sevenDaysAgo),
          ),
          orderBy: desc(schema.exercises.createdAt),
          limit: 30,
        });
        const weaknessCounter = new Map<string, number>();
        for (const ex of recentExercises) {
          if (ex.isCorrect === false) {
            weaknessCounter.set(ex.topic, (weaknessCounter.get(ex.topic) || 0) + 1);
          }
        }
        const weaknessActions = Array.from(weaknessCounter.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([topic, count]) => ({
            topic,
            misses: count,
            action: `Revoir ${topic} avec 2 exercices guides`,
          }));

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
          weeklyTimeline,
          weaknessActions,
        };
      })
    );

    return dashboard.filter(Boolean);
  },

  async getRecentNotifications(parentId: number, studentId: number) {
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

    const generatedNotifications = recentSessions.map(session => ({
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
          generatedNotifications.push({
            id: `homework-${set.id}`,
            type: "homework_completed",
            message: "Devoirs du jour terminés !",
            createdAt: set.createdAt,
            read: false,
          });
        }
      }
    }

    for (const notification of generatedNotifications) {
      await db
        .insert(schema.parentNotifications)
        .values({
          parentId,
          studentId,
          notificationId: notification.id,
          type: notification.type,
          message: notification.message,
          createdAt: notification.createdAt,
          updatedAt: new Date(),
        })
        .onConflictDoNothing();
    }

    const stored = await db.query.parentNotifications.findMany({
      where: and(
        eq(schema.parentNotifications.parentId, parentId),
        eq(schema.parentNotifications.studentId, studentId),
      ),
      orderBy: desc(schema.parentNotifications.createdAt),
      limit: 10,
    });

    return stored.map((notification) => ({
      id: notification.notificationId,
      type: notification.type,
      message: notification.message,
      createdAt: notification.createdAt,
      read: notification.readAt !== null,
    }));
  },

  async markNotificationAsRead(userId: number, notificationId: string) {
    const parent = await db.query.parents.findFirst({
      where: eq(schema.parents.userId, userId),
    });
    if (!parent) {
      throw new Error("Parent not found");
    }

    if (notificationId === "all") {
      await db
        .update(schema.parentNotifications)
        .set({ readAt: new Date(), updatedAt: new Date() })
        .where(and(
          eq(schema.parentNotifications.parentId, parent.id),
          isNull(schema.parentNotifications.readAt),
        ));
      return { success: true, readAll: true };
    }

    if (typeof notificationId === "string" && notificationId.trim().length > 0) {
      await db
        .update(schema.parentNotifications)
        .set({ readAt: new Date(), updatedAt: new Date() })
        .where(and(
          eq(schema.parentNotifications.parentId, parent.id),
          eq(schema.parentNotifications.notificationId, notificationId.trim()),
        ));
    }
    return { success: true, readAll: false };
  },
};
