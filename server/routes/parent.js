import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);
router.use(authorize('PARENT'));

// Get parent dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const parent = await prisma.parent.findUnique({
      where: { userId: req.user.id },
      include: {
        children: {
          include: {
            user: true,
            class: true,
            grades: { include: { subject: true }, orderBy: { date: 'desc' }, take: 20 },
            attendances: { orderBy: { date: 'desc' }, take: 30 }
          }
        }
      }
    });

    res.json({ success: true, data: parent });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get child details
router.get('/children/:id', async (req, res) => {
  try {
    const parent = await prisma.parent.findUnique({ where: { userId: req.user.id } });
    
    const child = await prisma.student.findFirst({
      where: {
        id: req.params.id,
        parentId: parent.id
      },
      include: {
        user: true,
        class: { include: { teacher: { include: { user: true } } } },
        grades: { include: { subject: true, teacher: { include: { user: true } } } },
        attendances: { include: { class: true } },
        testResults: { include: { test: { include: { subject: true } } } }
      }
    });

    if (!child) {
      return res.status(404).json({ success: false, message: 'Child not found' });
    }

    res.json({ success: true, data: child });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
