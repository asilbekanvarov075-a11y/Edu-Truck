# 🚀 EduTrack - Tez Boshlash

## 1️⃣ O'rnatish (5 daqiqa)

```bash
# Dependencies
npm install

# Environment
cp .env.example .env
```

`.env` faylni tahrirlang:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/edutrack"
JWT_ACCESS_SECRET="your-secret-key-change-this"
JWT_REFRESH_SECRET="your-refresh-secret-change-this"
```

## 2️⃣ Database (2 daqiqa)

```bash
# Prisma setup
npm run prisma:generate

# Create database
npm run prisma:migrate

# Add test data
npm run seed
```

## 3️⃣ Ishga Tushirish (1 daqiqa)

```bash
npm run dev
```

✅ Server: `http://localhost:5000`

## 4️⃣ Test Qilish

### Browser da:
```
http://localhost:5000/health
```

Javob:
```json
{"status":"ok","timestamp":"..."}
```

### Terminal da:
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"student@edutrack.uz","password":"Student123!"}'
```

## 🎯 Test Accounts

- **Student**: student@edutrack.uz / Student123!
- **Teacher**: teacher@edutrack.uz / Teacher123!
- **Parent**: parent@edutrack.uz / Parent123!
- **Admin**: admin@edutrack.uz / Admin123!

## 📡 API Endpoints

- `POST /api/auth/login` - Kirish
- `POST /api/auth/register` - Ro'yxatdan o'tish
- `GET /api/subjects/student/:id` - Fanlar
- `GET /api/grades/student/:id` - Baholar
- `POST /api/assignments` - Vazifa yaratish
- `POST /api/tests` - Test yaratish

## 🔧 Qo'shimcha

```bash
# Database UI
npm run prisma:studio

# Logs
tail -f logs/combined.log
```

## ❓ Muammo?

1. PostgreSQL ishlab turibmi? → `psql -U postgres`
2. Port band emas? → `lsof -i :5000`
3. Dependencies o'rnatildimi? → `npm install`

## ✅ Tayyor!

Endi API ishlamoqda. Postman yoki curl bilan test qiling! 🎉
