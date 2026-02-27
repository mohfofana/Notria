import { eq, desc, and, gte } from "drizzle-orm";
import { db, schema } from "../db/index.js";

export const ParentService = {
  async getParentDashboard(userId: number) {
    // Get parent profile
    const parent = await db.query.parents.findFirst({
      where: eq(schema.parents.userId, userId),
    });

    if (!parent) {
      throw new Error("Parent not found");
    }

    // Get linked students
    const parentStudents = await db.query.parentStudents.findMany({
      where: eq(schema.parentStudents.parentId, parent.id),
      with: {
        student: {
          with: {
            user: true,
          },
        },
      },
    });

    const students = parentStudents.map(ps => ps.student);

    // Get recent activity for each student
    const dashboard = await Promise.all(
      students.map(async (student) => {
        // Recent study sessions (last 7 days)
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

        // Current streak
        const currentStreak = student.currentStreak || 0;

        // Today's homework status
        const today = new Date();
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);

        const todaysHomework = await db.query.homeworkSets.findMany({
          where: and(
            eq(schema.homeworkSets.studentId, student.id),
            gte(schema.homeworkSets.createdAt, startOfDay)
          ),
          with: {
            exercises: true,
          },
        });

        const homeworkCompleted = todaysHomework.some(set =>
          set.exercises.every(ex => ex.isCorrect !== null)
        );

        // Recent notifications
        const notifications = await this.getRecentNotifications(student.id);

        return {
          student: {
            id: student.id,
            firstName: student.user.firstName,
            lastName: student.user.lastName,
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

    return dashboard;
  },

  async getRecentNotifications(studentId: number) {
    // In a real implementation, you'd have a notifications table
    // For now, simulate based on recent activity
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

    // Add homework notifications
    const todaysHomework = await db.query.homeworkSets.findMany({
      where: and(
        eq(schema.homeworkSets.studentId, studentId),
        gte(schema.homeworkSets.createdAt, sevenDaysAgo)
      ),
      with: {
        exercises: true,
      },
    });

    todaysHomework.forEach(set => {
      const completed = set.exercises.every(ex => ex.isCorrect !== null);
      if (completed) {
        notifications.push({
          id: `homework-${set.id}`,
          type: "homework_completed",
          message: "Devoirs du jour terminés !",
          createdAt: set.createdAt,
          read: false,
        });
      }
    });

    return notifications
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
  },

  async markNotificationAsRead(parentId: number, notificationId: string) {
    // In a real implementation, update notification status
    // For now, just return success
    return { success: true };
  },
};
