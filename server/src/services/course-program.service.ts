import { and, desc, eq } from "drizzle-orm";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

import { openai, CHAT_MODEL } from "../lib/openai.js";
import { db, schema } from "../db/index.js";
import { RagService } from "./rag.service.js";
import { PedagogicalContentService } from "./pedagogical-content.service.js";
import type { Student } from "../db/schema.js";

const DOMAIN_TO_TOPIC: Record<string, string> = {
  "Calcul numerique": "Calcul numerique",
  "Calcul litteral": "Calcul litteral",
  "Equations et inequations": "Equations et inequations",
  "Systemes d'equations": "Systemes d'equations",
  "Fonctions lineaires et affines": "Fonctions lineaires et affines",
  "Statistiques": "Statistiques",
  "Theoreme de Pythagore": "Geometrie plane",
  "Theoreme de Thales": "Geometrie plane",
  Trigonometrie: "Trigonometrie",
  "Problemes de la vie courante": "Problemes de la vie courante",
};

type Difficulty = "facile" | "moyen" | "difficile";
type ProgramSessionType = "lesson" | "exercise" | "quiz" | "recap" | "revision" | "evaluation";
type EngagementMode = "discovery" | "quick_win" | "challenge" | "exam_drill";

type SessionStatus = "upcoming" | "in_progress" | "completed" | "skipped";
type WeekStatus = "upcoming" | "in_progress" | "completed";
type ProgramStatus = "active" | "completed" | "abandoned";

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
  difficulty: Difficulty;
}

interface ProgramSessionPlan {
  dayNumber: number;
  sessionOrder: number;
  topic: string;
  type: ProgramSessionType;
  engagementMode: EngagementMode;
  title: string;
  description: string;
  durationMinutes: number;
  difficulty: Difficulty;
  objectives: string[];
  content: { keyConcepts: string[]; exercises: string[]; ragSources: string[] };
}

interface WeekPlan {
  weekNumber: number;
  theme: string;
  objectives: string[];
  focusTopics: Array<{ topic: string; priority: "high" | "medium" | "low"; hoursAllocated: number }>;
  sessions: ProgramSessionPlan[];
}

interface MicroTemplate {
  type: ProgramSessionType;
  durationMinutes: number;
  engagementMode: EngagementMode;
}

function parseJsonResponse(content: string): unknown {
  let cleaned = content.trim();
  const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) cleaned = match[1].trim();
  return JSON.parse(cleaned);
}

