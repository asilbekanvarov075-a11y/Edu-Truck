import { PrismaClient, AttendanceStatus } from '@prisma/client';
import QRCode from 'qrcode';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export interface MarkAttendanceDTO {
  studentId: string;
  subjectId: string;
  date: Date;
  status: AttendanceStatus;
  markedBy: string;
  note?: string;
}

// Mark attendance
export async function markAttendance(data: MarkAttendanceDTO) {
  const attendance = await prisma.attendanceRecord.create({
    data: {
      studentId: data.studentId,
      subjectId: data.subjectId,
      date: new Date(data.date),
      status: data.status,
      markedBy: data.markedBy,
      note: data.note,
      qrCodeUsed: false,
    },
    include: {
      student: { include: { user: { select: { firstName: true, lastName: true } } } },
      subject: true,
    },
  });

  return attendance;
}

// Generate QR code for attendance
export async function generateQRCode(subjectId: string, sessionDate: Date) {
  const code = `ATT-${subjectId}-${Date.now()}`;
  const expiresAt = new Date(sessionDate.getTime() + 15 * 60 * 1000); // 15 min

  const qrCode = await prisma.qRCode.create({
    data: {
      code,
      subjectId,
      sessionDate,
      expiresAt,
      isActive: true,
    },
  });

  const qrImage = await QRCode.toDataURL(code);

  return { ...qrCode, qrImage };
}

// Scan QR code
export async function scanQRCode(code: string, studentId: string) {
  const qrCode = await prisma.qRCode.findUnique({ where: { code } });

  if (!qrCode || !qrCode.isActive) {
    throw new AppError('Invalid or expired QR code', 400);
  }

  const now = new Date();
  const status = now > qrCode.expiresAt ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;

  const attendance = await prisma.attendanceRecord.create({
    data: {
      studentId,
      subjectId: qrCode.subjectId,
      date: qrCode.sessionDate,
      status,
      markedBy: studentId,
      qrCodeUsed: true,
    },
  });

  return attendance;
}

// Calculate attendance rate
export async function calculateAttendanceRate(
  studentId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const records = await prisma.attendanceRecord.findMany({
    where: {
      studentId,
      date: { gte: startDate, lte: endDate },
    },
  });

  if (records.length === 0) return 0;

  const presentCount = records.filter(
    (r) => r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.LATE
  ).length;

  return Math.round((presentCount / records.length) * 100 * 100) / 100;
}

// Get daily report
export async function getDailyReport(date: Date, subjectId?: string) {
  const records = await prisma.attendanceRecord.findMany({
    where: {
      date: {
        gte: new Date(date.setHours(0, 0, 0, 0)),
        lt: new Date(date.setHours(23, 59, 59, 999)),
      },
      ...(subjectId && { subjectId }),
    },
    include: {
      student: { include: { user: { select: { firstName: true, lastName: true } } } },
    },
  });

  const summary = {
    totalSessions: records.length,
    presentCount: records.filter((r) => r.status === AttendanceStatus.PRESENT).length,
    absentCount: records.filter((r) => r.status === AttendanceStatus.ABSENT).length,
    lateCount: records.filter((r) => r.status === AttendanceStatus.LATE).length,
    excusedCount: records.filter((r) => r.status === AttendanceStatus.EXCUSED).length,
  };

  return { summary, records };
}
