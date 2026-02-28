# 🚀 EduTrack - To'liq Ishga Tushirish

## 📋 Hozirgi Holat

✅ **Tayyor:**
- Backend kod (100%)
- Database schema
- API endpoints
- Frontend demo

❌ **Kerak:**
- PostgreSQL
- Dependencies o'rnatish
- Database yaratish

---

## 🔧 1-QADAM: PostgreSQL O'rnatish

### Terminal ochib, quyidagi buyruqlarni ishga tushiring:

```bash
# Homebrew orqali PostgreSQL o'rnatish
brew install postgresql@14

# PostgreSQL ni ishga tushirish
brew services start postgresql@14

# Tekshirish
psql --version
```

**Agar Homebrew yo'q bo'lsa:**
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

---

## 📦 2-QADAM: Dependencies O'rnatish

```bash
# Loyiha papkasiga o'ting
cd "/Users/asilbekanvarov/Documents/edu track"

# Dependencies o'rnatish (5-10 daqiqa)
npm install
```

---

## 🗄️ 3-QADAM: Database Yaratish

```bash
# PostgreSQL database yaratish
createdb edutrack

# Prisma setup
npx prisma generate
npx prisma migrate dev --name init

# Test ma'lumotlar qo'shish
npx tsx prisma/seed.ts
```

---

## 🚀 4-QADAM: Server Ishga Tushirish

```bash
# Development server
npm run dev
```

Server `http://localhost:5000` da ishga tushadi.

---

## 🌐 5-QADAM: Frontend Ochish

Yangi terminal ochib:

```bash
cd "/Users/asilbekanvarov/Documents/edu track"
open public/index.html
```

Yoki browserda: `http://localhost:5000` (agar static server qo'shsak)

---

## 🧪 Test Accounts

| Rol | Email | Parol |
|-----|-------|-------|
| Student | student@edutrack.uz | Student123! |
| Teacher | teacher@edutrack.uz | Teacher123! |
| Parent | parent@edutrack.uz | Parent123! |
| Admin | admin@edutrack.uz | Admin123! |

---

## ✅ Tekshirish

### 1. Health Check
```bash
curl http://localhost:5000/health
```

Javob: `{"status":"ok"}`

### 2. Login Test
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"student@edutrack.uz","password":"Student123!"}'
```

---

## 🐛 Muammolar va Yechimlar

### PostgreSQL ishlamayapti
```bash
brew services restart postgresql@14
```

### Port band
```bash
lsof -ti:5000 | xargs kill -9
```

### Dependencies xatolik
```bash
rm -rf node_modules package-lock.json
npm install
```

### Database xatolik
```bash
dropdb edutrack
createdb edutrack
npx prisma migrate dev --name init
```

---

## 📁 Loyiha Strukturasi

```
edu track/
├── src/
│   ├── index.ts          # Main server
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── middleware/       # Auth, RBAC, etc
│   └── utils/            # Helpers
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Test data
├── public/
│   ├── index.html        # Login page
│   ├── dashboard.html    # Student dashboard
│   ├── admin-dashboard.html
│   └── teacher-dashboard.html
└── package.json

```

---

## 🎯 Keyingi Qadamlar

1. ✅ PostgreSQL o'rnatish
2. ✅ Dependencies o'rnatish
3. ✅ Database yaratish
4. ✅ Server ishga tushirish
5. ✅ Test qilish

---

## 💡 Yordam

Agar muammo bo'lsa:
1. Terminal da xatolik xabarini ko'ring
2. `logs/error.log` faylini tekshiring
3. PostgreSQL ishlab turganini tekshiring: `brew services list`

---

## 🎉 Muvaffaqiyat!

Agar hammasi ishlasa:
- ✅ Backend API: http://localhost:5000
- ✅ Health: http://localhost:5000/health
- ✅ Login: public/index.html

**Omad!** 🚀
