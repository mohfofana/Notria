import { eq, and, gte, lte, sql } from "drizzle-orm";
import { db, schema } from "../db/index.js";

export const SessionService = {
  async getTodaysSession(userId: number) {
    const student = await db.query.students.findFirst({
      where: eq(schema.students.userId, userId),
    });

    if (!student) {
      throw new Error("Student not found");
    }

    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Find scheduled session for today
    const scheduledSession = await db.query.scheduledSessions.findFirst({
      where: and(
        eq(schema.scheduledSessions.studentId, student.id),
        gte(schema.scheduledSessions.date, startOfDay),
        lte(schema.scheduledSessions.date, endOfDay),
        eq(schema.scheduledSessions.status, "upcoming")
      ),
    });

    if (!scheduledSession) {
      return null; // No session scheduled for today
    }

    const schedule = await db.query.schedules.findFirst({
      where: eq(schema.schedules.id, scheduledSession.scheduleId),
    });
    if (!schedule) {
      return null;
    }

    // Get or create conversation for this session
    let conversation = await db.query.conversations.findFirst({
      where: eq(schema.conversations.id, scheduledSession.conversationId || 0),
    });

    if (!conversation) {
      // Create new conversation
      const [newConversation] = await db.insert(schema.conversations).values({
        studentId: student.id,
        subject: scheduledSession.subject,
        topic: `Séance ${scheduledSession.subject}`,
        title: `Séance du jour - ${scheduledSession.subject}`,
      }).returning();

      conversation = newConversation;

      // Link conversation to session
      await db
        .update(schema.scheduledSessions)
        .set({ conversationId: newConversation.id })
        .where(eq(schema.scheduledSessions.id, scheduledSession.id));
    }

    return {
      session: scheduledSession,
      conversation,
      subject: scheduledSession.subject,
      startTime: schedule.startTime,
      durationMinutes: schedule.durationMinutes,
    };
  },

  async startSession(userId: number, sessionId: number) {
    const student = await db.query.students.findFirst({
      where: eq(schema.students.userId, userId),
    });

    if (!student) {
      throw new Error("Student not found");
    }

    // Update session status
    await db
      .update(schema.scheduledSessions)
      .set({ status: "completed" })
      .where(eq(schema.scheduledSessions.id, sessionId));

    // Create study session record
    await db.insert(schema.studySessions).values({
      studentId: student.id,
      subject: "Mathématiques", // TODO: Get from session
      type: "chat",
      durationMinutes: 45, // TODO: Get actual duration
      score: 85, // TODO: Calculate based on performance
    });

    // Generate homework
    await this.generateHomework(student.id, sessionId);

    return { success: true };
  },

  async generateHomework(studentId: number, sessionId: number) {
    const session = await db.query.scheduledSessions.findFirst({
      where: eq(schema.scheduledSessions.id, sessionId),
    });

    if (!session?.conversationId) {
      return;
    }

    const conversation = await db.query.conversations.findFirst({
      where: eq(schema.conversations.id, session.conversationId),
    });

    if (!conversation) {
      return;
    }

    // Create homework set
    const dueDate = new Date();
    dueDate.setHours(20, 0, 0, 0); // Due at 8 PM today

    const [homeworkSet] = await db.insert(schema.homeworkSets).values({
      studentId,
      conversationId: conversation.id,
      dueDate,
    }).returning();

    // Generate sample exercises (in real implementation, this would be AI-generated)
    const exercises = [
      {
        question: "Calcule la dérivée de f(x) = x² + 3x + 1",
        expectedAnswer: "f'(x) = 2x + 3",
        difficulty: "facile" as const,
      },
      {
        question: "Résous l'équation 2x + 5 = 13",
        expectedAnswer: "x = 4",
        difficulty: "facile" as const,
      },
      {
        question: "Quelle est la primitive de f(x) = 2x ?",
        expectedAnswer: "F(x) = x² + C",
        difficulty: "moyen" as const,
      },
      {
        question: "Calcule ∫(x² + 2x + 1)dx",
        expectedAnswer: "(1/3)x³ + x² + x + C",
        difficulty: "moyen" as const,
      },
      {
        question: "Détermine la dérivée de f(x) = e^x * sin(x)",
        expectedAnswer: "f'(x) = e^x * (sin(x) + cos(x))",
        difficulty: "difficile" as const,
      },
    ];

    for (const exercise of exercises) {
      await db.insert(schema.exercises).values({
        studentId,
        subject: "Mathématiques",
        topic: "Dérivées et primitives",
        difficulty: exercise.difficulty,
        question: exercise.question,
        expectedAnswer: exercise.expectedAnswer,
        homeworkSetId: homeworkSet.id,
      });
    }

    return homeworkSet;
  },

  async getTodaysHomework(userId: number) {
    const student = await db.query.students.findFirst({
      where: eq(schema.students.userId, userId),
    });

    if (!student) {
      throw new Error("Student not found");
    }

    // Get today's homework sets
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const homeworkSets = await db.query.homeworkSets.findMany({
      where: and(
        eq(schema.homeworkSets.studentId, student.id),
        gte(schema.homeworkSets.createdAt, startOfDay),
        lte(schema.homeworkSets.createdAt, endOfDay)
      ),
      with: {
        exercises: true,
      },
    });

    return homeworkSets.flatMap(set => set.exercises);
  },
};
