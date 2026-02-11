import { z } from "zod";

export const onboardingStep1Schema = z.object({
  examType: z.enum(["BEPC", "BAC"]),
  grade: z.enum(["3eme", "terminale"]),
  series: z.enum(["A1", "A2", "C", "D"]).optional(),
  school: z.string().optional(),
});

export const onboardingStep2Schema = z.object({
  prioritySubjects: z.array(z.string()).min(1, "Sélectionnez au moins une matière"),
});

export const onboardingStep3Schema = z.object({
  targetScore: z.number().min(8).max(20),
  dailyTime: z.enum(["15min", "30min", "1h"]),
});

export const assessmentAnswerSchema = z.object({
  questionId: z.number(),
  answer: z.string(),
});

export const assessmentSubmissionSchema = z.object({
  subject: z.string(),
  answers: z.array(assessmentAnswerSchema),
});

export const scheduleSetupSchema = z.object({
  daysOfWeek: z.array(z.number()).min(1, "Sélectionnez au moins un jour"),
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format HH:MM requis"),
  durationMinutes: z.enum(["30", "45", "60"]),
});

export type OnboardingStep1Input = z.infer<typeof onboardingStep1Schema>;
export type OnboardingStep2Input = z.infer<typeof onboardingStep2Schema>;
export type OnboardingStep3Input = z.infer<typeof onboardingStep3Schema>;
export type AssessmentSubmissionInput = z.infer<typeof assessmentSubmissionSchema>;
export type ScheduleSetupInput = z.infer<typeof scheduleSetupSchema>;
