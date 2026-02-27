import type { Request, Response } from "express";
import { onboardingStep1Schema, onboardingStep2Schema, onboardingStep3Schema } from "@notria/shared";
import { StudentService } from "../services/student.service.js";

export const StudentController = {
  async getProfile(req: Request, res: Response) {
    const userId = req.user!.userId;
    const student = await StudentService.getByUserId(userId);
    if (!student) return res.status(404).json({ error: "Student not found" });
    return res.json({ student });
  },

  async onboardingStep1(req: Request, res: Response) {
    const parsed = onboardingStep1Schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Données invalides", details: parsed.error.flatten() });
    }

    const userId = req.user!.userId;
    const { examType, grade, series, school } = parsed.data;

    if (examType === "BAC" && !series) {
      return res.status(400).json({ error: "La série est requise pour le BAC" });
    }

    const student = await StudentService.onboardingStep1(userId, { examType, grade, series, school });
    return res.json({ student });
  },

  async onboardingStep2(req: Request, res: Response) {
    const parsed = onboardingStep2Schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Données invalides", details: parsed.error.flatten() });
    }

    const userId = req.user!.userId;
    const updated = await StudentService.onboardingStep2(userId, { prioritySubjects: parsed.data.prioritySubjects });
    if (!updated) return res.status(404).json({ error: "Complète d'abord l'étape 1" });

    return res.json({ student: updated });
  },

  async onboardingStep3(req: Request, res: Response) {
    const parsed = onboardingStep3Schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Données invalides", details: parsed.error.flatten() });
    }

    const userId = req.user!.userId;
    const { targetScore } = parsed.data;

    const result = await StudentService.onboardingStep3(userId, { targetScore });
    if (!result) return res.status(404).json({ error: "Complète d'abord les étapes précédentes" });

    return res.json({ student: result.student, studyPlan: result.studyPlan });
  },
};
