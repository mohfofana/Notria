import { pgTable, serial, text, integer, timestamp, boolean, decimal, jsonb, varchar } from "drizzle-orm/pg-core";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  phone: varchar("phone", { length: 20 }).unique().notNull(),
  email: varchar("email", { length: 255 }),
  role: varchar("role", { enum: ["student", "parent", "admin"] }).notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Students table
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  country: varchar("country", { length: 100 }).notNull(),
  examType: varchar("exam_type", { enum: ["BEPC", "BAC"] }).notNull(),
  grade: varchar("grade", { enum: ["3eme", "terminale"] }).notNull(),
  series: varchar("series", { enum: ["A1", "A2", "C", "D"] }),
  school: varchar("school", { length: 255 }),
  targetScore: integer("target_score"),
  onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
  assessmentCompleted: boolean("assessment_completed").default(false).notNull(),
  currentStreak: integer("current_streak").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
  lastActiveDate: timestamp("last_active_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Parents table
export const parents = pgTable("parents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Parent-Student relationships
export const parentStudents = pgTable("parent_students", {
  id: serial("id").primaryKey(),
  parentId: integer("parent_id").references(() => parents.id).notNull(),
  studentId: integer("student_id").references(() => students.id).notNull(),
  inviteCode: varchar("invite_code", { length: 6 }).unique().notNull(),
  isConfirmed: boolean("is_confirmed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Conversations
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => students.id).notNull(),
  subject: varchar("subject", { length: 100 }).notNull(),
  topic: varchar("topic", { length: 255 }),
  title: varchar("title", { length: 255 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Messages
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => conversations.id).notNull(),
  role: varchar("role", { enum: ["user", "assistant", "system"] }).notNull(),
  content: text("content").notNull(),
  tokenCount: integer("token_count"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Exercises
export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => students.id).notNull(),
  subject: varchar("subject", { length: 100 }).notNull(),
  topic: varchar("topic", { length: 255 }).notNull(),
  difficulty: varchar("difficulty", { enum: ["facile", "moyen", "difficile"] }).notNull(),
  question: text("question").notNull(),
  expectedAnswer: text("expected_answer").notNull(),
  studentAnswer: text("student_answer"),
  isCorrect: boolean("is_correct"),
  score: integer("score"),
  feedback: text("feedback"),
  homeworkSetId: integer("homework_set_id").references(() => homeworkSets.id),
  answeredAt: timestamp("answered_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Homework sets
export const homeworkSets = pgTable("homework_sets", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => students.id).notNull(),
  conversationId: integer("conversation_id").references(() => conversations.id).notNull(),
  status: varchar("status", { enum: ["pending", "completed", "partial"] }).default("pending").notNull(),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Progress tracking
export const progress = pgTable("progress", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => students.id).notNull(),
  subject: varchar("subject", { length: 100 }).notNull(),
  topic: varchar("topic", { length: 255 }),
  scorePercentage: integer("score_percentage").notNull(),
  exercisesCompleted: integer("exercises_completed").default(0).notNull(),
  exercisesCorrect: integer("exercises_correct").default(0).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

// Study sessions
export const studySessions = pgTable("study_sessions", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => students.id).notNull(),
  subject: varchar("subject", { length: 100 }).notNull(),
  type: varchar("type", { enum: ["chat", "exercise", "assessment"] }).notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  score: integer("score"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Subscriptions
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  plan: varchar("plan", { enum: ["gratuit", "standard", "premium"] }).default("gratuit").notNull(),
  status: varchar("status", { enum: ["trialing", "active", "past_due", "canceled", "unpaid"] }).default("active").notNull(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  trialStart: timestamp("trial_start"),
  trialEnd: timestamp("trial_end"),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Level assessments
export const levelAssessments = pgTable("level_assessments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => students.id).notNull(),
  subject: varchar("subject", { length: 100 }).notNull(),
  questionsJson: jsonb("questions_json").notNull(),
  answersJson: jsonb("answers_json"),
  score: integer("score"),
  level: varchar("level", { enum: ["debutant", "intermediaire", "avance"] }),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Refresh tokens
export const refreshTokens = pgTable("refresh_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  tokenHash: varchar("token_hash", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Study plans
export const studyPlans = pgTable("study_plans", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => students.id).notNull(),
  examDate: timestamp("exam_date"),
  totalWeeks: integer("total_weeks").notNull(),
  currentWeek: integer("current_week").default(1).notNull(),
  phases: jsonb("phases").notNull(), // Array of phases with subjects/chapters per week
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  lastAdjustedAt: timestamp("last_adjusted_at").defaultNow().notNull(),
});

// Study plan weeks
export const studyPlanWeeks = pgTable("study_plan_weeks", {
  id: serial("id").primaryKey(),
  studyPlanId: integer("study_plan_id").references(() => studyPlans.id).notNull(),
  weekNumber: integer("week_number").notNull(),
  subject: varchar("subject", { length: 100 }).notNull(),
  topic: varchar("topic", { length: 255 }).notNull(),
  objective: text("objective").notNull(),
  status: varchar("status", { enum: ["upcoming", "in_progress", "completed"] }).default("upcoming").notNull(),
  scoreAtCompletion: integer("score_at_completion"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Schedules
export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => students.id).notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6 (Sunday-Saturday)
  startTime: varchar("start_time", { length: 5 }).notNull(), // HH:MM format
  durationMinutes: integer("duration_minutes").notNull(),
  subject: varchar("subject", { length: 100 }), // Auto-assigned, can be null
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Scheduled sessions
export const scheduledSessions = pgTable("scheduled_sessions", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => students.id).notNull(),
  scheduleId: integer("schedule_id").references(() => schedules.id).notNull(),
  date: timestamp("date").notNull(),
  subject: varchar("subject", { length: 100 }).notNull(),
  topic: varchar("topic", { length: 255 }),
  status: varchar("status", { enum: ["upcoming", "completed", "missed", "rescheduled"] }).default("upcoming").notNull(),
  conversationId: integer("conversation_id").references(() => conversations.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Types for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;
export type Parent = typeof parents.$inferSelect;
export type NewParent = typeof parents.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type Exercise = typeof exercises.$inferSelect;
export type NewExercise = typeof exercises.$inferInsert;
export type HomeworkSet = typeof homeworkSets.$inferSelect;
export type NewHomeworkSet = typeof homeworkSets.$inferInsert;
export type Progress = typeof progress.$inferSelect;
export type NewProgress = typeof progress.$inferInsert;
export type StudySession = typeof studySessions.$inferSelect;
export type NewStudySession = typeof studySessions.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type LevelAssessment = typeof levelAssessments.$inferSelect;
export type NewLevelAssessment = typeof levelAssessments.$inferInsert;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;
export type StudyPlan = typeof studyPlans.$inferSelect;
export type NewStudyPlan = typeof studyPlans.$inferInsert;
export type StudyPlanWeek = typeof studyPlanWeeks.$inferSelect;
export type NewStudyPlanWeek = typeof studyPlanWeeks.$inferInsert;
export type Schedule = typeof schedules.$inferSelect;
export type NewSchedule = typeof schedules.$inferInsert;
export type ScheduledSession = typeof scheduledSessions.$inferSelect;
export type NewScheduledSession = typeof scheduledSessions.$inferInsert;
