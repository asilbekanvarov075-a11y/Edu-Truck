import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export interface Question {
  id: string;
  text: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  options?: string[];
  correctAnswer: string | string[];
  points: number;
}

export interface CreateTestDTO {
  title: string;
  description?: string;
  subjectId: string;
  teacherId: string;
  timeLimit: number; // in minutes
  passingScore: number;
  scheduledFor: Date;
  questions: Question[];
}

export interface UpdateTestDTO {
  title?: string;
  description?: string;
  timeLimit?: number;
  passingScore?: number;
  scheduledFor?: Date;
  questions?: Question[];
}

export interface SubmitTestDTO {
  testId: string;
  studentId: string;
  answers: Array<{
    questionId: string;
    answer: string | string[];
  }>;
}

/**
 * Create new test
 */
export async function createTest(data: CreateTestDTO) {
  // Validate questions
  if (!data.questions || data.questions.length === 0) {
    throw new AppError('Test must have at least one question', 400);
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

  const test = await prisma.test.create({
    data: {
      title: data.title,
      description: data.description,
      subjectId: data.subjectId,
      teacherId: data.teacherId,
      timeLimit: data.timeLimit,
      passingScore: data.passingScore,
      scheduledFor: new Date(data.scheduledFor),
      questions: data.questions as any,
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

  return test;
}

/**
 * Get tests by subject
 */
export async function getTestsBySubject(subjectId: string) {
  const tests = await prisma.test.findMany({
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
          results: true,
        },
      },
    },
    orderBy: {
      scheduledFor: 'desc',
    },
  });

  return tests;
}

/**
 * Get test by ID
 */
export async function getTestById(id: string, includeAnswers: boolean = false) {
  const test = await prisma.test.findUnique({
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
    },
  });

  if (!test) {
    throw new AppError('Test not found', 404);
  }

  // Remove correct answers if not authorized
  if (!includeAnswers) {
    const questions = test.questions as Question[];
    test.questions = questions.map((q) => ({
      ...q,
      correctAnswer: undefined,
    })) as any;
  }

  return test;
}

/**
 * Update test
 */
export async function updateTest(id: string, data: UpdateTestDTO) {
  const test = await prisma.test.update({
    where: { id },
    data,
    include: {
      subject: true,
    },
  });

  return test;
}

/**
 * Delete test (only if no results)
 */
export async function deleteTest(id: string) {
  // Check for results
  const resultCount = await prisma.testResult.count({
    where: { testId: id },
  });

  if (resultCount > 0) {
    throw new AppError('Cannot delete test with existing results', 400);
  }

  await prisma.test.delete({
    where: { id },
  });

  return { success: true, message: 'Test deleted successfully' };
}

/**
 * Submit test and auto-grade
 */
export async function submitTest(data: SubmitTestDTO) {
  // Get test with questions
  const test = await prisma.test.findUnique({
    where: { id: data.testId },
  });

  if (!test) {
    throw new AppError('Test not found', 404);
  }

  // Verify student is enrolled in subject
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      studentId_subjectId: {
        studentId: data.studentId,
        subjectId: test.subjectId,
      },
    },
  });

  if (!enrollment) {
    throw new AppError('Student is not enrolled in this subject', 403);
  }

  // Check if already submitted
  const existing = await prisma.testResult.findUnique({
    where: {
      testId_studentId: {
        testId: data.testId,
        studentId: data.studentId,
      },
    },
  });

  if (existing) {
    throw new AppError('Test already submitted', 409);
  }

  // Auto-grade objective questions
  const questions = test.questions as Question[];
  let totalScore = 0;
  let maxScore = 0;

  const gradedAnswers = data.answers.map((answer) => {
    const question = questions.find((q) => q.id === answer.questionId);
    if (!question) {
      return { ...answer, isCorrect: false, points: 0 };
    }

    maxScore += question.points;

    // Auto-grade for objective questions
    if (question.type === 'MULTIPLE_CHOICE' || question.type === 'TRUE_FALSE') {
      const isCorrect = JSON.stringify(answer.answer) === JSON.stringify(question.correctAnswer);
      if (isCorrect) {
        totalScore += question.points;
      }
      return { ...answer, isCorrect, points: isCorrect ? question.points : 0 };
    }

    // Short answer requires manual grading
    return { ...answer, isCorrect: null, points: 0 };
  });

  // Create test result
  const result = await prisma.testResult.create({
    data: {
      testId: data.testId,
      studentId: data.studentId,
      answers: gradedAnswers as any,
      score: totalScore,
      maxScore,
    },
    include: {
      test: {
        select: {
          title: true,
          passingScore: true,
        },
      },
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

  return result;
}

/**
 * Get test results by student
 */
export async function getTestResultsByStudent(studentId: string) {
  const results = await prisma.testResult.findMany({
    where: { studentId },
    include: {
      test: {
        include: {
          subject: true,
        },
      },
    },
    orderBy: {
      submittedAt: 'desc',
    },
  });

  return results;
}

/**
 * Get test results by test
 */
export async function getTestResultsByTest(testId: string) {
  const results = await prisma.testResult.findMany({
    where: { testId },
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
    orderBy: {
      score: 'desc',
    },
  });

  return results;
}

/**
 * Get test statistics
 */
export async function getTestStatistics(testId: string) {
  const results = await prisma.testResult.findMany({
    where: { testId },
    select: {
      score: true,
      maxScore: true,
    },
  });

  if (results.length === 0) {
    return {
      totalSubmissions: 0,
      averageScore: 0,
      averagePercentage: 0,
      passRate: 0,
      highestScore: 0,
      lowestScore: 0,
    };
  }

  const test = await prisma.test.findUnique({
    where: { id: testId },
    select: { passingScore: true },
  });

  const scores = results.map((r) => r.score);
  const percentages = results.map((r) => (r.score / r.maxScore) * 100);
  const passCount = percentages.filter((p) => p >= test!.passingScore).length;

  return {
    totalSubmissions: results.length,
    averageScore: Math.round((scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 100) / 100,
    averagePercentage:
      Math.round((percentages.reduce((a: number, b: number) => a + b, 0) / percentages.length) * 100) / 100,
    passRate: Math.round((passCount / results.length) * 100 * 100) / 100,
    highestScore: Math.max(...scores),
    lowestScore: Math.min(...scores),
  };
}
