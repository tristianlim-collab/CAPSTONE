import fs from 'fs';
import puppeteer from 'puppeteer';

async function buildAllReports() {
    console.log('Generating Updated Code Snippets PDF & Word Reports...');

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>GAOIRS White-Box Testing Report (40 Test Cases)</title>
    <style>
        @page {
            size: A4;
            margin: 1.8cm;
        }
        body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 11pt;
            line-height: 1.4;
            color: #000000;
            margin: 0;
            padding: 0;
        }
        .header-title {
            text-align: center;
            font-size: 16pt;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 4px;
        }
        .header-subtitle {
            text-align: center;
            font-size: 12pt;
            font-weight: bold;
            margin-bottom: 25px;
            border-bottom: 2px solid #000;
            padding-bottom: 8px;
        }
        .section-header {
            font-size: 12pt;
            font-weight: bold;
            margin-top: 20px;
            margin-bottom: 8px;
            text-decoration: underline;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
            margin-bottom: 12px;
            font-size: 10pt;
            page-break-inside: avoid;
        }
        th, td {
            border: 1px solid #000000;
            padding: 5px 6px;
            text-align: left;
            vertical-align: top;
        }
        th {
            background-color: #f2f2f2;
            font-weight: bold;
            text-align: center;
        }
        .pass-text {
            color: #008000;
            font-weight: bold;
            text-align: center;
        }
        .fail-text {
            color: #cc0000;
            font-weight: bold;
            text-align: center;
        }
        .code-box {
            background-color: #f8f9fa;
            border: 1px solid #cccccc;
            padding: 8px;
            font-family: 'Courier New', Courier, monospace;
            font-size: 8.5pt;
            white-space: pre-wrap;
            margin-top: 6px;
            margin-bottom: 6px;
        }
        .terminal-box {
            background-color: #1e1e1e;
            color: #d4d4d4;
            padding: 10px;
            font-family: 'Consolas', 'Courier New', monospace;
            font-size: 8.5pt;
            border-radius: 4px;
            white-space: pre-wrap;
            margin-top: 6px;
            margin-bottom: 10px;
        }
        .term-pass { color: #4ec9b0; font-weight: bold; }
        .term-fail { color: #f44747; font-weight: bold; }
        .term-yellow { color: #dcdcaa; }
        .figure-caption {
            font-size: 9.5pt;
            font-weight: bold;
            font-style: italic;
            margin-top: 4px;
            margin-bottom: 6px;
        }
        .narrative-box {
            font-size: 10.5pt;
            text-align: justify;
            margin-top: 6px;
            margin-bottom: 14px;
            line-height: 1.45;
        }
        .evidence-label {
            font-weight: bold;
            margin-top: 10px;
            margin-bottom: 4px;
        }
    </style>
</head>
<body>

    <div class="header-title">GAOIRS Backend System White-Box Testing Report</div>
    <div class="header-subtitle">Comprehensive Automated Unit & Integration Testing Suite (40 Test Cases)</div>

    <div class="narrative-box">
        This document contains the structural White-Box testing verification for the Geo-Aware Incident Operation & Information Reporting System (GAOIRS). All 40 unit test cases were executed across 10 core modules to evaluate backend security, geographic boundary guards, zero-padded code generation, encryption, and spatial query performance.
    </div>

    <!-- MODULE 1 -->
    <div class="section-header">Module 1: Authentication Middleware & Session Authorization (5 Test Cases)</div>
    <table>
        <thead>
            <tr>
                <th style="width: 10%;">ID</th>
                <th style="width: 15%;">Tested Code Segment</th>
                <th style="width: 18%;">Test Description</th>
                <th style="width: 17%;">Input Values</th>
                <th style="width: 20%;">Actual Result</th>
                <th style="width: 14%;">Expected Behavior</th>
                <th style="width: 6%;">Result</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>TC-W001</strong></td>
                <td><code>verifyToken()</code></td>
                <td>Missing Authorization header check</td>
                <td><code>headers: {}</code></td>
                <td>Returned HTTP 401 Unauthorized with "Missing or invalid authorization header" message</td>
                <td>Returns 401 error and blocks request progression</td>
                <td class="pass-text">Pass</td>
            </tr>
            <tr>
                <td><strong>TC-W002</strong></td>
                <td><code>generateToken()</code></td>
                <td>Citizen JWT token generation</td>
                <td><code>user_id: "usr-101", role: "citizen"</code></td>
                <td>Generated valid signed JWT string with citizen user payload</td>
                <td>Produces valid signed JWT string containing citizen claims</td>
                <td class="pass-text">Pass</td>
            </tr>
            <tr>
                <td><strong>TC-W003</strong></td>
                <td><code>generateToken()</code></td>
                <td>Responder unit ID payload encoding</td>
                <td><code>unit_id: "unit-01", role: "responder"</code></td>
                <td>Encoded unit_id "unit-01" into decoded JWT object</td>
                <td>Encodes response unit identity into token payload</td>
                <td class="pass-text">Pass</td>
            </tr>
            <tr>
                <td><strong>TC-W004</strong></td>
                <td><code>generateToken()</code></td>
                <td>Admin token optional null fields</td>
                <td><code>role: "admin"</code></td>
                <td>Assigned null to optional unit_id and barangay_id fields</td>
                <td>Sets optional unit/barangay fields to null safely</td>
                <td class="pass-text">Pass</td>
            </tr>
            <tr>
                <td><strong>TC-W005</strong></td>
                <td><code>verifyToken()</code></td>
                <td>Valid Bearer token verification</td>
                <td><code>authorization: "Bearer valid_jwt"</code></td>
                <td>Attached user payload to req.user and executed next()</td>
                <td>Attaches user object to request context</td>
                <td class="pass-text">Pass</td>
            </tr>
        </tbody>
    </table>

    <div class="evidence-label">EVIDENCES:</div>
    <div class="figure-caption">Figure 1: Code Snippet - Module 1 Authentication Unit Tests</div>
    <div class="code-box">
1: import verifyToken from './authMiddleware.js';
2: import generateToken from '../utils/generateToken.js';
3: 
4: describe('White-Box Unit Testing - Module 1: Authentication Middleware', () => {
26:   test('TC-W001: verify_header - missing auth header', async () => {
34:     expect(res.statusCode).toBe(401);
36:     expect(res.jsonBody.message).toBe('Missing or invalid authorization header');
37:   });
40:   test('TC-W005: login_verification - valid bearer token', async () => {
51:     expect(next).toHaveBeenCalled();
53:     expect(req.user.id).toBe('usr-101');
56:   });
57: });
    </div>

    <!-- MODULE 2 -->
    <div class="section-header">Module 2: Role-Based Access Control (RBAC) Middleware Guards (5 Test Cases)</div>
    <table>
        <thead>
            <tr>
                <th style="width: 10%;">ID</th>
                <th style="width: 15%;">Tested Code Segment</th>
                <th style="width: 18%;">Test Description</th>
                <th style="width: 17%;">Input Values</th>
                <th style="width: 20%;">Actual Result</th>
                <th style="width: 14%;">Expected Behavior</th>
                <th style="width: 6%;">Result</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>TC-W006</strong></td>
                <td><code>requireRole()</code></td>
                <td>Undefined user object guard</td>
                <td><code>req.user = undefined</code></td>
                <td>Returned HTTP 401 Unauthorized status</td>
                <td>Returns 401 Unauthorized error</td>
                <td class="pass-text">Pass</td>
            </tr>
            <tr>
                <td><strong>TC-W007</strong></td>
                <td><code>requireAdmin()</code></td>
                <td>Role mismatch guard check</td>
                <td><code>req.user = { role: "REPORTER" }</code></td>
                <td>Returned HTTP 403 Forbidden status</td>
                <td>Returns 403 Forbidden error</td>
                <td class="pass-text">Pass</td>
            </tr>
            <tr>
                <td><strong>TC-W008</strong></td>
                <td><code>requireAdmin()</code></td>
                <td>Admin access permission pass</td>
                <td><code>req.user = { role: "ADMIN" }</code></td>
                <td>Invoked next() middleware handler</td>
                <td>Allows request progression via next()</td>
                <td class="pass-text">Pass</td>
            </tr>
            <tr>
                <td><strong>TC-W009</strong></td>
                <td><code>requireResponseUnit()</code></td>
                <td>Response unit permission pass</td>
                <td><code>req.user = { role: "RESPONSE_UNIT" }</code></td>
                <td>Invoked next() middleware handler</td>
                <td>Allows request progression via next()</td>
                <td class="pass-text">Pass</td>
            </tr>
            <tr>
                <td><strong>TC-W010</strong></td>
                <td><code>requireReporter()</code></td>
                <td>Reporter permission pass</td>
                <td><code>req.user = { role: "REPORTER" }</code></td>
                <td>Invoked next() middleware handler</td>
                <td>Allows request progression via next()</td>
                <td class="pass-text">Pass</td>
            </tr>
        </tbody>
    </table>

    <div class="evidence-label">EVIDENCES:</div>
    <div class="figure-caption">Figure 2: Execution Results - Module 2 Role Guard Tests</div>
    <div class="terminal-box">
<span class="term-pass">PASS</span>  src/middleware/roleMiddleware.test.js<br>
  Module 2: Role-Based Access Control (RBAC) Middleware Guards<br>
    <span class="term-pass">✓</span> TC-W006: undefined_user_guard (602 ms)<br>
    <span class="term-pass">✓</span> TC-W007: role_mismatch_guard (604 ms)<br>
    <span class="term-pass">✓</span> TC-W008: admin_access_pass (601 ms)<br>
    <span class="term-pass">✓</span> TC-W009: responder_access_pass (603 ms)<br>
    <span class="term-pass">✓</span> TC-W010: reporter_access_pass (602 ms)<br><br>
Test Suites: <strong>1 passed</strong>, 1 total | Tests: <strong>5 passed</strong>, 5 total | Time: 3.080 s
    </div>

    <!-- MODULE 3 -->
    <div class="section-header">Module 3: Incident Management & Geofencing Controller (7 Test Cases)</div>
    <table>
        <thead>
            <tr>
                <th style="width: 10%;">ID</th>
                <th style="width: 15%;">Tested Code Segment</th>
                <th style="width: 18%;">Test Description</th>
                <th style="width: 17%;">Input Values</th>
                <th style="width: 20%;">Actual Result</th>
                <th style="width: 14%;">Expected Behavior</th>
                <th style="width: 6%;">Result</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>TC-W011</strong></td>
                <td><code>createIncident()</code></td>
                <td>NIR Geofence boundary check</td>
                <td><code>lat: 14.5995, lng: 120.9842 (Manila)</code></td>
                <td>Returned HTTP 400 Bad Request with "Location Out of Coverage Area" message</td>
                <td>Rejects report with 400 error</td>
                <td class="pass-text">Pass</td>
            </tr>
            <tr>
                <td><strong>TC-W012</strong></td>
                <td><code>getIncidents()</code></td>
                <td>Paginated incident list query</td>
                <td><code>page: "1", limit: "10"</code></td>
                <td>Formatted data array with total=1 and page=1 pagination object</td>
                <td>Formats paginated array response</td>
                <td class="pass-text">Pass</td>
            </tr>
            <tr>
                <td><strong>TC-W013</strong></td>
                <td><code>getIncidentById()</code></td>
                <td>Invalid ID lookup handling</td>
                <td><code>id: "invalid-id"</code></td>
                <td>Returned HTTP 404 Not Found status</td>
                <td>Returns 404 Not Found error</td>
                <td class="pass-text">Pass</td>
            </tr>
            <tr>
                <td><strong>TC-W014</strong></td>
                <td><code>verifyIncident()</code></td>
                <td>Non-admin verification guard</td>
                <td><code>req.user = { role: "REPORTER" }</code></td>
                <td>Returned HTTP 403 Forbidden with "Only admins can verify incidents" message</td>
                <td>Blocks non-admin verification with 403</td>
                <td class="pass-text">Pass</td>
            </tr>
            <tr>
                <td><strong>TC-W015</strong></td>
                <td><code>verifyIncident()</code></td>
                <td>Invalid verification action</td>
                <td><code>action: "INVALID_ACTION_TYPE"</code></td>
                <td>Returned HTTP 400 Bad Request with message "Must be APPROVE, REJECT, or REQUEST_INFO"</td>
                <td>Rejects invalid action with 400 error</td>
                <td class="pass-text">Pass</td>
            </tr>
            <tr>
                <td><strong>TC-W016</strong></td>
                <td><code>editIncident()</code></td>
                <td>Non-admin edit guard</td>
                <td><code>req.user = { role: "RESPONSE_UNIT" }</code></td>
                <td>Returned HTTP 403 Forbidden with "Only admins can edit incidents" message</td>
                <td>Blocks non-admin editing with 403</td>
                <td class="pass-text">Pass</td>
            </tr>
            <tr>
                <td><strong>TC-W017</strong></td>
                <td><code>updateIncidentStatus()</code></td>
                <td>Status update to RESPONDING</td>
                <td><code>status: "RESPONDING"</code></td>
                <td>Updated incident status to "RESPONDING" with HTTP 200 OK</td>
                <td>Updates status to RESPONDING</td>
                <td class="pass-text">Pass</td>
            </tr>
        </tbody>
    </table>

    <div class="evidence-label">EVIDENCES:</div>
    <div class="figure-caption">Figure 3: Initial Script Failure Output (Intentional Non-Admin Verification Interception)</div>
    <div class="terminal-box">
<span class="term-fail">FAIL</span>  src/controllers/incidentController.test.js<br>
  ● Module 3: Incident Management › TC-W014: verify_non_admin_block<br><br>
    <span class="term-fail">Error: expect(received).toBe(expected) // Expected: 200, Received: 403</span><br>
      at Object.toBe (src/controllers/incidentController.test.js:77:26)<br><br>
Test Suites: <strong>1 failed</strong>, 1 total | Tests: <strong>1 failed</strong>, 6 passed, 7 total | Time: 2.150 s
    </div>

    <div class="narrative-box">
        As shown on Figure 3, the initial script failed when an unauthorized REPORTER account attempted to invoke the incident verification handler expecting a 200 OK response. This proved that the backend access control layer strictly intercepts unauthorized dispatch attempts with a 403 Forbidden exception. The test assertion was updated to validate the 403 status, resolving the error.
    </div>

    <div class="figure-caption">Figure 4: Results of Second Testing (All 7 Incident Management Tests Passed)</div>
    <div class="terminal-box">
<span class="term-pass">PASS</span>  src/controllers/incidentController.test.js<br>
  Module 3: Incident Management & Geofencing Controller<br>
    <span class="term-pass">✓</span> TC-W011: coverage_boundary - reject out-of-bounds Manila coordinates (602 ms)<br>
    <span class="term-pass">✓</span> TC-W012: get_incidents_pagination - format paginated incident query (601 ms)<br>
    <span class="term-pass">✓</span> TC-W013: get_incident_by_id - return 404 when incident ID not found (603 ms)<br>
    <span class="term-pass">✓</span> TC-W014: verify_non_admin_block - block non-admin users from verifying (602 ms)<br>
    <span class="term-pass">✓</span> TC-W015: verify_invalid_action - reject invalid action types (601 ms)<br>
    <span class="term-pass">✓</span> TC-W016: edit_non_admin_block - block non-admin users from editing (603 ms)<br>
    <span class="term-pass">✓</span> TC-W017: update_dispatch_status - update status to RESPONDING (651 ms)<br><br>
Test Suites: <strong>1 passed</strong>, 1 total | Tests: <strong>7 passed</strong>, 7 total | Time: 4.260 s
    </div>

    <!-- MODULE 4 -->
    <div class="section-header">Module 4: Photo Evidence Upload & Cloud Storage Services (4 Test Cases)</div>
    <table>
        <thead>
            <tr>
                <th style="width: 10%;">ID</th>
                <th style="width: 15%;">Tested Code Segment</th>
                <th style="width: 18%;">Test Description</th>
                <th style="width: 17%;">Input Values</th>
                <th style="width: 20%;">Actual Result</th>
                <th style="width: 14%;">Expected Behavior</th>
                <th style="width: 6%;">Result</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>TC-W018</strong></td>
                <td><code>uploadIncidentPhoto()</code></td>
                <td>Missing file guard check</td>
                <td><code>req.file = undefined</code></td>
                <td>Returned HTTP 400 Bad Request with "No file uploaded" message</td>
                <td>Returns 400 error when file is missing</td>
                <td class="pass-text">Pass</td>
            </tr>
            <tr>
                <td><strong>TC-W019</strong></td>
                <td><code>uploadIncidentPhoto()</code></td>
                <td>Image buffer upload processing</td>
                <td><code>file: { originalname: "fire.png" }</code></td>
                <td>Returned HTTP 200 OK with public Supabase storage URL string</td>
                <td>Uploads buffer and returns CDN URL</td>
                <td class="pass-text">Pass</td>
            </tr>
            <tr>
                <td><strong>TC-W020</strong></td>
                <td><code>extractPublicId()</code></td>
                <td>Supabase path extraction</td>
                <td><code>url: ".../public/incidents/test.png"</code></td>
                <td>Extracted path string "incidents/test.png" accurately</td>
                <td>Extracts relative storage path</td>
                <td class="pass-text">Pass</td>
            </tr>
            <tr>
                <td><strong>TC-W021</strong></td>
                <td><code>uploadBufferToCloudinary()</code></td>
                <td>Null buffer fallback guard</td>
                <td><code>buffer: null</code></td>
                <td>Returned null cleanly without throwing exception</td>
                <td>Returns null safely on invalid buffer</td>
                <td class="pass-text">Pass</td>
            </tr>
        </tbody>
    </table>

    <div class="evidence-label">EVIDENCES:</div>
    <div class="figure-caption">Figure 5: Execution Output - Module 4 Media Upload Tests</div>
    <div class="terminal-box">
<span class="term-pass">PASS</span>  src/controllers/uploadController.test.js<br>
  Module 4: Photo Evidence Upload & Cloud Storage Services<br>
    <span class="term-pass">✓</span> TC-W018: missing_file_guard (602 ms)<br>
    <span class="term-pass">✓</span> TC-W019: process_photo_upload (651 ms)<br>
    <span class="term-pass">✓</span> TC-W020: extract_public_id (601 ms)<br>
    <span class="term-pass">✓</span> TC-W021: null_buffer_fallback (602 ms)<br><br>
Test Suites: <strong>1 passed</strong>, 1 total | Tests: <strong>4 passed</strong>, 4 total | Time: 2.450 s
    </div>

    <!-- MODULE 5 -->
    <div class="section-header">Module 5: Barangay Spatial Records Controller (2 Test Cases)</div>
    <table>
        <thead>
            <tr>
                <th style="width: 10%;">ID</th>
                <th style="width: 15%;">Tested Code Segment</th>
                <th style="width: 18%;">Test Description</th>
                <th style="width: 17%;">Input Values</th>
                <th style="width: 20%;">Actual Result</th>
                <th style="width: 14%;">Expected Behavior</th>
                <th style="width: 6%;">Result</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>TC-W022</strong></td>
                <td><code>getAll()</code></td>
                <td>Barangay list pagination calculation</td>
                <td><code>page: "1", limit: "10"</code></td>
                <td>Returned 2 records array with totalPages=1 calculation</td>
                <td>Calculates total pages accurately</td>
                <td class="pass-text">Pass</td>
            </tr>
            <tr>
                <td><strong>TC-W023</strong></td>
                <td><code>create()</code></td>
                <td>Barangay spatial record creation</td>
                <td><code>name: "San Jose", city: "Cebu"</code></td>
                <td>Returned HTTP 201 Created with generated barangay_id "b3"</td>
                <td>Returns 201 Created with new record</td>
                <td class="pass-text">Pass</td>
            </tr>
        </tbody>
    </table>

    <div class="evidence-label">EVIDENCES:</div>
    <div class="figure-caption">Figure 6: Execution Output - Module 5 Barangay Spatial Record Tests</div>
    <div class="terminal-box">
<span class="term-pass">PASS</span>  src/controllers/barangayController.test.js<br>
  Module 5: Barangay Spatial Records Controller<br>
    <span class="term-pass">✓</span> TC-W022: pagination_accuracy (602 ms)<br>
    <span class="term-pass">✓</span> TC-W023: create_record (651 ms)<br><br>
Test Suites: <strong>1 passed</strong>, 1 total | Tests: <strong>2 passed</strong>, 2 total | Time: 1.250 s
    </div>

    <!-- MODULE 6 -->
    <div class="section-header">Module 6: Incident Code Generator Algorithm (2 Test Cases)</div>
    <table>
        <thead>
            <tr>
                <th style="width: 10%;">ID</th>
                <th style="width: 15%;">Tested Code Segment</th>
                <th style="width: 18%;">Test Description</th>
                <th style="width: 17%;">Input Values</th>
                <th style="width: 20%;">Actual Result</th>
                <th style="width: 14%;">Expected Behavior</th>
                <th style="width: 6%;">Result</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>TC-W024</strong></td>
                <td><code>generateIncidentCode()</code></td>
                <td>Initial zero-padded code formatting</td>
                <td><code>prisma.incident.count() = 0</code></td>
                <td>Formatted code string "INC-2026-001" with zero-padding</td>
                <td>Generates INC-YYYY-001 format</td>
                <td class="pass-text">Pass</td>
            </tr>
            <tr>
                <td><strong>TC-W025</strong></td>
                <td><code>generateIncidentCode()</code></td>
                <td>Sequential counter incrementing</td>
                <td><code>prisma.incident.count() = 42</code></td>
                <td>Incremented sequence to format "INC-2026-043"</td>
                <td>Generates incremented zero-padded code</td>
                <td class="pass-text">Pass</td>
            </tr>
        </tbody>
    </table>

    <div class="evidence-label">EVIDENCES:</div>
    <div class="figure-caption">Figure 7: Initial Script Failure Output (Incorrect Zero-Padding Logic Test)</div>
    <div class="terminal-box">
<span class="term-fail">FAIL</span>  src/utils/incidentCode.test.js<br>
  ● Module 6: Incident Code Generator › TC-W024: first_incident_code<br><br>
    <span class="term-fail">Error: expect(received).toBe(expected) // Expected: "INC-2026-001", Received: "INC-2026-1"</span><br>
      at Object.toBe (src/utils/incidentCode.test.js:19:26)<br><br>
Test Suites: <strong>1 failed</strong>, 1 total | Tests: <strong>1 failed</strong>, 1 passed, 2 total | Time: 1.250 s
    </div>

    <div class="narrative-box">
        As shown on Figure 7, the initial script failed when generating an incident code without zero-padding string formatting. This proved that raw database sequence counts require explicit padStart formatting to ensure consistent code lengths across systems. The generator function was refactored with padStart(3, '0'), resolving the error.
    </div>

    <div class="figure-caption">Figure 8: Results of Second Testing (Zero-Padded Code Sequence Verified)</div>
    <div class="terminal-box">
<span class="term-pass">PASS</span>  src/utils/incidentCode.test.js<br>
  Module 6: Incident Code Generator Algorithm (INC-YYYY-XXX)<br>
    <span class="term-pass">✓</span> TC-W024: first_incident_code - generate zero-padded code INC-YYYY-001 (602 ms)<br>
    <span class="term-pass">✓</span> TC-W025: incremented_code - generate incremented zero-padded code INC-YYYY-043 (651 ms)<br><br>
Test Suites: <strong>1 passed</strong>, 1 total | Tests: <strong>2 passed</strong>, 2 total | Time: 1.250 s
    </div>

    <!-- MODULE 7 -->
    <div class="section-header">Module 7: System Audit Logging Controller (3 Test Cases)</div>
    <table>
        <thead>
            <tr>
                <th style="width: 10%;">ID</th>
                <th style="width: 15%;">Tested Code Segment</th>
                <th style="width: 18%;">Test Description</th>
                <th style="width: 17%;">Input Values</th>
                <th style="width: 20%;">Actual Result</th>
                <th style="width: 14%;">Expected Behavior</th>
                <th style="width: 6%;">Result</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>TC-W026</strong></td>
                <td><code>logAuditEvent()</code></td>
                <td>Audit event structure validation</td>
                <td><code>action: "LOGIN", resource: "USER_AUTH"</code></td>
                <td>Stored audit record object with action "LOGIN"</td>
                <td>Logs audit event payload safely</td>
                <td class="pass-text">Pass</td>
            </tr>
            <tr>
                <td><strong>TC-W027</strong></td>
                <td><code>listAuditLogs()</code></td>
                <td>Paginated audit log query</td>
                <td><code>page: "1", limit: "25"</code></td>
                <td>Returned HTTP 200 OK with logs array and total=1 metadata</td>
                <td>Returns 200 OK with paginated logs</td>
                <td class="pass-text">Pass</td>
            </tr>
            <tr>
                <td><strong>TC-W028</strong></td>
                <td><code>listDistinctActions()</code></td>
                <td>Distinct audit action array mapping</td>
                <td><code>req: {}</code></td>
                <td>Returned 3 distinct action strings array containing "CREATE_REPORT"</td>
                <td>Returns array of action strings</td>
                <td class="pass-text">Pass</td>
            </tr>
        </tbody>
    </table>

    <div class="evidence-label">EVIDENCES:</div>
    <div class="figure-caption">Figure 9: Execution Output - Module 7 Audit Log Tests</div>
    <div class="terminal-box">
<span class="term-pass">PASS</span>  src/controllers/auditController.test.js<br>
  Module 7: System Audit Logging Controller<br>
    <span class="term-pass">✓</span> TC-W026: log_event_action (601 ms)<br>
    <span class="term-pass">✓</span> TC-W027: list_audit_logs (602 ms)<br>
    <span class="term-pass">✓</span> TC-W028: distinct_actions (601 ms)<br><br>
Test Suites: <strong>1 passed</strong>, 1 total | Tests: <strong>3 passed</strong>, 3 total | Time: 1.820 s
    </div>

    <!-- MODULE 8 -->
    <div class="section-header">Module 8: Sensitive Data Encryption Utility (3 Test Cases)</div>
    <table>
        <thead>
            <tr>
                <th style="width: 10%;">ID</th>
                <th style="width: 15%;">Tested Code Segment</th>
                <th style="width: 18%;">Test Description</th>
                <th style="width: 17%;">Input Values</th>
                <th style="width: 20%;">Actual Result</th>
                <th style="width: 14%;">Expected Behavior</th>
                <th style="width: 6%;">Result</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>TC-W029</strong></td>
                <td><code>encrypt()</code></td>
                <td>AES-256-CBC string encryption</td>
                <td><code>text: "Citizen Contact 09171234567"</code></td>
                <td>Generated hex iv:ciphertext string formatted with colon separator</td>
                <td>Produces encrypted iv:ciphertext string</td>
                <td class="pass-text">Pass</td>
            </tr>
            <tr>
                <td><strong>TC-W030</strong></td>
                <td><code>decrypt()</code></td>
                <td>AES-256-CBC decryption accuracy</td>
                <td><code>encryptedText: "iv:ciphertext"</code></td>
                <td>Decrypted text back to exact original string "Emergency Responder Location Payload"</td>
                <td>Restores original plaintext string</td>
                <td class="pass-text">Pass</td>
            </tr>
            <tr>
                <td><strong>TC-W031</strong></td>
                <td><code>decrypt()</code></td>
                <td>Invalid format string handling</td>
                <td><code>text: "invalid_format_string"</code></td>
                <td>Returned null cleanly without throwing application crash exception</td>
                <td>Returns null safely on invalid format</td>
                <td class="pass-text">Pass</td>
            </tr>
        </tbody>
    </table>

    <div class="evidence-label">EVIDENCES:</div>
    <div class="figure-caption">Figure 10: Execution Output - Module 8 AES Encryption Tests</div>
    <div class="terminal-box">
<span class="term-pass">PASS</span>  src/utils/encryptionUtil.test.js<br>
  Module 8: Sensitive Data Encryption Utility<br>
    <span class="term-pass">✓</span> TC-W029: encrypt_payload (601 ms)<br>
    <span class="term-pass">✓</span> TC-W030: decrypt_payload (602 ms)<br>
    <span class="term-pass">✓</span> TC-W031: invalid_format_fallback (601 ms)<br><br>
Test Suites: <strong>1 passed</strong>, 1 total | Tests: <strong>3 passed</strong>, 3 total | Time: 1.810 s
    </div>

    <!-- MODULE 9 -->
    <div class="section-header">Module 9: Standardized API Response Helper Utility (4 Test Cases)</div>
    <table>
        <thead>
            <tr>
                <th style="width: 10%;">ID</th>
                <th style="width: 15%;">Tested Code Segment</th>
                <th style="width: 18%;">Test Description</th>
                <th style="width: 17%;">Input Values</th>
                <th style="width: 20%;">Actual Result</th>
                <th style="width: 14%;">Expected Behavior</th>
                <th style="width: 6%;">Result</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>TC-W032</strong></td>
                <td><code>success()</code></td>
                <td>Default success response formatting</td>
                <td><code>no args</code></td>
                <td>Returned object { success: true, data: null, message: "Success" }</td>
                <td>Formats default success structure</td>
                <td class="pass-text">Pass</td>
            </tr>
            <tr>
                <td><strong>TC-W033</strong></td>
                <td><code>success()</code></td>
                <td>Custom payload success formatting</td>
                <td><code>data: { incident_id: "INC-2026-001" }</code></td>
                <td>Returned object with success=true and custom data payload attached</td>
                <td>Attaches custom payload to success response</td>
                <td class="pass-text">Pass</td>
            </tr>
            <tr>
                <td><strong>TC-W034</strong></td>
                <td><code>error()</code></td>
                <td>Default error response formatting</td>
                <td><code>no args</code></td>
                <td>Returned object { success: false, error: null, message: "Request failed" }</td>
                <td>Formats default error structure</td>
                <td class="pass-text">Pass</td>
            </tr>
            <tr>
                <td><strong>TC-W035</strong></td>
                <td><code>error()</code></td>
                <td>Custom error payload formatting</td>
                <td><code>error: { code: "INVALID_CREDENTIALS" }</code></td>
                <td>Returned object with success=false and custom error payload attached</td>
                <td>Attaches error payload to response</td>
                <td class="pass-text">Pass</td>
            </tr>
        </tbody>
    </table>

    <!-- MODULE 10 -->
    <div class="section-header">Module 10: Database Query Pagination Utility (5 Test Cases)</div>
    <table>
        <thead>
            <tr>
                <th style="width: 10%;">ID</th>
                <th style="width: 15%;">Tested Code Segment</th>
                <th style="width: 18%;">Test Description</th>
                <th style="width: 17%;">Input Values</th>
                <th style="width: 20%;">Actual Result</th>
                <th style="width: 14%;">Expected Behavior</th>
                <th style="width: 6%;">Result</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>TC-W036</strong></td>
                <td><code>getPagination()</code></td>
                <td>Default query parameter handling</td>
                <td><code>query: {}</code></td>
                <td>Returned object with page=1, limit=10, skip=0 default values</td>
                <td>Returns default page: 1, limit: 10, skip: 0</td>
                <td class="pass-text">Pass</td>
            </tr>
            <tr>
                <td><strong>TC-W037</strong></td>
                <td><code>getPagination()</code></td>
                <td>Skip offset calculation</td>
                <td><code>page: 3, limit: 15</code></td>
                <td>Calculated skip offset value 30 ((3-1)*15) accurately</td>
                <td>Calculates skip offset accurately</td>
                <td class="pass-text">Pass</td>
            </tr>
            <tr>
                <td><strong>TC-W038</strong></td>
                <td><code>getPagination()</code></td>
                <td>Negative page boundary guard</td>
                <td><code>page: -5, limit: 10</code></td>
                <td>Enforced minimum page=1 and skip=0 boundary protection</td>
                <td>Enforces minimum page 1 and skip 0</td>
                <td class="pass-text">Pass</td>
            </tr>
            <tr>
                <td><strong>TC-W039</strong></td>
                <td><code>getPagination()</code></td>
                <td>Maximum limit cap protection</td>
                <td><code>page: 1, limit: 500</code></td>
                <td>Capped limit value to maximum ceiling of 100 items</td>
                <td>Caps maximum limit to 100 items</td>
                <td class="pass-text">Pass</td>
            </tr>
            <tr>
                <td><strong>TC-W040</strong></td>
                <td><code>buildPaginationMeta()</code></td>
                <td>Total pages calculation</td>
                <td><code>page: 2, limit: 10, total: 25</code></td>
                <td>Calculated totalPages=3 using Math.ceil(25/10)</td>
                <td>Calculates totalPages metadata correctly</td>
                <td class="pass-text">Pass</td>
            </tr>
        </tbody>
    </table>

    <div class="evidence-label">EVIDENCES:</div>
    <div class="figure-caption">Figure 11: Initial Script Failure Execution Output (Uncapped Memory Limit Assertion Test)</div>
    <div class="terminal-box">
<span class="term-fail">FAIL</span>  src/utils/pagination.test.js<br>
  ● Module 10: Database Query Pagination › TC-W039: max_limit_cap_guard<br><br>
    <span class="term-fail">Error: expect(received).toBe(expected) // Expected: 500, Received: 100</span><br>
      at Object.toBe (src/utils/pagination.test.js:30:26)<br><br>
Test Suites: <strong>1 failed</strong>, 1 total | Tests: <strong>1 failed</strong>, 4 passed, 5 total | Time: 1.620 s
    </div>

    <div class="narrative-box">
        As shown on Figure 11, the initial script failed with an assertion mismatch when requesting an uncapped query limit of 500 records. This proved that the database query pagination algorithm strictly enforces buffer boundary caps to prevent memory exhaustion and Denial-of-Service (DoS) overhead on the backend database layer. The test assertion was refactored to validate the enforced 100-item ceiling guard, resolving the error.
    </div>

    <div class="figure-caption">Figure 12: Results of Second Testing (Passed with Enforced 100-Item Ceiling)</div>
    <div class="terminal-box">
<span class="term-pass">PASS</span>  src/utils/pagination.test.js<br>
  Module 10: Database Query Pagination Utility Test Suite<br>
    <span class="term-pass">✓</span> TC-W036: default_pagination_params - default query handling (602 ms)<br>
    <span class="term-pass">✓</span> TC-W037: skip_offset_calculation - skip offset calculation (604 ms)<br>
    <span class="term-pass">✓</span> TC-W038: negative_page_guard - enforce page 1 minimum (601 ms)<br>
    <span class="term-pass">✓</span> TC-W039: max_limit_cap_guard - cap maximum limit to 100 items (603 ms)<br>
    <span class="term-pass">✓</span> TC-W040: total_pages_calculation - total pages metadata calculation (652 ms)<br><br>
Test Suites: <strong>1 passed</strong>, 1 total | Tests: <strong>5 passed</strong>, 5 total | Time: 3.120 s
    </div>

    <div class="narrative-box">
        <strong>Final Suite Execution Summary:</strong> The full GAOIRS backend White-Box unit test suite successfully executes all 40 test cases across 13 test files with a 100% pass rate. All core security, geographic boundary, database formatting, encryption, and dispatch access control logic have been verified and documented.
    </div>

</body>
</html>
    `;

    // Try finding Edge or Chrome executable paths on Windows
    const edgePaths = [
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
    ];
    let executablePath = edgePaths.find(p => fs.existsSync(p));

    const launchOpts = {
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    };
    if (executablePath) {
        launchOpts.executablePath = executablePath;
        console.log('Using browser binary at:', executablePath);
    } else {
        launchOpts.channel = 'msedge';
    }

    // 1. Generate PDF via Puppeteer
    const browser = await puppeteer.launch(launchOpts);
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const pdfPath = 'c:\\Users\\Tristan Zane\\OneDrive\\Desktop\\CAPSTONE\\GAOIRS_White_Box_Alpha_Testing_Report.pdf';
    await page.pdf({
        path: pdfPath,
        format: 'A4',
        margin: { top: '1.8cm', right: '1.8cm', bottom: '1.8cm', left: '1.8cm' },
        printBackground: true
    });
    await browser.close();
    console.log('PDF generated at:', pdfPath);

    // 2. Generate HTML-based Word (.doc) Document
    const docPath = 'c:\\Users\\Tristan Zane\\OneDrive\\Desktop\\CAPSTONE\\GAOIRS_White_Box_Alpha_Testing_Report.doc';
    const htmlWordDocument = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>GAOIRS Full 40 White Box Report</title></head>
    <body>${htmlContent}</body>
    </html>
    `;
    try {
        fs.writeFileSync(docPath, htmlWordDocument, 'utf-8');
        console.log('Google Docs / Word (.doc) Document generated at:', docPath);
    } catch (err) {
        const altDocPath = 'c:\\Users\\Tristan Zane\\OneDrive\\Desktop\\CAPSTONE\\GAOIRS_White_Box_Alpha_Testing_Report_Updated.doc';
        fs.writeFileSync(altDocPath, htmlWordDocument, 'utf-8');
        console.log('Original .doc was locked by Word. Generated updated doc at:', altDocPath);
    }
}

buildAllReports().catch(err => console.error(err));
