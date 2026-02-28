import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { AIService } from "./ai.service.js";

type Difficulty = "facile" | "moyen" | "difficile";

interface QuestionBankItem {
  id: string;
  topic: string;
  difficulty: Difficulty;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  tags: string[];
}

interface PlannedQuestion extends QuestionBankItem {
  subject: "Mathematiques";
  domainKey: string;
  domainAttempt: number;
  userAnswer?: number;
  isCorrect?: boolean;
}

interface DomainProgress {
  topic: string;
  asked: number;
  correct: number;
  totalPlanned: number;
}

interface StudentProfile {
  examType: "BEPC" | "BAC";
  grade: "3eme" | "terminale";
  series?: "A1" | "A2" | "C" | "D";
  prioritySubjects: string[];
  targetScore?: number;
}

interface AssessmentProgress {
  currentQuestionIndex: number;
  totalQuestions: number;
  questions: PlannedQuestion[];
  domainProgress: Record<string, DomainProgress>;
  studentProfile: StudentProfile;
}

const QUESTION_BANK_PATH = fileURLToPath(
  new URL("../../data/assessment/bepc-maths-3eme.json", import.meta.url),
);

const DOMAIN_CONFIG = [
  { key: "calc_num", topic: "Calcul numerique", idPrefix: "calc-num", count: 1 },
  { key: "calc_lit", topic: "Calcul litteral", idPrefix: "calc-lit", count: 2 },
  { key: "equations", topic: "Equations et inequations", idPrefix: "eq-", count: 2 },
  { key: "systemes", topic: "Systemes d'equations", idPrefix: "sys-", count: 1 },
  { key: "fonctions", topic: "Fonctions lineaires et affines", idPrefix: "fonc-", count: 2 },
  { key: "statistiques", topic: "Statistiques", idPrefix: "stat-", count: 1 },
  { key: "pythagore", topic: "Theoreme de Pythagore", idPrefix: "pyth-", count: 2 },
  { key: "thales", topic: "Theoreme de Thales", idPrefix: "thal-", count: 2 },
  { key: "trigonometrie", topic: "Trigonometrie", idPrefix: "trigo-", count: 1 },
  { key: "vie_courante", topic: "Problemes de la vie courante", idPrefix: "prob-", count: 1 },
] as const;

const REQUIRED_TOTAL_QUESTIONS = DOMAIN_CONFIG.reduce((sum, domain) => sum + domain.count, 0);
const LEVEL_BEGINNER = "debutant";
const LEVEL_INTERMEDIATE = "intermediaire";
const LEVEL_ADVANCED = "avance";

function repairMojibake(input: string): string {
  if (!/[ÃÂâ]/.test(input)) {
    return input;
  }

  const repaired = Buffer.from(input, "latin1").toString("utf8");
  return /[ÃÂâ]/.test(repaired) ? input : repaired;
}

const WINDOWS_1252_REVERSE_MAP: Record<number, number> = {
  0x20ac: 0x80,
  0x201a: 0x82,
  0x0192: 0x83,
  0x201e: 0x84,
  0x2026: 0x85,
  0x2020: 0x86,
  0x2021: 0x87,
  0x02c6: 0x88,
  0x2030: 0x89,
  0x0160: 0x8a,
  0x2039: 0x8b,
  0x0152: 0x8c,
  0x017d: 0x8e,
  0x2018: 0x91,
  0x2019: 0x92,
  0x201c: 0x93,
  0x201d: 0x94,
  0x2022: 0x95,
  0x2013: 0x96,
  0x2014: 0x97,
  0x02dc: 0x98,
  0x2122: 0x99,
  0x0161: 0x9a,
  0x203a: 0x9b,
  0x0153: 0x9c,
  0x017e: 0x9e,
  0x0178: 0x9f,
};

function corruptionScore(input: string): number {
  let score = 0;
  for (const char of input) {
    const code = char.charCodeAt(0);
    if (code === 0xfffd) {
      score += 3;
      continue;
    }
    if (code < 32 && code !== 9 && code !== 10 && code !== 13) {
      score += 2;
      continue;
    }
    if (code === 0x00c3 || code === 0x00c2 || code === 0x00e2) {
      score += 1;
    }
  }
  return score;
}

