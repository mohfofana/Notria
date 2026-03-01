import { eq, and, gte, lte, inArray, desc } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { z } from "zod";
import { PromptRegistry, runJsonPrompt } from "../observability/prompt-registry.js";

type HomeworkDifficulty = "facile" | "moyen" | "difficile";

interface HomeworkExerciseDraft {
  question: string;
  expectedAnswer: string;
  difficulty: HomeworkDifficulty;
  topic: string;
}

interface HomeworkGenerationContext {
  subject: string;
  topic: string;
  recentMessages: string[];
}

const GAMIFICATION_LEAGUES = [
  { name: "Bronze", minPoints: 0 },
  { name: "Argent", minPoints: 160 },
  { name: "Or", minPoints: 300 },
  { name: "Platine", minPoints: 480 },
  { name: "Diamant", minPoints: 700 },
] as const;

const GAMIFICATION_AVATARS = [
  "rocket-fox",
  "tiger-math",
  "eagle-scout",
  "panther-logic",
  "koala-wiz",
  "falcon-pro",
  "rhino-core",
  "dolphin-brain",
] as const;

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeSubjectKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function isValidDifficulty(value: unknown): value is HomeworkDifficulty {
  return value === "facile" || value === "moyen" || value === "difficile";
}

function getLeague(points: number) {
  const sorted = [...GAMIFICATION_LEAGUES].sort((a, b) => b.minPoints - a.minPoints);
  return sorted.find((league) => points >= league.minPoints) ?? GAMIFICATION_LEAGUES[0];
}

function getNextLeague(points: number) {
  const sorted = [...GAMIFICATION_LEAGUES].sort((a, b) => a.minPoints - b.minPoints);
  for (const league of sorted) {
    if (league.minPoints > points) return league;
  }
  return null;
}

function sanitizeDraftExercise(value: unknown, fallbackTopic: string): HomeworkExerciseDraft | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<HomeworkExerciseDraft>;
  const question = typeof item.question === "string" ? normalizeText(item.question) : "";
  const expectedAnswer = typeof item.expectedAnswer === "string" ? normalizeText(item.expectedAnswer) : "";
  const topic = typeof item.topic === "string" && item.topic.trim().length > 0
    ? normalizeText(item.topic)
    : fallbackTopic;
  if (!question || !expectedAnswer) return null;
  return {
    question,
    expectedAnswer,
    topic,
    difficulty: isValidDifficulty(item.difficulty) ? item.difficulty : "moyen",
  };
}

