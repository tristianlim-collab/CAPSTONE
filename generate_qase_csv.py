import csv
import sys

def build_qase_csv():
    headers = [
        'id', 'title', 'description', 'preconditions', 'postconditions', 'tags',
        'priority', 'severity', 'type', 'behavior', 'automation', 'status',
        'is_flaky', 'layer', 'steps_type', 'steps_actions', 'steps_result',
        'steps_data', 'milestone_id', 'milestone', 'suite_id', 'suite_parent_id',
        'suite', 'suite_without_cases', 'parameters', 'is_muted'
    ]

    rows = []

    # Helper function to append suite declaration row
    def add_suite(suite_id, suite_name):
        row = [''] * 26
        row[20] = str(suite_id)
        row[22] = suite_name
        row[23] = '1'
        rows.append(row)

    # Helper function to append test case row
    def add_tc(tc_id, title, description, preconditions, postconditions, tags, priority, severity, tc_type, behavior, automation, layer, steps_actions, steps_result, steps_data, suite_id, suite_name):
        row = [''] * 26
        row[0] = str(tc_id)
        row[1] = title
        row[2] = description
        row[3] = preconditions
        row[4] = postconditions
        row[5] = tags
        row[6] = priority
        row[7] = severity
        row[8] = tc_type
        row[9] = behavior
        row[10] = automation
        row[11] = 'actual'
        row[12] = 'no'
        row[13] = layer
        row[14] = 'classic'
        row[15] = steps_actions
        row[16] = steps_result
        row[17] = steps_data
        row[18] = '1'
        row[19] = 'Release 1.0'
        row[20] = str(suite_id)
        row[21] = ''
        row[22] = suite_name
        row[23] = ''
        row[24] = ''
        row[25] = 'no'
        rows.append(row)

    tc_counter = 1

    # ==========================================
    # SUITE 1: User Authentication & Access Control (UC1)
    # ==========================================
    s1_name = "Suite 1: User Authentication & Access Control"
    add_suite(1, s1_name)

    add_tc(
        tc_counter,
        "UC-001 - TC01: Citizen User Registration with Valid Details",
        "Verify that a new citizen can successfully register an account using valid personal and credential information.",
        "System is running. Citizen is on the Registration screen of the Mobile Reporter App.",
        "New citizen account created in database with role 'citizen', hashed password, and activation status.",
        "authentication,registration,citizen,mobile",
        "high", "critical", "functional", "positive", "to-be-automated", "e2e",
        "1. Launch GAOIRS Reporter App\n2. Navigate to Register Screen\n3. Fill in Full Name, Email, Contact Number, Barangay, and Password\n4. Tap 'Register' button",
        "1. App opens successfully\n2. Registration form rendered\n3. Input fields populated without validation errors\n4. Account created, confirmation displayed, redirected to Login",
        "1. N/A\n2. N/A\n3. Name: Juan Cruz, Email: juan.cruz@gmail.com, Phone: 09171234567, Barangay: Poblacion, Pass: Pass@123\n4. N/A",
        1, s1_name
    )
    tc_counter += 1

    add_tc(
        tc_counter,
        "UC-001 - TC02: User Authentication / Login across System Roles",
        "Verify that Admin, Responder, and Citizen users can log in using valid credentials and receive role-based JWT tokens.",
        "User accounts exist in database for Admin, Responder, and Citizen roles.",
        "User authenticated, JWT token issued, user routed to role-specific dashboard.",
        "authentication,login,jwt,rbac",
        "critical", "blocker", "smoke", "positive", "automated", "api",
        "1. Send POST request to /api/auth/login with valid email and password\n2. Verify HTTP response status and JWT payload\n3. Verify UI navigation to role dashboard",
        "1. Request received by backend\n2. Status 200 OK returned with JWT access token and user role object\n3. User redirected to appropriate dashboard",
        "1. Email: admin@gaoirs.gov.ph / responder@bfp.gov.ph, Password: Secret123!\n2. N/A\n3. N/A",
        1, s1_name
    )
    tc_counter += 1

    add_tc(
        tc_counter,
        "UC-001 - TC03: User Login with Invalid Credentials",
        "Verify that login attempts with incorrect passwords or unregistered email addresses are rejected with appropriate error messages.",
        "User is on the login page of Admin Web Dashboard or Mobile Reporter App.",
        "Authentication fails, no token issued, error message displayed.",
        "authentication,security,negative",
        "high", "major", "functional", "negative", "to-be-automated", "ui",
        "1. Enter unregistered email or wrong password\n2. Click/Tap Login button",
        "1. Credentials entered in input fields\n2. System rejects request with 401 Unauthorized and displays 'Invalid email or password'",
        "1. Email: invalid@user.com, Password: WrongPassword123\n2. N/A",
        1, s1_name
    )
    tc_counter += 1

    add_tc(
        tc_counter,
        "UC-001 - TC04: Access Protected Endpoint Without Authorization Token",
        "Verify that unauthorized requests to protected API endpoints without a valid Bearer token are blocked by security middleware.",
        "Backend API server is running.",
        "HTTP 401 Unauthorized / 403 Forbidden status returned.",
        "security,authorization,api",
        "high", "critical", "security", "negative", "automated", "api",
        "1. Send GET request to /api/incidents or /api/users without Authorization header\n2. Inspect API response",
        "1. API intercepts request\n2. Returns status 401 Unauthorized with error message 'No token provided'",
        "1. Endpoint: GET /api/incidents, Headers: None\n2. N/A",
        1, s1_name
    )
    tc_counter += 1


    # ==========================================
    # SUITE 2: Incident Reporting & Submission (UC2, UC3, UC4, UC5)
    # ==========================================
    s2_name = "Suite 2: Incident Reporting & Submission"
    add_suite(2, s2_name)

    add_tc(
        tc_counter,
        "UC-002 - TC05: Submit Complete Incident Report with Location & Evidence",
        "Verify that a citizen can complete and submit a full emergency incident report with incident type, GPS coordinates, description, and photo evidence.",
        "Citizen is logged into Mobile Reporter App with active GPS and camera permissions.",
        "Incident created in DB status 'Reported', images stored, real-time socket event fired.",
        "incident-reporting,mobile,gps,evidence",
        "critical", "blocker", "smoke", "positive", "to-be-automated", "e2e",
        "1. Open Submit Incident form in Mobile App\n2. Select Incident Type (e.g. Fire Incident)\n3. Capture/Tag current GPS coordinates\n4. Enter incident description\n5. Attach photo evidence\n6. Tap 'Submit Incident Report'",
        "1. Form opens\n2. Incident type selected and icon updated\n3. GPS coordinates (Lat: 10.244, Long: 123.848) acquired and previewed on map\n4. Description entered\n5. Photo preview rendered\n6. Report submitted successfully, unique incident code generated",
        "1. N/A\n2. Type: Fire\n3. GPS: 10.2448, 123.8481\n4. Desc: House fire near Barangay Hall\n5. File: photo1.jpg\n6. N/A",
        2, s2_name
    )
    tc_counter += 1

    add_tc(
        tc_counter,
        "UC-003 - TC06: Predefined Incident Type Selection & Visual Indicator Update",
        "Verify that selecting different incident types updates the form styling, category markers, and response agency mapping.",
        "User is on the Incident Type selection screen.",
        "Selected incident type stored in form state, corresponding color badge applied.",
        "incident-type,ui,categorization",
        "medium", "normal", "functional", "positive", "to-be-automated", "ui",
        "1. Open Incident Type dropdown/picker\n2. Select 'Road Accident / Vehicular'\n3. Observe map marker color and icon",
        "1. Options displayed (Fire, Medical, Crime, Road Accident, Flood, Public Disturbance)\n2. Selection saved\n3. Form color-code changes to yellow/amber for Road Accident",
        "1. List of types\n2. Selection: Road Accident\n3. Visual marker preview",
        2, s2_name
    )
    tc_counter += 1

    add_tc(
        tc_counter,
        "UC-004 - TC07: Tag GPS Coordinates & Manual Map Pin Adjustment",
        "Verify that automatic device GPS coordinate retrieval and manual drag-and-drop map pin repositioning update location data accurately.",
        "Device location service enabled, interactive map preview rendered on report form.",
        "Confirmed GPS coordinates (latitude, longitude, barangay) saved to report payload.",
        "gps,geofencing,location,map",
        "high", "major", "functional", "positive", "to-be-automated", "ui",
        "1. Tap 'Detect My Location'\n2. Drag location marker pin to exact incident spot on interactive map\n3. Confirm location",
        "1. GPS fetches latitude/longitude\n2. Map pin moves smoothly to new position, reverse geocodes Barangay name\n3. Coordinates updated in form state",
        "1. Auto GPS\n2. Pin shift: +0.0005 lat\n3. Barangay: Bulacao",
        2, s2_name
    )
    tc_counter += 1

    add_tc(
        tc_counter,
        "UC-005 - TC08: Attach Photo Evidence with Format & File Size Validation",
        "Verify that the system accepts valid JPEG/PNG photos within size limits and rejects unsupported file formats or oversized files.",
        "User is at Step 5 (Upload Photo Evidence) of report creation.",
        "Valid photos uploaded and previewed; invalid files generate error popups.",
        "evidence,upload,validation,media",
        "medium", "normal", "functional", "positive", "to-be-automated", "ui",
        "1. Click 'Upload Photo'\n2. Choose a valid .JPG photo (< 5MB)\n3. Attempt to upload a .TXT file or file > 20MB",
        "1. File picker opens\n2. Valid photo attached and thumbnail thumbnail displayed\n3. Validation error 'Invalid file type / File size exceeds 10MB limit' displayed",
        "1. File selection\n2. File: scene.jpg (2.1MB)\n3. File: invalid.txt",
        2, s2_name
    )
    tc_counter += 1

    add_tc(
        tc_counter,
        "UC-002 - TC09: Submit Incident Report with Missing Required Fields",
        "Verify that submitting an incident report without required fields (e.g. missing description or location) triggers form validation errors.",
        "User is on the Incident Submission form.",
        "Form submission blocked, field highlight and validation message shown.",
        "validation,negative,form",
        "high", "major", "functional", "negative", "to-be-automated", "ui",
        "1. Leave Incident Description and Location blank\n2. Click 'Submit Incident Report'",
        "1. Fields remain empty\n2. System prevents submission and displays 'Please provide incident description and valid location'",
        "1. Blank fields\n2. N/A",
        2, s2_name
    )
    tc_counter += 1

    add_tc(
        tc_counter,
        "UC-002 - TC10: Offline Incident Queueing & Auto-Sync upon Network Restoration",
        "Verify that reports created without active internet are stored in local SQLite queue and automatically synced to backend once reconnected.",
        "Mobile device network connectivity is toggled off (Airplane mode).",
        "Report stored locally with pending badge; uploaded automatically when connection resumes.",
        "offline,sync,mobile,resilience",
        "high", "critical", "reliability", "positive", "to-be-automated", "e2e",
        "1. Disconnect device network\n2. Submit an incident report\n3. Verify local queue storage message\n4. Re-enable network connection",
        "1. Device offline\n2. App displays 'Saved offline in queue'\n3. Item visible in Pending Offline Queue\n4. System detects online status, transmits queue to /api/incidents/sync, updates status to Submitted",
        "1. Offline state\n2. Report payload\n3. Queue item ID\n4. Online trigger",
        2, s2_name
    )
    tc_counter += 1


    # ==========================================
    # SUITE 3: Citizen Incident Tracking & Notifications (UC6, UC7)
    # ==========================================
    s3_name = "Suite 3: Citizen Incident Tracking & Notifications"
    add_suite(3, s3_name)

    add_tc(
        tc_counter,
        "UC-007 - TC11: Receive Submission Confirmation with Unique Incident Code",
        "Verify that upon successful report submission, the user receives an immediate confirmation dialog containing a unique reference code.",
        "Citizen has submitted an incident report.",
        "Unique incident reference code (e.g. INC-2026-0891) displayed and stored in user report history.",
        "confirmation,incident-code,citizen",
        "high", "normal", "functional", "positive", "to-be-automated", "ui",
        "1. Complete incident submission\n2. Observe response modal\n3. Note down generated Incident Code",
        "1. Submission completes\n2. Modal displays 'Report Received Successfully!'\n3. Unique Incident Code INC-XXXX-XXXX displayed with option to view in My Reports",
        "1. N/A\n2. Confirmation dialog\n3. Code: INC-2026-0891",
        3, s3_name
    )
    tc_counter += 1

    add_tc(
        tc_counter,
        "UC-006 - TC12: Track Incident Real-Time Status Timeline in Citizen Portal",
        "Verify that citizens can view their submitted reports list and inspect the step-by-step progress timeline.",
        "Citizen is logged into app and has submitted at least one incident report.",
        "Report details and status timeline (Reported -> Verified -> Responding -> Resolved) correctly displayed.",
        "tracking,timeline,citizen,status",
        "high", "major", "functional", "positive", "to-be-automated", "ui",
        "1. Navigate to 'My Reports' tab\n2. Tap on an active incident record\n3. Review status timeline and timestamps",
        "1. List of submitted reports loaded\n2. Incident detail page opens\n3. Status progression timeline rendered with active stage highlighted and timestamps listed",
        "1. User ID\n2. Incident ID: INC-2026-0891\n3. Status steps",
        3, s3_name
    )
    tc_counter += 1

    add_tc(
        tc_counter,
        "UC-007 - TC13: Real-Time Socket & Push Notification Delivery on Status Change",
        "Verify that when an admin or responder updates incident status, the citizen receives a real-time push/socket notification.",
        "Citizen has an active incident. Admin/Responder changes status to 'Responding'.",
        "Notification banner received on citizen device, status updated instantly without manual refresh.",
        "notification,socket,push,realtime",
        "high", "major", "functional", "positive", "automated", "e2e",
        "1. Keep citizen app open on incident tracking view\n2. Update status from admin dashboard\n3. Observe citizen app interface",
        "1. App connected to WebSocket server\n2. Status update emitted via Socket.io / FCM push\n3. Citizen app displays notification toast 'Your report status is now: Responding'",
        "1. Socket event: incident_status_updated\n2. Status: Responding\n3. Timestamp",
        3, s3_name
    )
    tc_counter += 1


    # ==========================================
    # SUITE 4: Incident Verification & Management (UC13)
    # ==========================================
    s4_name = "Suite 4: Incident Verification & Management"
    add_suite(4, s4_name)

    add_tc(
        tc_counter,
        "UC-013 - TC14: Admin Verification Queue Inspection & Incident Detail Review",
        "Verify that administrators can access the incoming incident queue, view full details, inspect attached photos, and check reporter details.",
        "Admin user logged into GAOIRS Web Dashboard. New incident has status 'Reported'.",
        "Incident modal opens, displaying map pin, reporter name/phone, photo evidence carousel, and action buttons.",
        "admin,verification,incident-management",
        "critical", "blocker", "smoke", "positive", "to-be-automated", "ui",
        "1. Open Admin Dashboard -> Incident Management\n2. Select an incident in 'Awaiting Verification' queue\n3. Review description, GPS location, and evidence photos",
        "1. Incident list displayed\n2. Incident detail modal opens smoothly\n3. All report metadata, map location, and high-res evidence images loaded",
        "1. N/A\n2. Incident ID: INC-1029\n3. Details payload",
        4, s4_name
    )
    tc_counter += 1

    add_tc(
        tc_counter,
        "UC-013 - TC15: Search and Filter Incidents by Type, Status, Barangay, and Date",
        "Verify that incident data table updates dynamically when applying search keywords or filter dropdown combinations.",
        "Multiple incident records exist across various barangays, statuses, and types.",
        "Data table filters instantly to show matching incident records.",
        "filter,search,datatable,admin",
        "medium", "normal", "functional", "positive", "to-be-automated", "ui",
        "1. Go to Incident Management table\n2. Select Filter: Barangay = 'Poblacion', Status = 'Verified', Type = 'Fire'\n3. Enter search term 'Commercial'",
        "1. Table loaded with all records\n2. Filters applied to dataset\n3. Table updates showing only matching incident entries",
        "1. Filter params: barangay=Poblacion&status=Verified&type=Fire\n2. Search query: Commercial\n3. Results count",
        4, s4_name
    )
    tc_counter += 1

    add_tc(
        tc_counter,
        "UC-013 - TC16: Mark Incident as Verified or False Alarm / Cancelled",
        "Verify that administrator can change incident verification status and add required administrative notes.",
        "Administrator is reviewing an unverified incident report.",
        "Incident status updated to 'VERIFIED' or 'CANCELLED' in database; status log recorded.",
        "verification,admin,status-change",
        "high", "major", "functional", "positive", "to-be-automated", "ui",
        "1. Open incident detail modal\n2. Click 'Verify Report' or 'Mark as False Alarm'\n3. Enter admin notes\n4. Save status update",
        "1. Modal active\n2. Status button selected\n3. Notes entered\n4. Database updated, toast notification 'Incident verified successfully' shown",
        "1. Incident ID\n2. Action: Verify\n3. Notes: Dispatched patrol confirmed smoke\n4. Status: VERIFIED",
        4, s4_name
    )
    tc_counter += 1


    # ==========================================
    # SUITE 5: Response Unit Dispatch & Recommendation (UC8, UC14)
    # ==========================================
    s5_name = "Suite 5: Response Unit Dispatch & Recommendation"
    add_suite(5, s5_name)

    add_tc(
        tc_counter,
        "UC-014 - TC17: Automated Geofenced Nearest Responder Recommendation Calculation",
        "Verify that the system calculates distance using PostGIS coordinates and recommends the nearest available response unit based on incident type.",
        "Incident verified at specific GPS coordinate. Response units have defined locations and statuses in database.",
        "System displays ranked recommendation list of nearest available units (BFP/DRRMO/PNP).",
        "dispatch,geofencing,postgis,algorithm",
        "critical", "blocker", "functional", "positive", "automated", "api",
        "1. Select verified incident needing dispatch\n2. Click 'Recommend Responder'\n3. Verify backend ST_Distance calculation response",
        "1. Incident selected\n2. Dispatch panel calculates straight-line / route distance\n3. Nearest available unit recommended at top of list with distance in KM",
        "1. Incident GPS: 10.245, 123.847\n2. Unit 1: BFP Station 1 (1.2km - Available)\n3. Unit 2: BFP Station 2 (4.5km - Available)",
        5, s5_name
    )
    tc_counter += 1

    add_tc(
        tc_counter,
        "UC-014 - TC18: Confirm Recommended Unit & Dispatch Emergency Response Team",
        "Verify that administrator can confirm unit dispatch, triggering real-time alerts to the selected response unit.",
        "Admin is on Dispatch tab for a verified incident.",
        "Dispatch order recorded, incident status changed to 'Responding', alert sent via Socket/SMS/Email.",
        "dispatch,alert,admin,response-unit",
        "critical", "blocker", "smoke", "positive", "to-be-automated", "e2e",
        "1. Select recommended Response Unit (e.g. BFP Engine 1)\n2. Click 'Confirm Dispatch'\n3. Observe dispatch event execution",
        "1. Unit selected\n2. Dispatch API called (/api/assignments/dispatch)\n3. Real-time alert dispatched to unit tablet, incident status set to 'Responding'",
        "1. Unit ID: UNIT-BFP-01\n2. Incident ID: INC-1029\n3. Dispatch timestamp logged",
        5, s5_name
    )
    tc_counter += 1

    add_tc(
        tc_counter,
        "UC-014 - TC19: Manual Overridden Dispatch Selection for Heavy Workload",
        "Verify that administrator can manually override recommendation and assign a secondary unit if primary unit is occupied.",
        "Primary recommended unit status is 'Busy' or 'On Incident'.",
        "Administrator manually selects alternate available unit; dispatch succeeds.",
        "dispatch,override,admin",
        "medium", "major", "functional", "positive", "to-be-automated", "ui",
        "1. Open dispatch selection list\n2. Override top recommendation\n3. Select secondary unit from list\n4. Confirm dispatch",
        "1. Recommendation list shows primary unit busy\n2. Admin selects secondary unit\n3. Secondary unit receives assignment",
        "1. Primary: Busy\n2. Override toggle: True\n3. Selected Unit: DRRMO Team B\n4. Dispatch confirmed",
        5, s5_name
    )
    tc_counter += 1

    add_tc(
        tc_counter,
        "UC-008 - TC20: Response Unit Receives Automated Alert & Acknowledges Incident",
        "Verify that response unit personnel receive dispatch notification on their device and can acknowledge receipt.",
        "Response unit is logged into Response Dashboard. Admin has dispatched an incident.",
        "Response unit receives audible alert, reviews incident summary, and clicks 'Acknowledge'.",
        "acknowledgement,response-unit,alert",
        "high", "critical", "functional", "positive", "to-be-automated", "e2e",
        "1. Receive dispatch alert notification on Responder tablet\n2. Tap alert to open incident assignment view\n3. Click 'Acknowledge Incident'",
        "1. Push/Socket notification triggers popup\n2. Incident location map, type, and severity rendered\n3. Status updated to 'Acknowledged', acknowledgment timestamp logged",
        "1. Incident payload\n2. Details: Fire at Subd. Block 4\n3. Action: Acknowledge",
        5, s5_name
    )
    tc_counter += 1


    # ==========================================
    # SUITE 6: Field Response, Status Tracking & Evidence Upload (UC9, UC10, UC12)
    # ==========================================
    s6_name = "Suite 6: Field Response, Status Tracking & Evidence Upload"
    add_suite(6, s6_name)

    add_tc(
        tc_counter,
        "UC-009 - TC21: Update Incident Status during Operational Response",
        "Verify that response units can update active incident status (Responding -> Arrived on Scene -> Under Control).",
        "Responder has acknowledged incident assignment.",
        "Incident status updated in DB and broadcast live to Admin Dashboard and Citizen App.",
        "responder,status-update,field-ops",
        "high", "major", "functional", "positive", "to-be-automated", "e2e",
        "1. Open active incident on Responder app\n2. Select status 'Arrived on Scene'\n3. Add operational remark (e.g. 'Setting up fire hoses')\n4. Tap 'Update Status'",
        "1. Active incident record open\n2. Status selected from dropdown\n3. Remarks entered\n4. Update succeeds, timestamp recorded, status log created",
        "1. Incident ID: INC-1029\n2. New Status: On Scene\n3. Remarks: Fire line established\n4. Update timestamp",
        6, s6_name
    )
    tc_counter += 1

    add_tc(
        tc_counter,
        "UC-012 - TC22: Upload Official Post-Incident Response Report & Aftermath Evidence",
        "Verify that response units can attach official summary reports, PDF documentation, and aftermath photos to the incident record.",
        "Incident status is 'Under Control' or 'Resolved'. Responder is on post-incident report form.",
        "Files uploaded, attached to Evidence table, linked to incident record.",
        "evidence,post-report,upload,responder",
        "high", "major", "functional", "positive", "to-be-automated", "ui",
        "1. Click 'Upload Response Evidence/Report'\n2. Select aftermath photos and official PDF report\n3. Click 'Submit Files'",
        "1. File picker opens\n2. Files selected\n3. Files uploaded to server/Cloudinary, thumbnails displayed in report record",
        "1. Files: report_doc.pdf, scene_after.jpg\n2. Upload endpoint: /api/post-reports/upload\n3. Response confirmation",
        6, s6_name
    )
    tc_counter += 1

    add_tc(
        tc_counter,
        "UC-010 - TC23: Formally Resolve and Close Incident Record",
        "Verify that response unit can mark incident as 'Resolved' with final resolution summary and cost/casualty details.",
        "On-site operations completed.",
        "Incident status updated to 'Resolved', resolution timestamp recorded, incident moved to resolved list.",
        "resolution,close-incident,responder",
        "critical", "blocker", "functional", "positive", "to-be-automated", "e2e",
        "1. Navigate to incident resolution form\n2. Enter resolution summary, casualty numbers, and property damage estimate\n3. Select status 'Resolved'\n4. Click 'Close Incident'",
        "1. Form displayed\n2. Resolution data populated\n3. Status updated to 'Resolved'\n4. Incident closed, notification sent to Admin and Reporter",
        "1. Casualties: 0, Injured: 2\n2. Summary: Fire extinguished successfully\n3. Status: RESOLVED",
        6, s6_name
    )
    tc_counter += 1


    # ==========================================
    # SUITE 7: Interactive Geospatial Mapping & Geofencing (UC11)
    # ==========================================
    s7_name = "Suite 7: Interactive Geospatial Mapping & Geofencing"
    add_suite(7, s7_name)

    add_tc(
        tc_counter,
        "UC-011 - TC24: Render Interactive Geospatial Map with Color-Coded Incident Markers",
        "Verify that Leaflet map loads correctly with custom color markers representing different incident categories.",
        "User is logged in and navigates to Map View.",
        "Interactive map renders with tiles, zoom controls, and incident markers color-coded by category (Red=Fire, Amber=Accident, Blue=Crime).",
        "map,leaflet,gis,markers",
        "high", "major", "smoke", "positive", "to-be-automated", "ui",
        "1. Navigate to Interactive Map screen\n2. Observe map tile loading and marker rendering\n3. Verify marker colors against legend",
        "1. Map container initializes with correct center coordinates\n2. Incident pins rendered at exact lat/long positions\n3. Red markers for Fire, Blue for Medical/Crime",
        "1. Map view\n2. GeoJSON pins\n3. Legend items",
        7, s7_name
    )
    tc_counter += 1

    add_tc(
        tc_counter,
        "UC-011 - TC25: Apply Barangay Geofencing Boundaries to Filter Incidents",
        "Verify that selecting a barangay zone filters map markers to display only incidents within that polygon boundary.",
        "Geofence polygon boundaries defined for all Talisay City barangays in database.",
        "Map highlights selected barangay boundary line and hides markers outside the polygon.",
        "geofencing,gis,barangay,boundary",
        "high", "major", "functional", "positive", "to-be-automated", "ui",
        "1. Open Barangay Geofence filter dropdown\n2. Select 'Barangay Poblacion'\n3. Observe map update",
        "1. Dropdown populated with barangays\n2. Polygon boundary overlay rendered on map\n3. Map markers filtered to show only those falling within Poblacion boundary",
        "1. Barangay: Poblacion\n2. GeoJSON Polygon\n3. Filtered markers",
        7, s7_name
    )
    tc_counter += 1

    add_tc(
        tc_counter,
        "UC-011 - TC26: Interact with Map Marker Popup to View Full Incident Quick Summary",
        "Verify that clicking on any incident pin on the map opens a popup with summary details and a direct link to full report.",
        "Incidents are displayed on interactive map.",
        "Marker click opens popup displaying incident title, code, status badge, reporter timestamp, and 'View Details' button.",
        "map,popup,ui,gis",
        "medium", "normal", "functional", "positive", "to-be-automated", "ui",
        "1. Click on an active incident marker pin on map\n2. Inspect popup card information\n3. Click 'View Full Details' link",
        "1. Marker pin selected\n2. Popup window opens smoothly over map pin\n3. Details match incident record; clicking link redirects to detailed incident view",
        "1. Marker click\n2. Popup data: INC-1029, Fire, Active\n3. Redirect URL",
        7, s7_name
    )
    tc_counter += 1


    # ==========================================
    # SUITE 8: Real-Time Analytics & ML Trend Forecasting (UC16)
    # ==========================================
    s8_name = "Suite 8: Real-Time Analytics & ML Trend Forecasting"
    add_suite(8, s8_name)

    add_tc(
        tc_counter,
        "UC-016 - TC27: View Real-Time Analytics Dashboard Summary Metrics & Charts",
        "Verify that Analytics Dashboard displays accurate summary cards (total incidents, avg response time, resolution rate) and distribution charts.",
        "Historical incident data exists in database. User has Analytics access permission.",
        "Dashboard loads total counts, response time metrics, pie charts by incident type, and bar charts by barangay.",
        "analytics,dashboard,metrics,charts",
        "high", "major", "smoke", "positive", "to-be-automated", "ui",
        "1. Navigate to Analytics Dashboard\n2. Inspect KPI summary cards\n3. Review Incident Type distribution pie chart and Barangay ranking bar chart",
        "1. Analytics page loaded\n2. Cards display aggregated statistics (e.g. Total: 142, Avg Response: 8.5 mins)\n3. Charts render accurately using real backend data",
        "1. Analytics route: /admin/analytics\n2. API response payload\n3. Rendered charts",
        8, s8_name
    )
    tc_counter += 1

    add_tc(
        tc_counter,
        "UC-016 - TC28: Render Spatial Incident Heatmap and Hotspot Analysis Visualizations",
        "Verify that spatial heatmap layer renders incident density clusters highlighting high-risk hotspot zones.",
        "Map view has Heatmap layer toggle enabled.",
        "Heatmap layer overlays thermal gradient (Red = high density hotspot, Yellow/Green = low density) over map.",
        "heatmap,hotspot,analytics,gis",
        "high", "major", "functional", "positive", "to-be-automated", "ui",
        "1. Select 'Heatmap View' tab on Analytics page\n2. Set intensity radius and date range filter\n3. Observe geospatial heatmap rendering",
        "1. Heatmap layer initializes\n2. Thermal color gradient overlays high incident density areas\n3. Hotspots clearly visible over specific barangays",
        "1. Heatmap toggle: On\n2. Date range: Last 30 days\n3. Density clusters",
        8, s8_name
    )
    tc_counter += 1

    add_tc(
        tc_counter,
        "UC-016 - TC29: Execute 7-Day SARIMA Machine Learning Incident Trend Forecasting Model",
        "Verify that calling the ML analytics service generates a 7-day predicted incident volume line graph with confidence interval bands.",
        "ML Python service running on port 5000 / integrated API endpoint. Historical incident data available.",
        "ML forecast returned JSON payload, rendered as predicted trend line with shaded confidence interval.",
        "ml,forecasting,sarima,analytics,ai",
        "critical", "blocker", "functional", "positive", "automated", "api",
        "1. Click 'Generate Trend Forecast'\n2. Trigger call to /api/analytics/forecast or ML service endpoint\n3. Inspect 7-day predicted output graph and accuracy rate",
        "1. Request sent to ML Service\n2. SARIMA model executes time-series prediction\n3. 7-day forecasted line graph rendered with predicted values per day and confidence bounds",
        "1. ML Endpoint: GET /ml-forecast/incidents\n2. Model params: SARIMA(1,1,1)(1,1,1)7\n3. Output: 7 daily predictions + confidence bands",
        8, s8_name
    )
    tc_counter += 1

    add_tc(
        tc_counter,
        "UC-016 - TC30: Dynamic Real-Time Analytics Chart Refresh on New Incident Ingestion",
        "Verify that when a new incident is submitted, connected analytics charts update live via WebSocket without requiring manual page reload.",
        "Admin is viewing Analytics Dashboard. System receives a new incident submission.",
        "Summary card count increments, charts re-render with new data point in real-time.",
        "socket,realtime,analytics,live-update",
        "medium", "normal", "functional", "positive", "automated", "e2e",
        "1. Keep Analytics Dashboard open\n2. Trigger a new incident creation via API or Mobile app\n3. Observe live chart update",
        "1. Dashboard open\n2. New incident ingested\n3. Socket event 'analytics_update' received; total count card increments by +1 and pie chart updates",
        "1. Initial count: 142\n2. Socket event trigger\n3. Updated count: 143",
        8, s8_name
    )
    tc_counter += 1


    # ==========================================
    # SUITE 9: System Administration, RBAC & Report Generation (UC15, UC17, UC18)
    # ==========================================
    s9_name = "Suite 9: System Administration, RBAC & Report Generation"
    add_suite(9, s9_name)

    add_tc(
        tc_counter,
        "UC-015 - TC31: Generate and Export Incident Summary Reports in PDF, Excel, and CSV Formats",
        "Verify that authorized users can select report parameters, apply filters, and download generated reports in PDF, XLSX, or CSV formats.",
        "User has report generation privileges. Incident data exists for selected date range.",
        "Report compiled on backend, file download triggered, record saved in Generated Reports log.",
        "export,reports,pdf,excel,csv",
        "high", "major", "functional", "positive", "to-be-automated", "e2e",
        "1. Navigate to Report Generation page\n2. Select Report Type: 'Monthly Incident Summary'\n3. Select Filters: Date Range = 'Current Month', Export Format = 'PDF'\n4. Click 'Generate & Download Report'",
        "1. Report options selected\n2. Filters applied\n3. Format chosen\n4. Server generates PDF document, browser initiates file download (e.g. Incident_Summary_2026_08.pdf)",
        "1. Report Type: Summary\n2. Format: PDF\n3. Date range: 2026-08-01 to 2026-08-31\n4. Output file",
        9, s9_name
    )
    tc_counter += 1

    add_tc(
        tc_counter,
        "UC-017 - TC32: Manage User Accounts (Create, Update, Activate, Deactivate)",
        "Verify that administrators can create new user accounts, update profile roles/barangays, and toggle active/inactive account status.",
        "Administrator logged in with full system administration privileges.",
        "User account created/modified in database; welcome email with credentials sent to user.",
        "user-management,admin,accounts,rbac",
        "critical", "blocker", "functional", "positive", "to-be-automated", "ui",
        "1. Navigate to User Management section\n2. Click 'Add New User'\n3. Fill in Name, Email, Contact, Role ('responder'), and assigned Response Unit\n4. Click 'Save User'\n5. Toggle user account status to 'Deactivated'",
        "1. User table loaded\n2. Add user modal opens\n3. Details entered\n4. User account created, listed in table\n5. User status updated to Inactive; deactivated user cannot log in",
        "1. User details\n2. Role: responder\n3. Unit: BFP Station 1\n4. Status: Deactive",
        9, s9_name
    )
    tc_counter += 1

    add_tc(
        tc_counter,
        "UC-018 - TC33: Configure Incident Categories & Role-Based Access Control (RBAC) Settings",
        "Verify that administrator can add/edit incident types (name, color, icon) and configure RBAC permission matrix system-wide.",
        "Administrator logged in with System Configuration access.",
        "Incident types updated, permission matrix saved, changes enforced across system APIs.",
        "system-config,rbac,incident-types,admin",
        "high", "critical", "functional", "positive", "to-be-automated", "ui",
        "1. Open System Configuration -> Incident Types\n2. Add new category 'Chemical Leak' with color '#FF0055' and icon 'hazard'\n3. Navigate to RBAC Settings panel\n4. Update permission checkboxes for 'responder' role\n5. Click 'Save Configuration'",
        "1. Config panel open\n2. New incident type added and saved\n3. RBAC matrix updated\n4. Permissions saved; system immediately enforces updated role permissions",
        "1. Category: Chemical Leak, Color: #FF0055, Icon: hazard\n2. Role permissions payload\n3. Save configuration",
        9, s9_name
    )
    tc_counter += 1


    # Write out to CSV file with proper quoting
    test_file = 'GAOIRS_Test_Cases_Qase_Import.csv'
    with open(test_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f, quoting=csv.QUOTE_MINIMAL)
        writer.writerow(headers)
        writer.writerows(rows)

    print(f'Successfully generated {test_file} with {len(rows)} total rows ({tc_counter - 1} test cases across 9 suites).')

if __name__ == '__main__':
    build_qase_csv()
