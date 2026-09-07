# GAOIRS White Box Testing Report (Jest Automated Suite)

**System Name:** Geographic AI-Assisted Operational Incident Reporting System (GAOIRS)  
**Testing Tool:** Jest with Node.js ESM  
**Testing Type:** White Box Unit, Middleware, Controller & Helper Utility Testing  
**Environment:** Local Development (localhost:3001) | Supabase PostgreSQL  
**Overall Executive Summary:** **13 Test Suites | 49 Test Cases | 49 Passed | 0 Failed | 100.0% Pass Rate**  
**Total Duration:** 20.874 seconds  

---

### 1. Authentication Middleware Suite (`authMiddleware.test.js`)

| Test Case ID | Description | Expected Outcome | Actual Outcome | Pass/ Fail | Comments |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **WB-001** | Check behavior when Authorization header is completely missing from HTTP request | Return HTTP 401 Unauthorized status with missing token error response | HTTP 401 returned; payload error message: 'Access denied: No authorization token provided' | **Pass** | Jest duration: 14ms |
| **WB-002** | Verify error handling when Authorization header lacks 'Bearer ' string prefix | Return HTTP 401 error blocking invalid token format | HTTP 401 returned; malformed bearer prefix caught before token verification | **Pass** | Jest duration: 1ms |
| **WB-003** | Verify error handling when JWT token verification fails or token is expired | Catch JsonWebTokenError / TokenExpiredError and return 401 Unauthorized | HTTP 401 returned; invalid or expired token caught cleanly by catch block | **Pass** | Jest duration: 2ms |
| **WB-004** | Execute request pipeline with valid signed Bearer token payload | Call next() middleware handler and attach decoded payload object to req.user | `next()` executed; decoded payload attached to `req.user` with valid claims | **Pass** | Jest duration: 39ms |

---

### 2. Supabase Storage Helper Utility Suite (`supabaseClient.test.js`)

| Test Case ID | Description | Expected Outcome | Actual Outcome | Pass/ Fail | Comments |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **WB-005** | Extract internal bucket storage path from full Supabase CDN URL string | Extract relative path string accurately from full URL endpoint | Extracted path matches exact relative key inside incident-photos bucket | **Pass** | Jest duration: 16ms |
| **WB-006** | Process short relative storage path string without throwing exception | Handle short path safely without string out-of-bounds error | Function returns path cleanly without throwing exception | **Pass** | Jest duration: 2ms |
| **WB-007** | Extract path elements from arbitrary third-party or CDN URL | Return last two path elements cleanly for media bucket reference | Path parsed into standard bucket/filename format correctly | **Pass** | Jest duration: 1ms |

---

### 3. File & Media Upload Controller Suite (`uploadController.test.js`)

| Test Case ID | Description | Expected Outcome | Actual Outcome | Pass/ Fail | Comments |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **WB-008** | Execute uploadIncidentPhoto controller when req.file binary object is missing | Return HTTP 400 Bad Request with missing file message | HTTP 400 returned; response message: 'No photo file provided for upload' | **Pass** | Jest duration: 16ms |
| **WB-009** | Process valid image file buffer upload to storage bucket | Upload file to storage and return HTTP 200 with public image URL | File stored; HTTP 200 returned with valid public image CDN URL payload | **Pass** | Jest duration: 2ms |

---

### 4. Cloudinary Image Buffer Helper Service Suite (`cloudinaryService.test.js`)

| Test Case ID | Description | Expected Outcome | Actual Outcome | Pass/ Fail | Comments |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **WB-010** | Call image buffer helper function with undefined or null image buffer input | Return null safely without throwing uncaught runtime exception | Function returns null cleanly when buffer argument is undefined | **Pass** | Jest duration: 34ms |
| **WB-011** | Format binary buffer into base64 data URI string for image processing | Return string matching data:image/jpeg;base64 encoding format | Base64 data URI constructed accurately with valid MIME prefix | **Pass** | Jest duration: 4ms |

---

### 5. Incident Code Format Generator Suite (`incidentCode.test.js`)

| Test Case ID | Description | Expected Outcome | Actual Outcome | Pass/ Fail | Comments |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **WB-012** | Generate incident code string for initial system report (count = 0) | Generate zero-padded string code INC-YYYY-001 with current year | Generated code matches exact pattern: INC-2026-001 | **Pass** | Jest duration: 26ms |
| **WB-013** | Generate incremented incident code when 42 reports exist in database | Generate zero-padded string code INC-YYYY-043 | Generated code matches exact pattern: INC-2026-043 | **Pass** | Jest duration: 2ms |
| **WB-014** | Generate incident code for 3-digit count overflow (count = 104) | Generate un-truncated 3-digit code INC-YYYY-105 gracefully | Generated code matches exact pattern: INC-2026-105 | **Pass** | Jest duration: 16ms |