function fallbackHomeworkExercises(context: HomeworkGenerationContext): HomeworkExerciseDraft[] {
  const topic = context.topic || "calcul numerique";
  const topicLower = topic.toLowerCase();
  const subjectKey = normalizeSubjectKey(context.subject);

  if (subjectKey.includes("francais")) {
    return [
      {
        question: "Corrige cette phrase: Les eleves arrive en retard parce qu'il pleuvait fort.",
        expectedAnswer: "Les eleves arrivent en retard parce qu'il pleuvait fort.",
        difficulty: "facile",
        topic,
      },
      {
        question: "Transforme au passe compose: Nous (finir) nos devoirs avant 20h.",
        expectedAnswer: "Nous avons fini nos devoirs avant 20h.",
        difficulty: "moyen",
        topic,
      },
      {
        question: "Redige 3 phrases pour resumer un texte argumentatif en gardant l'idee principale.",
        expectedAnswer: "Resume attendu: idee principale + argument 1 + argument 2, en phrases courtes et coherentes.",
        difficulty: "difficile",
        topic,
      },
    ];
  }

  if (subjectKey.includes("svt")) {
    return [
      {
        question: "Cite deux roles du sang dans le corps humain.",
        expectedAnswer: "Le sang transporte l'oxygene et les nutriments, et il evacue les dechets.",
        difficulty: "facile",
        topic,
      },
      {
        question: "Explique la difference entre nutrition autotrophe et heterotrophe.",
        expectedAnswer: "Autotrophe: fabrique sa matiere organique (ex: plante). Heterotrophe: consomme une matiere organique deja produite.",
        difficulty: "moyen",
        topic,
      },
      {
        question: "On observe une plante placee 7 jours sans lumiere. Que constates-tu et pourquoi ?",
        expectedAnswer: "La plante jaunit et pousse mal car sans lumiere la photosynthese diminue fortement.",
        difficulty: "difficile",
        topic,
      },
    ];
  }

  if (subjectKey.includes("physique") || subjectKey.includes("chimie")) {
    return [
      {
        question: "Une lampe fonctionne sous 6 V avec une intensite de 0,5 A. Calcule la puissance P.",
        expectedAnswer: "P = U x I = 6 x 0,5 = 3 W.",
        difficulty: "facile",
        topic,
      },
      {
        question: "Un objet est a 12 cm d'une lentille convergente de focale 8 cm. L'image est-elle reelle ou virtuelle ?",
        expectedAnswer: "Comme distance objet > focale, l'image est reelle (dans le cadre des modeles usuels).",
        difficulty: "moyen",
        topic,
      },
      {
        question: "Donne un exemple de transformation chimique et justifie avec un indice observable.",
        expectedAnswer: "Exemple: combustion du papier. Indice: apparition de fumee, cendres, chaleur.",
        difficulty: "difficile",
        topic,
      },
    ];
  }

  if (topicLower.includes("vecteur")) {
    return [
      {
        question: "Dans un repere, A(1,2) et B(5,4). Calcule les coordonnees du vecteur AB.",
        expectedAnswer: "AB = (5-1 ; 4-2) = (4 ; 2).",
        difficulty: "facile",
        topic,
      },
      {
        question: "Avec AB = (4 ; 2), calcule la norme ||AB||.",
        expectedAnswer: "||AB|| = sqrt(4^2 + 2^2) = sqrt(20) = 2sqrt(5).",
        difficulty: "moyen",
        topic,
      },
      {
        question: "Dans un repere, A(2,1), B(6,5), C(3,2). Verifie si AB et AC sont colineaires.",
        expectedAnswer: "AB = (4,4), AC = (1,1), donc AB = 4*AC, ils sont colineaires.",
        difficulty: "difficile",
        topic,
      },
    ];
  }

  if (topicLower.includes("pythagore") || topicLower.includes("triangle")) {
    return [
      {
        question: "Triangle rectangle en B, AB=3 cm, BC=4 cm. Calcule AC.",
        expectedAnswer: "AC^2 = 3^2 + 4^2 = 25 donc AC = 5 cm.",
        difficulty: "facile",
        topic,
      },
      {
        question: "Triangle rectangle en B, AB=5 cm, BC=12 cm. Calcule AC.",
        expectedAnswer: "AC^2 = 5^2 + 12^2 = 169 donc AC = 13 cm.",
        difficulty: "moyen",
        topic,
      },
      {
        question: "Triangle rectangle en A, AB=8 cm, AC=15 cm. Calcule BC puis explique la methode.",
        expectedAnswer: "BC^2 = 8^2 + 15^2 = 289 donc BC=17 cm, en appliquant le theoreme de Pythagore.",
        difficulty: "difficile",
        topic,
      },
    ];
  }

  return [
    {
      question: "Calcule: 5 + 3 * (2 + 4) - 8.",
      expectedAnswer: "2+4=6, 3*6=18, 5+18-8=15.",
      difficulty: "facile",
      topic,
    },
    {
      question: "Resous: 2x + 5 = 17.",
      expectedAnswer: "2x = 12 puis x = 6.",
      difficulty: "moyen",
      topic,
    },
    {
      question: "Calcule la moyenne de 12, 15, 9 et 14.",
      expectedAnswer: "(12+15+9+14)/4 = 50/4 = 12,5.",
      difficulty: "moyen",
      topic,
    },
  ];
}

async function generateHomeworkExercises(context: HomeworkGenerationContext): Promise<HomeworkExerciseDraft[]> {
  try {
    const subjectLabel = context.subject || "Mathématiques";
    const prompt = [
      `Tu es Prof Ada. Genere 3 exercices BEPC de ${subjectLabel}.`,
      `Matiere: ${subjectLabel}.`,
      `Theme: ${context.topic}.`,
      `Contexte recent eleve: ${context.recentMessages.join(" | ") || "non disponible"}.`,
      "Retourne STRICTEMENT un JSON array de 3 objets avec:",
      '- question: string',
      '- expectedAnswer: string (courte correction)',
      '- difficulty: "facile" | "moyen" | "difficile"',
      '- topic: string',
      "Regles:",
      "- exercices progressifs, concrets, niveau 3eme, programme ivoirien.",
      "- adapte le style de question a la matiere indiquee (calcul, redaction, science, etc.).",
      "- pas de markdown, pas de texte hors JSON.",
    ].join("\n");

    const exercisesSchema = z.array(z.object({
      question: z.string().min(1),
      expectedAnswer: z.string().min(1),
      difficulty: z.enum(["facile", "moyen", "difficile"]),
      topic: z.string().min(1),
    })).min(1);

    const { data } = await runJsonPrompt({
      prompt: PromptRegistry.homeworkGenV1,
      schema: exercisesSchema,
      userContent: prompt,
      retries: 3,
      temperature: 0.4,
      maxTokens: 650,
    });

    const sanitized = data
      .map((item) => sanitizeDraftExercise(item, context.topic))
      .filter((item): item is HomeworkExerciseDraft => Boolean(item))
      .slice(0, 3);

    if (sanitized.length < 3) return fallbackHomeworkExercises(context);
    return sanitized;
  } catch (error) {
    console.warn("Dynamic homework generation failed, using fallback:", error);
    return fallbackHomeworkExercises(context);
  }
}

