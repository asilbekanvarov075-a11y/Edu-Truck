import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);
router.use(authorize('TEACHER'));

// Get teacher dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.user.id },
      include: {
        subject: true,
        classes: { include: { students: true } }
      }
    });

    res.json({ success: true, data: teacher });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get students
router.get('/students', async (req, res) => {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.user.id },
      include: { classes: true }
    });

    const students = await prisma.student.findMany({
      where: { classId: { in: teacher.classes.map(c => c.id) } },
      include: { user: true, class: true }
    });

    res.json({ success: true, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create homework
router.post('/homeworks', async (req, res) => {
  try {
    const teacher = await prisma.teacher.findUnique({ where: { userId: req.user.id } });
    const { title, description, subjectId, dueDate, maxScore, attachments } = req.body;

    const homework = await prisma.homework.create({
      data: {
        title,
        description,
        subjectId,
        teacherId: teacher.id,
        dueDate: new Date(dueDate),
        maxScore: maxScore || 100,
        attachments: attachments || []
      }
    });

    res.json({ success: true, data: homework });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Grade homework
router.put('/homeworks/submissions/:id/grade', async (req, res) => {
  try {
    const { score, feedback } = req.body;

    const submission = await prisma.homeworkSubmission.update({
      where: { id: req.params.id },
      data: {
        score,
        feedback,
        gradedAt: new Date()
      }
    });

    res.json({ success: true, data: submission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add grade
router.post('/grades', async (req, res) => {
  try {
    const teacher = await prisma.teacher.findUnique({ where: { userId: req.user.id } });
    const { studentId, subjectId, score, maxScore, type, comment } = req.body;

    const grade = await prisma.grade.create({
      data: {
        studentId,
        subjectId,
        teacherId: teacher.id,
        score,
        maxScore: maxScore || 100,
        type,
        comment
      }
    });

    res.json({ success: true, data: grade });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark attendance
router.post('/attendance', async (req, res) => {
  try {
    const teacher = await prisma.teacher.findUnique({ where: { userId: req.user.id } });
    const { studentId, classId, date, status, note } = req.body;

    const attendance = await prisma.attendance.create({
      data: {
        studentId,
        classId,
        teacherId: teacher.id,
        date: new Date(date),
        status,
        note
      }
    });

    res.json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