function normalizeText(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function mapDomainToTopic(domain: string): string {
  if (DOMAIN_TO_TOPIC[domain]) return DOMAIN_TO_TOPIC[domain];
  const normalized = normalizeText(domain);
  for (const [key, value] of Object.entries(DOMAIN_TO_TOPIC)) {
    if (normalizeText(key) === normalized) return value;
  }
  return domain;
}

export const CourseProgramService = {
  async generateProgram(userId: number): Promise<{
    program: typeof schema.coursePrograms.$inferSelect;
    weeks: Array<typeof schema.courseProgramWeeks.$inferSelect & {
      sessions: Array<typeof schema.courseProgramSessions.$inferSelect>;
    }>;
  }> {
    const student = await db.query.students.findFirst({
      where: eq(schema.students.userId, userId),
    });
    if (!student) throw new Error("Student not found");

    const assessment = await db.query.levelAssessments.findFirst({
      where: eq(schema.levelAssessments.studentId, student.id),
      orderBy: [desc(schema.levelAssessments.createdAt)],
    });
    if (!assessment) throw new Error("No assessment found. Complete the placement test first.");

    const studentSchedules = await db.query.schedules.findMany({
      where: and(
        eq(schema.schedules.studentId, student.id),
        eq(schema.schedules.isActive, true),
      ),
    });

    const weeklySessionCount = Math.max(studentSchedules.length, 3);
    const sessionDuration = studentSchedules[0]?.durationMinutes ?? 45;

    const { weaknesses, intermediates, strengths, overallLevel } = this.analyzeAssessmentResults(assessment);

    const topicAllocations = this.allocateTopicSessions(
      weaknesses,
      intermediates,
      strengths,
      weeklySessionCount * 4,
    );

    const aiRecommendations = await this.getAIRecommendations(
      student,
      { weaknesses, intermediates, strengths },
      topicAllocations,
    );

    const weekPlans = await this.buildWeekPlans(
      topicAllocations,
      weeklySessionCount,
      sessionDuration,
      aiRecommendations,
    );

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

  analyzeAssessmentResults(assessment: typeof schema.levelAssessments.$inferSelect) {
    const questions = (assessment.questionsJson as Array<{ topic?: string; isCorrect?: boolean }>) ?? [];

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
      const level = percentage < 50 ? "debutant" : percentage < 80 ? "intermediaire" : "avance";
      const result: DomainResult = { domain, level, percentage };

      if (percentage < 50) weaknesses.push(result);
      else if (percentage < 80) intermediates.push(result);
      else strengths.push(result);
    }

    weaknesses.sort((a, b) => a.percentage - b.percentage);

    const overallAvg = assessment.score ?? 0;
    const overallLevel = overallAvg < 50 ? "debutant" : overallAvg >= 80 ? "avance" : "intermediaire";

    return { weaknesses, intermediates, strengths, overallLevel };
  },

  allocateTopicSessions(
    weaknesses: DomainResult[],
    intermediates: DomainResult[],
    strengths: DomainResult[],
    totalSessions: number,
  ): TopicAllocation[] {
    const allocations: TopicAllocation[] = [];

    const weakSessionPool = Math.ceil(totalSessions * 0.55);
    const interSessionPool = Math.ceil(totalSessions * 0.30);
    const strongSessionPool = Math.max(1, totalSessions - weakSessionPool - interSessionPool);

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

    const merged = new Map<string, TopicAllocation>();
    for (const alloc of allocations) {
      const existing = merged.get(alloc.topic);
      if (existing) {
        existing.sessionsAllocated += alloc.sessionsAllocated;
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
      "Mathematiques",
      student.examType as "BEPC" | "BAC",
    );

    const systemPrompt = `Tu es Prof Ada. Genere des recommandations JSON pour un programme de 4 semaines.
Profil: ${student.examType}, ${student.grade}, objectif ${student.targetScore ?? 14}/20.
Faiblesses: ${results.weaknesses.map((w) => `${w.domain} ${w.percentage}%`).join(", ") || "aucune"}.
Allocations: ${allocations.map((a) => `${a.topic}(${a.priority}:${a.sessionsAllocated})`).join(", ")}.
Contexte: ${curriculumContext}.
Format strict JSON:
{
"summary":"...",
"weeklyThemes":["...","...","...","..."],
"tips":["...","...","..."],
"motivation":"..."
}`;

    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: "Genere les recommandations." },
    ];

    try {
      const response = await openai.chat.completions.create({
        model: CHAT_MODEL,
        messages,
        temperature: 0.4,
        max_tokens: 900,
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
        ? `Ton test montre des lacunes en ${weakTopics}. On va les traiter en micro-sprints pour garder le rythme.`
        : "Bon niveau global. Le programme va consolider et accelerer ta progression.",
      weeklyThemes: [
        "Renforcement des bases",
        "Consolidation et pratique",
        "Approfondissement",
        "Revision et simulation",
      ],
      tips: [
        "Travaille court mais regulierement.",
        "Vise une petite victoire a chaque session.",
        "Corrige tes erreurs le jour meme.",
      ],
      motivation: "Tu progresses mieux avec des etapes courtes et precises. On garde le cap.",
    };
  },

  async buildWeekPlans(
    allocations: TopicAllocation[],
    weeklySessionCount: number,
    sessionDuration: number,
    aiRecs: { weeklyThemes: string[] },
  ): Promise<WeekPlan[]> {
    const weeks: WeekPlan[] = [];

    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const sortedAllocations = [...allocations].sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
    );

    const sessionQueue: Array<{ topic: string; difficulty: Difficulty; priority: "high" | "medium" | "low" }> = [];
    for (const alloc of sortedAllocations) {
      for (let i = 0; i < alloc.sessionsAllocated; i++) {
        sessionQueue.push({ topic: alloc.topic, difficulty: alloc.difficulty, priority: alloc.priority });
      }
    }

    const weekSlots: Array<typeof sessionQueue> = [[], [], [], []];
    for (let i = 0; i < sessionQueue.length; i++) {
      weekSlots[i % 4].push(sessionQueue[i]);
    }

    for (let w = 0; w < 4; w++) {
      while (weekSlots[w].length < weeklySessionCount) {
        const fillTopic = sortedAllocations[0] ?? {
          topic: "Revision generale",
          difficulty: "moyen" as Difficulty,
          priority: "medium" as const,
        };
        weekSlots[w].push({
          topic: fillTopic.topic,
          difficulty: fillTopic.difficulty,
          priority: fillTopic.priority,
        });
      }
    }

    for (let weekNum = 1; weekNum <= 4; weekNum++) {
      const weekIdx = weekNum - 1;
      const theme = aiRecs.weeklyThemes[weekIdx] ?? `Semaine ${weekNum}`;
      const slotsForWeek = weekSlots[weekIdx].slice(0, weeklySessionCount);

      const weekTopics = [...new Set(slotsForWeek.map((s) => s.topic))];
      const objectives = this.getWeekObjectives(weekNum, weekTopics);

      const focusTopics = weekTopics.map((topic) => {
        const alloc = sortedAllocations.find((a) => a.topic === topic);
        const slotCountForTopic = slotsForWeek.filter((s) => s.topic === topic).length;
        const avgSlotMinutes = this.estimateMicroMinutesPerSlot(sessionDuration, weekNum);
        return {
          topic,
          priority: alloc?.priority ?? ("medium" as const),
          hoursAllocated: Math.round((slotCountForTopic * avgSlotMinutes) / 60 * 10) / 10,
        };
      });

      const sessions: ProgramSessionPlan[] = [];
      for (let dayIdx = 0; dayIdx < slotsForWeek.length; dayIdx++) {
        const slot = slotsForWeek[dayIdx];

        let baseDifficulty = slot.difficulty;
        if (weekNum >= 3 && baseDifficulty === "facile") baseDifficulty = "moyen";
        if (weekNum === 4 && baseDifficulty === "moyen") baseDifficulty = "difficile";

        const microBlueprint = this.buildDailyMicroSessions(weekNum, sessionDuration, dayIdx + 1);

        for (const micro of microBlueprint) {
          const difficulty = this.resolveDifficultyForType(baseDifficulty, micro.type, weekNum);
          const ragContent = await this.fetchRagContent(slot.topic, micro.type);

          sessions.push({
            dayNumber: dayIdx + 1,
            sessionOrder: micro.sessionOrder,
            topic: slot.topic,
            type: micro.type,
            engagementMode: micro.engagementMode,
            title: this.generateSessionTitle(slot.topic, micro.type, micro.engagementMode),
            description: this.generateSessionDescription(slot.topic, micro.type, difficulty, micro.engagementMode),
            durationMinutes: micro.durationMinutes,
            difficulty,
            objectives: this.getSessionObjectives(slot.topic, micro.type, weekNum),
            content: ragContent,
          });
        }
      }

      this.enforceWeeklyVariety(weekNum, sessions);

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

  estimateMicroMinutesPerSlot(slotDuration: number, weekNum: number): number {
    const plan = this.buildDailyMicroSessions(weekNum, slotDuration, 1);
    return plan.reduce((sum, p) => sum + p.durationMinutes, 0);
  },

  buildDailyMicroSessions(
    weekNum: number,
    slotDuration: number,
    dayNumber: number,
  ): Array<{ sessionOrder: number; type: ProgramSessionType; durationMinutes: number; engagementMode: EngagementMode }> {
    const blueprint30: MicroTemplate[] = [
      { type: "lesson", durationMinutes: 8, engagementMode: "discovery" },
      { type: "exercise", durationMinutes: 8, engagementMode: dayNumber % 2 === 0 ? "challenge" : "quick_win" },
      { type: "recap", durationMinutes: 4, engagementMode: "discovery" },
      // Exo final obligatoire avant de changer de topic.
      { type: "evaluation", durationMinutes: 10, engagementMode: "challenge" },
    ];

    const blueprint45: MicroTemplate[] = [
      { type: "lesson", durationMinutes: 10, engagementMode: "discovery" },
      { type: "exercise", durationMinutes: 12, engagementMode: dayNumber % 2 === 0 ? "challenge" : "quick_win" },
      { type: "quiz", durationMinutes: 8, engagementMode: "challenge" },
      { type: "recap", durationMinutes: 5, engagementMode: "discovery" },
      // Exo final obligatoire avant de changer de topic.
      { type: "evaluation", durationMinutes: 10, engagementMode: "challenge" },
    ];

    const blueprint60: MicroTemplate[] = [
      { type: "lesson", durationMinutes: 12, engagementMode: "discovery" },
      { type: "exercise", durationMinutes: 14, engagementMode: "quick_win" },
      { type: "quiz", durationMinutes: 8, engagementMode: "challenge" },
      { type: "exercise", durationMinutes: 10, engagementMode: "challenge" },
      { type: "recap", durationMinutes: 4, engagementMode: "discovery" },
      // Exo final obligatoire avant de changer de topic.
      { type: "evaluation", durationMinutes: 12, engagementMode: "challenge" },
    ];

    const raw = slotDuration >= 60 ? blueprint60 : slotDuration >= 45 ? blueprint45 : blueprint30;

    const transformed = weekNum >= 3
      ? raw.map((item) => item.type === "lesson" ? { ...item, type: "revision" as ProgramSessionType } : item)
      : raw;

    return transformed.map((item, index) => ({
      sessionOrder: index + 1,
      type: item.type,
      durationMinutes: item.durationMinutes,
      engagementMode: item.engagementMode,
    }));
  },

  enforceWeeklyVariety(weekNum: number, sessions: ProgramSessionPlan[]) {
    if (!sessions.some((s) => s.engagementMode === "quick_win")) {
      const ex = sessions.find((s) => s.type === "exercise");
      if (ex) {
        ex.engagementMode = "quick_win";
        ex.title = this.generateSessionTitle(ex.topic, ex.type, ex.engagementMode);
      }
    }

    if (!sessions.some((s) => s.engagementMode === "challenge")) {
      const quiz = sessions.find((s) => s.type === "quiz");
      if (quiz) {
        quiz.engagementMode = "challenge";
        quiz.title = this.generateSessionTitle(quiz.topic, quiz.type, quiz.engagementMode);
      } else {
        const ex = sessions.find((s) => s.type === "exercise");
        if (ex) {
          ex.engagementMode = "challenge";
          ex.title = this.generateSessionTitle(ex.topic, ex.type, ex.engagementMode);
        }
      }
    }

    if (weekNum === 4 && !sessions.some((s) => s.engagementMode === "exam_drill")) {
      const candidate = [...sessions].reverse().find((s) => s.type === "evaluation" || s.type === "revision" || s.type === "exercise");
      if (candidate) {
        candidate.engagementMode = "exam_drill";
        candidate.type = "evaluation";
        candidate.durationMinutes = Math.max(15, Math.min(20, candidate.durationMinutes + 5));
        candidate.title = this.generateSessionTitle(candidate.topic, candidate.type, candidate.engagementMode);
      }
    }
  },

  getWeekObjectives(weekNum: number, topics: string[]): string[] {
    const topicList = topics.slice(0, 3).join(", ");
    switch (weekNum) {
      case 1:
        return [
          `Revoir les notions fondamentales : ${topicList}`,
          "Identifier et corriger les erreurs frequentes",
          "Construire des automatismes sans surcharge",
        ];
      case 2:
        return [
          `Consolider les acquis : ${topicList}`,
          "Pratiquer en micro-sprints regulierement",
          "Transformer les points faibles en points stables",
        ];
      case 3:
        return [
          `Approfondir : ${topicList}`,
          "Monter en difficulte progressivement",
          "Ameliorer vitesse et precision",
        ];
      case 4:
        return [
          "Revision intensive ciblee",
          "Simulations courtes type examen",
          "Finaliser les derniers ajustements",
        ];
      default:
        return [`Travailler : ${topicList}`];
    }
  },

  getSessionObjectives(topic: string, type: ProgramSessionType, weekNum: number): string[] {
    switch (type) {
      case "lesson":
        return [
          `Comprendre les concepts cles de : ${topic}`,
          "Retenir les methodes essentielles",
          "Valider avec un exemple simple",
        ];
      case "exercise":
        return [
          `Pratiquer sur : ${topic}`,
          weekNum <= 2 ? "Exercices guides" : "Exercices plus autonomes",
          "Corriger les erreurs immediatement",
        ];
      case "quiz":
        return [
          `Tester les automatismes sur : ${topic}`,
          "Repondre sous mini-contrainte de temps",
          "Identifier les derniers points a revoir",
        ];
      case "recap":
        return [
          `Synthese rapide de : ${topic}`,
          "Fixer 2-3 points memorisables",
          "Repartir avec un plan clair pour la suite",
        ];
      case "revision":
        return [
          `Reviser et consolider : ${topic}`,
          "Refaire les exercices cles",
          "Verifier la robustesse des acquis",
        ];
      case "evaluation":
        return [
          `Exo final sur : ${topic}`,
          "Verifier que le topic est compris avant le suivant",
          "Identifier les derniers ajustements",
        ];
    }
  },

  generateSessionTitle(topic: string, type: ProgramSessionType, engagementMode: EngagementMode): string {
    const typeLabels: Record<ProgramSessionType, string> = {
      lesson: "Cours",
      exercise: "Exercice",
      quiz: "Quiz",
      recap: "Recap",
      revision: "Revision",
      evaluation: "Evaluation",
    };
    const modeLabels: Record<EngagementMode, string> = {
      discovery: "Decouverte",
      quick_win: "Quick win",
      challenge: "Challenge",
      exam_drill: "Exam drill",
    };
    if (type === "evaluation" && engagementMode !== "exam_drill") {
      return `Exo final (${modeLabels[engagementMode]}) : ${topic}`;
    }
    return `${typeLabels[type]} (${modeLabels[engagementMode]}) : ${topic}`;
  },

  resolveDifficultyForType(
    baseDifficulty: Difficulty,
    type: ProgramSessionType,
    weekNum: number,
  ): Difficulty {
    if (type === "recap") return "facile";
    if (type === "quiz") return weekNum <= 2 ? "moyen" : "difficile";
    if (type === "evaluation") return weekNum >= 4 ? "difficile" : "moyen";
    return baseDifficulty;
  },

  generateSessionDescription(
    topic: string,
    type: ProgramSessionType,
    difficulty: Difficulty,
    engagementMode: EngagementMode,
  ): string {
    const diffLabels = { facile: "fondamental", moyen: "intermediaire", difficile: "avance" };

    switch (type) {
      case "lesson":
        return `Cours court sur ${topic}, niveau ${diffLabels[difficulty]} (${engagementMode}).`;
      case "exercise":
        return `Bloc d'exercices guides sur ${topic}, niveau ${diffLabels[difficulty]} (${engagementMode}).`;
      case "quiz":
        return `Quiz chrono sur ${topic} (${engagementMode}).`;
      case "recap":
        return `Recap express de ${topic} pour fixer les acquis.`;
      case "revision":
        return `Revision ciblee de ${topic}, niveau ${diffLabels[difficulty]} (${engagementMode}).`;
      case "evaluation":
        if (engagementMode === "exam_drill") {
          return `Evaluation type examen sur ${topic} (${engagementMode}).`;
        }
        return `Exo final de validation sur ${topic} avant passage au topic suivant (${engagementMode}).`;
    }
  },

  async fetchRagContent(
    topic: string,
    type: ProgramSessionType,
  ): Promise<{ keyConcepts: string[]; exercises: string[]; ragSources: string[] }> {
    const keyConcepts: string[] = [];
    const exercises: string[] = [];
    const ragSources: string[] = [];

    try {
      if (type === "lesson" || type === "revision" || type === "recap") {
        const coursResults = await RagService.search(
          `cours ${topic} BEPC 3eme mathematiques`,
          3,
          { sourceType: "cours", grade: "3eme" },
        );
        for (const result of coursResults) {
          keyConcepts.push(result.content.substring(0, 500));
          ragSources.push(result.title);
        }
      }

      if (type === "exercise" || type === "revision" || type === "evaluation" || type === "quiz") {
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

      if (type === "evaluation") {
        const annaleResults = await RagService.search(
          `annale BEPC mathematiques ${topic}`,
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
    const dayOfWeek = startDate.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
    startDate.setDate(startDate.getDate() + daysUntilMonday);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 27);

    const existingPrograms = await db.query.coursePrograms.findMany({
      where: and(
        eq(schema.coursePrograms.studentId, student.id),
        eq(schema.coursePrograms.status, "active" as ProgramStatus),
      ),
    });

    for (const existing of existingPrograms) {
      await db
        .update(schema.coursePrograms)
        .set({ status: "abandoned" as ProgramStatus, updatedAt: now })
        .where(eq(schema.coursePrograms.id, existing.id));
    }

    const [program] = await db
      .insert(schema.coursePrograms)
      .values({
        studentId: student.id,
        assessmentId: assessment.id,
        title: `Programme personnalise - ${overallLevel === "debutant" ? "Renforcement des bases" : overallLevel === "avance" ? "Perfectionnement" : "Progression"}`,
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
          status: weekPlan.weekNumber === 1 ? ("in_progress" as WeekStatus) : ("upcoming" as WeekStatus),
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
            engagementMode: sessionPlan.engagementMode,
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

  async getCurrentProgram(userId: number) {
    const student = await db.query.students.findFirst({
      where: eq(schema.students.userId, userId),
    });
    if (!student) throw new Error("Student not found");

    const program = await db.query.coursePrograms.findFirst({
      where: and(
        eq(schema.coursePrograms.studentId, student.id),
        eq(schema.coursePrograms.status, "active" as ProgramStatus),
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

        return {
          ...week,
          sessions: sessions.sort((a, b) => (a.dayNumber - b.dayNumber) || (a.sessionOrder - b.sessionOrder)),
        };
      }),
    );

    return {
      ...program,
      weeks: weeksWithSessions.sort((a, b) => a.weekNumber - b.weekNumber),
    };
  },

  async getWeekDetails(userId: number, weekNumber: number) {
    const program = await this.getCurrentProgram(userId);
    if (!program) throw new Error("No active program found");

    const week = program.weeks.find((w) => w.weekNumber === weekNumber);
    if (!week) throw new Error(`Week ${weekNumber} not found`);

    return week;
  },

  async getNextSession(userId: number) {
    const program = await this.getCurrentProgram(userId);
    if (!program) return null;

    const orderedSessions = program.weeks
      .slice()
      .sort((a, b) => a.weekNumber - b.weekNumber)
      .flatMap((week) =>
        (week.sessions ?? [])
          .slice()
          .sort((a, b) => (a.dayNumber - b.dayNumber) || (a.sessionOrder - b.sessionOrder))
          .map((session) => ({
            session,
            weekNumber: week.weekNumber,
            weekTheme: week.theme,
          })),
      );

    const next = orderedSessions.find(
      (item) => item.session.status === "upcoming" || item.session.status === "in_progress",
    );

    if (!next) return null;

    return {
      programId: program.id,
      weekNumber: next.weekNumber,
      weekTheme: next.weekTheme,
      session: next.session,
    };
  },

  async startSession(userId: number, sessionId: number) {
    const student = await db.query.students.findFirst({
      where: eq(schema.students.userId, userId),
    });
    if (!student) throw new Error("Student not found");

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

    const allWeeks = await db.query.courseProgramWeeks.findMany({
      where: eq(schema.courseProgramWeeks.programId, program.id),
    });
    const weekIds = allWeeks.map((w) => w.id);

    const allSessions = await Promise.all(
      weekIds.map((weekId) =>
        db.query.courseProgramSessions.findMany({
          where: eq(schema.courseProgramSessions.weekId, weekId),
        }),
      ),
    );

    const weekById = new Map(allWeeks.map((w) => [w.id, w]));
    const orderedSessions = allSessions
      .flat()
      .sort((a, b) => {
        const weekA = weekById.get(a.weekId);
        const weekB = weekById.get(b.weekId);
        const weekOrder = (weekA?.weekNumber ?? 0) - (weekB?.weekNumber ?? 0);
        if (weekOrder !== 0) return weekOrder;
        const dayOrder = a.dayNumber - b.dayNumber;
        if (dayOrder !== 0) return dayOrder;
        return a.sessionOrder - b.sessionOrder;
      });

    const nextPending = orderedSessions.find(
      (s) => s.status === "upcoming" || s.status === "in_progress",
    );

    if (!nextPending) {
      throw new Error("No pending session in this program");
    }

    if (nextPending.id !== sessionId) {
      throw new Error("Session must follow the program order");
    }

    if (session.status === "completed" || session.status === "skipped") {
      throw new Error("Session already closed");
    }

    let startedSession = session;
    if (session.status === "upcoming") {
      const [updated] = await db
        .update(schema.courseProgramSessions)
        .set({
          status: "in_progress" as SessionStatus,
          updatedAt: new Date(),
        })
        .where(eq(schema.courseProgramSessions.id, sessionId))
        .returning();
      startedSession = updated ?? session;
    }

    return {
      programId: program.id,
      weekNumber: week.weekNumber,
      weekTheme: week.theme,
      session: startedSession,
    };
  },

  async completeSession(userId: number, sessionId: number, score?: number) {
    const student = await db.query.students.findFirst({
      where: eq(schema.students.userId, userId),
    });
    if (!student) throw new Error("Student not found");

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

    const allWeeks = await db.query.courseProgramWeeks.findMany({
      where: eq(schema.courseProgramWeeks.programId, program.id),
    });
    const weekById = new Map(allWeeks.map((w) => [w.id, w]));
    const allSessions = await Promise.all(
      allWeeks.map((w) =>
        db.query.courseProgramSessions.findMany({
          where: eq(schema.courseProgramSessions.weekId, w.id),
        }),
      ),
    );

    const orderedSessions = allSessions
      .flat()
      .sort((a, b) => {
        const weekA = weekById.get(a.weekId);
        const weekB = weekById.get(b.weekId);
        const weekOrder = (weekA?.weekNumber ?? 0) - (weekB?.weekNumber ?? 0);
        if (weekOrder !== 0) return weekOrder;
        const dayOrder = a.dayNumber - b.dayNumber;
        if (dayOrder !== 0) return dayOrder;
        return a.sessionOrder - b.sessionOrder;
      });
    const nextPending = orderedSessions.find(
      (s) => s.status === "upcoming" || s.status === "in_progress",
    );

    if (!nextPending || nextPending.id !== sessionId) {
      throw new Error("Session must follow the program order");
    }

    await db
      .update(schema.courseProgramSessions)
      .set({
        status: "completed" as SessionStatus,
        completedAt: new Date(),
        scoreAtCompletion: score ?? null,
        updatedAt: new Date(),
      })
      .where(eq(schema.courseProgramSessions.id, sessionId));

    const weekSessions = await db.query.courseProgramSessions.findMany({
      where: eq(schema.courseProgramSessions.weekId, week.id),
    });
    const allCompleted = weekSessions.every(
      (s) => s.id === sessionId || s.status === "completed" || s.status === "skipped",
    );

    if (allCompleted) {
      await db
        .update(schema.courseProgramWeeks)
        .set({ status: "completed" as WeekStatus, updatedAt: new Date() })
        .where(eq(schema.courseProgramWeeks.id, week.id));

      const nextWeek = await db.query.courseProgramWeeks.findFirst({
        where: and(
          eq(schema.courseProgramWeeks.programId, program.id),
          eq(schema.courseProgramWeeks.weekNumber, week.weekNumber + 1),
        ),
      });

      if (nextWeek) {
        await db
          .update(schema.courseProgramWeeks)
          .set({ status: "in_progress" as WeekStatus, updatedAt: new Date() })
          .where(eq(schema.courseProgramWeeks.id, nextWeek.id));
      } else {
        await db
          .update(schema.coursePrograms)
          .set({ status: "completed" as ProgramStatus, updatedAt: new Date() })
          .where(eq(schema.coursePrograms.id, program.id));
      }
    }

    return { success: true };
  },
};
