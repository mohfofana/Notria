import { and, desc, eq } from "drizzle-orm";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { openai, CHAT_MODEL } from "../lib/openai.js";
import { db, schema } from "../db/index.js";
import { RagService } from "./rag.service.js";
import { PedagogicalContentService } from "./pedagogical-content.service.js";
import type { Student } from "../db/schema.js";

// ── Assessment domain → Curriculum topic mapping ──────────────────────────
const DOMAIN_TO_TOPIC: Record<string, string> = {
  "Calcul numerique": "Calcul numérique",
  "Calcul litteral": "Calcul littéral",
  "Equations et inequations": "Équations et inéquations",
  "Systemes d'equations": "Systèmes d'équations",
  "Fonctions lineaires et affines": "Fonctions linéaires et affines",
  "Statistiques": "Statistiques",
  "Theoreme de Pythagore": "Géométrie plane",
  "Theoreme de Thales": "Géométrie plane",
  "Trigonometrie": "Trigonométrie",
  "Problemes de la vie courante": "Problèmes de la vie courante",
};

function normalizeText(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function mapDomainToTopic(domain: string): string {
  // Try exact match first
  if (DOMAIN_TO_TOPIC[domain]) return DOMAIN_TO_TOPIC[domain];
  // Try normalized match
  const normalized = normalizeText(domain);
  for (const [key, value] of Object.entries(DOMAIN_TO_TOPIC)) {
    if (normalizeText(key) === normalized) return value;
  }
  return domain;
}

interface DomainResult {
  domain: string;
  level: string;
  percentage: number;
}

interface TopicAllocation {
  topic: string;
  priority: "high" | "medium" | "low";
  level: string;
  percentage: number;
  sessionsAllocated: number;
  difficulty: "facile" | "moyen" | "difficile";
}

interface WeekPlan {
  weekNumber: number;
  theme: string;
  objectives: string[];
  focusTopics: Array<{ topic: string; priority: "high" | "medium" | "low"; hoursAllocated: number }>;
  sessions: Array<{
    dayNumber: number;
    sessionOrder: number;
    topic: string;
    type: "lesson" | "exercise" | "revision" | "evaluation";
    title: string;
    description: string;
    durationMinutes: number;
    difficulty: "facile" | "moyen" | "difficile";
    objectives: string[];
    content: { keyConcepts: string[]; exercises: string[]; ragSources: string[] };
  }>;
}

/** Parse JSON from OpenAI responses that may be wrapped in ```json ... ``` */
function parseJsonResponse(content: string): unknown {
  let cleaned = content.trim();
  const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) cleaned = match[1].trim();
  return JSON.parse(cleaned);
}

