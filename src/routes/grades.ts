import express from 'express';
import { body, param, validationResult } from 'express-validator';
import * as gradeService from '../services/gradeService';
import { authenticate, authorize } from '../middleware/auth';
import { checkTeacherStudentAccess, checkParentAccess } from '../middleware/rbac';
import { AppError } from '../middleware/errorHandler';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/grades
 * Create new grade (Teacher only)
 */
router.post(
  '/',
  authorize('TEACHER'),
  [
    body('studentId').notEmpty().withMessage('Student ID is required'),
    body('subjectId').notEmpty().withMessage('Subject ID is required'),
    body('value').isFloat({ min: 0, max: 100 }).withMessage('Grade must be between 0-100'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(errors.array()[0].msg, 400);
      }

      // Get teacher profile
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      const teacherProfile = await prisma.teacherProfile.findUnique({
        where: { userId: req.user!.id },
      });

      if (!teacherProfile) {
        throw new AppError('Teacher profile not found', 404);
      }

      const grade = await gradeService.createGrade({
        ...req.body,
        teacherId: teacherProfile.id,
      });

      res.status(201).json({ success: true, data: grade });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/grades/:id
 * Update grade (Teacher only)
 */
router.put(
  '/:id',
  authorize('TEACHER'),
  async (req, res, next) => {
    try {
      const grade = await gradeService.updateGrade(req.params.id, req.body);
      res.json({ success: true, data: grade });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/grades/student/:studentId
 * Get grades by student
 */
router.get(
  '/student/:studentId',
  checkParentAccess,
  checkTeacherStudentAccess,
  async (req, res, next) => {
    try {
      const { subjectId } = req.query;
      const grades = await gradeService.getGradesByStudent(
        req.params.studentId,
        subjectId as string
      );
      res.json({ success: true, data: grades });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/grades/subject/:subjectId
 * Get grades by subject (Teacher only)
 */
router.get(
  '/subject/:subjectId',
  authorize('TEACHER', 'ADMIN'),
  async (req, res, next) => {
    try {
      const grades = await gradeService.getGradesBySubject(req.params.subjectId);
      res.json({ success: true, data: grades });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/grades/student/:studentId/average
 * Get student's average grade
 */
router.get(
  '/student/:studentId/average',
  checkParentAccess,
  async (req, res, next) => {
    try {
      const { subjectId } = req.query;

      if (subjectId) {
        const average = await gradeService.calculateSubjectAverage(
          req.params.studentId,
          subjectId as string
        );
        res.json({ success: true, data: { average, subjectId } });
      } else {
        const gpa = await gradeService.calculateOverallGPA(req.params.studentId);
        res.json({ success: true, data: { gpa } });
      }
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/grades/bulk
 * Bulk create grades (Teacher only)
 */
router.post(
  '/bulk',
  authorize('TEACHER'),
  [body('grades').isArray().withMessage('Grades must be an array')],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(errors.array()[0].msg, 400);
      }

      const grades = await gradeService.bulkCreateGrades(req.body.grades);
      res.status(201).json({ success: true, data: grades });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/grades/subject/:subjectId/statistics
 * Get grade statistics for subject
 */
router.get(
  '/subject/:subjectId/statistics',
  authorize('TEACHER', 'ADMIN'),
  async (req, res, next) => {
    try {
      const stats = await gradeService.getSubjectGradeStatistics(req.params.subjectId);
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
