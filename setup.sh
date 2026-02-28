#!/bin/bash

echo "🚀 EduTrack - Avtomatik Setup"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Homebrew is installed
echo "📦 Homebrew tekshirilmoqda..."
if ! command -v brew &> /dev/null; then
    echo -e "${YELLOW}Homebrew topilmadi. O'rnatilmoqda...${NC}"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
    echo -e "${GREEN}✅ Homebrew o'rnatilgan${NC}"
fi

# Check if PostgreSQL is installed
echo ""
echo "🗄️  PostgreSQL tekshirilmoqda..."
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}PostgreSQL topilmadi. O'rnatilmoqda...${NC}"
    brew install postgresql@14
    brew services start postgresql@14
    sleep 5
else
    echo -e "${GREEN}✅ PostgreSQL o'rnatilgan${NC}"
    brew services start postgresql@14 2>/dev/null
fi

# Check if Node.js is installed
echo ""
echo "📦 Node.js tekshirilmoqda..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js topilmadi!${NC}"
    echo "Iltimos, Node.js o'rnating: https://nodejs.org"
    exit 1
else
    echo -e "${GREEN}✅ Node.js $(node --version)${NC}"
fi

# Install dependencies
echo ""
echo "📦 Dependencies o'rnatilmoqda..."
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Dependencies o'rnatildi${NC}"
    else
        echo -e "${RED}❌ Dependencies o'rnatishda xatolik${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Dependencies allaqachon o'rnatilgan${NC}"
fi

# Create database
echo ""
echo "🗄️  Database yaratilmoqda..."
createdb edutrack 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database yaratildi${NC}"
else
    echo -e "${YELLOW}⚠️  Database allaqachon mavjud yoki xatolik${NC}"
fi

# Run Prisma migrations
echo ""
echo "🔄 Prisma setup..."
npx prisma generate
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Prisma client generated${NC}"
else
    echo -e "${RED}❌ Prisma generate xatolik${NC}"
    exit 1
fi

npx prisma migrate dev --name init
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database migrated${NC}"
else
    echo -e "${YELLOW}⚠️  Migration xatolik (ehtimol allaqachon bajarilgan)${NC}"
fi

# Seed database
echo ""
echo "🌱 Test ma'lumotlar qo'shilmoqda..."
npx tsx prisma/seed.ts
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Test ma'lumotlar qo'shildi${NC}"
else
    echo -e "${YELLOW}⚠️  Seed xatolik${NC}"
fi

# Success message
echo ""
echo "================================"
echo -e "${GREEN}🎉 Setup muvaffaqiyatli tugadi!${NC}"
echo ""
echo "📝 Keyingi qadamlar:"
echo "1. Server ishga tushirish:"
echo "   npm run dev"
echo ""
echo "2. Browser da ochish:"
echo "   open public/index.html"
echo ""
echo "3. Test accounts:"
echo "   Student: student@edutrack.uz / Student123!"
echo "   Teacher: teacher@edutrack.uz / Teacher123!"
echo "   Admin: admin@edutrack.uz / Admin123!"
echo ""
echo "================================"
