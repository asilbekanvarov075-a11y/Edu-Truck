import { PrismaClient, BadgeType } from '@prisma/client';

const prisma = new PrismaClient();

// Add experience points
export async function addExperiencePoints(studentId: string, points: number, reason: string) {
  let gamification = await prisma.gamificationStatus.findUnique({
    where: { studentId },
  });

  if (!gamification) {
    gamification = await prisma.gamificationStatus.create({
      data: { studentId, experiencePoints: 0, level: 1 },
    });
  }

  const newXP = gamification.experiencePoints + points;
  const newLevel = calculateLevel(newXP);

  await prisma.gamificationStatus.update({
    where: { studentId },
    data: {
      experiencePoints: newXP,
      level: newLevel,
    },
  });

  return { newXP, newLevel, leveledUp: newLevel > gamification.level };
}

// Calculate level from XP
function calculateLevel(xp: number): number {
  if (xp < 100) return 1;
  if (xp < 250) return 2;
  if (xp < 500) return 3;
  if (xp < 1000) return 4;
  if (xp < 2000) return 5;
  return Math.floor(5 + (xp - 2000) / 500);
}

// Award badge
export async function awardBadge(studentId: string, type: BadgeType, name: string, description: string) {
  const existing = await prisma.badge.findFirst({
    where: { studentId, type },
  });

  if (existing) return existing;

  const badge = await prisma.badge.create({
    data: {
      studentId,
      type,
      name,
      description,
    },
  });

  return badge;
}

// Get leaderboard
export async function getLeaderboard(limit: number = 10) {
  const leaderboard = await prisma.gamificationStatus.findMany({
    include: {
      student: {
        include: {
          user: { select: { firstName: true, lastName: true } },
        },
      },
      _count: { select: { student: { select: { badges: true } } } },
    },
    orderBy: { experiencePoints: 'desc' },
    take: limit,
  });

  return leaderboard.map((entry, index) => ({
    rank: index + 1,
    studentId: entry.studentId,
    studentName: `${entry.student.user.firstName} ${entry.student.user.lastName}`,
    level: entry.level,
    experiencePoints: entry.experiencePoints,
    badgeCount: entry.student.badges.length,
  }));
}

// Check and award achievements
export async function checkAndAwardAchievements(studentId: string) {
  const badges = [];

  // Check perfect attendance
  const attendanceRate = await calculateAttendanceRate(studentId);
  if (attendanceRate === 100) {
    const badge = await awardBadge(
      studentId,
      BadgeType.PERFECT_ATTENDANCE_MONTH,
      'Perfect Attendance',
      'Achieved 100% attendance this month'
    );
    badges.push(badge);
  }

  // Check A+ student
  const avgGrade = await calculateAverageGrade(studentId);
  if (avgGrade >= 90) {
    const badge = await awardBadge(
      studentId,
      BadgeType.A_PLUS_STUDENT,
      'A+ Student',
      'Maintained 90+ average'
    );
    badges.push(badge);
  }

  return badges;
}

async function calculateAttendanceRate(studentId: string): Promise<number> {
  const records = await prisma.attendanceRecord.findMany({
    where: { studentId },
  });
  if (records.length === 0) return 0;
  const present = records.filter((r) => r.status === 'PRESENT').length;
  return (present / records.length) * 100;
}

async function calculateAverageGrade(studentId: string): Promise<number> {
  const grades = await prisma.grade.findMany({
    where: { studentId },
    select: { value: true },
  });
  if (grades.length === 0) return 0;
  return grades.reduce((sum, g) => sum + g.value, 0) / grades.length;
}
