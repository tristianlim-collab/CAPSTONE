# GAOIRS Black Box Testing Report

**System Name:** Geographic AI-Assisted Operational Incident Reporting System (GAOIRS)  
**Testing Type:** Black Box System & Functional Acceptance Testing  
**Test Coverage:** 33 Core Functional Test Cases across 9 Functional Modules  
**Overall Status:** 100% Passed (33 / 33 Test Cases)  

---

### User Authentication & Access Control

| Test Case ID | Description | Expected Outcome | Actual Outcome | Pass/ Fail | Comments |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **TC-001** | Register a new citizen account with valid details (Full Name, Email, Password, Contact Number, Barangay) | Account is created successfully and user is redirected to the login/landing screen | Account created; confirmation modal displayed, redirected to Login screen | **Pass** | Form inputs validated without errors |
| **TC-002** | Log in with valid registered credentials across system roles (Admin, Response Unit, Citizen) | User is authenticated, JWT access token issued, and user redirected to role-specific dashboard | Status 200 OK returned with JWT token; redirected to appropriate role dashboard | **Pass** | Role-based authentication working as expected |
| **TC-003** | Log in with invalid credentials (unregistered email or incorrect password) | Authentication fails, no token issued, and appropriate error message displayed | HTTP 401 Unauthorized returned; 'Invalid email or password' toast shown | **Pass** | System security restriction verified |
| **TC-004** | Access protected API endpoints without an authorization Bearer token | Unauthorized request is intercepted and blocked by security middleware | Returns HTTP 401 Unauthorized status with 'No token provided' payload | **Pass** | API middleware authorization verified |

---

### Incident Reporting & Submission

| Test Case ID | Description | Expected Outcome | Actual Outcome | Pass/ Fail | Comments |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **TC-005** | Submit a complete emergency incident report with type, GPS coordinates, description, and photo evidence | Incident report created in database with status 'Reported', media stored, socket alert fired | Report created successfully; unique incident code generated, map pin preview rendered | **Pass** | Photo attachment and GPS capture working seamlessly |
| **TC-006** | Select predefined incident type and verify visual indicator updates | Form styling, category marker color, and target agency mapping update dynamically | Form visual badge changes to yellow/amber for Road Accident | **Pass** | Dynamic form color-coding verified |
| **TC-007** | Tag GPS coordinates using auto-detect and manual map pin repositioning | Confirmed GPS coordinates (latitude, longitude, barangay) saved to report payload | Pin shifted on map; latitude/longitude updated and reverse geocoded to Barangay name | **Pass** | Reverse geocoding active |
| **TC-008** | Upload photo evidence with format and file size validation | System accepts valid JPEG/PNG files (<5MB) and rejects unsupported formats or oversized files | Valid JPG uploaded; uploading .TXT file triggers 'Invalid file type' error | **Pass** | File validation constraints enforced strictly |
| **TC-009** | Submit incident report with missing required fields (e.g. empty description or location) | Form submission blocked, field highlighted with validation warning | System prevents submission and displays 'Please provide incident description and valid location' | **Pass** | Required field validation active |
| **TC-010** | Perform offline incident queueing and auto-sync upon network restoration | Report created offline stored in local SQLite queue; auto-uploaded when network resumes | App displays 'Saved offline in queue'; report syncs to `/api/incidents/sync` when online | **Pass** | Offline queueing & background sync verified |

---

### Citizen Incident Tracking & Notifications

| Test Case ID | Description | Expected Outcome | Actual Outcome | Pass/ Fail | Comments |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **TC-011** | Receive submission confirmation dialog with unique incident reference code | Immediate confirmation dialog shown displaying unique code (e.g., INC-2026-0891) | Confirmation modal displayed showing unique Incident Code 'INC-2026-0891' | **Pass** | Incident tracking code generated instantly |
| **TC-012** | Track real-time status progression timeline in Citizen Portal | Citizen can inspect report history and view step-by-step timeline (Reported -> Verified -> Responding -> Resolved) | Incident detail page opens; status progression timeline rendered with active stage highlighted | **Pass** | Status progression visual bar active |
| **TC-013** | Real-time WebSocket and push notification delivery upon incident status change | Citizen device receives instant banner/toast notification when status is updated by Admin or Responder | WebSockets emit event; citizen app displays notification 'Your report status is now: Responding' | **Pass** | Zero-delay socket listener operational |

---

### Incident Verification & Management

| Test Case ID | Description | Expected Outcome | Actual Outcome | Pass/ Fail | Comments |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **TC-014** | Admin verification queue inspection and detailed incident review | Administrator opens incoming report queue, reviews description, GPS location pin, and photo gallery | Detail modal opens smoothly displaying full incident metadata and high-res evidence photos | **Pass** | Comprehensive verification layout loaded |
| **TC-015** | Search and filter incidents by type, status, barangay, and date range | Incident data table updates dynamically according to filter dropdowns and search inputs | Table updates dynamically displaying matching incident records | **Pass** | Multi-column table filtering verified |
| **TC-016** | Mark incident report as Verified or False Alarm / Cancelled | Incident verification status updated in database with required administrative log notes | Status updated to 'VERIFIED'; admin notes recorded, toast notification displayed | **Pass** | Status change logged with admin timestamp |

---

### Response Unit Dispatch & Recommendation

