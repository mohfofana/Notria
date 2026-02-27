import request from 'supertest';
import express from 'express';
import assessmentRoutes from '../routes/assessment.routes';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

// Mock the auth middleware
jest.mock('../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = { id: 123, role: 'student' };
    next();
  },
}));

describe('Assessment Routes', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/assessment', assessmentRoutes);
  });

  describe('POST /api/assessment/start', () => {
    it('should start assessment successfully', async () => {
      const response = await request(app)
        .post('/api/assessment/start')
        .expect(200);

      expect(response.body).toHaveProperty('sessionId');
      expect(response.body).toHaveProperty('currentQuestionIndex', 0);
      expect(response.body).toHaveProperty('studentId');
    });

    it('should return 404 when student not found', async () => {
      // Mock AssessmentService to throw error
      const mockStartAssessment = jest.spyOn(require('../services/assessment.service'), 'AssessmentService')
        .mockImplementationOnce(() => ({
          startAssessment: jest.fn().mockRejectedValue(new Error('Student not found')),
        }));

      const response = await request(app)
        .post('/api/assessment/start')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Student not found');

      mockStartAssessment.mockRestore();
    });
  });

  describe('GET /api/assessment/question', () => {
    it('should return next question', async () => {
      const mockQuestion = {
        id: 1,
        question: 'Quelle est la capitale de la France ?',
        answers: ['Paris', 'Lyon', 'Marseille', 'Toulouse'],
        subject: 'Géographie',
        difficulty: 'facile',
      };

      // Mock getNextQuestion
      const mockGetNextQuestion = jest.spyOn(require('../services/assessment.service'), 'AssessmentService')
        .mockImplementationOnce(() => ({
          getNextQuestion: jest.fn().mockResolvedValue(mockQuestion),
        }));

      const response = await request(app)
        .get('/api/assessment/question')
        .query({ sessionId: 'test-session-123' })
        .expect(200);

      expect(response.body).toEqual(mockQuestion);

      mockGetNextQuestion.mockRestore();
    });

    it('should return 404 when no more questions', async () => {
      // Mock getNextQuestion to return null
      const mockGetNextQuestion = jest.spyOn(require('../services/assessment.service'), 'AssessmentService')
        .mockImplementationOnce(() => ({
          getNextQuestion: jest.fn().mockResolvedValue(null),
        }));

      const response = await request(app)
        .get('/api/assessment/question')
        .query({ sessionId: 'test-session-123' })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'No more questions available');

      mockGetNextQuestion.mockRestore();
    });

    it('should return 400 when sessionId is missing', async () => {
      const response = await request(app)
        .get('/api/assessment/question')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Session ID is required');
    });
  });

  describe('POST /api/assessment/answer', () => {
    it('should submit answer successfully', async () => {
      const answerData = {
        sessionId: 'test-session-123',
        questionId: 1,
        answer: 0,
        timeSpent: 30,
      };

      const mockResult = {
        correct: true,
        explanation: 'Paris est bien la capitale de la France.',
        nextQuestion: {
          id: 2,
          question: 'Quelle est la formule de l\'eau ?',
        },
      };

      // Mock submitAnswer
      const mockSubmitAnswer = jest.spyOn(require('../services/assessment.service'), 'AssessmentService')
        .mockImplementationOnce(() => ({
          submitAnswer: jest.fn().mockResolvedValue(mockResult),
        }));

      const response = await request(app)
        .post('/api/assessment/answer')
        .send(answerData)
        .expect(200);

      expect(response.body).toEqual(mockResult);

      mockSubmitAnswer.mockRestore();
    });

    it('should return 400 when required fields are missing', async () => {
      const incompleteData = {
        sessionId: 'test-session-123',
        // missing questionId, answer, timeSpent
      };

      const response = await request(app)
        .post('/api/assessment/answer')
        .send(incompleteData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/assessment/results/:sessionId', () => {
    it('should return assessment results', async () => {
      const mockResults = {
        sessionId: 'test-session-123',
        score: 85,
        totalQuestions: 20,
        correctAnswers: 17,
        level: 'intermediaire',
        recommendations: [
          'Réviser les fractions',
          'Travailler la géométrie',
        ],
      };

      // Mock getResults
      const mockGetResults = jest.spyOn(require('../services/assessment.service'), 'AssessmentService')
        .mockImplementationOnce(() => ({
          getResults: jest.fn().mockResolvedValue(mockResults),
        }));

      const response = await request(app)
        .get('/api/assessment/results/test-session-123')
        .expect(200);

      expect(response.body).toEqual(mockResults);

      mockGetResults.mockRestore();
    });
  });
});
