# 📋 GAOIRS Use Case Scenarios

This document provides detailed scenarios for the core functionalities of the GAOIRS (Geographic-Aware Operational Incident Response System). These scenarios are essential for explaining the system's operational flow during the project defense.

---

## Use Case 1: Incident Reporting (Mobile)
**Goal**: Allow citizens to report emergencies with location and evidence.

| Step | Action | System Response |
| :--- | :--- | :--- |
| 1 | Reporter opens the GAOIRS Mobile App. | Displays the incident reporting dashboard. |
| 2 | Reporter clicks "Report New Incident". | Opens the multi-step report form. |
| 3 | Reporter selects Incident Type (Fire/Medical). | Loads relevant icons and captures GPS location. |
| 4 | Reporter attaches a photo or video evidence. | Previews the media and prepares for upload. |
| 5 | Reporter clicks "Submit". | **Online**: Sends to Cloud immediately.<br>**Offline**: Saves to Local Queue and syncs later. |
| 6 | Reporter views confirmation. | Displays a unique Reference Code (e.g., INC-102). |

---

## Use Case 2: Incident Verification & Dispatch (Admin)
**Goal**: Verify report validity and dispatch the nearest response units.

| Step | Action | System Response |
| :--- | :--- | :--- |
| 1 | Admin logs into the Dashboard. | Shows counts of "Awaiting Verification" reports. |
| 2 | Admin reviews a new report. | Displays incident details, evidence, and map location. |
| 3 | Admin clicks "Verify". | Changes status to **VERIFIED** and searches for nearby units. |
| 4 | Admin selects a Response Unit (e.g., Fire Dept). | Highlights the unit on the map and confirms distance. |
| 5 | Admin clicks "Dispatch". | Sends a real-time **Push Notification** to the unit's device. |

---

## Use Case 3: Incident Response & Resolution (Responder)
**Goal**: Handle the incident and mark it as resolved.

| Step | Action | System Response |
| :--- | :--- | :--- |
| 1 | Responder receives a Push Notification. | Opens the mobile dashboard with incident details. |
| 2 | Responder clicks "Accept Dispatch". | Updates status to **RESPONDING** and starts timer. |
| 3 | Responder uses navigation to reach the scene. | Displays the optimized route via integrated map. |
| 4 | Responder clicks "Mark Resolved". | Prompts for a Post-Incident Report. |
| 5 | Responder submits report details. | Updates status to **RESOLVED** and logs data for analytics. |

---

## Use Case 4: Trend Forecasting (ML Analytics)
**Goal**: Use historical data to predict future incident hotspots.

| Step | Action | System Response |
| :--- | :--- | :--- |
| 1 | Admin navigates to the Analytics tab. | Loads current and historical incident stats. |
| 2 | Admin clicks "Generate Trend Forecast". | System calls the **SARIMA/Prophet ML Service**. |
| 3 | Admin reviews the 7-day prediction chart. | Displays predicted incident spikes and risk areas. |
| 4 | Admin allocates resources proactively. | Logs shift adjustments based on data-driven insights. |