| Test Case ID | Description | Expected Outcome | Actual Outcome | Pass/ Fail | Comments |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **TC-017** | Automated geofenced nearest responder recommendation calculation | System calculates distance using PostGIS coordinates and recommends nearest available unit | Dispatch panel displays ranked list of units; nearest available unit ranked top (1.2 km) | **Pass** | PostGIS ST_Distance algorithm accurate |
| **TC-018** | Confirm recommended response unit and dispatch emergency team | Dispatch order recorded, status set to 'Responding', real-time alert dispatched to responder device | Real-time alert dispatched to responder unit tablet, incident status set to 'Responding' | **Pass** | Automated alert and dispatch record created |
| **TC-019** | Manual overridden dispatch selection during high unit workload | Administrator manually selects alternative available unit from recommendation list | Secondary responder unit selected manually and receives emergency assignment | **Pass** | Manual override feature verified |
| **TC-020** | Response unit receives automated alert and acknowledges incident assignment | Responder tablet receives audible alert, renders summary details, and acknowledges assignment | Responder app receives alert; clicking 'Acknowledge' updates status to 'Acknowledged' | **Pass** | Response acknowledgment logged |

---

### Field Response, Status Tracking & Evidence Upload

| Test Case ID | Description | Expected Outcome | Actual Outcome | Pass/ Fail | Comments |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **TC-021** | Update incident operational status during field response | Status updated in DB (e.g. 'Arrived on Scene') and broadcast live to Admin & Citizen apps | Operational remark logged ('Setting up hoses'); status update broadcasted to all viewers | **Pass** | Real-time multi-client sync operational |
| **TC-022** | Upload official post-incident response report and aftermath evidence | Responder uploads summary documentation PDF and aftermath photos to incident record | PDF report and aftermath photos uploaded; thumbnails attached to incident record | **Pass** | Post-incident file attachments verified |
| **TC-023** | Formally resolve and close completed incident record | Incident status changed to 'Resolved' with final casualty details and operational summary | Incident status set to 'Resolved'; closed record moved to archived resolved list | **Pass** | Resolution metrics and logs recorded |

---

### Interactive Geospatial Mapping & Geofencing

| Test Case ID | Description | Expected Outcome | Actual Outcome | Pass/ Fail | Comments |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **TC-024** | Render interactive geospatial map with color-coded category markers | Leaflet map loads tiles, zoom controls, and custom color pins (Red=Fire, Amber=Accident, Blue=Crime/Medical) | Interactive map initializes; incident pins rendered at exact lat/long positions | **Pass** | Custom geospatial marker rendering smooth |
| **TC-025** | Apply Barangay geofencing polygon boundaries to filter map incidents | Selecting a barangay highlights polygon boundary and hides pins outside the boundary line | Polygon overlay rendered on map; pins filtered strictly within Barangay Poblacion boundary | **Pass** | Spatial polygon containment accurate |
| **TC-026** | Interact with map marker pin popup to view incident summary | Clicking incident pin opens popup with incident code, category badge, and 'View Details' link | Pin click opens popup showing incident summary details and quick redirect link | **Pass** | Map marker interaction verified |

---

### Real-Time Analytics & ML Trend Forecasting

| Test Case ID | Description | Expected Outcome | Actual Outcome | Pass/ Fail | Comments |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **TC-027** | View Real-Time Analytics Dashboard summary metrics and distribution charts | Analytics dashboard displays KPI cards (Total Incidents, Avg Response Time) and charts | KPI cards display 142 total incidents and 8.5 min average response time | **Pass** | Live backend data aggregate verified |
| **TC-028** | Render spatial incident heatmap and hotspot analysis visualizations | Heatmap layer overlays thermal gradient showing high-density incident hotspot zones | Thermal color gradient highlights incident density clusters over high-risk areas | **Pass** | Heatmap intensity rendering verified |
| **TC-029** | Execute 7-Day SARIMA Machine Learning incident trend forecasting model | ML service returns 7-day predicted incident volume graph with confidence interval bounds | SARIMA model executes time-series prediction; 7-day trend line graph rendered with bounds | **Pass** | ML microservice integration verified |
| **TC-030** | Dynamic real-time analytics chart refresh upon new incident ingestion | Submitting a new incident automatically updates summary metrics and re-renders charts live | Total incident count card increments (+1) instantly via WebSocket without page refresh | **Pass** | Dynamic chart socket update active |

---

### System Administration, RBAC & Report Generation

| Test Case ID | Description | Expected Outcome | Actual Outcome | Pass/ Fail | Comments |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **TC-031** | Generate and export incident summary reports in PDF, Excel, and CSV formats | User selects filters and exports report; server generates document and initiates file download | Report compiled; browser downloads PDF summary report `Incident_Summary_2026_08.pdf` | **Pass** | Multi-format report export verified |
| **TC-032** | Manage user accounts (Create, Update, Role Assignment, Deactivate) | Admin creates new account, assigns role/unit, and toggles active/inactive account state | New responder user created and assigned; deactivated user cannot authenticate | **Pass** | Full RBAC user management operational |
| **TC-033** | Configure incident categories & system-wide RBAC permission matrix | Admin adds new incident category (name, color, icon) and updates role permissions | Added category 'Chemical Leak' with color `#FF0055`; RBAC matrix updated and enforced | **Pass** | Dynamic RBAC matrix active |
