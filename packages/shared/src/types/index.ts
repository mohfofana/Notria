export type UserRole = "student" | "parent" | "admin";
export type ExamType = "BEPC" | "BAC";
export type Series = "A1" | "A2" | "C" | "D";
export type Grade = "3eme" | "terminale";
export type Difficulty = "facile" | "moyen" | "difficile";
export type MessageRole = "user" | "assistant" | "system";
export type SubscriptionPlan = "gratuit" | "standard" | "premium";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "unpaid";
export type HomeworkStatus = "pending" | "completed" | "partial";
export type SessionStatus = "upcoming" | "completed" | "missed" | "rescheduled";
export type StudyPlanWeekStatus = "upcoming" | "in_progress" | "completed";
export type StudentLevel = "debutant" | "intermediaire" | "avance";
export type RagSourceType = "cours" | "exercice" | "annale" | "livre";

export interface User {
  id: number;
  phone: string;
  email?: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: string;
}

export interface Student {
  id: number;
  userId: number;
  country: string;
  examType: ExamType;
  grade: Grade;
  series?: Series;
  school?: string;
  targetScore?: number;
  onboardingCompleted: boolean;
  assessmentCompleted: boolean;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate?: string;
}

export interface Conversation {
  id: number;
  studentId: number;
  subject: string;
  topic?: string;
  title?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: number;
  conversationId: number;
  role: MessageRole;
  content: string;
  tokenCount?: number;
  createdAt: string;
}

export interface Exercise {
  id: number;
  studentId: number;
  subject: string;
  topic: string;
  difficulty: Difficulty;
  question: string;
  expectedAnswer: string;
  studentAnswer?: string;
  isCorrect?: boolean;
  score?: number;
  feedback?: string;
  homeworkSetId?: number;
  answeredAt?: string;
  createdAt: string;
}

export interface HomeworkSet {
  id: number;
  studentId: number;
  conversationId: number;
  status: HomeworkStatus;
  dueDate?: string;
  createdAt: string;
  exercises?: Exercise[];
}

export interface Progress {
  id: number;
  studentId: number;
  subject: string;
  topic?: string;
  scorePercentage: number;
  exercisesCompleted: number;
  exercisesCorrect: number;
  lastUpdated: string;
}

export interface StudyPlan {
  id: number;
  studentId: number;
  examDate?: string;
  totalWeeks: number;
  currentWeek: number;
  generatedAt: string;
  lastAdjustedAt: string;
}

export interface StudyPlanWeek {
  id: number;
  studyPlanId: number;
  weekNumber: number;
  subject: string;
  topic: string;
  objective: string;
  status: StudyPlanWeekStatus;
  scoreAtCompletion?: number;
}

export interface Schedule {
  id: number;
  studentId: number;
  dayOfWeek: number;
  startTime: string;
  durationMinutes: number;
  subject?: string;
  isActive: boolean;
}

export interface ScheduledSession {
  id: number;
  studentId: number;
  scheduleId: number;
  date: string;
  subject: string;
  topic?: string;
  status: SessionStatus;
  conversationId?: number;
}

export interface Subscription {
  id: number;
  userId: number;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  trialStart?: string;
  trialEnd?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
}

export interface LevelAssessment {
  id: number;
  studentId: number;
  subject: string;
  score?: number;
  level?: StudentLevel;
  completedAt?: string;
}

export interface RagSearchFilters {
  chapter?: string;
  grade?: string;
  sourceType?: RagSourceType;
}

export interface RagSearchRequest {
  query: string;
  limit?: number;
  filters?: RagSearchFilters;
}

export interface RagSearchResult {
  id: number;
  content: string;
  chapter: string | null;
  sourceType: RagSourceType | string;
  title: string;
  similarity: number;
  metadata: Record<string, unknown> | null;
}
