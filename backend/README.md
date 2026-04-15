# GAOIRS Backend API

**Geospatial Approach to Optimize Incident Response System**

RESTful API server for managing incident reports with PostGIS geospatial capabilities.

## Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: PostgreSQL 15+ with PostGIS extension
- **ORM**: Prisma
- **Authentication**: JWT + bcrypt
- **File Storage**: Cloudinary
- **SMS**: Twilio
- **Email**: Nodemailer

## Prerequisites

Before you begin, ensure you have installed:

- Node.js (v18 or higher)
- PostgreSQL (v15 or higher)
- PostGIS extension for PostgreSQL

## Installation

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup PostgreSQL with PostGIS

Connect to your PostgreSQL database and enable PostGIS:

```sql
CREATE DATABASE gaoirs_db;
\c gaoirs_db
CREATE EXTENSION IF NOT EXISTS postgis;
```

### 3. Configure Environment Variables

Copy the example environment file and update with your credentials:

```bash
cp .env.example .env
```

Edit `.env` and configure:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/gaoirs_db?schema=public"
JWT_SECRET="your-secret-key-change-this"
CLOUDINARY_CLOUD_NAME="your-cloudinary-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
# ... other configs
```

### 4. Run Prisma Migrations

Generate Prisma client and run migrations:

```bash
npm run prisma:generate
npm run prisma:migrate
```

This will:
- Create all database tables
- Set up PostGIS geometry columns
- Apply indexes

### 5. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/me` | Get current user | Yes |

### Incidents

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| POST | `/api/incidents` | Create incident | Yes | All |
| GET | `/api/incidents` | Get all incidents (filtered) | Yes | All |
| GET | `/api/incidents/:id` | Get incident by ID | Yes | All |
| PATCH | `/api/incidents/:id/status` | Update incident status | Yes | RESPONSE_UNIT, ADMIN |
| PATCH | `/api/incidents/:id/assign` | Assign to response unit | Yes | ADMIN |

### File Upload

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/upload/incident-photo` | Upload incident photo | Yes |

## Request Examples

### Register User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "REPORTER",
    "phone_number": "+639123456789"
  }'
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Create Incident

```bash
curl -X POST http://localhost:5000/api/incidents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "type": "FIRE",
    "description": "Fire in residential area",
    "latitude": 14.5995,
    "longitude": 120.9842,
    "photo_url": "https://cloudinary.com/..."
  }'
```

### Upload Photo

```bash
curl -X POST http://localhost:5000/api/upload/incident-photo \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "photo=@/path/to/image.jpg"
```

## Database Schema

### Key Tables

- **users** - User accounts (reporters, response units, admins)
- **incidents** - Incident reports with PostGIS location points
- **barangays** - Barangay boundaries as PostGIS polygons
- **response_units** - Response teams with locations
- **alerts** - Multi-channel alert logs
- **incident_status_logs** - Status change history

### PostGIS Columns

- `incidents.location` - POINT geometry for incident coordinates
- `barangays.boundary` - POLYGON geometry for area boundaries
- `response_units.location` - POINT geometry for unit positions

## User Roles

1. **REPORTER** - Submit incidents, view own reports
2. **RESPONSE_UNIT** - View assigned incidents, update status
3. **ADMIN** - Full system access, manage all data

## Incident Status Flow

```
REPORTED → VERIFIED → RESPONDING → RESOLVED → CLOSED
```

## Incident Types

- FIRE (human-caused)
- ACCIDENT
- MEDICAL
- CRIME_RELATED
- OTHER

## Development Tools

### View Database with Prisma Studio

```bash
npm run prisma:studio
```

Opens at `http://localhost:5555`

### Check API Health

```bash
curl http://localhost:5000/health
```

## Project Structure

```
backend/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Auth, validation middleware
│   ├── routes/         # API routes
│   ├── utils/          # Helper functions
│   └── index.js        # Server entry point
├── prisma/
│   └── schema.prisma   # Database schema
├── .env.example        # Environment template
├── package.json
└── README.md
```

## Next Steps

After backend setup:

1. Test all API endpoints using Postman/Insomnia
2. Create seed data (barangays, response units)
3. Build frontend React app
4. Implement Socket.io for real-time updates
5. Add SMS/Email alert functionality

## Team

- **Rubelyn** - Project Manager
- **Justine** - System Analyst
- **Tristan** - Programmer

---

**GAOIRS Team © 2026**
