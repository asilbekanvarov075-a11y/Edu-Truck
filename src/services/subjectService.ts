import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export interface CreateSubjectDTO {
  name: string;
  nameUz: string;
  nameRu: string;
  nameEn: string;
  description?: string;
  gradeLevel: number;
  teacherId: string;
}

export interface UpdateSubjectDTO {
  name?: string;
  nameUz?: string;
  nameRu?: string;
  nameEn?: string;
  description?: string;
  gradeLevel?: number;
}

/**
 * Create new subject
 */
export async function createSubject(data: CreateSubjectDTO) {
  // Verify teacher exists
  const teacher = await prisma.teacherProfile.findUnique({
    where: { id: data.teacherId },
  });

  if (!teacher) {
    throw new AppError('Teacher not found', 404);
  }

  if (!teacher.isApproved) {
    throw new AppError('Teacher is not approved', 403);
  }

  const subject = await prisma.subject.create({
    data: {
      name: data.name,
      nameUz: data.nameUz,
      nameRu: data.nameRu,
      nameEn: data.nameEn,
      description: data.description,
      gradeLevel: data.gradeLevel,
      teacherId: data.teacherId,
    },
    include: {
      teacher: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    },
  });

  return subject;
}

/**
 * Get subjects by teacher
 */
export async function getSubjectsByTeacher(teacherId: string) {
  const subjects = await prisma.subject.findMany({
    where: {
      teacherId,
      isActive: true,
    },
    include: {
      _count: {
        select: {
          enrollments: true,
          assignments: true,
          tests: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  return subjects;
}

/**
 * Get subjects by student (via enrollments)
 */
export async function getSubjectsByStudent(studentId: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId },
    include: {
      subject: {
        include: {
          teacher: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return enrollments.map((enrollment) => ({
    ...enrollment.subject,
    enrolledAt: enrollment.enrolledAt,
  }));
}

/**
 * Get subject by ID
 */
export async function getSubjectById(id: string) {
  const subject = await prisma.subject.findUnique({
    where: { id },
    include: {
      teacher: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
      _count: {
        select: {
          enrollments: true,
          assignments: true,
          tests: true,
          grades: true,
        },
      },
    },
  });

  if (!subject) {
    throw new AppError('Subject not found', 404);
  }

  return subject;
}

/**
 * Update subject
 */
export async function updateSubject(id: string, data: UpdateSubjectDTO) {
  const subject = await prisma.subject.update({
    where: { id },
    data,
    include: {
      teacher: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  return subject;
}

/**
 * Archive subject (soft delete)
 */
export async function archiveSubject(id: string) {
  // Check if subject has any data
  const subject = await prisma.subject.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          grades: true,
          assignments: true,
          tests: true,
        },
      },
    },
  });

  if (!subject) {
    throw new AppError('Subject not found', 404);
  }

  // Don't allow deletion if there's data
  const hasData =
    subject._count.grades > 0 ||
    subject._count.assignments > 0 ||
    subject._count.tests > 0;

  if (hasData) {
    throw new AppError(
      'Cannot archive subject with existing grades, assignments, or tests',
      400
    );
  }

  const updated = await prisma.subject.update({
    where: { id },
    data: { isActive: false },
  });

  return updated;
}

/**
 * Enroll student in subject
 */
export async function enrollStudent(studentId: string, subjectId: string) {
  // Check if student exists
  const student = await prisma.studentProfile.findUnique({
    where: { id: studentId },
  });

  if (!student) {
    throw new AppError('Student not found', 404);
  }

  // Check if subject exists
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
  });

  if (!subject) {
    throw new AppError('Subject not found', 404);
  }

  if (!subject.isActive) {
    throw new AppError('Subject is not active', 400);
  }

  // Check for duplicate enrollment
  const existing = await prisma.enrollment.findUnique({
    where: {
      studentId_subjectId: {
        studentId,
        subjectId,
      },
    },
  });

  if (existing) {
    throw new AppError('Student is already enrolled in this subject', 409);
  }

  const enrollment = await prisma.enrollment.create({
    data: {
      studentId,
      subjectId,
    },
    include: {
      subject: true,
      student: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  return enrollment;
}

/**
 * Get enrollments by student
 */
export async function getEnrollmentsByStudent(studentId: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId },
    include: {
      subject: {
        include: {
          teacher: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      enrolledAt: 'desc',
    },
  });

  return enrollments;
}

/**
 * Get enrollments by subject
 */
export async function getEnrollmentsBySubject(subjectId: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: { subjectId },
    include: {
      student: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      enrolledAt: 'desc',
    },
  });

  return enrollments;
}
