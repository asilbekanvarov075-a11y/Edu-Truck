# EduTrack - O'rnatish va Ishga Tushirish

## 📋 Talablar

- Node.js 18+
- PostgreSQL 14+
- npm yoki yarn

## 🚀 O'rnatish

### 1. Dependencies o'rnatish

```bash
npm install
```

### 2. Environment o'rnatish

`.env` fayl yarating:

```bash
cp .env.example .env
```

`.env` faylni tahrirlang:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/edutrack"
JWT_ACCESS_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"
PORT=5000
CLIENT_URL="http://localhost:3000"
```

### 3. Database yaratish

```bash
# Prisma Client generatsiya qilish
npm run prisma:generate

# Migration ishga tushirish
npm run prisma:migrate

# Test ma'lumotlar qo'shish
npm run seed
```

### 4. Serverni ishga tushirish

```bash
# Development rejimida
npm run dev

# Production build
npm run build
npm start
```

Server `http://localhost:5000` da ishga tushadi.

## 🧪 Test Foydalanuvchilar

Seed script quyidagi test foydalanuvchilarni yaratadi:

| Role    | Email                  | Password     |
|---------|------------------------|--------------|
| Admin   | admin@edutrack.uz      | Admin123!    |
| Teacher | teacher@edutrack.uz    | Teacher123!  |
| Student | student@edutrack.uz    | Student123!  |
| Parent  | parent@edutrack.uz     | Parent123!   |

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Ro'yxatdan o'tish
- `POST /api/auth/login` - Kirish
- `POST /api/auth/refresh` - Token yangilash
- `POST /api/auth/logout` - Chiqish

### Subjects
- `POST /api/subjects` - Fan yaratish
- `GET /api/subjects/teacher/:teacherId` - O'qituvchi fanlari
- `GET /api/subjects/student/:studentId` - O'quvchi fanlari
- `POST /api/subjects/:id/enroll` - O'quvchini yozish

### Grades
- `POST /api/grades` - Baho qo'yish
- `GET /api/grades/student/:studentId` - O'quvchi baholari
- `GET /api/grades/student/:studentId/average` - O'rtacha baho
- `POST /api/grades/bulk` - Ko'p baholarni qo'shish

### Assignments
- `POST /api/assignments` - Vazifa yaratish
- `GET /api/assignments/student/:studentId` - O'quvchi vazifalari
- `POST /api/assignments/:id/submit` - Vazifa topshirish
- `PUT /api/assignments/submissions/:id/grade` - Vazifani baholash

### Tests
- `POST /api/tests` - Test yaratish
- `GET /api/tests/subject/:subjectId` - Fan testlari
- `POST /api/tests/:id/submit` - Test topshirish
- `GET /api/tests/:id/statistics` - Test statistikasi

## 🔧 Development

```bash
# Prisma Studio (database UI)
npm run prisma:studio

# Linting
npm run lint

# Formatting
npm run format

# Tests
npm test
```

## 📚 Texnologiyalar

- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL, Prisma ORM
- **Authentication**: JWT, bcrypt
- **Real-time**: Socket.io
- **Validation**: express-validator
- **Testing**: Jest, fast-check

## 🎯 Asosiy Xususiyatlar

✅ JWT Authentication  
✅ Role-Based Access Control (RBAC)  
✅ Subject Management  
✅ Grade Management (CRUD, calculations)  
✅ Assignment System (create, submit, grade)  
✅ Test System (auto-grading)  
✅ Attendance Tracking (QR codes)  
✅ Real-time Chat  
✅ Smart Notifications  
✅ Gamification (badges, XP, levels)  
✅ Multi-language Support  

## 📞 Yordam

Muammolar yuzaga kelsa:
1. `.env` faylni tekshiring
2. Database ulanishini tekshiring
3. `npm run prisma:migrate` qayta ishga tushiring
4. Logs papkasidagi xatolarni ko'ring

## 🔐 Xavfsizlik

- Parollar bcrypt bilan hash qilinadi
- JWT tokenlar 15 daqiqa (access) va 7 kun (refresh)
- Rate limiting: 100 req/min
- Login attempts: 5 marta, keyin 30 daqiqa bloklash
- RBAC orqali ruxsatlar nazorati
