# EduTrack - Education Management System

Modern, scalable Education Management System that unifies students, teachers, parents, and administrators on a single digital platform.

## 🎯 Loyiha Haqida

EduTrack - bu o'quvchi, o'qituvchi, ota-ona va administratorlarni yagona raqamli platformada birlashtiruvchi zamonaviy ta'lim boshqaruv tizimi (EMS). Tizim ta'lim jarayonini raqamlashtirish, o'quvchilarning bilim darajasi va rivojlanishini chuqur tahlil qilish hamda barcha ishtirokchilar o'rtasida samarali aloqa o'rnatish uchun mo'ljallangan.

## ✨ Asosiy Xususiyatlar

### 🔐 Authentication & Security
- JWT-based authentication (access + refresh tokens)
- Password hashing with bcrypt
- Rate limiting (100 req/min)
- Account lockout after 5 failed login attempts
- Role-based access control (RBAC)

### 👥 User Roles
- **Student (O'quvchi)**: Fanlar, baholar, vazifalar, testlar
- **Teacher (O'qituvchi)**: Baho qo'yish, vazifa berish, test yaratish
- **Parent (Ota-ona)**: Farzand monitoring, notificationlar
- **Admin (Administrator)**: Tizim boshqaruvi

### 📚 Academic Features
- **Subject Management**: Fanlar yaratish, o'quvchilarni yozish
- **Grade Management**: Baholar, o'rtacha hisoblash, GPA
- **Assignment System**: Vazifa yaratish, topshirish, baholash
- **Test System**: Test yaratish, auto-grading, statistika
- **Attendance**: QR code, kunlik/oylik hisobotlar

### 💬 Communication
- Real-time chat (Teacher ↔ Student ↔ Parent)
- Smart notifications (grade drops, missing homework)
- WebSocket-based messaging

### 🎮 Gamification
- Experience points (XP)
- Levels and progression
- Badges and achievements
- Leaderboards

### 📊 Analytics
- Grade trends and statistics
- Attendance reports
- Performance analytics
- Weak subject identification

### 🌍 Multi-language
- O'zbek tili
- Русский язык
- English

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

```bash
# 1. Clone repository
git clone <repository-url>
cd edutrack

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
# Edit .env with your database credentials

# 4. Setup database
npm run prisma:generate
npm run prisma:migrate
npm run seed

# 5. Start server
npm run dev
```

Server runs on `http://localhost:5000`

### Test Credentials

| Role    | Email                  | Password     |
|---------|------------------------|--------------|
| Admin   | admin@edutrack.uz      | Admin123!    |
| Teacher | teacher@edutrack.uz    | Teacher123!  |
| Student | student@edutrack.uz    | Student123!  |
| Parent  | parent@edutrack.uz     | Parent123!   |

## 📡 API Documentation

### Authentication
```bash
POST /api/auth/register  # Register new user
POST /api/auth/login     # Login
POST /api/auth/refresh   # Refresh token
POST /api/auth/logout    # Logout
```

### Subjects
```bash
POST   /api/subjects                    # Create subject
GET    /api/subjects/teacher/:id        # Get teacher subjects
GET    /api/subjects/student/:id        # Get student subjects
POST   /api/subjects/:id/enroll         # Enroll student
```

### Grades
```bash
POST   /api/grades                      # Create grade
GET    /api/grades/student/:id          # Get student grades
GET    /api/grades/student/:id/average  # Get average/GPA
POST   /api/grades/bulk                 # Bulk create grades
```

### Assignments
```bash
POST   /api/assignments                 # Create assignment
GET    /api/assignments/student/:id     # Get student assignments
POST   /api/assignments/:id/submit      # Submit assignment
PUT    /api/assignments/submissions/:id/grade  # Grade submission
```

### Tests
```bash
POST   /api/tests                       # Create test
GET    /api/tests/subject/:id           # Get subject tests
POST   /api/tests/:id/submit            # Submit test
GET    /api/tests/:id/statistics        # Get test stats
```

## 🏗️ Project Structure

```
edutrack/
├── src/
│   ├── index.ts              # Application entry point
│   ├── services/             # Business logic
│   │   ├── authService.ts
│   │   ├── subjectService.ts
│   │   ├── gradeService.ts
│   │   ├── assignmentService.ts
│   │   ├── testService.ts
│   │   ├── attendanceService.ts
│   │   ├── chatService.ts
│   │   ├── notificationService.ts
│   │   └── gamificationService.ts
│   ├── routes/               # API routes
│   │   ├── auth.ts
│   │   ├── subjects.ts
│   │   ├── grades.ts
│   │   ├── assignments.ts
│   │   └── tests.ts
│   ├── middleware/           # Express middleware
│   │   ├── auth.ts
│   │   ├── rbac.ts
│   │   ├── rateLimiter.ts
│   │   └── errorHandler.ts
│   ├── utils/                # Utilities
│   │   ├── jwt.ts
│   │   ├── password.ts
│   │   └── logger.ts
│   └── types/                # TypeScript types
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.ts               # Seed data
├── tests/                    # Test files
├── .env.example              # Environment template
├── package.json
├── tsconfig.json
├── README.md
└── SETUP.md                  # Detailed setup guide
```

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT, bcrypt
- **Real-time**: Socket.io
- **Validation**: express-validator
- **Testing**: Jest, fast-check
- **Logging**: Winston
- **QR Codes**: qrcode library

## 📊 Database Schema

25+ models including:
- User, StudentProfile, TeacherProfile, ParentProfile
- Subject, Enrollment, Grade
- Assignment, Submission
- Test, TestResult
- AttendanceRecord, QRCode
- Chat, ChatMessage
- Notification, NotificationPreferences
- Badge, GamificationStatus
- FileRecord

## 🔧 Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format

# Open Prisma Studio (database UI)
npm run prisma:studio
```

## 📈 Features Roadmap

✅ **Completed**
- Authentication & Authorization
- Subject & Enrollment Management
- Grade Management with calculations
- Assignment System (create, submit, grade)
- Test System with auto-grading
- Attendance Tracking with QR codes
- Real-time Chat
- Notifications
- Gamification (badges, XP, levels)

🚧 **In Progress**
- Frontend (React/Next.js)
- Mobile App (React Native)
- Advanced Analytics Dashboard
- AI-powered Recommendations

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 📞 Support

For issues and questions:
- Check SETUP.md for detailed setup instructions
- Review API documentation above
- Check logs in `logs/` directory
- Open an issue on GitHub

## 🎓 Use Cases

- **Schools**: Complete school management system
- **Universities**: Course and grade management
- **Training Centers**: Student progress tracking
- **Online Education**: Remote learning platform

## 🌟 Key Benefits

- **Scalable**: Built with modern architecture
- **Secure**: JWT auth, RBAC, rate limiting
- **Real-time**: WebSocket for instant updates
- **Multi-language**: Uzbek, Russian, English
- **Comprehensive**: All-in-one education platform
- **Professional**: Production-ready code

---

Made with ❤️ for education
