import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from './errorHandler';

const prisma = new PrismaClient();

/**
 * Check if parent has access to specific student
 */
export async function checkParentAccess(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    // Only apply to parents
    if (req.user.role !== 'PARENT') {
      return next();
    }

    // Get studentId from params or body
    const studentId = req.params.studentId || req.body.studentId;

    if (!studentId) {
      throw new AppError('Student ID is required', 400);
    }

    // Find parent profile
    const parentProfile = await prisma.parentProfile.findUnique({
      where: { userId: req.user.id },
      include: {
        children: {
          where: { studentId },
        },
      },
    });

    if (!parentProfile || parentProfile.children.length === 0) {
      throw new AppError('Access denied: You do not have access to this student', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Check if teacher has access to specific student (via subject enrollment)
 */
export async function checkTeacherStudentAccess(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    // Only apply to teachers
    if (req.user.role !== 'TEACHER') {
      return next();
    }

    const studentId = req.params.studentId || req.body.studentId;

    if (!studentId) {
      throw new AppError('Student ID is required', 400);
    }

    // Find teacher profile
    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: req.user.id },
      include: {
        subjects: {
          include: {
            enrollments: {
              where: { studentId },
            },
          },
        },
      },
    });

    if (!teacherProfile) {
      throw new AppError('Teacher profile not found', 404);
    }

    // Check if any of teacher's subjects have this student enrolled
    const hasAccess = teacherProfile.subjects.some(
      (subject) => subject.enrollments.length > 0
    );

    if (!hasAccess) {
      throw new AppError('Access denied: Student is not enrolled in your subjects', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Check if teacher has access to specific subject
 */
export async function checkTeacherSubjectAccess(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    // Only apply to teachers
    if (req.user.role !== 'TEACHER') {
      return next();
    }

    const subjectId = req.params.subjectId || req.body.subjectId;

    if (!subjectId) {
      throw new AppError('Subject ID is required', 400);
    }

    // Find teacher profile
    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!teacherProfile) {
      throw new AppError('Teacher profile not found', 404);
    }

    // Check if subject belongs to this teacher
    const subject = await prisma.subject.findFirst({
      where: {
        id: subjectId,
        teacherId: teacherProfile.id,
      },
    });

    if (!subject) {
      throw new AppError('Access denied: You do not teach this subject', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
}
