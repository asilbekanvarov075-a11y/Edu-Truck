import express from 'express';
import { body, validationResult } from 'express-validator';
import * as testService from '../services/testService';
import { authenticate, authorize } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

// Create test (Teacher only)
router.post(
  '/',
  authorize('TEACHER'),
  [
    body('title').notEmpty(),
    body('subjectId').notEmpty(),
    body('timeLimit').isInt({ min: 1 }),
    body('passingScore').isFloat({ min: 0, max: 100 }),
    body('scheduledFor').isISO8601(),
    body('questions').isArray({ min: 1 }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new AppError(errors.array()[0].msg, 400);

      const teacherProfile = await prisma.teacherProfile.findUnique({
        where: { userId: req.user!.id },
      });
      if (!teacherProfile) throw new AppError('Teacher profile not found', 404);

      const test = await testService.createTest({
        ...req.body,
        teacherId: teacherProfile.id,
      });

      res.status(201).json({ success: true, data: test });
    } catch (error) {
      next(error);
    }
  }
);

// Get tests by subject
router.get('/subject/:subjectId', async (req, res, next) => {
  try {
    const tests = await testService.getTestsBySubject(req.params.subjectId);
    res.json({ success: true, data: tests });
  } catch (error) {
    next(error);
  }
});

// Get test by ID
router.get('/:id', async (req, res, next) => {
  try {
    const includeAnswers = req.user!.role === 'TEACHER' || req.user!.role === 'ADMIN';
    const test = await testService.getTestById(req.params.id, includeAnswers);
    res.json({ success: true, data: test });
  } catch (error) {
    next(error);
  }
});

// Submit test (Student only)
router.post(
  '/:id/submit',
  authorize('STUDENT'),
  [body('answers').isArray()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new AppError(errors.array()[0].msg, 400);

      const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId: req.user!.id },
      });
      if (!studentProfile) throw new AppError('Student profile not found', 404);

      const result = await testService.submitTest({
        testId: req.params.id,
        studentId: studentProfile.id,
        answers: req.body.answers,
      });

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// Get test statistics
router.get('/:id/statistics', authorize('TEACHER', 'ADMIN'), async (req, res, next) => {
  try {
    const stats = await testService.getTestStatistics(req.params.id);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

export default router;
