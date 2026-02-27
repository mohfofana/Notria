import { Request, Response } from "express";
import { AssessmentService } from "../services/assessment.service.js";

// In-memory store for assessment sessions (use Redis in production)
const assessmentSessions = new Map<number, any>();

export const AssessmentController = {
  async startAssessment(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const progress = await AssessmentService.startAssessment(userId);

      assessmentSessions.set(userId, progress);

      const question = await AssessmentService.getNextQuestion(userId, progress);

      res.json({
        success: true,
        data: {
          currentQuestionIndex: progress.currentQuestionIndex,
          totalQuestions: progress.totalQuestions,
          question,
        },
      });
    } catch (error: any) {
      console.error("Start assessment error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to start assessment",
      });
    }
  },

  async getNextQuestion(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const progress = assessmentSessions.get(userId);

      if (!progress) {
        return res.status(400).json({
          success: false,
          error: "No active assessment session",
        });
      }

      const question = await AssessmentService.getNextQuestion(userId, progress);

      if (!question) {
        const results = await AssessmentService.completeAssessment(userId, progress);
        assessmentSessions.delete(userId);

        return res.json({
          success: true,
          data: {
            completed: true,
            results,
          },
        });
      }

      res.json({
        success: true,
        data: {
          completed: false,
          currentQuestionIndex: progress.currentQuestionIndex,
          totalQuestions: progress.totalQuestions,
          question,
        },
      });
    } catch (error: any) {
      console.error("Get next question error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to get next question",
      });
    }
  },

  async submitAnswer(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { questionId, answer } = req.body;

      if (!questionId || typeof answer !== "number") {
        return res.status(400).json({
          success: false,
          error: "Invalid questionId or answer",
        });
      }

      const progress = assessmentSessions.get(userId);
      if (!progress) {
        return res.status(400).json({
          success: false,
          error: "No active assessment session",
        });
      }

      const updatedProgress = await AssessmentService.submitAnswer(
        userId,
        String(questionId),
        answer,
        progress
      );
      assessmentSessions.set(userId, updatedProgress);

      const nextQuestion = await AssessmentService.getNextQuestion(userId, updatedProgress);

      if (!nextQuestion) {
        const results = await AssessmentService.completeAssessment(userId, updatedProgress);
        assessmentSessions.delete(userId);

        return res.json({
          success: true,
          data: {
            completed: true,
            results,
          },
        });
      }

      res.json({
        success: true,
        data: {
          completed: false,
          currentQuestionIndex: updatedProgress.currentQuestionIndex,
          totalQuestions: updatedProgress.totalQuestions,
          question: nextQuestion,
          previousAnswer: {
            isCorrect: updatedProgress.questions[updatedProgress.currentQuestionIndex - 1]?.isCorrect,
            explanation: updatedProgress.questions[updatedProgress.currentQuestionIndex - 1]?.explanation,
          },
        },
      });
    } catch (error: any) {
      console.error("Submit answer error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to submit answer",
      });
    }
  },

  async getResults(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const results = await AssessmentService.getLatestResults(userId);

      if (!results) {
        return res.status(404).json({
          success: false,
          error: "No assessment results found",
        });
      }

      res.json({ success: true, data: results });
    } catch (error: any) {
      console.error("Get results error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to get results",
      });
    }
  },
};
