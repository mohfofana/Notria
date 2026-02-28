import { z } from "zod";

export const createConversationSchema = z.object({
  subject: z.string().min(1, "La matière est requise"),
  topic: z.string().optional(),
  title: z.string().optional(),
});

export const sendMessageSchema = z.object({
  conversationId: z.number(),
  content: z.string().min(1, "Le message ne peut pas être vide"),
  internal: z.boolean().optional(),
});

export const generateHomeworkSchema = z.object({
  conversationId: z.number(),
  subject: z.string(),
  topic: z.string(),
  difficulty: z.enum(["facile", "moyen", "difficile"]),
  exerciseCount: z.number().min(1).max(5),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type GenerateHomeworkInput = z.infer<typeof generateHomeworkSchema>;
