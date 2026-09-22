# GAOIRS - User Guide & Operating Manual
**Geospatial Approach to Optimize Incident Response System with Data Analytics Integration**

Welcome to the **GAOIRS Comprehensive User Guide**. This document provides step-by-step instructions for operating the GAOIRS web application and mobile interface across all user roles: **Citizen / Resident Reporters**, **Response Units (Fire, Police, Medical)**, and **System Administrators**.

---

## 📑 Table of Contents

1. [System Overview & Architecture](#-system-overview--architecture)
2. [Role 1: Resident / Citizen Reporter Guide](#-role-1-resident--citizen-reporter-guide)
   - [Account Registration & Login](#11-account-registration--login)
   - [Submitting an Incident Report](#12-submitting-an-incident-report)
   - [Tracking Incident Progress](#13-tracking-incident-progress)
3. [Role 2: Emergency Response Unit Guide](#-role-2-emergency-response-unit-guide)
   - [Logging In & Managing Shift Status](#21-logging-in--managing-shift-status)
   - [Viewing Assigned Incidents & Live Map](#22-viewing-assigned-incidents--live-map)
   - [Accepting, Responding, and Resolving Incidents](#23-accepting-responding-and-resolving-incidents)
4. [Role 3: Administrator & Officials Guide](#-role-3-administrator--officials-guide)
   - [Real-Time Incident Command Center & Live Heatmaps](#31-real-time-incident-command-center--live-heatmaps)
   - [Incident Verification & Responder Assignment](#32-incident-verification--responder-assignment)
   - [Data Analytics & Trend Visualizations](#33-data-analytics--trend-visualizations)
   - [Exporting Reports (PDF, Excel, CSV)](#34-exporting-reports-pdf-excel-csv)
5. [Incident Lifecycle & Workflow](#-incident-lifecycle--workflow)
6. [Troubleshooting & Support](#-troubleshooting--support)

---

## 🌐 System Overview & Architecture

GAOIRS is an integrated emergency management platform designed for LGUs in the Negros Island Region (NIR). It connects citizens, emergency responders, and LGU administrators in real time using GIS location tracking, PostGIS spatial queries, and live dashboard analytics.

```
+------------------+         +------------------+         +--------------------+
| Citizen Reporter | ------> | System / Admin   | ------> | Emergency Response |
| (Submits Report) |         | (Verifies/Dispatches)|       | Unit (Dispatched)  |
+------------------+         +------------------+         +--------------------+
```

---

## 📱 Role 1: Resident / Citizen Reporter Guide

### 1.1 Account Registration & Login
1. Navigate to the GAOIRS Web Application portal (`/login` or `/register`).
2. Click **Create Account** or log in with your credentials.
3. Once logged in, you will be redirected to the **Citizen Home Portal**.

### 1.2 Submitting an Incident Report
1. On the Citizen Home screen, tap **Report Incident** (or the red **SOS / Emergency Button**).
2. **Select Incident Category**:
   - 🔴 **Fire** (Structure, Brush fire, Electrical)
   - 🟠 **Road Accident** (Vehicular collision, Pedestrian hit)
   - 🟣 **Medical Emergency** (Injury, Sudden illness, Cardiac event)
   - 🔵 **Crime / Security** (Robbery, Disturbance, Assault)
   - ⚪ **Others**
3. **Capture & Confirm GPS Location**:
   - Allow browser/device location access.
   - The map automatically pinpoints your current coordinates and assigns your report to the local Barangay via PostGIS geofencing.
4. **Attach Evidence & Description**:
   - Take or upload a photo of the incident scene.
   - Add a brief note detailing the situation or landmarks nearby.
5. Tap **Submit Report**.

### 1.3 Tracking Incident Progress
1. Go to **My Reports** from the bottom navigation bar.
2. View your submitted reports with live status badges:
   - 🟡 **Reported**: Submitted and awaiting admin/responder confirmation.
   - 🔵 **Verified**: Confirmed by local dispatch.
   - 🟣 **Responding**: Emergency unit is en route to your location.
   - 🟢 **Resolved**: Incident has been safely handled.

---

## 🚒 Role 2: Emergency Response Unit Guide

### 2.1 Logging In & Managing Shift Status
1. Open the Response Unit Portal (`/response/dashboard`).
2. Log in using your assigned unit credentials (e.g., Fire Station Alpha, Police Bravo, Medical Charlie).
3. At the top header, click the **On Shift / Off Shift** toggle button.
   - *Note:* You will only receive real-time incident dispatches when your status is set to **On Shift (Active)**.

### 2.2 Viewing Assigned Incidents & Live Map
1. **Dashboard Tab (`/response/dashboard`)**:
   - View summary metrics: *Total Assigned*, *Pending Acceptance*, *Currently Responding*, and *Resolved Today*.
2. **Live Map Tab (`/response/map`)**:
   - Displays real-time interactive Leaflet markers of all active incidents assigned to your zone.
   - Click any marker to view reporter notes, severity, and photo evidence.

### 2.3 Accepting, Responding, and Resolving Incidents
1. When a new incident is assigned:
   - Click **Accept** on the incident card. The status automatically updates to **RESPONDING**.
2. Click **Get Directions** or view the map coordinates to navigate to the scene.
3. Once the emergency is resolved at the scene:
   - Click **Mark Resolved**.
   - Input optional resolution notes and confirm completion.

---

## 📊 Role 3: Administrator & Officials Guide

### 3.1 Real-Time Incident Command Center & Live Heatmaps
1. Log in to the **Admin Dashboard** (`/admin/dashboard`).
2. **Main Live Map**: View all incident locations, active responders, and Barangay boundaries.
3. **Heatmap Overlay**: Toggle the Heatmap view to analyze spatial density and high-risk hotspot clusters across the municipality.

### 3.2 Incident Verification & Responder Assignment
1. Incoming citizen reports appear in the **Pending Queue**.
2. Review report photos, AI/System priority score, and location coordinates.
3. Click **Verify & Dispatch**.
4. The system automatically recommends the **Nearest Available Response Unit** based on PostGIS `ST_Distance` calculations. Click **Confirm Assignment**.

### 3.3 Data Analytics & Trend Visualizations
1. Navigate to **Analytics** (`/admin/analytics`).
2. Interactively filter incident metrics by:
   - Date range (Daily, Weekly, Monthly, Custom)
   - Barangay ranking & high-incident zones
   - Incident type breakdown (Fire vs. Crime vs. Medical vs. Traffic)
   - Average response time performance metrics

### 3.4 Exporting Reports (PDF, Excel, CSV)
1. Go to **Incident Exports / Reports** (`/admin/exports`).
2. Select desired date filters, incident types, and barangay scopes.
3. Choose format:
   - **Download PDF**: Generates an official print-ready summary report.
   - **Export Excel / CSV**: Downloads full structured tabular data for auditing and LGU records.

---

## 🔄 Incident Lifecycle & Workflow

```
[1. REPORTED]    -->  [2. VERIFIED]    -->  [3. RESPONDING]  -->  [4. RESOLVED]   -->  [5. CLOSED]
Citizen submits       Admin / System       Response unit        Response unit         Admin archives
GPS report & photo    verifies report      accepts & dispatches completes response    and logs incident
```

---

## ❓ Troubleshooting & Support

| Issue | Cause | Solution |
|-------|-------|----------|
| **GPS location accurate error** | Location permissions blocked in browser | Click browser lock icon near URL bar and set **Location** to *Allow*. |
| **No incident dispatch received** | Responder status set to "Off Shift" | Toggle header button to **On Shift** in responder portal. |
| **Export downloaded empty file** | Filters set outside existing date range | Adjust filter dates to include historical incident records. |
| **Photo fails to upload** | File size exceeds limits or poor signal | Ensure photo is under 5MB or retry on standard mobile connection. |

*For system administration & technical support, contact the GAOIRS IT Support Team or refer to system deployment documentation.*
