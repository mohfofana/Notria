import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AssessmentService } from '../services/assessment.service';
import { db } from '../db';
import { students } from '../db/schema';
import { eq } from 'drizzle-orm';

describe('AssessmentService', () => {
  describe('startAssessment', () => {
    it('should throw error when student not found', async () => {
      // Mock database query to return null (no student found)
      const mockQuery = jest.spyOn(db, 'query').mockImplementation(() => ({
        students: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
      } as any));

      await expect(AssessmentService.startAssessment(999)).rejects.toThrow('Student not found');

      mockQuery.mockRestore();
    });

    it('should return assessment data when student exists', async () => {
      const mockStudent = {
        id: 1,
        userId: 123,
        examType: 'bac',
        grade: 'terminale',
        series: 'scientifique',
        school: 'Lycée Test',
        onboardingCompleted: true,
      };

      // Mock database query to return a student
      const mockQuery = jest.spyOn(db, 'query').mockImplementation(() => ({
        students: {
          findFirst: jest.fn().mockResolvedValue(mockStudent),
        },
      } as any));

      const result = await AssessmentService.startAssessment(123);

      expect(result).toHaveProperty('studentId', 1);
      expect(result).toHaveProperty('sessionId');
      expect(result).toHaveProperty('currentQuestionIndex', 0);

      mockQuery.mockRestore();
    });

    it('should throw error when student onboarding not completed', async () => {
      const mockStudent = {
        id: 1,
        userId: 123,
        examType: 'bac',
        grade: 'terminale',
        series: 'scientifique',
        school: 'Lycée Test',
        onboardingCompleted: false, // Not completed
      };

      const mockQuery = jest.spyOn(db, 'query').mockImplementation(() => ({
        students: {
          findFirst: jest.fn().mockResolvedValue(mockStudent),
        },
      } as any));

      await expect(AssessmentService.startAssessment(123)).rejects.toThrow('Student onboarding not completed');

      mockQuery.mockRestore();
    });
  });

  describe('getNextQuestion', () => {
    it('should return first question when no previous answers', async () => {
      const mockSession = {
        id: 'session-1',
        studentId: 1,
        currentQuestionIndex: 0,
        questionsJson: JSON.stringify([
          { id: 1, question: 'Question 1', answers: ['A', 'B', 'C'], correctAnswer: 0 },
          { id: 2, question: 'Question 2', answers: ['X', 'Y', 'Z'], correctAnswer: 1 },
        ]),
        answersJson: null,
      };

      // Mock database query
      const mockQuery = jest.spyOn(db, 'query').mockImplementation(() => ({
        assessmentSessions: {
          findFirst: jest.fn().mockResolvedValue(mockSession),
        },
      } as any));

      const result = await AssessmentService.getNextQuestion('session-1');

      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('question', 'Question 1');
      expect(result).toHaveProperty('answers', ['A', 'B', 'C']);

      mockQuery.mockRestore();
    });

    it('should return null when all questions answered', async () => {
      const mockSession = {
        id: 'session-1',
        studentId: 1,
        currentQuestionIndex: 2,
        questionsJson: JSON.stringify([
          { id: 1, question: 'Question 1' },
          { id: 2, question: 'Question 2' },
        ]),
        answersJson: JSON.stringify([0, 1]), // All questions answered
      };

      const mockQuery = jest.spyOn(db, 'query').mockImplementation(() => ({
        assessmentSessions: {
          findFirst: jest.fn().mockResolvedValue(mockSession),
        },
      } as any));

      const result = await AssessmentService.getNextQuestion('session-1');

      expect(result).toBeNull();

      mockQuery.mockRestore();
    });

    it('should throw error when session not found', async () => {
      const mockQuery = jest.spyOn(db, 'query').mockImplementation(() => ({
        assessmentSessions: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
      } as any));

      await expect(AssessmentService.getNextQuestion('invalid-session')).rejects.toThrow('Assessment session not found');

      mockQuery.mockRestore();
    });
  });
});