function toWindows1252Bytes(input: string): Uint8Array | null {
  const bytes: number[] = [];
  for (const char of input) {
    const code = char.charCodeAt(0);
    if (code <= 0xff) {
      bytes.push(code);
      continue;
    }

    const mapped = WINDOWS_1252_REVERSE_MAP[code];
    if (mapped === undefined) {
      return null;
    }
    bytes.push(mapped);
  }
  return Uint8Array.from(bytes);
}

function cleanupResidualArtifacts(input: string): string {
  return input
    .replace(/\uFFFD!\u0019/g, "\u21D2")
    .replace(/\uFFFD\uFFFD\u0019/g, "\u2212")
    .replace(/\uFFFD\u0019/g, "\u2212")
    .replace(/\uFFFD\u0014/g, "\u00D7")
    .replace(/\uFFFD0\uFFFD/g, "\u2248")
    .replace(/\uFFFD\u001A/g, "\u03B1");
}

function hasSuspiciousArtifacts(input: string): boolean {
  for (const char of input) {
    const code = char.charCodeAt(0);
    if (code === 0xfffd || code === 0x00c3 || code === 0x00c2 || code === 0x00e2) {
      return true;
    }
  }
  return false;
}

function normalizeQuestionText(input: string): string {
  if (!hasSuspiciousArtifacts(input)) {
    return cleanupResidualArtifacts(input);
  }

  const bytes = toWindows1252Bytes(input);
  if (!bytes) {
    return cleanupResidualArtifacts(repairMojibake(input));
  }

  const repaired = Buffer.from(bytes).toString("utf8");
  if (corruptionScore(repaired) < corruptionScore(input)) {
    return cleanupResidualArtifacts(repaired);
  }

  return cleanupResidualArtifacts(repairMojibake(input));
}

function normalizeText(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function loadQuestionBank(): QuestionBankItem[] {
  const raw = readFileSync(QUESTION_BANK_PATH, "utf8");
  const sanitized = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
  const parsed = JSON.parse(sanitized) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("Invalid assessment question bank format");
  }

  const questions = (parsed as QuestionBankItem[]).map((question) => ({
    ...question,
    topic: normalizeQuestionText(question.topic),
    question: normalizeQuestionText(question.question),
    options: question.options.map((option) => normalizeQuestionText(option)),
    explanation: normalizeQuestionText(question.explanation),
    tags: question.tags.map((tag) => normalizeQuestionText(tag)),
  }));

  const uniqueIds = new Set<string>();
  for (const question of questions) {
    if (
      !question.id ||
      !question.topic ||
      !question.question ||
      !Array.isArray(question.options) ||
      question.options.length !== 4 ||
      typeof question.correctAnswer !== "number"
    ) {
      throw new Error(`Invalid question in bank: ${JSON.stringify(question).slice(0, 120)}`);
    }
    if (uniqueIds.has(question.id)) {
      throw new Error(`Duplicate question id in bank: ${question.id}`);
    }
    uniqueIds.add(question.id);
  }

  return questions;
}

const QUESTION_BANK = loadQuestionBank();

function findDomainByQuestion(question: QuestionBankItem) {
  const normalizedTopic = normalizeText(question.topic);
  return DOMAIN_CONFIG.find((domain) => {
    if (question.id.startsWith(domain.idPrefix)) {
      return true;
    }
    return normalizedTopic.includes(normalizeText(domain.topic));
  });
}

function getQuestionsForDomain(domainKey: string, difficulty: Difficulty) {
  return QUESTION_BANK.filter((question) => {
    const domain = findDomainByQuestion(question);
    return domain?.key === domainKey && question.difficulty === difficulty;
  });
}

function pickQuestion(
  domainKey: string,
  difficulty: Difficulty,
  usedIds: Set<string>,
): QuestionBankItem {
  const preferred = getQuestionsForDomain(domainKey, difficulty).filter((q) => !usedIds.has(q.id));
  if (preferred.length > 0) {
    return preferred[Math.floor(Math.random() * preferred.length)];
  }

  const fallback = QUESTION_BANK.filter((q) => {
    const domain = findDomainByQuestion(q);
    return domain?.key === domainKey && !usedIds.has(q.id);
  });
  if (fallback.length > 0) {
    return fallback[Math.floor(Math.random() * fallback.length)];
  }

  throw new Error(`No available question for domain "${domainKey}"`);
}

