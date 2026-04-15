# GAOIRS - Geospatial Approach to Optimize Incident Response System with Data Analytics Integration

**Web-based Incident Management System for Philippine LGUs (Negros Island Region)**

Focus: Human-induced incidents (fires, road accidents, medical, crime, others). Natural disasters are out of scope.

---

## 📋 Project Info

- **Scope:** Negros Island Region (NIR)
- **Objective:** Streamline incident reporting, verification, and dispatch via geospatial technology and data analytics.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React.js + Vite + Tailwind CSS |
| **Maps** | Leaflet.js + react-leaflet + leaflet.heat |
| **Charts/Data** | Recharts |
| **Real-time** | Socket.io + Socket.io-client |
| **Backend** | Node.js + Express.js |
| **Auth** | JWT + bcryptjs + Supabase Auth / Google OAuth |
| **ORM** | @prisma/client |
| **Database** | Supabase (PostgreSQL + PostGIS) |
| **Storage** | Supabase Storage |
| **SMS/Email** | Semaphore PH (or Vonage) / Nodemailer |
| **HTTP Client** | Axios |
| **Icons** | lucide-react |
| **Export** | jsPDF + jspdf-autotable (PDF) + SheetJS/xlsx (Excel) |

---

## 👥 User Roles

### 1. RESIDENT / COMMUNITY REPORTER (Mobile-Responsive Web)
- Login options: Google OAuth, Create Account
- Submit incident via GPS with auto-captured coordinates & photo evidence
- Specify incident type and context
- Live tracking timeline of submitted reports

### 2. RESPONSE UNIT (Web Dashboard - Desktop/Tablet)
- Shift start/end screen
- Nearest responder location tracking via WebSocket
- View assigned incidents & start notifications
- Accept/Reject assignments & Update status
- Live map view with color-coded severity markers

### 3. ADMINISTRATOR / OFFICIALS (Web Dashboard - Desktop)
- Monitor all real-time dashboards & analytics
- Heatmap overlay & geofence overlay (Barangays)
- User, response unit, and workflow management
- Generate reports in PDF, Excel, and CSV

---

## 📂 Project Structure

```
CAPSTONE/
├── backend/                # Node.js + Express API + Socket.io
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Auth & validation
│   │   ├── config/        # Database & env config
│   │   └── utils/         # Helpers
│   ├── prisma/
│   │   ├── schema.prisma  # Database schema (PostGIS integrated)
│   │   └── seed.js        # Data seed (NIR targeted)
│   ├── .env               # Environment variables
│   └── package.json
│
├── frontend/              # React.js + Vite Frontend
│   ├── src/
│   │   ├── components/    # Reusable UI parts & Maps
│   │   ├── pages/         # Dashboard, Incident Reporter, Maps
│   │   ├── api/           # Axios config
│   │   ├── context/       # Auth and Global State
│   │   └── utils/         # Helpers
│   ├── tailwind.config.js # Theming
│   └── package.json
│
├── SETUP.md              # Setup guide
└── README.md             # This file
```

---

## 🚀 Quick Start

See **[SETUP.md](./SETUP.md)** for detailed environment setup.

### Backend Setup:
```bash
cd backend
npm install
# Ensure .env connects to your Supabase PostgreSQL instance
npm run db:setup
npm run dev
```

### Frontend Setup:
```bash
cd frontend
npm install
npm run dev
```

---

## 🗺️ Key Features

### Module 1: Incident Reporting
- GPS-based submission w/ auto-captured coordinates via Geolocation API.
- Photo evidence uploaded to Supabase Storage.
- Geofencing via PostGIS auto-assigns reports to the right barangay/zone.

### Module 2: Incident Response
- Nearest Responder Detection (PostGIS `ST_Distance`).
- Automated alerts (Sockets, Emails, SMS).
- Live location tracking for response units.

### Module 3: Monitoring and Analysis
- Real-time Recharts visualizations (trends, response times, breakdowns).
- Interactive Leaflet maps + Hotspot analysis plugins.
- Export to Excel (`.xlsx`) and `.pdf`.

---

## 🎯 Incident Types & Severities

**Types:** Fire, Road Accidents, Crime, Medical, Others
**Severity Colors:**
- Critical = Red 🔴
- High = Orange 🟠
- Medium = Yellow 🟡
- Low = Blue 🔵

## 📊 Incident Status Flow

```
REPORTED → VERIFIED → RESPONDING → RESOLVED → CLOSED
```

---

## 🗄️ Supabase Tables Architecture

- **users**: Accounts (admin/responder/resident) + RBAC details.
- **incidents**: Main incident records (`type, description, photo_url, coordinates [PostGIS POINT], status, barangay_id, reporter_id`).
- **incident_updates**: Log of text/status changes.
- **barangays**: Geospatial boundaries (`name, boundary [PostGIS POLYGON]`).
- **response_units**: Responders mapping (`name, type, location [PostGIS POINT], status`).
- **assignments**: Mapping logic linking incidents to units (`assigned_at, responded_at`).
- **notifications**: Alerts dispatched to users/responders.
- **analytics_cache**: Pre-computed metrics for heavy Recharts payloads.

### Phase 1: Backend (DONE ✅)
- Database schema
- API endpoints
- Authentication
- PostGIS integration

### Phase 2: Frontend - Reporter (CURRENT)
- Login/Register pages
- Incident form
- Map integration
- Photo upload
- View incidents

### Phase 3: Real-time Features
- Socket.io setup
- Live updates
- Notifications

### Phase 4: Dashboards
- Response Unit dashboard
- Admin dashboard
- Analytics

### Phase 5: Advanced Features
- SMS/Email alerts
- Report generation
- Heatmaps

---

## 🧪 Testing

```bash
# Test API health
curl http://localhost:5000/health

# View database
cd backend && npm run prisma:studio
```

---

## 📝 License

MIT - GAOIRS Team © 2026

---

**Ready to build the frontend? Let's go! 🚀**
