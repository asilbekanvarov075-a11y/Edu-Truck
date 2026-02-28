# EduTrack API Test Guide

## 🧪 API ni Test Qilish

### 1. Serverni Ishga Tushirish

```bash
# Terminal 1: Server
npm run dev
```

Server `http://localhost:5000` da ishga tushadi.

### 2. Test Qilish (curl yoki Postman)

#### ✅ Health Check

```bash
curl http://localhost:5000/health
```

**Kutilgan javob:**
```json
{
  "status": "ok",
  "timestamp": "2024-..."
}
```

---

#### 🔐 1. Register (Ro'yxatdan o'tish)

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "firstName": "Test",
    "lastName": "User",
    "role": "STUDENT"
  }'
```

**Kutilgan javob:**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "test@example.com",
    "role": "STUDENT",
    ...
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

---

#### 🔑 2. Login (Kirish)

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "student@edutrack.uz",
    "password": "Student123!"
  }'
```

**Kutilgan javob:**
```json
{
  "success": true,
  "user": { ... },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

**TOKEN ni saqlang!** Keyingi requestlar uchun kerak bo'ladi.

---

#### 📚 3. Fanlarni Ko'rish

```bash
# TOKEN ni o'zgartiring!
curl http://localhost:5000/api/subjects/student/STUDENT_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

#### 📊 4. Baholarni Ko'rish

```bash
curl http://localhost:5000/api/grades/student/STUDENT_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

#### ✍️ 5. Baho Qo'yish (Teacher)

```bash
# Avval teacher sifatida login qiling
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "teacher@edutrack.uz",
    "password": "Teacher123!"
  }'

# Keyin baho qo'ying
curl -X POST http://localhost:5000/api/grades \
  -H "Authorization: Bearer TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "STUDENT_PROFILE_ID",
    "subjectId": "SUBJECT_ID",
    "value": 95,
    "type": "exam",
    "comment": "Excellent work!"
  }'
```

---

## 🔍 Postman Collection

### Import qilish uchun:

1. Postman ochish
2. Import → Raw text
3. Quyidagi JSON ni paste qiling:

```json
{
  "info": {
    "name": "EduTrack API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"test@example.com\",\n  \"password\": \"Test123!\",\n  \"firstName\": \"Test\",\n  \"lastName\": \"User\",\n  \"role\": \"STUDENT\"\n}"
            },
            "url": {"raw": "http://localhost:5000/api/auth/register"}
          }
        },
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"identifier\": \"student@edutrack.uz\",\n  \"password\": \"Student123!\"\n}"
            },
            "url": {"raw": "http://localhost:5000/api/auth/login"}
          }
        }
      ]
    }
  ]
}
```

---

## 📝 Test Credentials

| Role    | Email                  | Password     |
|---------|------------------------|--------------|
| Admin   | admin@edutrack.uz      | Admin123!    |
| Teacher | teacher@edutrack.uz    | Teacher123!  |
| Student | student@edutrack.uz    | Student123!  |
| Parent  | parent@edutrack.uz     | Parent123!   |

---

## ⚠️ Muhim Eslatmalar

1. **TOKEN**: Har bir protected endpoint uchun `Authorization: Bearer TOKEN` header kerak
2. **IDs**: Student ID, Subject ID kabi qiymatlarni database dan oling
3. **Validation**: Email format, password requirements tekshiriladi
4. **Rate Limiting**: 100 request/minute, 5 login attempts

---

## 🐛 Debugging

Agar xatolik bo'lsa:

```bash
# Logs ko'rish
tail -f logs/combined.log
tail -f logs/error.log

# Database tekshirish
npm run prisma:studio
```

---

## ✅ Success Indicators

Server to'g'ri ishlayotganini bilish uchun:

1. ✅ Health check `/health` 200 qaytaradi
2. ✅ Login muvaffaqiyatli token qaytaradi
3. ✅ Protected endpoints 401 (token yo'q) yoki 200 (token bor) qaytaradi
4. ✅ Logs da xatolik yo'q