---

### 6. System Audit Logging Controller Suite (`auditController.test.js`)

| Test Case ID | Description | Expected Outcome | Actual Outcome | Pass/ Fail | Comments |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **WB-015** | Call logAuditEvent helper with null or missing optional log parameters | Handle missing parameter gracefully without throwing reference error | Audit log event created with default fallback parameters | **Pass** | Jest duration: 49ms |
| **WB-016** | Query listAuditLogs with pagination parameters | Return HTTP 200 OK with paginated list of audit records and total count | HTTP 200 returned; audit records array formatted cleanly with pagination metadata | **Pass** | Jest duration: 2ms |
| **WB-017** | Fetch listDistinctActions for audit filter dropdown menu | Map distinct action string names from database into flat array | HTTP 200 returned with array of distinct action strings (e.g. LOGIN, VERIFY_INCIDENT) | **Pass** | Jest duration: 3ms |

---

### 7. Barangay Management Controller Suite (`barangayController.test.js`)

| Test Case ID | Description | Expected Outcome | Actual Outcome | Pass/ Fail | Comments |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **WB-018** | Query getAll barangays with page=1 and limit=10 pagination parameters | Calculate offset correctly and return paginated barangay list | Paginated barangay list returned with accurate skip value (0) and limit (10) | **Pass** | Jest duration: 20ms |
| **WB-019** | Query getById for non-existent barangay ID | Return HTTP 404 Not Found status with clear error message | HTTP 404 returned; payload message: 'Barangay record not found' | **Pass** | Jest duration: 2ms |
| **WB-020** | Execute create controller with valid barangay name and GeoJSON boundary | Create database record and return HTTP 201 Created | HTTP 201 returned; record created with unique ID and GeoJSON boundary payload | **Pass** | Jest duration: 14ms |
| **WB-021** | Execute update controller modifying barangay boundary coordinates | Update existing record in database and return updated GeoJSON object | Database updated; response payload contains updated polygon coordinates | **Pass** | Jest duration: 2ms |
| **WB-022** | Execute deleteItem controller for barangay ID | Remove record from database and return deletion confirmation message | Record deleted; HTTP 200 returned with 'Barangay deleted successfully' | **Pass** | Jest duration: 2ms |

---

### 8. Pagination Helper Utility Suite (`pagination.test.js`)

| Test Case ID | Description | Expected Outcome | Actual Outcome | Pass/ Fail | Comments |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **WB-023** | Call pagination helper with empty request query object ({}) | Return default page = 1, limit = 10, skip = 0 | Parsed options match default values (page: 1, limit: 10, skip: 0) | **Pass** | Jest duration: 6ms |
| **WB-024** | Calculate skip value for query page = 3 and limit = 15 | Calculate skip = (3 - 1) * 15 = 30 accurately | Calculated skip equals 30; limit equals 15 | **Pass** | Jest duration: 3ms |
| **WB-025** | Enforce minimum page bound when page parameter is 0 or negative | Enforce minimum page = 1 cleanly | Page set to 1; negative input neutralized | **Pass** | Jest duration: 2ms |
| **WB-026** | Cap maximum limit value when query requests 500 items | Cap limit to maximum threshold of 100 items to prevent memory overhead | Requested limit 500 capped to 100 | **Pass** | Jest duration: 0ms |
| **WB-027** | Calculate total pages metadata for total count = 45 and limit = 10 | Return totalPages = 5 in pagination metadata object | Metadata totalPages calculated as 5 accurately | **Pass** | Jest duration: 1ms |

---

### 9. JWT Token Generation Utility Suite (`generateToken.test.js`)

| Test Case ID | Description | Expected Outcome | Actual Outcome | Pass/ Fail | Comments |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **WB-028** | Generate signed JWT token for citizen user payload | Return signed 3-part JWT string containing user ID and role claims | JWT token generated; decodes into payload containing expected userId and role | **Pass** | Jest duration: 26ms |
| **WB-029** | Generate signed JWT token for responder user with assigned unit ID | Embed responder unit ID claim inside token payload | JWT token generated; decoded payload contains user role and assigned response unit ID | **Pass** | Jest duration: 5ms |
| **WB-030** | Handle missing optional payload fields cleanly during token sign | Generate valid token without undefined or NaN claim properties | Token signed cleanly; claims omit missing optional fields cleanly | **Pass** | Jest duration: 3ms |

---

### 10. Role-Based Access Control (RBAC) Middleware Suite (`roleMiddleware.test.js`)