function resolveTopic(domainKey: string, questionTopic: string): string {
  const domain = DOMAIN_CONFIG.find((item) => item.key === domainKey);
  return domain?.topic ?? questionTopic;
}

function createQuestionPlan(): PlannedQuestion[] {
  const usedIds = new Set<string>();
  const plan: PlannedQuestion[] = [];

  const shuffledDomains = [...DOMAIN_CONFIG].sort(() => Math.random() - 0.5);

  for (const domain of shuffledDomains) {
    const firstQuestion = pickQuestion(domain.key, "moyen", usedIds);
    usedIds.add(firstQuestion.id);
    plan.push({
      ...firstQuestion,
      topic: resolveTopic(domain.key, firstQuestion.topic),
      subject: "Mathematiques",
      domainKey: domain.key,
      domainAttempt: 1,
    });
  }

  for (const domain of shuffledDomains.filter((item) => item.count === 2)) {
    const secondQuestion = pickQuestion(domain.key, "moyen", usedIds);
    usedIds.add(secondQuestion.id);
    plan.push({
      ...secondQuestion,
      topic: resolveTopic(domain.key, secondQuestion.topic),
      subject: "Mathematiques",
      domainKey: domain.key,
      domainAttempt: 2,
    });
  }

  if (plan.length !== REQUIRED_TOTAL_QUESTIONS) {
    throw new Error(`Invalid assessment plan length: ${plan.length}`);
  }

  return plan;
}

function computeDomainLevel(
  correct: number,
  totalPlanned: number,
): { level: string; percentage: number } {
  const percentage = totalPlanned > 0 ? Math.round((correct / totalPlanned) * 100) : 0;

  if (totalPlanned === 2) {
    if (correct === 2) return { level: LEVEL_ADVANCED, percentage };
    if (correct === 1) return { level: LEVEL_INTERMEDIATE, percentage };
    return { level: LEVEL_BEGINNER, percentage };
  }

  if (percentage >= 80) return { level: LEVEL_ADVANCED, percentage };
  if (percentage >= 50) return { level: LEVEL_INTERMEDIATE, percentage };
  return { level: LEVEL_BEGINNER, percentage };
}

