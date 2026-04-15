#!/bin/bash

echo "🚀 GAOIRS Backend Setup"
echo "═══════════════════════════════════════"
echo ""

# Check if node_modules exists
if [ ! -d "backend/node_modules" ]; then
  echo "📦 Installing dependencies..."
  cd backend && npm install && cd ..
  echo ""
fi

# Check if .env exists
if [ ! -f "backend/.env" ]; then
  echo "⚙️  Creating .env file..."
  cp backend/.env.example backend/.env
  echo "✅ .env created. Please update DATABASE_URL if needed."
  echo ""
fi

echo "🗄️  Setting up database..."
cd backend

# Generate Prisma Client
echo "1️⃣  Generating Prisma Client..."
npx prisma generate

echo ""
echo "2️⃣  Running database migrations..."
npx prisma migrate dev --name init

echo ""
echo "3️⃣  Seeding database with sample data..."
node prisma/seed.js

echo ""
echo "═══════════════════════════════════════"
echo "✅ Setup complete!"
echo ""
echo "📋 Test Credentials Created:"
echo "   Admin:    admin@gaoirs.com / admin123"
echo "   Reporter: reporter@test.com / reporter123"
echo "   Response: [unit email] / response123"
echo ""
echo "🚀 Start server with: npm run dev"
echo "═══════════════════════════════════════"