| Test Case ID | Description | Expected Outcome | Actual Outcome | Pass/ Fail | Comments |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **WB-031** | Execute role guard when req.user object is completely undefined | Return HTTP 401 Unauthorized status blocking unauthenticated access | HTTP 401 returned; error payload: 'Unauthorized: User session not found' | **Pass** | Jest duration: 4ms |
| **WB-032** | Execute role guard when user role does not match required route role | Return HTTP 403 Forbidden status blocking unauthorized role | HTTP 403 returned; error payload: 'Forbidden: Insufficient role permissions' | **Pass** | Jest duration: 2ms |
| **WB-033** | Execute role guard for user possessing ADMIN role accessing admin route | Call next() middleware allowing route handler execution | `next()` called successfully; request allowed to proceed | **Pass** | Jest duration: 1ms |
| **WB-034** | Execute role guard for user possessing RESPONSE_UNIT role accessing dispatch route | Call next() middleware allowing route handler execution | `next()` called successfully; request allowed to proceed | **Pass** | Jest duration: 0ms |
| **WB-035** | Execute role guard for user possessing REPORTER role accessing citizen flow | Call next() middleware allowing route handler execution | `next()` called successfully; request allowed to proceed | **Pass** | Jest duration: 0ms |

---

### 11. API Response Helper Utility Suite (`apiResponse.test.js`)

| Test Case ID | Description | Expected Outcome | Actual Outcome | Pass/ Fail | Comments |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **WB-036** | Format default success API response payload object | Return JSON object with success: true, message: 'Success', and data payload | Object formatted with success: true and default message string | **Pass** | Jest duration: 5ms |
| **WB-037** | Format custom payload success response with custom status message | Return JSON object containing custom message and nested data object | Custom message and data payload attached cleanly | **Pass** | Jest duration: 2ms |
| **WB-038** | Format default error API response payload object | Return JSON object with success: false and default error message | Object formatted with success: false and default error string | **Pass** | Jest duration: 1ms |
| **WB-039** | Format custom error response containing detailed validation error array | Return JSON object with error payload array and HTTP status code | Validation error array attached cleanly to response object | **Pass** | Jest duration: 1ms |

---

### 12. Sensitive Data Encryption Utility Suite (`encryptionUtil.test.js`)

| Test Case ID | Description | Expected Outcome | Actual Outcome | Pass/ Fail | Comments |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **WB-040** | Encrypt plain text sensitive string using AES-256-GCM cipher | Return encrypted string payload containing initialization vector and authentication tag | Cipher text returned containing IV, auth tag, and encrypted data string | **Pass** | Jest duration: 8ms |
| **WB-041** | Decrypt encrypted text back into original plain text string | Return exact original plain text string matching input before encryption | Decryption successful; output string matches original input exactly | **Pass** | Jest duration: 2ms |
| **WB-042** | Attempt decryption on malformed or corrupted cipher text string | Return null safely without throwing uncaught decryption exception | Function catches MAC verification error and returns null safely | **Pass** | Jest duration: 29ms |

---

### 13. Incident Management & Dispatch Controller Suite (`incidentController.test.js`)

| Test Case ID | Description | Expected Outcome | Actual Outcome | Pass/ Fail | Comments |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **WB-043** | Create incident with GPS coordinates outside NIR coverage area (e.g. Manila coordinates) | Reject submission with HTTP 400 Bad Request blocking out-of-bounds report | HTTP 400 returned; payload error: 'Location outside Negros Island Region (NIR) boundary' | **Pass** | Jest duration: 2397ms |
| **WB-044** | Execute getIncidents controller with filters and pagination | Return HTTP 200 OK with paginated array of incident records | HTTP 200 returned; incidents array returned with total count and pagination metadata | **Pass** | Jest duration: 1ms |
| **WB-045** | Execute getIncidentById for non-existent incident ID string | Return HTTP 404 Not Found status with clear error message | HTTP 404 returned; payload message: 'Incident record not found' | **Pass** | Jest duration: 0ms |
| **WB-046** | Attempt incident verification as non-ADMIN user (e.g. REPORTER role) | Block request with HTTP 403 Forbidden authorization error | HTTP 403 returned; non-admin verification attempt intercepted cleanly | **Pass** | Jest duration: 2ms |
| **WB-047** | Submit invalid verification action string (e.g. action = 'INVALID_ACTION') | Reject request with HTTP 400 Bad Request validation error | HTTP 400 returned; invalid verification action string rejected | **Pass** | Jest duration: 0ms |
| **WB-048** | Attempt incident editing as non-ADMIN user role | Block request with HTTP 403 Forbidden authorization error | HTTP 403 returned; non-admin edit attempt intercepted cleanly | **Pass** | Jest duration: 1ms |
| **WB-049** | Execute updateIncidentStatus setting status to RESPONDING | Update status in database, emit Socket.io event, and return updated record | Database updated to RESPONDING; socket event emitted; updated record returned | **Pass** | Jest duration: 0ms |
