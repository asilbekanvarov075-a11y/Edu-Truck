import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export interface CreateGradeDTO {
  studentId: string;
  subjectId: string;
  teacherId: string;
  value: number;
  type?: string;
  comment?: string;
  assignmentId?: string;
  testId?: string;
}

export interface UpdateGradeDTO {
  value?: number;
  type?: string;
  comment?: string;
}

/**
 * Validate grade value (0-100 range)
 */
function validateGradeValue(value: number): void {
  if (value < 0 || value > 100) {
    throw new AppError('Grade value must be between 0 and 100', 400);
  }
}

/**
 * Create new grade
 */
export async function createGrade(data: CreateGradeDTO) {
  // Validate grade value
  validateGradeValue(data.value);

  // Verify student exists and is enrolled in subject
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      studentId_subjectId: {
        studentId: data.studentId,
        subjectId: data.subjectId,
      },
    },
  });

  if (!enrollment) {
    throw new AppError('Student is not enrolled in this subject', 400);
  }

  // Verify teacher teaches this subject
  const subject = await prisma.subject.findFirst({
    where: {
      id: data.subjectId,
      teacherId: data.teacherId,
    },
  });

  if (!subject) {
    throw new AppError('Teacher does not teach this subject', 403);
  }

  const grade = await prisma.grade.create({
    data: {
      studentId: data.studentId,
      subjectId: data.subjectId,
      teacherId: data.teacherId,
      value: data.value,
      type: data.type,
      comment: data.comment,
      assignmentId: data.assignmentId,
      testId: data.testId,
    },
    include: {
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
      subject: true,
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

  return grade;
}

/**
 * Update grade with audit trail
 */
export async function updateGrade(id: string, data: UpdateGradeDTO) {
  // Validate grade value if provided
  if (data.value !== undefined) {
    validateGradeValue(data.value);
  }

  const grade = await prisma.grade.update({
    where: { id },
    data,
    include: {
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
      subject: true,
    },
  });

  return grade;
}

/**
 * Get grades by student
 */
export async function getGradesByStudent(studentId: string, subjectId?: string) {
  const grades = await prisma.grade.findMany({
    where: {
      studentId,
      ...(subjectId && { subjectId }),
    },
    include: {
      subject: true,
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
      assignment: {
        select: {
          title: true,
        },
      },
      test: {
        select: {
          title: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return grades;
}

/**
 * Get grades by subject
 */
export async function getGradesBySubject(subjectId: string) {
  const grades = await prisma.grade.findMany({
    where: { subjectId },
    include: {
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
    orderBy: [{ createdAt: 'desc' }],
  });

  return grades;
}

/**
 * Calculate average grade for student in subject
 */
export async function calculateSubjectAverage(
  studentId: string,
  subjectId: string
): Promise<number> {
  const grades = await prisma.grade.findMany({
    where: {
      studentId,
      subjectId,
    },
    select: {
      value: true,
    },
  });

  if (grades.length === 0) {
    return 0;
  }

  const sum = grades.reduce((acc, grade) => acc + grade.value, 0);
  return Math.round((sum / grades.length) * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate overall GPA for student
 */
export async function calculateOverallGPA(studentId: string): Promise<number> {
  // Get all subjects student is enrolled in
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId },
    select: { subjectId: true },
  });

  if (enrollments.length === 0) {
    return 0;
  }

  // Calculate average for each subject
  const subjectAverages = await Promise.all(
    enrollments.map((enrollment) =>
      calculateSubjectAverage(studentId, enrollment.subjectId)
    )
  );

  // Filter out subjects with no grades
  const validAverages = subjectAverages.filter((avg) => avg > 0);

  if (validAverages.length === 0) {
    return 0;
  }

  const sum = validAverages.reduce((acc, avg) => acc + avg, 0);
  return Math.round((sum / validAverages.length) * 100) / 100;
}

/**
 * Bulk create grades (with transaction for atomicity)
 */
export async function bulkCreateGrades(grades: CreateGradeDTO[]) {
  // Validate all grades first
  for (const grade of grades) {
    validateGradeValue(grade.value);
  }

  // Use transaction to ensure atomicity
  const result = await prisma.$transaction(
    grades.map((grade) =>
      prisma.grade.create({
        data: {
          studentId: grade.studentId,
          subjectId: grade.subjectId,
          teacherId: grade.teacherId,
          value: grade.value,
          type: grade.type,
          comment: grade.comment,
          assignmentId: grade.assignmentId,
          testId: grade.testId,
        },
      })
    )
  );

  return result;
}

/**
 * Get grade statistics for subject
 */
export async function getSubjectGradeStatistics(subjectId: string) {
  const grades = await prisma.grade.findMany({
    where: { subjectId },
    select: { value: true },
  });

  if (grades.length === 0) {
    return {
      count: 0,
      average: 0,
      min: 0,
      max: 0,
      median: 0,
    };
  }

  const values = grades.map((g) => g.value).sort((a, b) => a - b);
  const sum = values.reduce((acc, val) => acc + val, 0);
  const average = sum / values.length;
  const median =
    values.length % 2 === 0
      ? (values[values.length / 2 - 1] + values[values.length / 2]) / 2
      : values[Math.floor(values.length / 2)];

  return {
    count: grades.length,
    average: Math.round(average * 100) / 100,
    min: Math.min(...values),
    max: Math.max(...values),
    median: Math.round(median * 100) / 100,
  };
}
