import { z } from "zod";

export const registerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().regex(/^\+225\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}$/),
  password: z.string().min(6),
  role: z.enum(["student", "parent"]),
  linkCode: z.string().trim().toUpperCase().length(8).optional(),
});

export const loginSchema = z.object({
  phone: z.string().regex(/^\+225\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}$/),
  password: z.string().min(6),
  linkCode: z.string().trim().toUpperCase().length(8).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
