import { eq, and, desc } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { AIService } from "./ai.service.js";

interface QuestionWithAnswer {
  id: string; // Now using generated IDs
  subject: string;
  difficulty: "facile" | "moyen" | "difficile"; // Fix type to match GeneratedQuestion
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string; // Make required to match GeneratedQuestion
  userAnswer?: number;
  isCorrect?: boolean;
  tags: string[]; // Make required to match GeneratedQuestion
}

interface AssessmentProgress {
  currentQuestionIndex: number;
  totalQuestions: number;
  questions: QuestionWithAnswer[];
  subjectProgress: Record<string, {
    correct: number;
    total: number;
    currentDifficulty: string;
    questionsAsked: number;
  }>;
  studentProfile: {
    examType: "BEPC" | "BAC";
    grade: "3eme" | "terminale";
    series?: "A1" | "A2" | "C" | "D";
    prioritySubjects: string[];
    targetScore?: number;
    currentLevel?: Record<string, "débutant" | "intermédiaire" | "avancé">;
  };
}

export const AssessmentService = {
  async startAssessment(userId: number): Promise<AssessmentProgress> {
    // Get student profile
    const student = await db.query.students.findFirst({
      where: eq(schema.students.userId, userId),
    });

    if (!student) {
      throw new Error("Student not found");
    }

    // Get priority subjects or all subjects for exam type
    const subjects = student.prioritySubjects as string[] || this.getDefaultSubjects(student);

    // Initialize progress
    const subjectProgress: Record<string, { correct: number; total: number; currentDifficulty: string; questionsAsked: number }> = {};
    subjects.forEach(subject => {
      subjectProgress[subject] = { correct: 0, total: 0, currentDifficulty: "facile", questionsAsked: 0 };
    });

    const studentProfile = {
      examType: student.examType as "BEPC" | "BAC",
      grade: student.grade as "3eme" | "terminale",
      series: student.series as "A1" | "A2" | "C" | "D" | undefined,
      prioritySubjects: subjects,
      targetScore: student.targetScore || undefined,
      currentLevel: {} as Record<string, "débutant" | "intermédiaire" | "avancé">, // Explicitly type as the expected union
    };

    // Generate first question using AI
    const firstQuestion = await this.generateNextQuestion(studentProfile, subjectProgress, []);

    return {
      currentQuestionIndex: 0,
      totalQuestions: 10,
      questions: [firstQuestion],
      subjectProgress,
      studentProfile,
    };
  },

  async generateNextQuestion(
    studentProfile: any,
    subjectProgress: Record<string, any>,
    previousQuestions: QuestionWithAnswer[]
  ): Promise<QuestionWithAnswer> {
    // Choose subject based on progress (prioritize less tested subjects)
    const availableSubjects = Object.keys(subjectProgress).filter(subject => subjectProgress[subject].questionsAsked < 5);
    const subject = availableSubjects[Math.floor(Math.random() * availableSubjects.length)] ||
                   Object.keys(subjectProgress)[0];

    const subjectData = subjectProgress[subject];
    const difficulty = subjectData.currentDifficulty;

    // Generate question using AI
    try {
      const aiQuestion = await AIService.generateAdaptiveQuestion(
        studentProfile,
        subject,
        difficulty as "facile" | "moyen" | "difficile",
        previousQuestions
      );

      return {
        id: `q_${Date.now()}_${Math.random()}`,
        subject: aiQuestion.subject,
        difficulty: aiQuestion.difficulty,
        question: aiQuestion.question,
        options: aiQuestion.options,
        correctAnswer: aiQuestion.correctAnswer,
        explanation: aiQuestion.explanation,
        tags: aiQuestion.tags,
      };
    } catch (error) {
      console.warn("AI service failed, using fallback question:", error);
      return this.getFallbackQuestion(subject, difficulty);
    }
  },

  async getNextQuestion(userId: number, progress: AssessmentProgress): Promise<QuestionWithAnswer | null> {
    if (progress.currentQuestionIndex >= progress.totalQuestions) {
      return null; // Assessment complete
    }

    // If we don't have enough questions pre-generated, generate the next one
    if (progress.questions.length <= progress.currentQuestionIndex) {
      const nextQuestion = await this.generateNextQuestion(
        progress.studentProfile,
        progress.subjectProgress,
        progress.questions
      );
      progress.questions.push(nextQuestion);
    }

    return progress.questions[progress.currentQuestionIndex];
  },

  async submitAnswer(
    userId: number,
    questionId: string,
    userAnswer: number,
    progress: AssessmentProgress
  ): Promise<AssessmentProgress> {
    const question = progress.questions.find(q => q.id === questionId);
    if (!question) {
      throw new Error("Question not found in progress");
    }

    // Mark answer
    question.userAnswer = userAnswer;
    question.isCorrect = userAnswer === question.correctAnswer;

    // Update subject progress
    const subjectData = progress.subjectProgress[question.subject];
    subjectData.total += 1;
    subjectData.questionsAsked += 1;

    if (question.isCorrect) {
      subjectData.correct += 1;

      // Increase difficulty if performing well
      if (subjectData.questionsAsked >= 2 && (subjectData.correct / subjectData.total) >= 0.7) {
        if (subjectData.currentDifficulty === "facile") {
          subjectData.currentDifficulty = "moyen";
        } else if (subjectData.currentDifficulty === "moyen") {
          subjectData.currentDifficulty = "difficile";
        }
      }
    } else {
      // Decrease difficulty if struggling
      if (subjectData.currentDifficulty === "difficile") {
        subjectData.currentDifficulty = "moyen";
      } else if (subjectData.currentDifficulty === "moyen") {
        subjectData.currentDifficulty = "facile";
      }
    }

    // Move to next question
    progress.currentQuestionIndex += 1;

    return progress;
  },

  async completeAssessment(userId: number, finalProgress: AssessmentProgress): Promise<{
    subjectLevels: Record<string, { level: string; percentage: number }>;
    overallAverage: number;
    personalizedPlan: any;
  }> {
    const subjectLevels: Record<string, { level: string; percentage: number }> = {};

    let totalScore = 0;
    let totalQuestions = 0;

    for (const [subject, data] of Object.entries(finalProgress.subjectProgress)) {
      const percentage = Math.round((data.correct / data.total) * 100);
      totalScore += data.correct;
      totalQuestions += data.total;

      let level: string;
      if (percentage >= 80) {
        level = "avancé";
      } else if (percentage >= 60) {
        level = "intermédiaire";
      } else {
        level = "débutant";
      }

      subjectLevels[subject] = { level, percentage };
    }

    const overallAverage = Math.round((totalScore / totalQuestions) * 100);

    // Generate personalized plan using AI
    const personalizedPlan = await AIService.generatePersonalizedPlan(
      finalProgress.studentProfile,
      subjectLevels
    );

    // Save assessment results
    const student = await db.query.students.findFirst({
      where: eq(schema.students.userId, userId),
    });

    if (student) {
      // Save to level_assessments table
      await db.insert(schema.levelAssessments).values({
        studentId: student.id,
        subject: "global", // For overall assessment
        questionsJson: finalProgress.questions.map(q => ({
          id: q.id,
          subject: q.subject,
          difficulty: q.difficulty,
          question: q.question,
          userAnswer: q.userAnswer,
          correctAnswer: q.correctAnswer,
          isCorrect: q.isCorrect,
        })),
        answersJson: finalProgress.questions.map(q => q.userAnswer),
        score: overallAverage,
        level: overallAverage >= 80 ? "avancé" : overallAverage >= 60 ? "intermédiaire" : "débutant",
        completedAt: new Date(),
      });

      // Update student assessment status
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

  getFallbackQuestion(subject: string, difficulty: string): QuestionWithAnswer {
    // Fallback questions when AI service is not available
    const fallbackQuestions: Record<string, QuestionWithAnswer[]> = {
      "Mathématiques": [
        {
          id: `fallback_math_${Date.now()}`,
          subject: "Mathématiques",
          difficulty: difficulty as "facile" | "moyen" | "difficile",
          question: "Quel est le résultat de 2 + 3 ?",
          options: ["3", "4", "5", "6"],
          correctAnswer: 2,
          explanation: "2 + 3 = 5, donc la réponse correcte est 5.",
          tags: ["arithmétique", "addition"]
        },
        {
          id: `fallback_math_${Date.now() + 1}`,
          subject: "Mathématiques",
          difficulty: difficulty as "facile" | "moyen" | "difficile",
          question: "Quel est le périmètre d'un carré de côté 4 cm ?",
          options: ["8 cm", "12 cm", "16 cm", "20 cm"],
          correctAnswer: 2,
          explanation: "Le périmètre d'un carré est 4 × côté = 4 × 4 = 16 cm.",
          tags: ["géométrie", "périmètre"]
        }
      ],
      "Français": [
        {
          id: `fallback_fr_${Date.now()}`,
          subject: "Français",
          difficulty: difficulty as "facile" | "moyen" | "difficile",
          question: "Quelle est la nature du mot 'maison' dans la phrase 'La maison est grande' ?",
          options: ["Verbe", "Adjectif", "Nom commun", "Pronom"],
          correctAnswer: 2,
          explanation: "'Maison' est un nom commun car il désigne un objet concret.",
          tags: ["grammaire", "nature des mots"]
        }
      ]
    };

    const subjectQuestions = fallbackQuestions[subject] || fallbackQuestions["Mathématiques"];
    return subjectQuestions[Math.floor(Math.random() * subjectQuestions.length)];
  },

  async getLatestResults(userId: number) {
    const student = await db.query.students.findFirst({
      where: eq(schema.students.userId, userId),
    });
    if (!student) return null;

    const assessment = await db.query.levelAssessments.findFirst({
      where: eq(schema.levelAssessments.studentId, student.id),
      orderBy: [desc(schema.levelAssessments.createdAt)],
    });
    if (!assessment) return null;

    // Rebuild subject levels from saved questions
    const questions = assessment.questionsJson as Array<{
      subject: string;
      isCorrect?: boolean;
    }>;

    const subjectLevels: Record<string, { level: string; percentage: number }> = {};
    const subjectStats: Record<string, { correct: number; total: number }> = {};

    for (const q of questions) {
      if (!subjectStats[q.subject]) {
        subjectStats[q.subject] = { correct: 0, total: 0 };
      }
      subjectStats[q.subject].total += 1;
      if (q.isCorrect) subjectStats[q.subject].correct += 1;
    }

    for (const [subject, stats] of Object.entries(subjectStats)) {
      const percentage = Math.round((stats.correct / stats.total) * 100);
      subjectLevels[subject] = {
        level: percentage >= 80 ? "avancé" : percentage >= 60 ? "intermédiaire" : "débutant",
        percentage,
      };
    }

    return {
      subjectLevels,
      overallAverage: assessment.score ?? 0,
      completedAt: assessment.completedAt,
    };
  },

  getDefaultSubjects(student: any): string[] {
    // Return default subjects based on exam type and series
    if (student.examType === "BEPC") {
      return ["Mathématiques", "Français", "Histoire-Géographie", "SVT", "Physique-Chimie", "Anglais"];
    } else { // BAC
      switch (student.series) {
        case "C":
          return ["Mathématiques", "Physique-Chimie", "SVT", "Philosophie", "Français", "Anglais"];
        case "D":
          return ["Mathématiques", "SVT", "Philosophie", "Français", "Anglais", "Espagnol"];
        case "A1":
        case "A2":
          return ["Mathématiques", "Philosophie", "Français", "Anglais", "SVT", "Histoire-Géographie"];
        default:
          return ["Mathématiques", "Français", "Philosophie", "Anglais"];
      }
    }
  },
};
