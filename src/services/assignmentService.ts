import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export interface CreateAssignmentDTO {
  title: string;
  description: string;
  subjectId: string;
  teacherId: string;
  dueDate: Date;
  maxPoints: number;
  attachments?: string[];
}

export interface UpdateAssignmentDTO {
  title?: string;
  description?: string;
  dueDate?: Date;
  maxPoints?: number;
  attachments?: string[];
}

export interface SubmitAssignmentDTO {
  assignmentId: string;
  studentId: string;
  content?: string;
  files?: string[];
}

export interface GradeSubmissionDTO {
  submissionId: string;
  grade: number;
  feedback?: string;
}

/**
 * Create new assignment
 */
export async function createAssignment(data: CreateAssignmentDTO) {
  // Validate due date is in the future
  if (new Date(data.dueDate) <= new Date()) {
    throw new AppError('Due date must be in the future', 400);
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

  const assignment = await prisma.assignment.create({
    data: {
      title: data.title,
      description: data.description,
      subjectId: data.subjectId,
      teacherId: data.teacherId,
      dueDate: new Date(data.dueDate),
      maxPoints: data.maxPoints,
      attachments: data.attachments || [],
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
    },
  });

  return assignment;
}

/**
 * Get assignments by subject
 */
export async function getAssignmentsBySubject(subjectId: string) {
  const assignments = await prisma.assignment.findMany({
    where: { subjectId },
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
      _count: {
        select: {
          submissions: true,
        },
      },
    },
    orderBy: {
      dueDate: 'desc',
    },
  });

  return assignments;
}

/**
 * Get assignments by student (filter by enrollments)
 */
export async function getAssignmentsByStudent(studentId: string) {
  // Get student's enrolled subjects
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId },
    select: { subjectId: true },
  });

  const subjectIds = enrollments.map((e) => e.subjectId);

  const assignments = await prisma.assignment.findMany({
    where: {
      subjectId: { in: subjectIds },
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
      submissions: {
        where: { studentId },
      },
    },
    orderBy: {
      dueDate: 'asc',
    },
  });

  // Add submission status
  return assignments.map((assignment) => ({
    ...assignment,
    submissionStatus:
      assignment.submissions.length > 0
        ? assignment.submissions[0].grade !== null
          ? 'graded'
          : 'submitted'
        : new Date() > assignment.dueDate
        ? 'overdue'
        : 'not_submitted',
  }));
}

/**
 * Get assignment by ID
 */
export async function getAssignmentById(id: string) {
  const assignment = await prisma.assignment.findUnique({
    where: { id },
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
      submissions: {
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
      },
    },
  });

  if (!assignment) {
    throw new AppError('Assignment not found', 404);
  }

  return assignment;
}

/**
 * Update assignment
 */
export async function updateAssignment(id: string, data: UpdateAssignmentDTO) {
  // Validate due date if provided
  if (data.dueDate && new Date(data.dueDate) <= new Date()) {
    throw new AppError('Due date must be in the future', 400);
  }

  const assignment = await prisma.assignment.update({
    where: { id },
    data,
    include: {
      subject: true,
    },
  });

  return assignment;
}

/**
 * Delete assignment (only if no submissions)
 */
export async function deleteAssignment(id: string) {
  // Check for submissions
  const submissionCount = await prisma.submission.count({
    where: { assignmentId: id },
  });

  if (submissionCount > 0) {
    throw new AppError('Cannot delete assignment with existing submissions', 400);
  }

  await prisma.assignment.delete({
    where: { id },
  });

  return { success: true, message: 'Assignment deleted successfully' };
}

/**
 * Submit assignment
 */
export async function submitAssignment(data: SubmitAssignmentDTO) {
  // Verify student is enrolled in subject
  const assignment = await prisma.assignment.findUnique({
    where: { id: data.assignmentId },
  });

  if (!assignment) {
    throw new AppError('Assignment not found', 404);
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      studentId_subjectId: {
        studentId: data.studentId,
        subjectId: assignment.subjectId,
      },
    },
  });

  if (!enrollment) {
    throw new AppError('Student is not enrolled in this subject', 403);
  }

  // Check if submission already exists (update if yes, create if no)
  const existing = await prisma.submission.findUnique({
    where: {
      assignmentId_studentId: {
        assignmentId: data.assignmentId,
        studentId: data.studentId,
      },
    },
  });

  if (existing) {
    // Update existing submission
    const updated = await prisma.submission.update({
      where: { id: existing.id },
      data: {
        content: data.content,
        files: data.files || [],
        submittedAt: new Date(),
      },
      include: {
        assignment: true,
      },
    });
    return updated;
  }

  // Create new submission
  const submission = await prisma.submission.create({
    data: {
      assignmentId: data.assignmentId,
      studentId: data.studentId,
      content: data.content,
      files: data.files || [],
    },
    include: {
      assignment: true,
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

  return submission;
}

/**
 * Grade submission
 */
export async function gradeSubmission(data: GradeSubmissionDTO) {
  // Validate grade
  if (data.grade < 0 || data.grade > 100) {
    throw new AppError('Grade must be between 0 and 100', 400);
  }

  const submission = await prisma.submission.update({
    where: { id: data.submissionId },
    data: {
      grade: data.grade,
      feedback: data.feedback,
      gradedAt: new Date(),
    },
    include: {
      assignment: true,
      student: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  // TODO: Trigger notification to student and parent

  return submission;
}

/**
 * Detect overdue assignments
 */
export async function detectOverdueAssignments() {
  const now = new Date();

  // Find assignments past due date
  const overdueAssignments = await prisma.assignment.findMany({
    where: {
      dueDate: { lt: now },
    },
    include: {
      subject: {
        include: {
          enrollments: {
            include: {
              student: true,
            },
          },
        },
      },
      submissions: true,
    },
  });

  // Find students who haven't submitted
  const overdueSubmissions = [];

  for (const assignment of overdueAssignments) {
    const enrolledStudents = assignment.subject.enrollments;
    const submittedStudentIds = assignment.submissions.map((s) => s.studentId);

    for (const enrollment of enrolledStudents) {
      if (!submittedStudentIds.includes(enrollment.studentId)) {
        overdueSubmissions.push({
          assignmentId: assignment.id,
          assignmentTitle: assignment.title,
          studentId: enrollment.studentId,
          dueDate: assignment.dueDate,
        });
      }
    }
  }

  return overdueSubmissions;
}