// ── Core Service ──────────────────────────────────────────────────────────
export const CourseProgramService = {
  /**
   * Generate a personalized 4-week course program based on assessment results.
   */
  async generateProgram(userId: number): Promise<{
    program: typeof schema.coursePrograms.$inferSelect;
    weeks: Array<typeof schema.courseProgramWeeks.$inferSelect & {
      sessions: Array<typeof schema.courseProgramSessions.$inferSelect>;
    }>;
  }> {
    // 1. Fetch student profile
    const student = await db.query.students.findFirst({
      where: eq(schema.students.userId, userId),
    });
    if (!student) throw new Error("Student not found");

    // 2. Fetch latest assessment results
    const assessment = await db.query.levelAssessments.findFirst({
      where: eq(schema.levelAssessments.studentId, student.id),
      orderBy: [desc(schema.levelAssessments.createdAt)],
    });
    if (!assessment) throw new Error("No assessment found. Complete the placement test first.");

    // 3. Fetch student's schedule to know available sessions per week
    const studentSchedules = await db.query.schedules.findMany({
      where: and(
        eq(schema.schedules.studentId, student.id),
        eq(schema.schedules.isActive, true),
      ),
    });

    const weeklySessionCount = Math.max(studentSchedules.length, 3); // minimum 3 sessions/week
    const sessionDuration = studentSchedules[0]?.durationMinutes ?? 45;

    // 4. Analyze assessment results → classify domains
    const { weaknesses, intermediates, strengths, overallLevel } =
      this.analyzeAssessmentResults(assessment);

    // 5. Allocate sessions per topic based on weaknesses
    const topicAllocations = this.allocateTopicSessions(
      weaknesses,
      intermediates,
      strengths,
      weeklySessionCount * 4, // total sessions over 4 weeks
    );

    // 6. Generate AI-powered recommendations
    const aiRecommendations = await this.getAIRecommendations(
      student,
      { weaknesses, intermediates, strengths },
      topicAllocations,
    );

    // 7. Build the 4-week plan with RAG content
    const weekPlans = await this.buildWeekPlans(
      topicAllocations,
      weeklySessionCount,
      sessionDuration,
      aiRecommendations,
    );

    // 8. Persist everything to DB
    return this.persistProgram(
      student,
      assessment,
      weekPlans,
      weeklySessionCount,
      sessionDuration,
      overallLevel,
      weaknesses,
      strengths,
      aiRecommendations,
    );
  },

  /**
   * Analyze assessment results and classify each domain by level.
   */
  analyzeAssessmentResults(assessment: typeof schema.levelAssessments.$inferSelect) {
    const questions = (assessment.questionsJson as Array<{
      topic?: string;
      isCorrect?: boolean;
    }>) ?? [];

    // Recompute per-topic stats
    const topicStats: Record<string, { correct: number; total: number }> = {};
    for (const q of questions) {
      const topic = q.topic ?? "Mathematiques";
      if (!topicStats[topic]) topicStats[topic] = { correct: 0, total: 0 };
      topicStats[topic].total += 1;
      if (q.isCorrect) topicStats[topic].correct += 1;
    }

    const weaknesses: DomainResult[] = [];
    const intermediates: DomainResult[] = [];
    const strengths: DomainResult[] = [];

    for (const [domain, stats] of Object.entries(topicStats)) {
      const percentage = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
      let level: string;
      if (percentage < 50) level = "debutant";
      else if (percentage < 80) level = "intermediaire";
      else level = "avance";

      const result: DomainResult = { domain, level, percentage };

      if (percentage < 50) weaknesses.push(result);
      else if (percentage < 80) intermediates.push(result);
      else strengths.push(result);
    }

    // Sort weaknesses by percentage ascending (worst first)
    weaknesses.sort((a, b) => a.percentage - b.percentage);

    const overallAvg = assessment.score ?? 0;
    let overallLevel = "intermediaire";
    if (overallAvg < 50) overallLevel = "debutant";
    else if (overallAvg >= 80) overallLevel = "avance";

    return { weaknesses, intermediates, strengths, overallLevel };
  },

  /**
   * Allocate sessions across topics based on weakness priority.
   * Weak topics get ~55% of sessions, intermediate ~30%, strong ~15%.
   */
  allocateTopicSessions(
    weaknesses: DomainResult[],
    intermediates: DomainResult[],
    strengths: DomainResult[],
    totalSessions: number,
  ): TopicAllocation[] {
    const allocations: TopicAllocation[] = [];

    // Calculate session distribution
    const weakSessionPool = Math.ceil(totalSessions * 0.55);
    const interSessionPool = Math.ceil(totalSessions * 0.30);
    const strongSessionPool = Math.max(1, totalSessions - weakSessionPool - interSessionPool);

    // Distribute weak sessions
    if (weaknesses.length > 0) {
      const perWeak = Math.max(2, Math.floor(weakSessionPool / weaknesses.length));
      for (const w of weaknesses) {
        allocations.push({
          topic: mapDomainToTopic(w.domain),
          priority: "high",
          level: w.level,
          percentage: w.percentage,
          sessionsAllocated: perWeak,
          difficulty: "facile",
        });
      }
    }

    // Distribute intermediate sessions
    if (intermediates.length > 0) {
      const perInter = Math.max(1, Math.floor(interSessionPool / intermediates.length));
      for (const i of intermediates) {
        allocations.push({
          topic: mapDomainToTopic(i.domain),
          priority: "medium",
          level: i.level,
          percentage: i.percentage,
          sessionsAllocated: perInter,
          difficulty: "moyen",
        });
      }
    }

    // Distribute strong sessions (light review)
    if (strengths.length > 0) {
      const perStrong = Math.max(1, Math.floor(strongSessionPool / strengths.length));
      for (const s of strengths) {
        allocations.push({
          topic: mapDomainToTopic(s.domain),
          priority: "low",
          level: s.level,
          percentage: s.percentage,
          sessionsAllocated: perStrong,
          difficulty: "difficile",
        });
      }
    }

    // Deduplicate topics (e.g., Pythagore & Thales both map to Géométrie plane)
    const merged = new Map<string, TopicAllocation>();
    for (const alloc of allocations) {
      const existing = merged.get(alloc.topic);
      if (existing) {
        existing.sessionsAllocated += alloc.sessionsAllocated;
        // Keep the higher priority
        if (alloc.priority === "high" || (alloc.priority === "medium" && existing.priority === "low")) {
          existing.priority = alloc.priority;
          existing.difficulty = alloc.difficulty;
          existing.percentage = Math.min(existing.percentage, alloc.percentage);
        }
      } else {
        merged.set(alloc.topic, { ...alloc });
      }
    }

    return Array.from(merged.values());
  },

  /**
   * Get AI-generated recommendations for the program.
   */
  async getAIRecommendations(
    student: Student,
    results: { weaknesses: DomainResult[]; intermediates: DomainResult[]; strengths: DomainResult[] },
    allocations: TopicAllocation[],
  ): Promise<{
    summary: string;
    weeklyThemes: string[];
    tips: string[];
    motivation: string;
  }> {
    const curriculumContext = await PedagogicalContentService.getCurriculumContext(
      "Mathématiques",
      student.examType as "BEPC" | "BAC",
    );

    const systemPrompt = `Tu es Prof Ada, conseillère pédagogique experte pour le système éducatif ivoirien.
Tu dois créer des recommandations personnalisées pour un programme de cours de 4 semaines (1 mois).

PROFIL ÉLÈVE :
- Examen : ${student.examType}
- Classe : ${student.grade}
- Objectif : ${student.targetScore ?? 14}/20

RÉSULTATS DU TEST DIAGNOSTIQUE :
Points faibles (à renforcer en priorité) :
${results.weaknesses.map((w) => `- ${w.domain} : ${w.percentage}% (${w.level})`).join("\n") || "Aucun point faible majeur"}

Niveau intermédiaire (à approfondir) :
${results.intermediates.map((i) => `- ${i.domain} : ${i.percentage}% (${i.level})`).join("\n") || "Aucun"}

Points forts (à maintenir) :
${results.strengths.map((s) => `- ${s.domain} : ${s.percentage}% (${s.level})`).join("\n") || "Aucun"}

ALLOCATION DES SESSIONS :
${allocations.map((a) => `- ${a.topic} : ${a.sessionsAllocated} sessions (priorité ${a.priority})`).join("\n")}

CONTEXTE PÉDAGOGIQUE :
${curriculumContext}

GÉNÈRE un JSON avec :
{
  "summary": "Résumé personnalisé du diagnostic et du plan en 2-3 phrases, adressé directement à l'élève (tu/toi)",
  "weeklyThemes": ["Thème semaine 1", "Thème semaine 2", "Thème semaine 3", "Thème semaine 4"],
  "tips": ["Conseil 1 pour réussir", "Conseil 2", "Conseil 3"],
  "motivation": "Message de motivation personnalisé pour l'élève"
}

IMPORTANT :
- Les thèmes doivent progresser logiquement sur 4 semaines
- Semaine 1 : Renforcement des bases faibles
- Semaine 2 : Consolidation et pratique
- Semaine 3 : Approfondissement et exercices d'examen
- Semaine 4 : Révision intensive et évaluation
- Adapte au contexte ivoirien et au programme BEPC/BAC officiel
- Utilise un langage encourageant et adapté à un élève ivoirien`;

    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: "Génère les recommandations personnalisées pour ce programme de 4 semaines." },
    ];

    try {
      const response = await openai.chat.completions.create({
        model: CHAT_MODEL,
        messages,
        temperature: 0.4,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error("No AI response");

      return parseJsonResponse(content) as {
        summary: string;
        weeklyThemes: string[];
        tips: string[];
        motivation: string;
      };
    } catch (error) {
      console.error("AI recommendations failed, using fallback:", error);
      return this.getFallbackRecommendations(results);
    }
  },

  getFallbackRecommendations(results: {
    weaknesses: DomainResult[];
    intermediates: DomainResult[];
    strengths: DomainResult[];
  }) {
    const weakTopics = results.weaknesses.map((w) => mapDomainToTopic(w.domain)).join(", ");
    return {
      summary: weakTopics
        ? `Ton test montre des lacunes en ${weakTopics}. Ce programme de 4 semaines va t'aider à renforcer ces bases et progresser vers ton objectif.`
        : "Ton niveau est correct, ce programme va t'aider à approfondir et consolider tes connaissances.",
      weeklyThemes: [
        "Renforcement des fondamentaux",
        "Consolidation et pratique guidée",
        "Approfondissement et exercices type examen",
        "Révision intensive et évaluation finale",
      ],
      tips: [
        "Travaille régulièrement, même 30 minutes par jour font la différence",
        "Refais les exercices où tu as fait des erreurs pour bien comprendre",
        "N'hésite pas à demander de l'aide à Prof Ada quand tu bloques",
      ],
      motivation: "Chaque effort que tu fais te rapproche de ton objectif. Tu as le potentiel, il faut juste la méthode !",
    };
  },

  /**
   * Build 4 weekly plans with sessions, using RAG for content enrichment.
   */
  async buildWeekPlans(
    allocations: TopicAllocation[],
    weeklySessionCount: number,
    sessionDuration: number,
    aiRecs: { weeklyThemes: string[] },
  ): Promise<WeekPlan[]> {
    const weeks: WeekPlan[] = [];

    // Sort allocations: high priority first, then medium, then low
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const sortedAllocations = [...allocations].sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
    );

    // Create a session queue distributed across weeks
    const sessionQueue: Array<{ topic: string; difficulty: "facile" | "moyen" | "difficile"; priority: "high" | "medium" | "low" }> = [];
    for (const alloc of sortedAllocations) {
      for (let i = 0; i < alloc.sessionsAllocated; i++) {
        sessionQueue.push({
          topic: alloc.topic,
          difficulty: alloc.difficulty,
          priority: alloc.priority,
        });
      }
    }

    // Distribute sessions across 4 weeks
    const weekSessions: Array<typeof sessionQueue> = [[], [], [], []];
    for (let i = 0; i < sessionQueue.length; i++) {
      const weekIdx = i % 4;
      weekSessions[weekIdx].push(sessionQueue[i]);
    }

    // Ensure each week has at least weeklySessionCount sessions
    for (let w = 0; w < 4; w++) {
      while (weekSessions[w].length < weeklySessionCount) {
        // Fill with high-priority topics from weak areas
        const fillTopic = sortedAllocations[0] ?? { topic: "Révision générale", difficulty: "moyen" as const, priority: "medium" as const };
        weekSessions[w].push({
          topic: fillTopic.topic,
          difficulty: fillTopic.difficulty,
          priority: fillTopic.priority,
        });
      }
    }

    // Build each week
    for (let weekNum = 1; weekNum <= 4; weekNum++) {
      const weekIdx = weekNum - 1;
      const theme = aiRecs.weeklyThemes[weekIdx] ?? `Semaine ${weekNum}`;
      const sessionsForWeek = weekSessions[weekIdx].slice(0, weeklySessionCount);

      // Determine session types based on week progression
      const sessionTypes = this.getSessionTypesForWeek(weekNum, sessionsForWeek.length);

      // Build objectives for the week
      const weekTopics = [...new Set(sessionsForWeek.map((s) => s.topic))];
      const objectives = this.getWeekObjectives(weekNum, weekTopics);

      // Build focus topics
      const focusTopics = weekTopics.map((topic) => {
        const alloc = sortedAllocations.find((a) => a.topic === topic);
        const sessionsForTopic = sessionsForWeek.filter((s) => s.topic === topic).length;
        return {
          topic,
          priority: alloc?.priority ?? ("medium" as const),
          hoursAllocated: Math.round((sessionsForTopic * sessionDuration) / 60 * 10) / 10,
        };
      });

      // Build individual sessions with RAG content
      const sessions = await Promise.all(
        sessionsForWeek.map(async (session, idx) => {
          const type = sessionTypes[idx] ?? "lesson";

          // Progressively increase difficulty across weeks
          let difficulty = session.difficulty;
          if (weekNum >= 3 && difficulty === "facile") difficulty = "moyen";
          if (weekNum === 4 && difficulty === "moyen") difficulty = "difficile";

          // Fetch RAG content for this topic
          const ragContent = await this.fetchRagContent(session.topic, type);

          const title = this.generateSessionTitle(session.topic, type);
          const description = this.generateSessionDescription(session.topic, type, difficulty);

          return {
            dayNumber: idx + 1,
            sessionOrder: 1,
            topic: session.topic,
            type,
            title,
            description,
            durationMinutes: sessionDuration,
            difficulty,
            objectives: this.getSessionObjectives(session.topic, type, weekNum),
            content: ragContent,
          };
        }),
      );

      weeks.push({
        weekNumber: weekNum,
        theme,
        objectives,
        focusTopics,
        sessions,
      });
    }

    return weeks;
  },

  /**
   * Determine session types based on week number and progression.
   */
  getSessionTypesForWeek(
    weekNum: number,
    sessionCount: number,
  ): Array<"lesson" | "exercise" | "revision" | "evaluation"> {
    const types: Array<"lesson" | "exercise" | "revision" | "evaluation"> = [];

    for (let i = 0; i < sessionCount; i++) {
      if (weekNum === 1) {
        // Week 1: Focus on lessons and basic exercises
        types.push(i % 2 === 0 ? "lesson" : "exercise");
      } else if (weekNum === 2) {
        // Week 2: Mix of exercises and some lessons
        types.push(i % 3 === 0 ? "lesson" : "exercise");
      } else if (weekNum === 3) {
        // Week 3: Exercises and revision
        types.push(i % 3 === 0 ? "revision" : "exercise");
      } else {
        // Week 4: Revision and final evaluation
        if (i === sessionCount - 1) types.push("evaluation");
        else types.push(i % 2 === 0 ? "revision" : "exercise");
      }
    }

    return types;
  },

  getWeekObjectives(weekNum: number, topics: string[]): string[] {
    const topicList = topics.slice(0, 3).join(", ");
    switch (weekNum) {
      case 1:
        return [
          `Revoir les notions fondamentales : ${topicList}`,
          "Identifier et corriger les erreurs fréquentes",
          "Résoudre des exercices de base avec méthode",
        ];
      case 2:
        return [
          `Consolider les acquis : ${topicList}`,
          "Pratiquer avec des exercices de difficulté progressive",
          "Développer des automatismes de résolution",
        ];
      case 3:
        return [
          `Approfondir et s'entraîner : ${topicList}`,
          "S'exercer sur des sujets type BEPC",
          "Travailler la rapidité et la précision",
        ];
      case 4:
        return [
          "Révision intensive de tous les chapitres",
          "Évaluation finale pour mesurer la progression",
          "Corriger les dernières lacunes avant l'examen",
        ];
      default:
        return [`Travailler : ${topicList}`];
    }
  },

  getSessionObjectives(
    topic: string,
    type: "lesson" | "exercise" | "revision" | "evaluation",
    weekNum: number,
  ): string[] {
    switch (type) {
      case "lesson":
        return [
          `Comprendre les concepts clés de : ${topic}`,
          "Mémoriser les formules et propriétés importantes",
          "Voir des exemples résolus étape par étape",
        ];
      case "exercise":
        return [
          `Pratiquer des exercices sur : ${topic}`,
          weekNum <= 2
            ? "Commencer par des exercices guidés"
            : "Résoudre des exercices de manière autonome",
          "Vérifier ses réponses et comprendre les erreurs",
        ];
      case "revision":
        return [
          `Réviser et consolider : ${topic}`,
          "Refaire les exercices clés du chapitre",
          "S'entraîner sur des extraits d'annales BEPC",
        ];
      case "evaluation":
        return [
          "Évaluation de fin de programme",
          "Résoudre un mini-sujet dans les conditions d'examen",
          "Mesurer sa progression depuis le test initial",
        ];
    }
  },

  generateSessionTitle(
    topic: string,
    type: "lesson" | "exercise" | "revision" | "evaluation",
  ): string {
    const typeLabels = {
      lesson: "Cours",
      exercise: "Exercices",
      revision: "Révision",
      evaluation: "Évaluation",
    };
    return `${typeLabels[type]} : ${topic}`;
  },

  generateSessionDescription(
    topic: string,
    type: "lesson" | "exercise" | "revision" | "evaluation",
    difficulty: "facile" | "moyen" | "difficile",
  ): string {
    const diffLabels = { facile: "fondamental", moyen: "intermédiaire", difficile: "avancé" };
    switch (type) {
      case "lesson":
        return `Leçon sur ${topic} — niveau ${diffLabels[difficulty]}. Revois les concepts clés, les formules et les méthodes de résolution avec Prof Ada.`;
      case "exercise":
        return `Entraîne-toi sur ${topic} avec des exercices de niveau ${diffLabels[difficulty]}. Prof Ada te guide pas à pas.`;
      case "revision":
        return `Révision complète de ${topic}. Refais les exercices importants et consolide tes acquis avant de passer à la suite.`;
      case "evaluation":
        return `Évaluation finale sur ${topic}. Teste tes connaissances dans les conditions d'examen pour mesurer ta progression.`;
    }
  },

  /**
   * Fetch relevant RAG content for a topic and session type.
   */
  async fetchRagContent(
    topic: string,
    type: "lesson" | "exercise" | "revision" | "evaluation",
  ): Promise<{ keyConcepts: string[]; exercises: string[]; ragSources: string[] }> {
    const keyConcepts: string[] = [];
    const exercises: string[] = [];
    const ragSources: string[] = [];

    try {
      // Search for course content
      if (type === "lesson" || type === "revision") {
        const coursResults = await RagService.search(
          `cours ${topic} BEPC 3eme mathématiques`,
          3,
          { sourceType: "cours", grade: "3eme" },
        );
        for (const result of coursResults) {
          keyConcepts.push(result.content.substring(0, 500));
          ragSources.push(result.title);
        }
      }

      // Search for exercises
      if (type === "exercise" || type === "revision" || type === "evaluation") {
        const exerciseResults = await RagService.search(
          `exercice ${topic} BEPC 3eme`,
          3,
          { sourceType: "exercice", grade: "3eme" },
        );
        for (const result of exerciseResults) {
          exercises.push(result.content.substring(0, 500));
          ragSources.push(result.title);
        }
      }

      // For evaluation, also look at past exam papers (annales)
      if (type === "evaluation") {
        const annaleResults = await RagService.search(
          `annale BEPC mathématiques ${topic}`,
          2,
          { sourceType: "annale", grade: "3eme" },
        );
        for (const result of annaleResults) {
          exercises.push(result.content.substring(0, 500));
          ragSources.push(result.title);
        }
      }
    } catch (error) {
      console.warn(`RAG fetch failed for topic "${topic}":`, error);
    }

    return {
      keyConcepts: keyConcepts.length > 0 ? keyConcepts : [`Notions fondamentales de ${topic}`],
      exercises: exercises.length > 0 ? exercises : [`Exercices pratiques sur ${topic}`],
      ragSources: [...new Set(ragSources)],
    };
  },

  /**
   * Persist the generated program to the database.
   */
  async persistProgram(
    student: Student,
    assessment: typeof schema.levelAssessments.$inferSelect,
    weekPlans: WeekPlan[],
    weeklySessionCount: number,
    sessionDuration: number,
    overallLevel: string,
    weaknesses: DomainResult[],
    strengths: DomainResult[],
    aiRecommendations: unknown,
  ) {
    const now = new Date();
    const startDate = new Date(now);
    // Start next Monday
    const dayOfWeek = startDate.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
    startDate.setDate(startDate.getDate() + daysUntilMonday);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 27); // 4 weeks = 28 days

    // Deactivate any existing active programs
    const existingPrograms = await db.query.coursePrograms.findMany({
      where: and(
        eq(schema.coursePrograms.studentId, student.id),
        eq(schema.coursePrograms.status, "active"),
      ),
    });
    for (const existing of existingPrograms) {
      await db
        .update(schema.coursePrograms)
        .set({ status: "abandoned", updatedAt: now })
        .where(eq(schema.coursePrograms.id, existing.id));
    }

    // Insert program
    const [program] = await db
      .insert(schema.coursePrograms)
      .values({
        studentId: student.id,
        assessmentId: assessment.id,
        title: `Programme personnalisé — ${overallLevel === "debutant" ? "Renforcement des bases" : overallLevel === "avance" ? "Perfectionnement" : "Progression vers l'objectif"}`,
        totalWeeks: 4,
        startDate,
        endDate,
        weeklySessionCount,
        sessionDurationMinutes: sessionDuration,
        overallLevel,
        weaknesses,
        strengths,
        recommendations: aiRecommendations,
      })
      .returning();

    // Insert weeks and sessions
    const weeksWithSessions = [];

    for (const weekPlan of weekPlans) {
      const [week] = await db
        .insert(schema.courseProgramWeeks)
        .values({
          programId: program.id,
          weekNumber: weekPlan.weekNumber,
          theme: weekPlan.theme,
          objectives: weekPlan.objectives,
          focusTopics: weekPlan.focusTopics,
          status: weekPlan.weekNumber === 1 ? "in_progress" : "upcoming",
        })
        .returning();

      const sessions = [];
      for (const sessionPlan of weekPlan.sessions) {
        const [session] = await db
          .insert(schema.courseProgramSessions)
          .values({
            weekId: week.id,
            dayNumber: sessionPlan.dayNumber,
            sessionOrder: sessionPlan.sessionOrder,
            topic: sessionPlan.topic,
            type: sessionPlan.type,
            title: sessionPlan.title,
            description: sessionPlan.description,
            durationMinutes: sessionPlan.durationMinutes,
            difficulty: sessionPlan.difficulty,
            content: sessionPlan.content,
            objectives: sessionPlan.objectives,
          })
          .returning();

        sessions.push(session);
      }

      weeksWithSessions.push({ ...week, sessions });
    }

    return { program, weeks: weeksWithSessions };
  },

  /**
   * Get the current active program for a student.
   */
  async getCurrentProgram(userId: number) {
    const student = await db.query.students.findFirst({
      where: eq(schema.students.userId, userId),
    });
    if (!student) throw new Error("Student not found");

    const program = await db.query.coursePrograms.findFirst({
      where: and(
        eq(schema.coursePrograms.studentId, student.id),
        eq(schema.coursePrograms.status, "active"),
      ),
      orderBy: [desc(schema.coursePrograms.createdAt)],
    });

    if (!program) return null;

    const weeks = await db.query.courseProgramWeeks.findMany({
      where: eq(schema.courseProgramWeeks.programId, program.id),
    });

    const weeksWithSessions = await Promise.all(
      weeks.map(async (week) => {
        const sessions = await db.query.courseProgramSessions.findMany({
          where: eq(schema.courseProgramSessions.weekId, week.id),
        });
        return { ...week, sessions };
      }),
    );

    return {
      ...program,
      weeks: weeksWithSessions.sort((a, b) => a.weekNumber - b.weekNumber),
    };
  },

  /**
   * Get a specific week's details.
   */
  async getWeekDetails(userId: number, weekNumber: number) {
    const program = await this.getCurrentProgram(userId);
    if (!program) throw new Error("No active program found");

    const week = program.weeks.find((w) => w.weekNumber === weekNumber);
    if (!week) throw new Error(`Week ${weekNumber} not found`);

    return week;
  },

  /**
   * Mark a session as completed.
   */
  async completeSession(userId: number, sessionId: number, score?: number) {
    const student = await db.query.students.findFirst({
      where: eq(schema.students.userId, userId),
    });
    if (!student) throw new Error("Student not found");

    // Verify the session belongs to the student's program
    const session = await db.query.courseProgramSessions.findFirst({
      where: eq(schema.courseProgramSessions.id, sessionId),
    });
    if (!session) throw new Error("Session not found");

    const week = await db.query.courseProgramWeeks.findFirst({
      where: eq(schema.courseProgramWeeks.id, session.weekId),
    });
    if (!week) throw new Error("Week not found");

    const program = await db.query.coursePrograms.findFirst({
      where: eq(schema.coursePrograms.id, week.programId),
    });
    if (!program || program.studentId !== student.id) throw new Error("Unauthorized");

    // Update session status
    await db
      .update(schema.courseProgramSessions)
      .set({
        status: "completed",
        completedAt: new Date(),
        scoreAtCompletion: score ?? null,
        updatedAt: new Date(),
      })
      .where(eq(schema.courseProgramSessions.id, sessionId));

    // Check if all sessions in the week are completed
    const allSessions = await db.query.courseProgramSessions.findMany({
      where: eq(schema.courseProgramSessions.weekId, week.id),
    });
    const allCompleted = allSessions.every(
      (s) => s.id === sessionId || s.status === "completed" || s.status === "skipped",
    );

    if (allCompleted) {
      // Mark week as completed
      await db
        .update(schema.courseProgramWeeks)
        .set({ status: "completed", updatedAt: new Date() })
        .where(eq(schema.courseProgramWeeks.id, week.id));

      // Activate next week if exists
      const nextWeek = await db.query.courseProgramWeeks.findFirst({
        where: and(
          eq(schema.courseProgramWeeks.programId, program.id),
          eq(schema.courseProgramWeeks.weekNumber, week.weekNumber + 1),
        ),
      });
      if (nextWeek) {
        await db
          .update(schema.courseProgramWeeks)
          .set({ status: "in_progress", updatedAt: new Date() })
          .where(eq(schema.courseProgramWeeks.id, nextWeek.id));
      } else {
        // All weeks completed → mark program as completed
        await db
          .update(schema.coursePrograms)
          .set({ status: "completed", updatedAt: new Date() })
          .where(eq(schema.coursePrograms.id, program.id));
      }
    }

    return { success: true };
  },
};
