import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@edutrack.uz' },
    update: {},
    create: {
      email: 'admin@edutrack.uz',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
      firstName: 'Admin',
      lastName: 'User',
      languagePreference: 'uz',
    },
  });
  console.log(`✅ Admin created: ${admin.email}`);

  // Create teacher
  const teacherPassword = await bcrypt.hash('Teacher123!', 10);
  const teacher = await prisma.user.create({
    data: {
      email: 'teacher@edutrack.uz',
      passwordHash: teacherPassword,
      role: UserRole.TEACHER,
      firstName: 'Aziza',
      lastName: 'Karimova',
      teacherProfile: {
        create: {
          teacherId: 'T001',
          specialization: ['Mathematics', 'Physics'],
          bio: 'Experienced mathematics teacher',
          experience: 10,
          isApproved: true,
          approvedAt: new Date(),
        },
      },
    },
  });
  console.log(`✅ Teacher created: ${teacher.email}`);

  // Create subjects
  const mathSubject = await prisma.subject.create({
    data: {
      name: 'Matematika',
      nameUz: 'Matematika',
      nameRu: 'Математика',
      nameEn: 'Mathematics',
      description: 'Algebra va geometriya',
      gradeLevel: 9,
      teacherId: teacher.teacherProfile!.id,
    },
  });
  console.log(`✅ Subject created: ${mathSubject.name}`);

  // Create student
  const studentPassword = await bcrypt.hash('Student123!', 10);
  const student = await prisma.user.create({
    data: {
      email: 'student@edutrack.uz',
      passwordHash: studentPassword,
      role: UserRole.STUDENT,
      firstName: 'Jasur',
      lastName: 'Aliyev',
      studentProfile: {
        create: {
          studentId: 'S001',
          gradeLevel: 9,
          dateOfBirth: new Date('2008-05-15'),
          gamification: {
            create: {
              level: 1,
              experiencePoints: 0,
            },
          },
        },
      },
    },
  });
  console.log(`✅ Student created: ${student.email}`);

  // Create parent
  const parentPassword = await bcrypt.hash('Parent123!', 10);
  const parent = await prisma.user.create({
    data: {
      email: 'parent@edutrack.uz',
      passwordHash: parentPassword,
      role: UserRole.PARENT,
      firstName: 'Dilshod',
      lastName: 'Aliyev',
      parentProfile: {
        create: {
          occupation: 'Engineer',
          children: {
            create: {
              studentId: student.studentProfile!.id,
              relationship: 'father',
              isPrimary: true,
            },
          },
        },
      },
    },
  });
  console.log(`✅ Parent created: ${parent.email}`);

  // Enroll student in subject
  await prisma.enrollment.create({
    data: {
      studentId: student.studentProfile!.id,
      subjectId: mathSubject.id,
    },
  });
  console.log(`✅ Student enrolled in ${mathSubject.name}`);

  console.log('🎉 Seed completed successfully!');
  console.log('\n📝 Test credentials:');
  console.log('Admin: admin@edutrack.uz / Admin123!');
  console.log('Teacher: teacher@edutrack.uz / Teacher123!');
  console.log('Student: student@edutrack.uz / Student123!');
  console.log('Parent: parent@edutrack.uz / Parent123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