async function estimateSessionScore(studentId: number, subject: string): Promise<number | null> {
  const recentExercises = await db.query.exercises.findMany({
    where: and(
      eq(schema.exercises.studentId, studentId),
      eq(schema.exercises.subject, subject),
    ),
    orderBy: [desc(schema.exercises.createdAt)],
    limit: 10,
  });

  if (recentExercises.length === 0) return null;

  let scored = 0;
  let total = 0;
  for (const exercise of recentExercises) {
    if (typeof exercise.score === "number") {
      total += exercise.score;
      scored += 1;
      continue;
    }
    if (exercise.isCorrect === true) {
      total += 100;
      scored += 1;
    } else if (exercise.isCorrect === false) {
      total += 0;
      scored += 1;
    }
  }

  if (scored === 0) return null;
  return Math.round(total / scored);
}

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

    const scheduledSession = await db.query.scheduledSessions.findFirst({
      where: and(
        eq(schema.scheduledSessions.id, sessionId),
        eq(schema.scheduledSessions.studentId, student.id),
      ),
    });

    if (!scheduledSession) {
      throw new Error("Session not found");
    }

    const schedule = await db.query.schedules.findFirst({
      where: eq(schema.schedules.id, scheduledSession.scheduleId),
    });

    // Update session status
    await db
      .update(schema.scheduledSessions)
      .set({ status: "completed" })
      .where(eq(schema.scheduledSessions.id, sessionId));

    const estimatedScore = await estimateSessionScore(student.id, scheduledSession.subject);
    const durationMinutes = schedule?.durationMinutes ?? 45;

    // Create study session record
    await db.insert(schema.studySessions).values({
      studentId: student.id,
      subject: scheduledSession.subject,
      type: "chat",
      durationMinutes,
      score: estimatedScore,
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

    const recentMessages = await db.query.messages.findMany({
      where: eq(schema.messages.conversationId, conversation.id),
      orderBy: [desc(schema.messages.createdAt)],
      limit: 6,
    });
    const recentContext = recentMessages
      .filter((m) => m.role !== "system")
      .map((m) => normalizeText(m.content))
      .slice(0, 4);

    // Create homework set
    const dueDate = new Date();
    dueDate.setHours(20, 0, 0, 0); // Due at 8 PM today

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const existingSet = await db.query.homeworkSets.findFirst({
      where: and(
        eq(schema.homeworkSets.studentId, studentId),
        eq(schema.homeworkSets.conversationId, conversation.id),
        gte(schema.homeworkSets.createdAt, startOfDay),
        lte(schema.homeworkSets.createdAt, endOfDay),
      ),
    });
    if (existingSet) {
      return existingSet;
    }

    const [homeworkSet] = await db.insert(schema.homeworkSets).values({
      studentId,
      conversationId: conversation.id,
      dueDate,
    }).returning();

    const topic = session.topic || conversation.topic || `Revision ${session.subject}`;
    const exercises = await generateHomeworkExercises({
      subject: session.subject,
      topic,
      recentMessages: recentContext,
    });

    for (const exercise of exercises) {
      await db.insert(schema.exercises).values({
        studentId,
        subject: session.subject,
        topic: exercise.topic,
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
    });
    if (homeworkSets.length === 0) return [];

    const setIds = homeworkSets.map((set) => set.id);
    const homeworkExercises = await db.query.exercises.findMany({
      where: inArray(schema.exercises.homeworkSetId, setIds),
    });

    return homeworkExercises;
  },

  async getCompetencyProgress(userId: number) {
    const student = await db.query.students.findFirst({
      where: eq(schema.students.userId, userId),
    });
    if (!student) throw new Error("Student not found");

    const recentExercises = await db.query.exercises.findMany({
      where: eq(schema.exercises.studentId, student.id),
      orderBy: [desc(schema.exercises.createdAt)],
      limit: 120,
    });

    const byTopic = new Map<string, { total: number; correct: number }>();
    for (const ex of recentExercises) {
      const topic = ex.topic || "General";
      const current = byTopic.get(topic) || { total: 0, correct: 0 };
      current.total += 1;
      if (ex.isCorrect === true) current.correct += 1;
      byTopic.set(topic, current);
    }

    return Array.from(byTopic.entries())
      .map(([topic, stats]) => ({
        topic,
        total: stats.total,
        correct: stats.correct,
        percent: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  },

  async getGamificationSnapshot(userId: number) {
    const currentStudent = await db.query.students.findFirst({
      where: eq(schema.students.userId, userId),
    });
    if (!currentStudent) throw new Error("Student not found");

    const students = await db.query.students.findMany();
    if (students.length === 0) {
      return {
        profile: null,
        leaderboard: [],
        nearby: [],
        missions: [],
        formula: null,
      };
    }

    const studentIds = students.map((student) => student.id);
    const userIds = students.map((student) => student.userId);
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const [users, sessions7d, exercises7d, sessionsToday, exercisesToday] = await Promise.all([
      userIds.length > 0
        ? db.query.users.findMany({ where: inArray(schema.users.id, userIds) })
        : Promise.resolve([]),
      studentIds.length > 0
        ? db.query.studySessions.findMany({
            where: and(
              inArray(schema.studySessions.studentId, studentIds),
              gte(schema.studySessions.createdAt, sevenDaysAgo),
            ),
          })
        : Promise.resolve([]),
      studentIds.length > 0
        ? db.query.exercises.findMany({
            where: and(
              inArray(schema.exercises.studentId, studentIds),
              gte(schema.exercises.createdAt, sevenDaysAgo),
            ),
          })
        : Promise.resolve([]),
      studentIds.length > 0
        ? db.query.studySessions.findMany({
            where: and(
              inArray(schema.studySessions.studentId, studentIds),
              gte(schema.studySessions.createdAt, startOfDay),
            ),
          })
        : Promise.resolve([]),
      studentIds.length > 0
        ? db.query.exercises.findMany({
            where: and(
              inArray(schema.exercises.studentId, studentIds),
              gte(schema.exercises.createdAt, startOfDay),
            ),
          })
        : Promise.resolve([]),
    ]);

    const userById = new Map(users.map((user) => [user.id, user]));
    const aggregates = new Map<number, {
      sessions: number;
      minutes: number;
      scoreTotal: number;
      scoreCount: number;
      exercises: number;
      correct: number;
      subjectCounts: Map<string, number>;
    }>();

    function getAggregate(studentId: number) {
      const existing = aggregates.get(studentId);
      if (existing) return existing;
      const created = {
        sessions: 0,
        minutes: 0,
        scoreTotal: 0,
        scoreCount: 0,
        exercises: 0,
        correct: 0,
        subjectCounts: new Map<string, number>(),
      };
      aggregates.set(studentId, created);
      return created;
    }

    for (const session of sessions7d) {
      const aggregate = getAggregate(session.studentId);
      aggregate.sessions += 1;
      aggregate.minutes += session.durationMinutes;
      if (typeof session.score === "number") {
        aggregate.scoreTotal += session.score;
        aggregate.scoreCount += 1;
      }
      aggregate.subjectCounts.set(
        session.subject,
        (aggregate.subjectCounts.get(session.subject) || 0) + 1,
      );
    }

    for (const exercise of exercises7d) {
      const aggregate = getAggregate(exercise.studentId);
      aggregate.exercises += 1;
      if (exercise.isCorrect === true) aggregate.correct += 1;
      aggregate.subjectCounts.set(
        exercise.subject,
        (aggregate.subjectCounts.get(exercise.subject) || 0) + 1,
      );
    }

    const ranking = students
      .map((student) => {
        const aggregate = getAggregate(student.id);
        const avgScore = aggregate.scoreCount > 0
          ? Math.round(aggregate.scoreTotal / aggregate.scoreCount)
          : 0;
        const streak = student.currentStreak || 0;
        let points =
          aggregate.sessions * 30 +
          aggregate.correct * 8 +
          aggregate.exercises * 2 +
          Math.min(streak, 14) * 6 +
          Math.round(avgScore / 5);
        if (aggregate.sessions >= 3) points += 25;
        if (aggregate.correct >= 10) points += 30;

        const sortedSubjects = Array.from(aggregate.subjectCounts.entries())
          .sort((a, b) => b[1] - a[1]);
        const topSubject = sortedSubjects[0]?.[0] || "Mathématiques";
        const user = userById.get(student.userId);
        const displayName = user
          ? `${user.firstName} ${user.lastName.slice(0, 1)}.`
          : `Élève ${student.id}`;

        return {
          studentId: student.id,
          points,
          streak,
          topSubject,
          avgScore,
          sessions: aggregate.sessions,
          exercises: aggregate.exercises,
          displayName,
          avatar: GAMIFICATION_AVATARS[student.id % GAMIFICATION_AVATARS.length],
        };
      })
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return b.streak - a.streak;
      });

    const currentIndex = ranking.findIndex((entry) => entry.studentId === currentStudent.id);
    const currentRank = currentIndex + 1;
    const currentEntry = ranking[currentIndex];
    const currentLeague = getLeague(currentEntry.points);
    const nextLeague = getNextLeague(currentEntry.points);

    const currentSessionsToday = sessionsToday.filter((session) => session.studentId === currentStudent.id).length;
    const currentMinutesToday = sessionsToday
      .filter((session) => session.studentId === currentStudent.id)
      .reduce((sum, session) => sum + (session.durationMinutes || 0), 0);
    const currentExercisesToday = exercisesToday.filter((exercise) => exercise.studentId === currentStudent.id).length;
    const currentCorrectToday = exercisesToday.filter(
      (exercise) => exercise.studentId === currentStudent.id && exercise.isCorrect === true
    ).length;
    const dailyPointsEstimate =
      currentSessionsToday * 30 +
      currentCorrectToday * 8 +
      currentExercisesToday * 2 +
      Math.min(currentEntry.streak, 14) * 6;
    const weeklyTargetPoints = 420;
    const weeklyPercent = Math.min(100, Math.round((currentEntry.points / weeklyTargetPoints) * 100));

    const milestones = [
      { points: 180, reward: "Badge Regulier" },
      { points: 320, reward: "Badge Strategie" },
      { points: 520, reward: "Boost Ligue +1" },
    ];
    const nextMilestone = milestones.find((milestone) => currentEntry.points < milestone.points) ?? null;

    const missions = [
      {
        id: "daily_session",
        label: "Finir 1 séance aujourd'hui",
        progress: currentSessionsToday,
        target: 1,
        reward: 40,
      },
      {
        id: "daily_exercises",
        label: "Résoudre 5 exercices aujourd'hui",
        progress: currentExercisesToday,
        target: 5,
        reward: 60,
      },
      {
        id: "daily_accuracy",
        label: "Avoir 3 bonnes réponses aujourd'hui",
        progress: currentCorrectToday,
        target: 3,
        reward: 50,
      },
      {
        id: "daily_time",
        label: "Etudier 30 min aujourd'hui",
        progress: currentMinutesToday,
        target: 30,
        reward: 45,
      },
      {
        id: "weekly_consistency",
        label: "Faire 4 seances sur 7 jours",
        progress: currentEntry.sessions,
        target: 4,
        reward: 80,
      },
    ];

    const start = Math.max(0, currentIndex - 2);
    const end = Math.min(ranking.length, currentIndex + 3);

    return {
      profile: {
        points: currentEntry.points,
        rank: currentRank,
        totalPlayers: ranking.length,
        league: currentLeague.name,
        streak: currentEntry.streak,
        topSubject: currentEntry.topSubject,
        avatar: currentEntry.avatar,
        pointsToNextLeague: nextLeague ? Math.max(0, nextLeague.minPoints - currentEntry.points) : 0,
      },
      leaderboard: ranking.slice(0, 10).map((entry, index) => ({
        rank: index + 1,
        displayName: entry.displayName,
        points: entry.points,
        league: getLeague(entry.points).name,
        avatar: entry.avatar,
        isCurrent: entry.studentId === currentStudent.id,
      })),
      nearby: ranking.slice(start, end).map((entry) => ({
        rank: ranking.findIndex((item) => item.studentId === entry.studentId) + 1,
        displayName: entry.displayName,
        points: entry.points,
        league: getLeague(entry.points).name,
        avatar: entry.avatar,
        isCurrent: entry.studentId === currentStudent.id,
      })),
      missions: missions.map((mission) => ({
        ...mission,
        done: mission.progress >= mission.target,
      })),
      progress: {
        dailyPointsEstimate,
        weeklyPoints: currentEntry.points,
        weeklyTargetPoints,
        weeklyPercent,
        nextMilestone,
      },
      formula: {
        sessionCompleted: 30,
        correctExercise: 8,
        attemptedExercise: 2,
        streakPerDay: 6,
        sessionBonus3Plus: 25,
        correctBonus10Plus: 30,
      },
    };
  },
};