export const AssessmentService = {
  async startAssessment(userId: number): Promise<AssessmentProgress> {
    const student = await db.query.students.findFirst({
      where: eq(schema.students.userId, userId),
    });

    if (!student) {
      throw new Error("Student not found");
    }

    const domainProgress: Record<string, DomainProgress> = {};
    for (const domain of DOMAIN_CONFIG) {
      domainProgress[domain.key] = {
        topic: domain.topic,
        asked: 0,
        correct: 0,
        totalPlanned: domain.count,
      };
    }

    return {
      currentQuestionIndex: 0,
      totalQuestions: REQUIRED_TOTAL_QUESTIONS,
      questions: createQuestionPlan(),
      domainProgress,
      studentProfile: {
        examType: student.examType as "BEPC" | "BAC",
        grade: student.grade as "3eme" | "terminale",
        series: student.series as "A1" | "A2" | "C" | "D" | undefined,
        prioritySubjects: ["Mathematiques"],
        targetScore: student.targetScore || undefined,
      },
    };
  },

  async getNextQuestion(userId: number, progress: AssessmentProgress): Promise<PlannedQuestion | null> {
    if (progress.currentQuestionIndex >= progress.totalQuestions) {
      return null;
    }

    return progress.questions[progress.currentQuestionIndex] ?? null;
  },

  async submitAnswer(
    userId: number,
    questionId: string,
    userAnswer: number,
    progress: AssessmentProgress,
  ): Promise<AssessmentProgress> {
    const currentQuestion = progress.questions.find((question) => question.id === questionId);
    if (!currentQuestion) {
      throw new Error("Question not found in progress");
    }

    currentQuestion.userAnswer = userAnswer;
    currentQuestion.isCorrect = userAnswer === currentQuestion.correctAnswer;

    const domainState = progress.domainProgress[currentQuestion.domainKey];
    domainState.asked += 1;
    if (currentQuestion.isCorrect) {
      domainState.correct += 1;
    }

    if (currentQuestion.domainAttempt === 1 && domainState.totalPlanned === 2) {
      const secondQuestionIndex = progress.questions.findIndex(
        (question) => question.domainKey === currentQuestion.domainKey && question.domainAttempt === 2,
      );

      if (secondQuestionIndex >= 0) {
        const desiredDifficulty: Difficulty = currentQuestion.isCorrect ? "difficile" : "facile";
        const nextQuestion = progress.questions[secondQuestionIndex];
        const usedIds = new Set(progress.questions.map((question) => question.id));
        usedIds.delete(nextQuestion.id);

        const replacement = pickQuestion(currentQuestion.domainKey, desiredDifficulty, usedIds);
        progress.questions[secondQuestionIndex] = {
          ...replacement,
          topic: resolveTopic(currentQuestion.domainKey, replacement.topic),
          subject: "Mathematiques",
          domainKey: currentQuestion.domainKey,
          domainAttempt: 2,
        };
      }
    }

    progress.currentQuestionIndex += 1;
    return progress;
  },

  async completeAssessment(
    userId: number,
    finalProgress: AssessmentProgress,
  ): Promise<{
    subjectLevels: Record<string, { level: string; percentage: number }>;
    overallAverage: number;
    personalizedPlan: unknown;
  }> {
    const subjectLevels: Record<string, { level: string; percentage: number }> = {};

    let totalCorrect = 0;
    let totalAnswered = 0;

    for (const [domainKey, domainState] of Object.entries(finalProgress.domainProgress)) {
      totalCorrect += domainState.correct;
      totalAnswered += domainState.asked;

      const result = computeDomainLevel(domainState.correct, domainState.totalPlanned);
      const label = DOMAIN_CONFIG.find((domain) => domain.key === domainKey)?.topic ?? domainState.topic;
      subjectLevels[label] = result;
    }

    const overallAverage = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
    const personalizedPlan = await AIService.generatePersonalizedPlan(finalProgress.studentProfile, subjectLevels);

    const student = await db.query.students.findFirst({
      where: eq(schema.students.userId, userId),
    });

    if (student) {
      await db.insert(schema.levelAssessments).values({
        studentId: student.id,
        subject: "Mathematiques",
        questionsJson: finalProgress.questions.map((question) => ({
          id: question.id,
          topic: question.topic,
          subject: question.subject,
          difficulty: question.difficulty,
          question: question.question,
          options: question.options,
          userAnswer: question.userAnswer,
          correctAnswer: question.correctAnswer,
          isCorrect: question.isCorrect,
          tags: question.tags,
        })),
        answersJson: finalProgress.questions.map((question) => question.userAnswer ?? null),
        score: overallAverage,
        completedAt: new Date(),
      });

      await db
        .update(schema.students)
        .set({
          assessmentCompleted: true,
          updatedAt: new Date(),
        })
        .where(eq(schema.students.id, student.id));
    }

    return { subjectLevels, overallAverage, personalizedPlan };
  },

  async getLatestResults(userId: number) {
    const student = await db.query.students.findFirst({
      where: eq(schema.students.userId, userId),
    });
    if (!student) {
      return null;
    }

    const assessment = await db.query.levelAssessments.findFirst({
      where: eq(schema.levelAssessments.studentId, student.id),
      orderBy: [desc(schema.levelAssessments.createdAt)],
    });
    if (!assessment) {
      return null;
    }

    const questions = (assessment.questionsJson as Array<{
      topic?: string;
      isCorrect?: boolean;
    }>) ?? [];

    const topicStats: Record<string, { correct: number; total: number }> = {};
    for (const question of questions) {
      const topic = question.topic ?? "Mathematiques";
      if (!topicStats[topic]) {
        topicStats[topic] = { correct: 0, total: 0 };
      }
      topicStats[topic].total += 1;
      if (question.isCorrect) {
        topicStats[topic].correct += 1;
      }
    }

    const subjectLevels: Record<string, { level: string; percentage: number }> = {};
    for (const [topic, stats] of Object.entries(topicStats)) {
      const domain = DOMAIN_CONFIG.find((item) => normalizeText(item.topic) === normalizeText(topic));
      const totalPlanned = domain?.count ?? stats.total;
      subjectLevels[topic] = computeDomainLevel(stats.correct, totalPlanned);
    }

    return {
      subjectLevels,
      overallAverage: assessment.score ?? 0,
      completedAt: assessment.completedAt,
    };
  },
};
