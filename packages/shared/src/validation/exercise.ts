import { z } from "zod";

export const submitExerciseSchema = z.object({
  exerciseId: z.number(),
  answer: z.string().min(1, "La réponse est requise"),
});

export const generateExercisesSchema = z.object({
  subject: z.string(),
  topic: z.string(),
  difficulty: z.enum(["facile", "moyen", "difficile"]),
  count: z.number().min(1).max(10),
});

export const completeHomeworkSchema = z.object({
  homeworkSetId: z.number(),
  exercises: z.array(z.object({
    exerciseId: z.number(),
    answer: z.string(),
  })),
});

export type SubmitExerciseInput = z.infer<typeof submitExerciseSchema>;
export type GenerateExercisesInput = z.infer<typeof generateExercisesSchema>;
export type CompleteHomeworkInput = z.infer<typeof completeHomeworkSchema>;
