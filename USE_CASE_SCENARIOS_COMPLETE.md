# GAOIRS (Geospatial Approach to Optimize Incident Response System)
## Complete Use Case Scenarios Documentation

---

## Table of Contents
1. [Use Case 1: Citizen Reports Emergency Incident](#use-case-1-citizen-reports-emergency-incident)
2. [Use Case 2: System Routes Incident to Response Unit](#use-case-2-system-routes-incident-to-response-unit)
3. [Use Case 3: Response Unit Manages Incident Response](#use-case-3-response-unit-manages-incident-response)
4. [Use Case 4: Response Unit Submits Post-Incident Report](#use-case-4-response-unit-submits-post-incident-report)
5. [Use Case 5: Admin Reviews & Approves Post-Incident Reports](#use-case-5-admin-reviews--approves-post-incident-reports)
6. [Use Case 6: Admin Views Real-Time Incident Analytics](#use-case-6-admin-views-real-time-incident-analytics)
7. [Use Case 7: Admin Manages LGU Configuration](#use-case-7-admin-manages-lgu-configuration)
8. [Use Case 8: Admin Monitors Audit Logs for Compliance](#use-case-8-admin-monitors-audit-logs-for-compliance)

---

## Use Case 1: Citizen Reports Emergency Incident

**Use Case ID:** UC-001
**Use Case Title:** Citizen Reports Emergency Incident
**Version:** 1.0
**Date Created:** June 2, 2026

### Use Case Goal
To allow citizens to quickly report emergency incidents with photographic evidence and accurate geolocation information through the mobile application, ensuring rapid dispatch of appropriate emergency response units.

### Actors
- **Primary Actor:** Citizen/Field Reporter
- **Secondary Actors:** GAOIRS Mobile Application, Backend System, GPS/Location Services

### Pre-conditions
- Citizen has downloaded and installed the GAOIRS Reporter Mobile App
- Citizen has registered an account with valid email and password
- Citizen's mobile device has internet connectivity (WiFi or mobile data)
- Citizen's mobile device has location services enabled
- Citizen has granted permissions: GPS access, camera access, storage access

### Main Flow

| Step | Actor | Action |
|------|-------|--------|
| 1 | Citizen | Opens the GAOIRS Reporter Mobile App and logs in with valid credentials |
| 2 | Mobile App | Displays authenticated user dashboard with action cards (Report Incident, View Reports) |
| 3 | Citizen | Taps "Report Incident" button to initiate incident creation |
| 4 | Mobile App | Opens incident reporting form with step-by-step wizard |
| 5 | Citizen | **Step 1 - Photo Evidence**: Opens camera and captures up to 5 photos of the emergency incident scene |
| 6 | Mobile App | Displays photo previews in grid with removal option |
| 7 | Citizen | **Step 2 - Location**: Confirms or adjusts current GPS location on map interface |
| 8 | Mobile App | Performs reverse geocoding to extract Barangay and City information |
| 9 | Citizen | **Step 3 - Incident Type**: Selects incident type from predefined options (Fire, Medical, Accident, Crime, Infrastructure Damage, Other) |
| 10 | Mobile App | Displays color-coded incident type badge (red for Fire, blue for Medical, etc.) |
| 11 | Citizen | **Step 4 - Description**: Enters detailed incident description (max 500 characters) including what happened, estimated number of people affected |
| 12 | Citizen | **Step 5 - Severity**: Selects incident severity level (LOW, MEDIUM, HIGH, CRITICAL) |
| 13 | Citizen | **Step 6 - Personal Information**: Enters reporter name, phone number, and email |
| 14 | Mobile App | Validates all required fields are completed |
| 15 | Citizen | Reviews all entered information and clicks "Submit Incident Report" |
| 16 | Mobile App | Displays loading indicator while submitting to backend |

### System Response

| Step | System Component | Response |
|------|------------------|----------|
| 1 | Mobile App | Routes citizen to login screen if not authenticated |
| 2 | Mobile App | Retrieves and displays user dashboard |
| 3-4 | Mobile App | Initializes incident form with camera and location permissions check |
| 5-8 | Mobile App + GPS Service | Captures photos, stores them temporarily; requests GPS coordinates; reverse geocodes location |
| 9 | Backend API | Fetches incident types from database with color coding |
| 11 | Mobile App | Validates text input in real-time (character count, required fields) |
| 14 | Mobile App | Enforces validation: all fields required, photos required, valid GPS location required |
| 16 | Mobile App → Backend | Transmits incident data (including base64-encoded images) to `/api/incidents/create` endpoint |
| 17 | Backend API | Receives incident submission and validates payload structure |
| 18 | Backend API | Stores incident record in PostgreSQL database with timestamp and GPS coordinates |
| 19 | Backend API | Uploads evidence photos to Cloudinary and links image URLs to incident record |
| 20 | Backend API | Performs smart incident assignment: analyzes incident type and selects appropriate response units based on geographic proximity and unit availability |
| 21 | Backend API | Creates incident notification records for assigned response units |
| 22 | Socket.io Service | Broadcasts real-time `new_incident` event to all connected admin dashboards and response unit tablets with full incident details |
| 23 | Firebase Cloud Messaging | Sends push notifications to assigned response units' devices with incident summary and location link |
| 24 | Mobile App | Displays "Incident Successfully Reported" success screen with incident ID and next steps |
| 25 | Mobile App | Automatically navigates citizen to "My Reports" screen after 3-second delay |

### Alternative Flows

#### Alternative Flow 1: Network Connectivity Loss
- **Condition:** Network connection is lost during incident submission
- **Steps:**
  - System detects network timeout after 30 seconds
  - Mobile App displays error message: "Network unavailable. Your report has been saved locally and will be submitted when connection is restored"
  - Incident data is stored in local SQLite database (Offline Incident Queue)
  - Mobile App shows notification badge indicating pending offline reports
  - When connectivity is restored, Mobile App automatically retransmits queued incidents to backend
  - System processes late submissions with same workflow as live submissions

#### Alternative Flow 2: Invalid or Missing GPS Location
- **Condition:** GPS signal is weak or unavailable
- **Steps:**
  - Mobile App prompts citizen: "Unable to obtain GPS location. Please enable location services or move to an open area."
  - Citizen has option to manually enter location by dropping pin on map or typing address
  - System performs geocoding on manual address entry to obtain coordinates
  - Incident proceeds with citizen-provided location coordinates
  - Backend marks incident with `location_verified=false` for admin review

#### Alternative Flow 3: Camera Permission Denied
- **Condition:** User denies camera permission
- **Steps:**
  - Mobile App allows proceeding without photos but displays warning
  - Form displays: "Photos help response units prepare better. Proceed without photos?"
  - User can continue to submission or retry camera permission request
  - Backend accepts incident with or without evidence photos

### User Action
Citizen completes incident report form with photos, location, type, description, severity, and personal information, then submits.

### System Response
System validates submission, stores incident in database with GPS coordinates, uploads evidence photos to cloud storage, performs intelligent incident assignment to response units based on incident type and location, broadcasts real-time notification via Socket.io and Firebase Cloud Messaging, and displays success confirmation to citizen.

### Postconditions
- Incident record created in GAOIRS database with status = `NEW`
- Incident notification created and delivered to assigned response units
- Incident visible on admin dashboard map in real-time
- Response units receive push notification with incident details
- Citizen can track incident status in "My Reports" screen

---

## Use Case 2: System Routes Incident to Response Unit

**Use Case ID:** UC-002
**Use Case Title:** System Routes Incident to Appropriate Response Unit
**Version:** 1.0
**Date Created:** June 2, 2026

### Use Case Goal
To ensure that reported incidents are automatically routed to the most appropriate and available response units based on incident type, severity, location, and unit capacity, minimizing response time.

### Actors
- **Primary Actor:** GAOIRS Backend System (Automated)
- **Secondary Actors:** Database, PostGIS Geographic Database, Response Unit Management System

### Pre-conditions
- Incident has been successfully created in the database by citizen
- Response units are registered and configured in the system
- LGU jurisdictions and geographic boundaries are defined in PostGIS database
- Response units have status information (available, busy, offline)
- Incident types have configured response unit assignments

### Main Flow

| Step | System Component | Action |
|------|------------------|--------|
| 1 | Backend API | Receives new incident and validates incident data |
| 2 | Backend API | Extracts incident attributes: type, severity, location (GPS), jurisdiction |
| 3 | Incident Assignment Engine | Retrieves incident type configuration rules from database |
| 4 | Incident Assignment Engine | Identifies primary response unit type(s) required: |
| | | - Fire incidents → FIRE response units |
| | | - Medical/Accident → DRRMO (Disaster Risk Reduction Management Office) units |
| | | - Crime/Public Disturbance → POLICE units |
| | | - Infrastructure Damage → DRRMO units |
| 5 | PostGIS Database | Queries response units within incident jurisdiction and geographic proximity |
| 6 | Incident Assignment Engine | Filters units by: (a) Correct unit type, (b) Status = AVAILABLE, (c) Current workload below severity limit |
| 7 | Incident Assignment Engine | Severity-based capacity constraints: |
| | | - CRITICAL incidents: Max 5 concurrent assignments per unit |
| | | - HIGH incidents: Max 3 concurrent assignments per unit |
| | | - LOW incidents: Max 1 concurrent assignment per unit |
| 8 | PostGIS Distance Calculation | Calculates geographic distance from each available unit to incident location using PostGIS ST_Distance function |
| 9 | Incident Assignment Engine | Sorts units by distance (nearest first) and selects primary unit with lowest distance and available capacity |
| 10 | Incident Assignment Engine | Creates incident assignment record linking incident to response unit with timestamp |
| 11 | Database | Updates incident status to `AWAITING_RESPONSE` |
| 12 | Notification Service | Creates notification record for assigned response unit with status = `PENDING` |

### System Response

| Step | System Component | Response |
|------|------------------|----------|
| 13 | Socket.io Service | Broadcasts `incident_assigned` event to response unit's dashboard tab with full incident details |
| 14 | Socket.io Service | Broadcasts `incident_awaiting_verification` event to admin dashboard for incident verification queue |
| 15 | Firebase Cloud Messaging Service | Sends push notification to response unit's device: "New [TYPE] incident at [LOCATION] - Severity: [LEVEL]" with action buttons (Accept/Decline) |
| 16 | Notification Service | Logs notification delivery timestamp in notification_history table |
| 17 | Backend API | Returns assignment confirmation to frontend with 200 OK status |
| 18 | Admin Dashboard | Displays incident on incident verification queue (awaiting human verification before full dispatch) |
| 19 | Response Unit Tablet | Displays incident alert with audible/vibration notification |

### Decision Tree

```
INCIDENT RECEIVED
    ↓
Extract Type & Location
    ↓
Determine Required Unit Type(s)
    ↓
Query Available Units in Jurisdiction
    ↓
Apply Severity Capacity Filters
    ├─ CRITICAL: Units with <5 assignments
    ├─ HIGH: Units with <3 assignments
    └─ LOW: Units with <1 assignment
    ↓
Calculate Distance to Each Unit (PostGIS)
    ↓
Select Nearest Available Unit
    ↓
Create Assignment & Notification
    ↓
Broadcast Socket.io & FCM Events
```

### Alternative Flows

#### Alternative Flow 1: No Available Units of Required Type
- **Condition:** No response units of the required type are available in the jurisdiction
- **Steps:**
  - System flags incident as `UNASSIGNED` in database
  - System sends alert notification to all admins: "No available units for [TYPE] incident"
  - Admin can manually assign different unit type or escalate across jurisdictions
  - System monitors for unit availability and auto-assigns when unit becomes available

#### Alternative Flow 2: Multi-Unit Assignment (High Severity)
- **Condition:** Incident severity is CRITICAL and exceeds single unit capacity
- **Steps:**
  - System identifies need for multiple response units
  - System selects 2-3 nearest available units of primary type
  - System creates assignment records for all selected units
  - All units receive notification with coordinated incident details
  - Incident marked as `MULTI_UNIT_RESPONSE`

#### Alternative Flow 3: Cross-Jurisdiction Assignment
- **Condition:** No units available in incident jurisdiction
- **Steps:**
  - System expands geographic search to neighboring jurisdictions
  - System calculates extended response time
  - System prioritizes units from nearest adjacent jurisdiction
  - System logs cross-jurisdiction assignment for admin review
  - Admin receives notification of cross-jurisdiction dispatch

### Postconditions
- Incident assigned to one or more response units
- Response unit(s) receive real-time notification via Socket.io and push notification
- Incident visible on response unit dashboard with full details, location map, and evidence photos
- Incident status updated to `AWAITING_RESPONSE`
- Assignment audit trail recorded

---

## Use Case 3: Response Unit Manages Incident Response

**Use Case ID:** UC-003
**Use Case Title:** Response Unit Manages Incident Response
**Version:** 1.0
**Date Created:** June 2, 2026

### Use Case Goal
To enable response units to view assigned incidents, track incident details, update incident status in real-time, and coordinate response activities through a comprehensive dashboard interface.

### Actors
- **Primary Actor:** Response Unit Personnel (Officer, Team Lead, Dispatcher)
- **Secondary Actors:** Response Unit Dashboard (Web), Backend System, Socket.io Service, GPS Service

### Pre-conditions
- Response unit personnel have registered accounts and are authenticated
- Response unit has been assigned to one or more incidents
- Response unit tablet/computer has internet connectivity
- Response unit has location services enabled for GPS tracking

### Main Flow

| Step | Actor | Action |
|------|-------|--------|
| 1 | Response Unit Officer | Logs into Response Unit Dashboard with credentials |
| 2 | Dashboard | Displays Response Unit Dashboard with: (a) Assigned incidents queue, (b) Real-time map view, (c) Unit status indicator |
| 3 | Response Unit Officer | Views incident list showing: incident ID, type (color-coded), location, severity, distance to unit, time since report |
| 4 | Response Unit Officer | Clicks on an incident to open detailed modal view with: |
| | | - Incident location on Leaflet map with marker pin |
| | | - Incident description and reporter information |
| | | - Photographic evidence gallery (scrollable) |
| | | - Assigned units list |
| | | - Current incident status |
| | | - Status update buttons |
| 5 | Response Unit Officer | Verifies incident legitimacy based on description and evidence photos |
| 6 | Response Unit Officer | Accepts incident by clicking "Accept Assignment" button |
| 7 | Dashboard | Displays loading state and transmits status update to backend |
| 8 | Response Unit Officer | Navigates unit to incident location using integrated map navigation |
| 9 | Response Unit Officer | Arrives at incident location |
| 10 | Response Unit Officer | Updates incident status to "IN_PROGRESS" by clicking status button |
| 11 | Response Unit Officer | Documents response actions in notes field: injuries treated, property damage extent, etc. |
| 12 | Response Unit Officer | During incident management: periodically updates status with real-time location tracking via GPS |
| 13 | Response Unit Officer | Once incident is controlled/resolved: updates status to "UNDER_CONTROL" or "RESOLVED" |
| 14 | Response Unit Officer | Marks incident as "RESOLVED" when complete |
| 15 | Dashboard | Button to proceed to post-incident report becomes visible |

### System Response

| Step | System Component | Response |
|------|------------------|----------|
| 1 | Authentication Service | Validates credentials and returns JWT token |
| 2 | Backend API | Fetches assigned incidents from database, queries incident details with PostGIS location data |
| 3 | Dashboard | Calculates distance from unit to each incident using GPS coordinates |
| 4 | Backend API | Retrieves incident photos from Cloudinary and loads into modal gallery |
| 5 | Dashboard | Displays incident details with evidence photos for verification |
| 6 | Backend API | Receives accept action via POST `/api/incidents/:id/accept` |
| 7 | Backend API | Updates incident status to `ACCEPTED` with timestamp |
| 8-9 | Socket.io Service | Broadcasts incident status update: `incident_status_updated` to admin dashboard and other units |
| 8-9 | Admin Dashboard | Updates incident status display in real-time for map and incident list |
| 10 | Backend API | Receives status update via PATCH `/api/incidents/:id/status` with new status "IN_PROGRESS" |
| 11 | Backend API | Updates incident record with new status and timestamp |
| 12 | Socket.io Service | Broadcasts incident status update with response unit location to dashboard |
| 13 | GPS Service | Receives periodic location updates from response unit device |
| 14 | Backend API | Stores location history in incident records |
| 15 | Admin Dashboard | Displays live unit location on incident map with real-time tracking line |
| 16 | Backend API | Receives final status update (RESOLVED) via PATCH endpoint |
| 17 | Backend API | Updates incident final status and closes incident |
| 18 | Database | Records incident resolution timestamp |
| 19 | Socket.io Service | Broadcasts incident completion event: `incident_resolved` to admin |
| 20 | Admin Dashboard | Removes incident from active incidents list; moves to completed incidents |
| 21 | Response Unit Dashboard | Displays success message and button to proceed to post-incident report |

### Status Lifecycle Flow

```
NEW (Initial)
    ↓
AWAITING_RESPONSE (System assigned)
    ↓
ACCEPTED (Unit accepted)
    ↓
IN_PROGRESS (Unit responding/at scene)
    ↓
UNDER_CONTROL (Initial control established)
    ↓
RESOLVED (Incident completed)
    ↓
AWAITING_POST_REPORT (Report pending)
```

### Alternative Flows

#### Alternative Flow 1: Incident Declined by Unit
- **Condition:** Response unit declines assignment due to unavailability
- **Steps:**
  - Officer clicks "Decline Assignment" button
  - System receives status update to `DECLINED`
  - Assignment removed from unit's incident queue
  - System automatically re-routes incident to next nearest available unit
  - Declined unit recorded in incident audit trail

#### Alternative Flow 2: Extended Response Time
- **Condition:** Unit encounters unexpected delays (traffic, hazard conditions)
- **Steps:**
  - Officer can update incident status to "DELAYED" with reason noted
  - System sends notification to admin about response delay
  - Admin can escalate and assign additional units if needed
  - System tracks response time deviation for performance analytics

#### Alternative Flow 3: Unit Goes Offline
- **Condition:** Response unit loses internet connectivity mid-response
- **Steps:**
  - Dashboard detects connection loss and displays offline indicator
  - Last known GPS location is cached on unit device
  - Incident status changes remain in offline queue
  - When connectivity restored, offline updates are synced to backend
  - Backend processes sync with conflict resolution (last-write-wins)

### Postconditions
- Incident status updated through complete lifecycle
- Real-time notifications sent to admin and other units
- GPS location history recorded for all response activities
- Response actions documented in incident record
- Incident marked ready for post-incident report submission

---

## Use Case 4: Response Unit Submits Post-Incident Report

**Use Case ID:** UC-004
**Use Case Title:** Response Unit Submits Post-Incident Report
**Version:** 1.0
**Date Created:** June 2, 2026

### Use Case Goal
To allow response units to formally document incident outcomes, including actions taken, casualty information, property damage assessment, and financial impact, creating an official record for audit and analysis purposes.

### Actors
- **Primary Actor:** Response Unit Officer/Team Lead
- **Secondary Actors:** Response Unit Dashboard, Backend System, Database

### Pre-conditions
- Incident status is `RESOLVED`
- Response unit has at least one user with Report Submission permissions
- Incident has been completed and all response activities documented
- User has access to Response Unit Dashboard

### Main Flow

| Step | Actor | Action |
|------|-------|--------|
| 1 | Response Unit Officer | Views completed incident in dashboard |
| 2 | Response Unit Officer | Clicks "Submit Post-Incident Report" button |
| 3 | Dashboard | Opens post-incident report form modal with sections for: |
| | | - **Incident Summary**: Auto-populated incident type, location, time, duration |
| | | - **Actions Taken**: Textarea for detailed response actions |
| | | - **Casualties & Injuries**: Input fields for deceased, injured, missing persons |
| | | - **Property Damage Assessment**: Category checkboxes (residential, commercial, vehicles, infrastructure) and damage extent (minor/moderate/severe) |
| | | - **Response Cost**: Financial impact estimate (labor hours, equipment used, fuel) |
| | | - **Additional Notes**: Optional notes field for context |
| | | - **Attachments**: Additional photo upload capability |
| 4 | Response Unit Officer | Reviews pre-populated incident summary for accuracy |
| 5 | Response Unit Officer | Describes detailed response actions taken: "Fire suppression on 2nd floor, evacuation of 15 residents, first aid provided to 3 injured" |
| 6 | Response Unit Officer | Enters casualty numbers: 0 deceased, 3 injured, 0 missing |
| 7 | Response Unit Officer | Selects property damage categories: Residential & Commercial |
| 8 | Response Unit Officer | Rates damage extent: "Severe" (structural damage) |
| 9 | Response Unit Officer | Estimates response cost: 8 labor hours, 1 vehicle, equipment usage |
| 10 | Response Unit Officer | Adds optional notes: "Coordinated with municipal fire bureau, follow-up structural assessment recommended" |
| 11 | Response Unit Officer | Optionally uploads additional evidence photos of incident aftermath |
| 12 | Response Unit Officer | Reviews complete report and clicks "Submit Report" |
| 13 | Dashboard | Validates all required fields are completed |
| 14 | Dashboard | Displays confirmation dialog: "This action cannot be undone. Confirm submission?" |
| 15 | Response Unit Officer | Confirms submission |

### System Response

| Step | System Component | Response |
|------|------------------|----------|
| 16 | Backend API | Receives POST request to `/api/incidents/:id/submit-report` with complete report data |
| 17 | Backend API | Validates report structure and required fields |
| 18 | Database | Creates PostIncidentReport record with all submitted data |
| 19 | Database | Links report to incident and response unit |
| 20 | Database | Records submission timestamp and submitting user |
| 21 | Database | Sets report status to `PENDING` (awaiting admin review) |
| 22 | Audit Logger | Logs report submission in audit trail: {action: "REPORT_SUBMITTED", user: officer_id, incident_id, timestamp} |
| 23 | Notification Service | Creates notification for admin: "New post-incident report awaiting review" |
| 24 | Socket.io Service | Broadcasts `report_submitted` event to admin dashboards |
| 25 | Email Service | Sends email notification to LGU admin with report link |
| 26 | Dashboard | Displays success message: "Report submitted successfully. Your report ID: [ID]" |
| 27 | Dashboard | Removes incident from response unit's active list; archives to "Completed Incidents" |
| 28 | Dashboard | Updates response unit's report submission count for performance tracking |

### Report Status Workflow

```
PENDING (Initial submission)
    ↓
UNDER_REVIEW (Admin reviewing)
    ↓
APPROVED (Admin approved)
    or
    ↓
REJECTED (Admin rejected, requires resubmission)
    ↓
[Sent back to officer for revision]
```

### Alternative Flows

#### Alternative Flow 1: Report Validation Error
- **Condition:** Required field is empty or invalid
- **Steps:**
  - System returns validation error message highlighting missing fields
  - Form is not submitted
  - Officer corrects errors and retries submission

#### Alternative Flow 2: Duplicate Report Prevention
- **Condition:** Officer attempts to submit report for same incident twice
- **Steps:**
  - System detects existing pending report for incident
  - System displays error: "A report for this incident has already been submitted and is pending review"
  - Officer is directed to view existing report

#### Alternative Flow 3: Report Revision Required
- **Condition:** Admin rejects report and requests revisions
- **Steps:**
  - System sends notification to officer: "Your post-incident report has been rejected. See comments from admin."
  - Officer can access original report with admin comments
  - Officer makes requested revisions and resubmits
  - Status reverts to PENDING for re-review
  - Revision history is maintained in audit trail

### Postconditions
- Post-incident report created in database with status = `PENDING`
- Report linked to incident and response unit
- Admin notification sent for review queue
- Response unit dashboard updated showing submission confirmation
- Audit trail logged for compliance
- Incident marked as requiring post-report review

---

## Use Case 5: Admin Reviews & Approves Post-Incident Reports

**Use Case ID:** UC-005
**Use Case Title:** Admin Reviews & Approves Post-Incident Reports
**Version:** 1.0
**Date Created:** June 2, 2026

### Use Case Goal
To provide administrators with a comprehensive report review interface enabling verification of response unit submissions, addition of administrative notes, and official approval or rejection of post-incident reports with full audit trail.

### Actors
- **Primary Actor:** LGU Administrator
- **Secondary Actors:** Admin Dashboard, Backend System, Database

### Pre-conditions
- Post-incident report has been submitted by response unit and status = `PENDING`
- Administrator has "Approve Reports" permission
- Administrator is logged into Admin Dashboard

### Main Flow

| Step | Actor | Action |
|------|-------|--------|
| 1 | Administrator | Navigates to "Post-Incident Reports" page in Admin Dashboard |
| 2 | Dashboard | Displays list of pending reports with columns: incident ID, incident type, location, unit, report date, status |
| 3 | Administrator | Clicks on a report to open detailed review modal |
| 4 | Modal | Displays complete report including: |
| | | - Incident information (auto-populated): type, location, time, severity |
| | | - Response actions detailed by unit |
| | | - Casualty information: deceased, injured, missing persons |
| | | - Property damage assessment with photos of damage |
| | | - Financial impact estimate |
| | | - Submitted by: unit name, officer name, submission timestamp |
| | | - Current status badge: "PENDING" |
| 5 | Administrator | Reviews all report data and evidence photos |
| 6 | Administrator | Uses filter checkboxes to filter report list by: |
| | | - Status (PENDING, APPROVED, REJECTED, UNDER_REVIEW) |
| | | - Date range |
| | | - Search by incident code or unit name |
| 7 | Administrator | Adds administrative notes in "Admin Comments" textarea: "Report details verified against incident photos. Casualty count confirmed. Approved for records." |
| 8 | Administrator | Selects final status from dropdown: "APPROVED" |
| 9 | Administrator | Clicks "Save & Update Status" button |
| 10 | Dashboard | Displays confirmation message: "Report status updated to APPROVED" |

### System Response

| Step | System Component | Response |
|------|------------------|----------|
| 11 | Backend API | Receives PATCH request to `/api/post-reports/:id` with new status and admin comments |
| 12 | Backend API | Authenticates administrator and validates permission level |
| 13 | Backend API | Validates new status is valid (APPROVED, REJECTED, UNDER_REVIEW) |
| 14 | Database | Updates PostIncidentReport record with: status, admin_notes, reviewed_by, reviewed_timestamp |
| 15 | Audit Logger | Logs approval action: {action: "REPORT_APPROVED", admin: admin_id, report_id, timestamp, comments_summary} |
| 16 | Notification Service | Creates notification for response unit: "Your post-incident report has been APPROVED" |
| 17 | Socket.io Service | Broadcasts `report_approved` event to response unit dashboard |
| 18 | Email Service | Sends approval confirmation email to submitting officer with admin comments |
| 19 | Dashboard | Updates report list: report moves from PENDING column to APPROVED column |
| 20 | Dashboard | Statistics dashboard incremented: "Reports Approved: +1" |
| 21 | Analytics Service | Report added to historical analytics for incident trend analysis |

### Report Review Checklist

```
Admin Review Criteria:
☐ Incident details match actual incident
☐ Casualty figures are reasonable and documented
☐ Property damage assessment matches incident photos
☐ Response actions appropriately documented
☐ Financial cost estimate is reasonable
☐ No contradictions in submitted data
☐ All required fields completed
```

### Alternative Flows

#### Alternative Flow 1: Report Rejected with Required Revisions
- **Condition:** Admin identifies inconsistencies or incomplete information
- **Steps:**
  - Admin selects status = "REJECTED"
  - Admin writes detailed comments explaining issues: "Casualty count discrepancy. Field photos show 2 injuries but report lists 3. Please clarify and resubmit."
  - Admin clicks "Save & Reject"
  - System sends notification to response unit with rejection reason
  - Report status reverts to editable state for officer revision
  - Officer corrects report and resubmits
  - Admin receives notification for re-review

#### Alternative Flow 2: Report Marked for Further Review
- **Condition:** Admin needs more information before final decision
- **Steps:**
  - Admin selects status = "UNDER_REVIEW"
  - Admin writes questions/requests in comments: "Need clarification on equipment used. Please provide itemized list."
  - System sends inquiry to response unit
  - Unit has 48-hour window to respond
  - Report marked as "AWAITING_RESPONSE" on both admin and unit dashboards
  - Response unit provides additional information via comment reply
  - Admin resumes review and makes final decision

#### Alternative Flow 3: Bulk Report Approval
- **Condition:** Admin needs to approve multiple reports with same incident type
- **Steps:**
  - Admin filters report list by: status=PENDING, incident_type=FIRE, date_range=last_week
  - Admin identifies and selects 5 matching reports via checkboxes
  - Admin clicks "Bulk Actions" → "Approve All Selected"
  - System displays confirmation: "Approve 5 reports? This action cannot be undone."
  - Admin confirms
  - All 5 reports updated with status=APPROVED, bulk review timestamp logged
  - All associated response units notified batch approval
  - Audit trail shows bulk action with count and reason (if provided)

### Postconditions
- Report status officially confirmed (APPROVED/REJECTED/UNDER_REVIEW)
- Admin comments recorded in database
- Audit trail logged for compliance verification
- Notification sent to response unit with new status
- Report moved to appropriate status column in admin dashboard
- Historical analytics updated if approved
- Report archived or marked for revision if rejected

---

## Use Case 6: Admin Views Real-Time Incident Analytics

**Use Case ID:** UC-006
**Use Case Title:** Admin Views Real-Time Incident Analytics & Trend Forecasting
**Version:** 1.0
**Date Created:** June 2, 2026

### Use Case Goal
To provide administrators with real-time or near-real-time analytics dashboards displaying incident statistics, geographic heat maps, trend analysis, and machine learning-based incident forecasting to support data-driven decision-making and resource allocation.

### Actors
- **Primary Actor:** LGU Administrator/Analytics Officer
- **Secondary Actors:** Admin Dashboard, Backend Analytics API, ML Service, PostgreSQL Database, Socket.io

### Pre-conditions
- Administrator is logged into Admin Dashboard with analytics permission
- At least 30 days of historical incident data exists in database
- ML Service is running and generating forecasts (daily at 2 AM)
- Socket.io connection is active for real-time updates

### Main Flow

| Step | Actor | Action |
|------|-------|--------|
| 1 | Administrator | Navigates to "Analytics" page from admin sidebar |
| 2 | Dashboard | Loads analytics landing page with card summary: |
| | | - Total Incidents (This Month): 42 |
| | | - Active Incidents: 3 |
| | | - Average Response Time: 8.2 minutes |
| | | - System Uptime: 99.7% |
| 3 | Administrator | Views "Real-Time Incident Map" displaying: |
| | | - Interactive Leaflet map with all incidents as colored markers |
| | | - Incident type color scheme (red=fire, orange=medical, blue=crime, green=infrastructure) |
| | | - Incident severity icon (small=low, medium=medium, large=critical) |
| | | - Popup on marker click showing incident summary and evidence |
| 4 | Administrator | Views "Incident Type Distribution" pie chart: |
| | | - Fire incidents: 35% (incidents: 15) |
| | | - Medical incidents: 28% (incidents: 12) |
| | | - Crime incidents: 22% (incidents: 9) |
| | | - Infrastructure: 15% (incidents: 6) |
| 5 | Administrator | Views "Incident Timeline" line graph showing incidents per day for last 30 days |
| 6 | Administrator | Views "Top Incident Locations" bar chart ranking barangays by incident count |
| 7 | Administrator | Scrolls to "Trend Forecasting" section displaying: |
| | | - 7-day incident forecast line graph |
| | | - Predicted incidents for next 7 days based on SARIMA model |
| | | - Confidence intervals (shaded region around forecast line) |
| | | - Forecast accuracy rate: "Model confidence: 87%" |
| 8 | Administrator | Hovers over forecast line to view daily predictions: Day 1=4.2, Day 2=5.1, Day 3=3.8, etc. |
| 9 | Administrator | Uses date range picker to filter analytics for custom period: e.g., "Last 90 days" |
| 10 | Administrator | All visualizations update to reflect new date range |
| 11 | Administrator | Exports analytics report by clicking "Export as PDF" button |
| 12 | Dashboard | Generates PDF report with all charts, statistics, and timestamp |

### System Response

| Step | System Component | Response |
|------|------------------|----------|
| 1 | Authentication | Validates admin credentials and "analytics" permission |
| 2 | Backend Analytics API | Queries database for summary statistics: |
| | | - COUNT(incidents) WHERE created_at >= DATE_TRUNC('month', NOW()) |
| | | - COUNT(incidents) WHERE status IN ('AWAITING_RESPONSE', 'ACCEPTED', 'IN_PROGRESS') |
| | | - AVG(resolved_at - created_at) for incidents resolved this month |
| 2 | Socket.io Service | Establishes real-time connection and subscribes admin to "analytics" channel |
| 3 | Leaflet Map Component | Queries backend for all incidents: `/api/incidents/analytics/map` |
| 3 | Backend API | Returns GeoJSON formatted incident data (coordinates, type, severity, status) |
| 3 | Leaflet | Renders markers on map with color/size-coding based on type/severity |
| 4 | Backend Analytics API | Aggregates incident counts by type: `/api/analytics/incidents-by-type` |
| 4 | Frontend Chart Library (Chart.js) | Renders pie chart with calculated percentages and legends |
| 5 | Backend Analytics API | Aggregates daily incident counts for last 30 days: `/api/analytics/incident-timeline` |
| 5 | Frontend Chart Library | Renders line graph with daily data points and trend |
| 6 | Backend Analytics API | Aggregates incidents by location (barangay) and ranks top 10: `/api/analytics/top-locations` |
| 6 | Frontend Chart Library | Renders horizontal bar chart sorted by incident count |
| 7 | ML Service (Port 5000) | Receives request for 7-day forecast: `/ml-forecast/incidents` |
| 7 | ML Service | Loads trained SARIMA model with parameters (p,d,q,s) |
| 7 | ML Service | Executes forecast on last 90 days of historical data |
| 7 | ML Service | Returns JSON: {predicted_values: [4.2, 5.1, 3.8, ...], confidence_intervals: [[3.5, 5.0], ...]} |
| 7 | Frontend | Renders forecast line graph with prediction points and confidence shaded area |
| 9 | Frontend | Updates all API calls with new date range parameters |
| 10 | Multiple Backends | All analytics queries filter by new date range: `WHERE created_at BETWEEN ? AND ?` |
| 12 | PDF Generation Service | Uses libraries (pdfkit, chart-image) to generate PDF with embedded charts |
| 12 | Backend | Returns PDF file as attachment for browser download |
| 13 | Socket.io Service | Broadcasts real-time updates when new incidents reported: `analytics_update` event |
| 13 | Dashboard | Charts auto-update in real-time without page refresh (if admin watching live) |

### Analytics Metrics Calculated

```
Real-Time Metrics:
├─ Incident Count (total, by type, by severity, by location)
├─ Response Metrics (avg response time, response unit efficiency)
├─ Geographic Heat Map (incident density by barangay)
├─ Timeline Analysis (incidents per hour, day, week, month)
├─ Trend Forecasting (7-day ML forecast with confidence)
├─ Unit Performance (incidents handled per unit, average resolution time)
└─ Resource Utilization (unit availability, response coverage)

Historical Trending:
├─ Month-over-month incident growth/decline
├─ Seasonal patterns (incidents by season/weather)
├─ Peak hours/days analysis
└─ Response time improvements over time
```

### Alternative Flows

#### Alternative Flow 1: ML Forecast Model Error
- **Condition:** ML Service is unavailable or forecast generation fails
- **Steps:**
  - Backend detects ML service timeout (>5 seconds)
  - Forecast section displays: "Forecast temporarily unavailable"
  - Admin can still view historical analytics
  - System logs error in audit trail
  - Retry forecast attempt in 5 minutes
  - If persistent, alert is sent to IT team for ML service investigation

#### Alternative Flow 2: Custom Analytics Report Generation
- **Condition:** Admin needs specific data filtered by multiple criteria
- **Steps:**
  - Admin clicks "Generate Custom Report"
  - Advanced filter modal opens with options: date range, incident type, location, severity, response unit, status
  - Admin selects filters: Type=FIRE, Severity=CRITICAL, Location=Downtown Barangay
  - Admin clicks "Generate Report"
  - System queries database with all filters applied
  - PDF generated with filtered analytics and timestamp

#### Alternative Flow 3: Real-Time Incident Updates
- **Condition:** New incident reported while admin viewing analytics
- **Steps:**
  - Socket.io broadcasts `new_incident` event to analytics page
  - Incident summary card (Total Incidents) increments by 1
  - New marker appears on map
  - Line charts animate to update with new data point
  - Admin sees notification badge: "New incident reported"

### Postconditions
- Analytics dashboard displays current incident statistics
- Real-time map shows all active and recent incidents
- Trend forecast displays 7-day predicted incident volume
- Historical data available for custom report generation
- PDF export successfully generated and downloaded
- Real-time updates received via Socket.io for live monitoring

---

## Use Case 7: Admin Manages LGU Configuration

**Use Case ID:** UC-007
**Use Case Title:** Admin Manages LGU Geographic Configuration
**Version:** 1.0
**Date Created:** June 2, 2026

### Use Case Goal
To enable LGU administrators to configure and maintain geographic jurisdictions, manage municipalities and barangays, define response unit coverage areas, and establish system boundaries for incident assignment and resource allocation.

### Actors
- **Primary Actor:** LGU System Administrator
- **Secondary Actors:** Admin Dashboard, Backend Configuration API, PostGIS Database, Audit Logger

### Pre-conditions
- Administrator has "System Configuration" permission
- Administrator is logged into Admin Dashboard
- LGU jurisdiction data exists or is being initialized
- PostGIS geographic boundaries are loaded in database

### Main Flow

| Step | Actor | Action |
|------|-------|--------|
| 1 | Administrator | Navigates to "LGU Configuration" page from admin menu |
| 2 | Dashboard | Displays LGU list with columns: |
| | | - LGU Name |
| | | - Municipality Count |
| | | - Barangay Count |
| | | - Status (ACTIVE/INACTIVE) |
| 3 | Administrator | Views list of 5 LGUs: quezon city, manila, caloocan, malabon, navotas |
| 4 | Administrator | Clicks on "Quezon City" to open configuration modal |
| 5 | Modal | Displays LGU detail view showing: |
| | | - LGU name: "Quezon City" |
| | | - Municipalities assigned (cities/municipalities are listed) |
| | | - Barangays list (39 barangays displayed) with search functionality |
| | | - Geographic boundary visualization (PostGIS map) |
| | | - Add/remove municipality buttons |
| | | - Edit coverage area buttons |
| 6 | Administrator | Views municipalities currently assigned to Quezon City |
| 7 | Administrator | Clicks "Add Municipality" button to add a new municipality |
| 8 | Modal | Opens municipality selection dialog showing available municipalities not yet assigned |
| 9 | Administrator | Selects "New Municipality from list and clicks "Add" |
| 10 | Modal | Refreshes showing newly added municipality in list |
| 11 | Administrator | Click "Edit Barangays" to manage barangay coverage |
| 12 | Modal | Shows barangay list with toggle buttons for inclusion in LGU coverage |
| 13 | Administrator | Toggles barangay status (add/remove from jurisdiction) |
| 14 | Administrator | Reviews all configuration changes and clicks "Save Configuration" |
| 15 | Dashboard | Displays confirmation: "LGU configuration updated successfully" |

### System Response

| Step | System Component | Response |
|------|------------------|----------|
| 1 | Authentication | Validates admin credentials and "lgu_configuration" permission |
| 2 | Backend API | Queries database for all LGUs: GET `/api/lgu-config` |
| 2 | PostgreSQL | SELECT lgu_name, COUNT(municipalities), COUNT(barangays), status FROM lgu_jurisdictions |
| 2 | Dashboard | Renders LGU list with calculated counts |
| 4 | Backend API | Fetches full LGU detail: GET `/api/lgu-config/quezon-city` |
| 4 | PostgreSQL | SELECT * FROM lgu_jurisdictions WHERE name='Quezon City' AND related municipalities/barangays |
| 5 | PostGIS Service | Generates geographic boundary visualization (ST_AsGeoJSON function) |
| 5 | Leaflet Map | Renders LGU boundary polygon on map |
| 7 | Backend API | Receives POST `/api/lgu-config/quezon-city/municipalities` with municipality_id |
| 8 | PostgreSQL | INSERT INTO lgu_municipalities (lgu_id, municipality_id) VALUES (...) |
| 9 | Backend API | Updates LGU municipality count in response |
| 10 | Dashboard | Re-fetches LGU detail and displays updated municipality list |
| 11 | Backend API | Fetches barangay list for LGU: GET `/api/lgu-config/quezon-city/barangays` |
| 13 | Backend API | Receives PATCH `/api/lgu-config/quezon-city/barangays/:id` with inclusion toggle |
| 13 | PostgreSQL | UPDATE barangay_coverage SET is_active = TRUE/FALSE WHERE barangay_id = ? |
| 14 | Backend API | Receives POST `/api/lgu-config/save` with all configuration changes |
| 14 | Audit Logger | Logs configuration update: {action: "LGU_CONFIG_UPDATED", admin_id, lgu_id, changes_summary, timestamp} |
| 15 | Notification Service | Notifies response unit bases in affected jurisdictions of boundary updates |
| 15 | Dashboard | Displays success message with updated configuration |
| 16 | Cache Service | Clears LGU configuration cache to ensure fresh data in incident assignment engine |

### LGU Jurisdiction Configuration Structure

```
LGU
├─ Municipalities
│   ├─ Municipality A
│   │   ├─ Barangay 1 (ACTIVE)
│   │   ├─ Barangay 2 (ACTIVE)
│   │   └─ Barangay 3 (INACTIVE)
│   └─ Municipality B
│       ├─ Barangay 4 (ACTIVE)
│       └─ Barangay 5 (ACTIVE)
├─ Response Units Coverage Areas (PostGIS Polygons)
├─ Dispatch Priority Zones
└─ Geographic Boundaries (GeoJSON)
```

### Alternative Flows

#### Alternative Flow 1: Bulk Jurisdiction Update
- **Condition:** Admin needs to update multiple LGUs with similar changes
- **Steps:**
  - Admin clicks "Bulk Configuration" from LGU list
  - Bulk update form shows options: add municipality to multiple LGUs, activate/deactivate barangays across LGUs
  - Admin selects: "Add 'New City' to: Quezon City, Manila, Caloocan"
  - System processes batch update with single confirmation
  - Audit trail logs bulk action with affected LGU count

#### Alternative Flow 2: Geographic Boundary Validation
- **Condition:** Admin attempts to create overlapping jurisdiction boundaries
- **Steps:**
  - Admin edits LGU boundary polygon on map
  - System performs PostGIS ST_Overlaps check against other LGU boundaries
  - If overlap detected: System displays warning: "This boundary overlaps with 'Manila City' jurisdiction. Resolve conflict?"
  - Admin can adjust boundary or merge jurisdictions
  - System validates no gaps in geographic coverage

#### Alternative Flow 3: Cascade Changes to Response Units
- **Condition:** Barangay removed from LGU triggers reassignment of response units
- **Steps:**
  - Admin removes barangay X from LGU jurisdiction
  - System detects response units assigned to barangay X
  - System notifies admin: "This change affects 2 response unit assignments. Continue?"
  - Admin confirms
  - System reassigns response units to new jurisdiction or marks them as needing reassignment
  - Incident assignment engine recalibrated for future incidents
  - Audit trail logged with cascade details

### Postconditions
- LGU geographic configuration updated in database
- Municipality and barangay coverage updated
- PostGIS boundaries recalculated
- Response unit assignment parameters refreshed
- Audit trail logged for compliance
- Notification sent to affected stakeholders
- Incident assignment logic updated with new jurisdictions

---

## Use Case 8: Admin Monitors Audit Logs for Compliance

**Use Case ID:** UC-008
**Use Case Title:** Admin Monitors System Audit Logs for Compliance & Accountability
**Version:** 1.0
**Date Created:** June 2, 2026

### Use Case Goal
To provide administrators with comprehensive, immutable audit logging of all system actions (CREATE, UPDATE, DELETE, LOGIN) for compliance verification, security investigation, and accountability tracking, with advanced filtering and export capabilities.

### Actors
- **Primary Actor:** LGU Compliance Officer / System Administrator
- **Secondary Actors:** Admin Dashboard, Backend Audit Service, PostgreSQL Database, CSV Export Service

### Pre-conditions
- Administrator has "View Audit Logs" permission (read-only)
- Administrator is logged into Admin Dashboard
- System has been recording audit events (at least 30 days of logs)

### Main Flow

| Step | Actor | Action |
|------|-------|--------|
| 1 | Compliance Officer | Navigates to "Audit Logs" page from admin sidebar |
| 2 | Dashboard | Displays audit logs list with columns: |
| | | - Timestamp (sortable, descending by default) |
| | | - Action (CREATE, UPDATE, DELETE, LOGIN - color-coded badges) |
| | | - User (admin/officer name) |
| | | - Resource Type (Incident, Unit, Report, LGU, etc.) |
| | | - Resource ID |
| | | - Changes Summary (abbreviated) |
| 3 | Dashboard | Displays 50 logs per page with pagination controls |
| 4 | Compliance Officer | Views filter bar with options: |
| | | - Action dropdown: [CREATE, UPDATE, DELETE, LOGIN, ALL] |
| | | - User dropdown: [Select from all users] |
| | | - Resource Type dropdown: [Incident, PostReport, Unit, LGU, Broadcast, etc.] |
| | | - Date range picker: From [date] to [date] |
| 5 | Compliance Officer | Applies filters: |
| | | - Action = DELETE |
| | | - Date Range = Last 7 days |
| | | - Resource Type = Incident |
| 6 | Dashboard | List updates showing only DELETE actions on Incidents in last 7 days: 3 records displayed |
| 7 | Compliance Officer | Reviews each log record for deletion accountability |
| 8 | Compliance Officer | Clicks on a log entry to open detailed view showing: |
| | | - Complete timestamp with timezone |
| | | - User who performed action (name, role, ID) |
| | | - Action type with colored badge |
| | | - Resource details (incident ID, type, location) |
| | | - Complete before/after data (if UPDATE action): |
| | | | * Original field values |
| | | | * New field values |
| | | | * Fields that changed highlighted |
| | | - IP address and user agent (for security audit) |
| | | - Reason/comment (if provided) |
| 9 | Compliance Officer | Closes detail view and continues reviewing other logs |
| 10 | Compliance Officer | Applies new filter: |
| | | - Action = UPDATE |
| | | - User = "Officer John Smith" |
| | | - Date Range = Last 30 days |
| 11 | Dashboard | Filters to show 8 UPDATE actions performed by Officer John Smith in last month |
| 12 | Compliance Officer | Scans update actions and notices suspicious pattern: multiple incident status changes by same user within short time |
| 13 | Compliance Officer | Clicks "Export as CSV" button to download audit log data |
| 14 | Backend | Generates CSV file with filtered audit logs data |
| 15 | Dashboard | Initiates CSV file download to user's device |

### System Response

| Step | System Component | Response |
|------|------------------|----------|
| 1 | Authentication | Validates admin has "audit_logs" read permission (no modify permission) |
| 2 | Backend Audit API | Queries audit log database table: GET `/api/audit-logs` |
| 2 | PostgreSQL | SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 50 |
| 2 | Dashboard | Displays list with 50 most recent audit entries |
| 3 | Dashboard | Provides pagination with total record count displayed |
| 4 | Backend API | Provides dropdown filter options: GET `/api/audit-logs/filters` |
| 4 | PostgreSQL | SELECT DISTINCT action FROM audit_logs; SELECT DISTINCT user_id FROM audit_logs; etc. |
| 5 | Compliance Officer | Applies filter criteria |
| 6 | Backend API | Processes filter request: GET `/api/audit-logs?action=DELETE&resource_type=Incident&date_from=X&date_to=Y` |
| 6 | PostgreSQL | Filters logs based on WHERE clauses for action, resource_type, timestamp range |
| 6 | Dashboard | Updates list showing only matching records (3 DELETE incidents in last 7 days) |
| 8 | Backend API | Fetches detailed log entry: GET `/api/audit-logs/:log_id` |
| 8 | PostgreSQL | SELECT * FROM audit_logs WHERE id = ? WITH DETAILED changes_data (before/after) |
| 8 | Dashboard | Renders detail modal with all before/after comparisons color-coded (red=deleted, green=added, yellow=modified) |
| 10 | Dashboard | User re-applies new filters (Action=UPDATE, User=Officer John Smith, date range) |
| 12 | Compliance Officer | Manually reviews action pattern (8 updates in 30 days - within normal range) |
| 13 | Backend API | Processes CSV export request: GET `/api/audit-logs/export?filters=...` |
| 14 | CSV Export Service | Generates CSV with columns: Timestamp, Action, User, Resource, Changes |
| 14 | Backend | Applies audit log filters and formats data for CSV export |
| 15 | Backend | Streams CSV file to browser with filename: `audit-logs_2026-06-02.csv` |

### Audit Log Entry Structure

```json
{
  "id": "UUID",
  "timestamp": "2026-06-02T14:35:22Z",
  "action": "UPDATE",
  "user_id": "user-123",
  "user_name": "Admin Maria",
  "resource_type": "PostIncidentReport",
  "resource_id": "report-456",
  "changes": {
    "status": ["PENDING", "APPROVED"],
    "admin_notes": [null, "Report verified and approved for records"],
    "reviewed_at": [null, "2026-06-02T14:35:22Z"]
  },
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0...",
  "status": "SUCCESS"
}
```

### Color-Coded Action Badges

```
CREATE  → Blue badge (new resource created)
UPDATE  → Orange badge (resource modified)
DELETE  → Red badge (resource removed)
LOGIN   → Green badge (user authentication)
```

### Alternative Flows

#### Alternative Flow 1: Audit Log Search by Keyword
- **Condition:** Compliance officer needs to find specific action not matching standard filters
- **Steps:**
  - Officer uses keyword search field: "incident-789"
  - System searches across resource_id, user_name, and resource_type fields
  - Matching logs displayed (all actions affecting incident-789)
  - Results can be further filtered by date range and action type

#### Alternative Flow 2: Suspicious Activity Alert
- **Condition:** Admin system detects unusual audit pattern
- **Steps:**
  - Audit monitoring service detects: User A performed 50+ actions in 1 hour (unusual spike)
  - System creates automated alert in audit logs: {action: "SYSTEM_ALERT", severity: "HIGH", description: "Unusual user activity detected"}
  - Alert displayed prominently on Audit Logs page
  - Admin can click alert to see detailed analysis
  - Admin can manually flag incident for security review

#### Alternative Flow 3: Audit Log Retention Policy
- **Condition:** System reaches audit log storage limits
- **Steps:**
  - System maintains minimum 1-year retention policy (immutable, cannot be deleted)
  - Archive service moves logs older than 1 year to cold storage (backup)
  - Compliance officer can still search archived logs via "View Archived Logs" option
  - Search performance may be slower for archived data
  - Retention schedule logged in system configuration

### Immutability & Security Guarantees

```
Audit Log Guarantees:
✓ No DELETE permitted on audit_logs table (database-level constraints)
✓ No UPDATE allowed (logs are append-only)
✓ Each log entry includes user_id and timestamp for accountability
✓ IP address and user agent logged for security review
✓ Cryptographic hash of log entry (optional) for tamper detection
✓ All changes tracked with before/after values
✓ Search results never modified by system (read-only)
```

### Postconditions
- Audit logs filtered and displayed according to criteria
- Detailed log entry information available for inspection
- CSV export successfully generated and downloaded
- No modifications made to audit logs (read-only)
- Compliance verification completed
- Suspicious activity patterns identified (if applicable)

---

## Summary: Complete System Flow

```
FULL SYSTEM INCIDENT LIFECYCLE:

1. CITIZEN REPORTS INCIDENT
   ├─ Opens mobile app, logs in
   ├─ Reports incident with photos, location, type, description, severity
   ├─ Submits to backend with offline queue fallback
   └─ Receives confirmation with incident ID

2. SYSTEM ROUTES INCIDENT
   ├─ Backend validates incident data
   ├─ Smart assignment engine analyzes incident type & location
   ├─ PostGIS finds nearest available response units
   ├─ Severity-based capacity filtering applied
   └─ Broadcast Socket.io & Firebase notifications

3. RESPONSE UNIT RECEIVES & RESPONDS
   ├─ Unit receives real-time notification
   ├─ Unit dashboard displays incident details & map
   ├─ Unit accepts incident and updates status
   ├─ Unit tracks GPS location during response
   ├─ Unit updates incident status: IN_PROGRESS → UNDER_CONTROL → RESOLVED
   └─ Completion triggers post-incident report ready state

4. UNIT SUBMITS POST-INCIDENT REPORT
   ├─ Unit completes form: actions, casualties, damages, costs
   ├─ Backend validates and stores report (status: PENDING)
   ├─ Admin receives notification for review queue
   └─ Report marked ready for administrative approval

5. ADMIN REVIEWS & APPROVES
   ├─ Admin views report in dashboard
   ├─ Admin adds comments and selects status (APPROVED/REJECTED)
   ├─ Backend updates report and logs action in audit trail
   └─ Response unit notified of decision

6. ADMIN MONITORS ANALYTICS
   ├─ Admin views real-time incident dashboard
   ├─ Real-time map shows all active incidents
   ├─ ML Service provides 7-day trend forecast
   ├─ Statistics & charts updated in real-time via Socket.io
   └─ Admin can export analytics reports

7. ADMIN MANAGES SYSTEM
   ├─ Admin configures LGU jurisdictions & geographic boundaries
   ├─ Admin monitors audit logs for compliance
   ├─ All changes recorded immutably in audit trail
   └─ System maintains 1-year minimum audit log retention

THROUGHOUT:
→ Real-time Socket.io broadcasts keep all dashboards synchronized
→ Firebase Cloud Messaging sends push notifications to devices
→ PostGIS enables geographic incident routing & analysis
→ Audit logging tracks all CREATE/UPDATE/DELETE/LOGIN actions
→ ML Service (SARIMA model) generates incident forecasts
```

---

## Conclusion

The GAOIRS system provides a comprehensive, end-to-end incident response management solution with:

- **Citizen-Centric Reporting**: Easy mobile app for incident reporting with photos and location
- **Intelligent Dispatch**: Smart incident routing based on incident type, severity, and geographic proximity
- **Real-Time Coordination**: Socket.io and push notifications for coordinated response
- **Administrative Oversight**: Comprehensive dashboards for incident tracking, analytics, and decision support
- **Compliance & Audit**: Immutable audit logging for full accountability
- **Predictive Analytics**: ML-powered incident forecasting for resource planning
- **Multi-Level Architecture**: Separated concerns for citizen app, response units, and administrative functions

With these eight interconnected use cases, GAOIRS delivers a production-ready system designed to optimize emergency response and save lives through better incident management and resource allocation.

---

**Document Version:** 1.0
**Last Updated:** June 2, 2026
**Created By:** GAOIRS Development Team
**Status:** Complete & Ready for Implementation
