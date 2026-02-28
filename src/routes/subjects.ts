import express from 'express';
import { body, param, validationResult } from 'express-validator';
import * as subjectService from '../services/subjectService';
import { authenticate, authorize } from '../middleware/auth';
import { checkTeacherSubjectAccess } from '../middleware/rbac';
import { AppError } from '../middleware/errorHandler';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/subjects
 * Create new subject (Admin or Teacher)
 */
router.post(
  '/',
  authorize('ADMIN', 'TEACHER'),
  [
    body('name').notEmpty().withMessage('Subject name is required'),
    body('nameUz').notEmpty().withMessage('Uzbek name is required'),
    body('nameRu').notEmpty().withMessage('Russian name is required'),
    body('nameEn').notEmpty().withMessage('English name is required'),
    body('gradeLevel').isInt({ min: 1, max: 12 }).withMessage('Grade level must be between 1-12'),
    body('teacherId').notEmpty().withMessage('Teacher ID is required'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(errors.array()[0].msg, 400);
      }

      const subject = await subjectService.createSubject(req.body);
      res.status(201).json({ success: true, data: subject });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/subjects/teacher/:teacherId
 * Get subjects by teacher
 */
router.get('/teacher/:teacherId', async (req, res, next) => {
  try {
    const subjects = await subjectService.getSubjectsByTeacher(req.params.teacherId);
    res.json({ success: true, data: subjects });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/subjects/student/:studentId
 * Get subjects by student
 */
router.get('/student/:studentId', async (req, res, next) => {
  try {
    const subjects = await subjectService.getSubjectsByStudent(req.params.studentId);
    res.json({ success: true, data: subjects });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/subjects/:id
 * Get subject by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const subject = await subjectService.getSubjectById(req.params.id);
    res.json({ success: true, data: subject });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/subjects/:id
 * Update subject
 */
router.put(
  '/:id',
  authorize('ADMIN', 'TEACHER'),
  checkTeacherSubjectAccess,
  async (req, res, next) => {
    try {
      const subject = await subjectService.updateSubject(req.params.id, req.body);
      res.json({ success: true, data: subject });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/subjects/:id
 * Archive subject
 */
router.delete(
  '/:id',
  authorize('ADMIN'),
  async (req, res, next) => {
    try {
      const subject = await subjectService.archiveSubject(req.params.id);
      res.json({ success: true, data: subject });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/subjects/:id/enroll
 * Enroll student in subject
 */
router.post(
  '/:id/enroll',
  authorize('ADMIN', 'TEACHER'),
  [body('studentId').notEmpty().withMessage('Student ID is required')],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(errors.array()[0].msg, 400);
      }

      const enrollment = await subjectService.enrollStudent(
        req.body.studentId,
        req.params.id
      );
      res.status(201).json({ success: true, data: enrollment });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
