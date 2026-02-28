import express from 'express';
import { body, validationResult } from 'express-validator';
import * as assignmentService from '../services/assignmentService';
import { authenticate, authorize } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

// Create assignment (Teacher only)
router.post(
  '/',
  authorize('TEACHER'),
  [
    body('title').notEmpty(),
    body('description').notEmpty(),
    body('subjectId').notEmpty(),
    body('dueDate').isISO8601(),
    body('maxPoints').isInt({ min: 1 }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new AppError(errors.array()[0].msg, 400);

      const teacherProfile = await prisma.teacherProfile.findUnique({
        where: { userId: req.user!.id },
      });
      if (!teacherProfile) throw new AppError('Teacher profile not found', 404);

      const assignment = await assignmentService.createAssignment({
        ...req.body,
        teacherId: teacherProfile.id,
      });

      res.status(201).json({ success: true, data: assignment });
    } catch (error) {
      next(error);
    }
  }
);

// Get assignments by subject
router.get('/subject/:subjectId', async (req, res, next) => {
  try {
    const assignments = await assignmentService.getAssignmentsBySubject(req.params.subjectId);
    res.json({ success: true, data: assignments });
  } catch (error) {
    next(error);
  }
});

// Get assignments by student
router.get('/student/:studentId', async (req, res, next) => {
  try {
    const assignments = await assignmentService.getAssignmentsByStudent(req.params.studentId);
    res.json({ success: true, data: assignments });
  } catch (error) {
    next(error);
  }
});

// Submit assignment (Student only)
router.post(
  '/:id/submit',
  authorize('STUDENT'),
  async (req, res, next) => {
    try {
      const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId: req.user!.id },
      });
      if (!studentProfile) throw new AppError('Student profile not found', 404);

      const submission = await assignmentService.submitAssignment({
        assignmentId: req.params.id,
        studentId: studentProfile.id,
        content: req.body.content,
        files: req.body.files,
      });

      res.json({ success: true, data: submission });
    } catch (error) {
      next(error);
    }
  }
);

// Grade submission (Teacher only)
router.put(
  '/submissions/:id/grade',
  authorize('TEACHER'),
  [body('grade').isFloat({ min: 0, max: 100 })],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new AppError(errors.array()[0].msg, 400);

      const submission = await assignmentService.gradeSubmission({
        submissionId: req.params.id,
        grade: req.body.grade,
        feedback: req.body.feedback,
      });

      res.json({ success: true, data: submission });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
