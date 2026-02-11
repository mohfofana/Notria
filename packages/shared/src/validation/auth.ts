import { z } from "zod";

export const registerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().regex(/^\+225\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}$/),
  password: z.string().min(6),
  role: z.enum(["student", "parent"]),
});

export const loginSchema = z.object({
  phone: z.string().regex(/^\+225\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}$/),
  password: z.string().min(6),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
