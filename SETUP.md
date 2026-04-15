# 🚀 GAOIRS Quick Setup Guide

## Requirements
- Node.js (v18+)
- Supabase Account (We use Supabase for PostgreSQL, PostGIS, and Storage)
- Package Manager: `npm` or `yarn`

---

## 📦 1. Supabase Database Setup 

Since GAOIRS (Negros Island Region) requires PostGIS for spatial analytics and closest responder detections:

1. **Create a project on [Supabase](https://supabase.com/)**
2. **Access the Connection String**: Go to Settings -> Database -> Connection string -> URI.
3. **Enable PostGIS**: Run this in your Supabase SQL Editor:
   ```sql
   create extension if not exists postgis schema extensions;
   -- Important: Make sure the PostGIS extension isn't dropped by mistake
   ```

---

## 🛠️ 2. Environment Configuration

### Backend Setup
Edit `backend/.env`:
```env
# Change this to your Supabase Transaction Pooler / Session string
DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?schema=public"
DIRECT_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

# For Authentication (JWT)
JWT_SECRET="YOUR_SUPER_SECURE_JWT_SECRET"

# For Supabase Storage / Auth client if needed
SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
SUPABASE_KEY="YOUR_SUPABASE_ANON_KEY"
SUPABASE_SERVICE_ROLE_KEY="YOUR_SUPER_SECURE_ROLE_KEY"

# Ports
PORT=5000
```

---

## ⚙️ 3. Backend Setup & Prisma Migration

1. **Install dependencies**:
   ```bash
   cd backend
   npm install
   ```
2. **Setup the Database & Seed data (Negros Island Region target)**:
   ```bash
   npm run db:setup
   ```
3. **Start the backend server**:
   ```bash
   npm run dev
   ```

✅ Done! Server running on http://localhost:5000

---

## 🎨 4. Frontend Setup (React.js + Vite)

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Run Vite development server**:
   ```bash
   npm run dev
   ```

✅ Frontend UI is responsive and will run on http://localhost:5173

---

## 🧪 Quick Test (API & Roles)
We use a role-based access to differentiate Resident app, Response Unit dashboard, and Admin portal.

### Health Check
```bash
curl http://localhost:5000/health
```

### View Data visually
Prisma Studio is available to verify the created seed data points:
```bash
cd backend
npm run prisma:studio
```

---

## ❓ Troubleshooting & Useful Commands

### Commands
```bash
# Generate Prisma Client (if changes are made to schema.prisma)
npm run prisma:generate

# Apply migrations
npm run prisma:migrate

# Reset DB completely (Drop + Remigrate)
npm run db:reset
```

### Issues
- **Extension Error**: If Prisma complains about `postgis` not existing, make sure it's created on the `public` schema or schema is specified if on Supabase.
- **Connection Refused**: Your pooler URL might require IPv4 or IPv6 specific mapping; on Supabase, use the direct string for `DIRECT_URL`.
