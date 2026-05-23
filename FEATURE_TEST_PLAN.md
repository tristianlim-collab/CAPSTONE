# 🧪 GAOIRS Feature Test Plan - All 4 Features

**Status**: All features are 100% implemented. This plan verifies they work end-to-end.

---

## ✅ PHASE 1: PUSH NOTIFICATIONS

### Prerequisites
- ✅ Firebase credentials in `.env` (DONE)
- Backend running on port 3001
- Frontend running on port 5173

### Test Cases

#### 1A: Backend Firebase Initialization
```bash
# In backend directory, run:
npm test -- notificationService
# OR test manually:
node -e "
const admin = require('firebase-admin');
const key = require('./backend/.env');
console.log('Firebase Project:', process.env.FIREBASE_PROJECT_ID);
console.log('Status: Ready');
"
```
**Expected**: No errors, Firebase SDK loads

#### 1B: Web Frontend - Request Browser Permission
1. Open http://localhost:5173/admin/dashboard
2. Accept browser notification permission prompt
3. **Check**: Toast appears "Notifications enabled"

#### 1C: Mobile App - Register with FCM Token
1. Open Reporter App (Expo)
2. Register new account or login
3. App requests notification permission
4. Token sent to backend on login
5. **Check**: Backend stores `fcm_token` for user

#### 1D: Test Push Notification Dispatch
1. Admin page: Create a HIGH/CRITICAL incident
2. Assign to response unit
3. **Check on Web**: Toast notification appears in browser
4. **Check on Mobile**: Push notification appears on device screen
5. **Check in Database**: `notifications` table has entry with `delivery_status: 'SENT'`

#### 1E: Fallback to SMS/Email (if FCM fails)
1. Manually delete FCM token from database: `UPDATE USER SET fcm_token = NULL WHERE...`
2. Create new incident
3. **Check**: SMS/Email sent instead (verify in email service logs)

---

## ✅ PHASE 2: PDF/EXCEL EXPORT

### Prerequisites
- Admin logged in
- Database has at least 10 incidents
- `xlsx` and `jspdf` packages installed (check: `npm ls xlsx jspdf`)

### Test Cases

#### 2A: Export to Excel
1. Go to Admin → **Incident Archive**
2. Click **"Export as Excel"** button (or ⬇️ icon)
3. **Expected**:
   - File downloads as `incidents_YYYY-MM-DD.xlsx`
   - Contains columns: Incident Code, Type, Status, Severity, Location, Date
   - All incidents visible in spreadsheet

#### 2B: Export to PDF
1. Go to Admin → **Incident Archive**
2. Click **"Export as PDF"** button
3. **Expected**:
   - File downloads as `incidents_YYYY-MM-DD.pdf`
   - Header with "GAOIRS Report" and date
   - Table with all incidents
   - Footer with page numbers

#### 2C: Export with Filters
1. Go to Admin → **Analytics**
2. Set filters:
   - Date range: Last 7 days
   - Status: Only "RESOLVED"
   - Type: Only "Fire"
3. Click **"Export Analytics"** button
4. **Expected**:
   - Only filtered incidents in export (4-5 incidents, not all)
   - File size reasonable (< 5MB for typical 500 incidents)

#### 2D: Analytics Dashboard Export
1. Go to Admin → **Analytics**
2. Click **"Download Report"** button (right side)
3. **Expected**:
   - PDF with charts embedded (if charts exist)
   - Incident summary statistics
   - Response time analytics

#### 2E: Performance Test
1. Create a large export (all incidents from past 3 months, ~500+ records)
2. Time the export
3. **Expected**: Completes in < 5 seconds

---

## ✅ PHASE 3: SYSTEM SETTINGS

### Prerequisites
- Admin logged in
- Backend running and connected to database

### Test Cases

#### 3A: Load Configuration
1. Go to Admin → **System Settings**
2. Click **"General Info"** tab
3. **Expected**:
   - Fields load without errors
   - System name shows current value
   - Support email populated

#### 3B: Update General Settings
1. Go to **General Info** tab
2. Change "Organization Name" to "Test Municipality"
3. Change "Support Email" to "test@municipality.gov.ph"
4. Change "Hotline Number" to "+63 2 1234 5678"
5. Click **"Save Changes"**
6. **Expected**:
   - Toast: "Configurations saved successfully"
   - Page reloads
   - New values persist (refresh page to verify)

#### 3C: SMTP Configuration
1. Go to **SMTP Server** tab
2. Enter:
   - **Host**: `smtp.gmail.com`
   - **Port**: `587`
   - **Username**: `your-email@gmail.com`
   - **Password**: `your-app-password`
   - **From Address**: `gaoirs@municipality.gov.ph`
3. Click **"Save Changes"**
4. **Expected**:
   - Toast: "Configurations saved successfully"
   - Password shows as `••••••••` after save
   - Values encrypted in database

#### 3D: Test Email Configuration
1. In SMTP tab, click **"Send Test Email"** button (if exists)
2. Enter test email address
3. **Expected**:
   - Test email arrives in inbox
   - Subject: "GAOIRS System Configuration Test"

#### 3E: API Keys Configuration
1. Go to **API Keys** tab
2. Fill in:
   - **Twilio SID**: `ACxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Twilio Token**: `your-twilio-auth-token`
   - **Twilio Phone**: `+1234567890`
3. Click **"Save Changes"**
4. **Expected**:
   - Token hidden as `••••••••` after save
   - Values encrypted in database
   - Audit log records the change

#### 3F: Verify Encryption
1. Open database directly: `SELECT * FROM SYSTEM_CONFIG WHERE config_key = 'SMTP_PASS'`
2. **Expected**: `config_value` is encrypted (unreadable) and `is_encrypted = true`

#### 3G: Notification Rules
1. Go to **Notification Rules** tab
2. Toggle settings:
   - "Critical Incident Summaries" ON
   - "SMS Dispatch Alerts" ON
   - "New Incident Audio Alerts" ON
3. Click **"Save Changes"**
4. **Expected**:
   - Toast: "Configurations saved successfully"
   - Toggles stay in new position

#### 3H: Verify Configuration Takes Effect
1. Update SMTP config with real Gmail credentials
2. Create a new incident
3. **Expected**: Alert email sent using updated SMTP settings

---

## ✅ PHASE 4: OFFLINE INCIDENT QUEUE

### Prerequisites
- Mobile app installed and running (Expo)
- Reporter user authenticated

### Test Cases

#### 4A: Disable Internet & Create Incident
1. On device/emulator, turn OFF WiFi and cellular data
2. Open Reporter App → Report Incident form
3. Fill in:
   - Type: "Fire"
   - Severity: "HIGH"
   - Location: Add any location (may use cached)
   - Description: "Test offline incident"
4. Click **"Submit Report"**
5. **Expected**:
   - Toast: "📲 Queued offline - will send when connected"
   - Incident appears in **My Reports** with status badge: **"⏳ Pending"**
   - No API error shown (graceful offline handling)

#### 4B: Verify Queue Storage
1. Open device developer tools (React Native Debugger for Expo)
2. Check AsyncStorage key: `incident_queue`
3. **Expected**: Queue contains 1 item with status `PENDING`

#### 4C: Re-Enable Internet & Auto-Sync
1. Turn WiFi/data back ON
2. **Expected**:
   - Automatic sync starts (no user action needed)
   - Status badge changes: **"⏳ Pending"** → **"Syncing..."** → **"✅ Sent"**
   - Toast: "1 queued incident synced successfully"

#### 4D: Verify Database
1. In admin dashboard, check **Incident Archive**
2. **Expected**: Queued incident now appears with status `REPORTED` or `VERIFIED`

#### 4E: Test Multiple Offline Submissions
1. Go offline again
2. Submit 3 incidents:
   - "Medical Emergency" - HIGH
   - "Crime" - CRITICAL
   - "Accident" - LOW
3. **Expected**:
   - All 3 appear in queue with **"⏳ Pending (3)"** badge
   - Form clears after each submission

#### 4F: Test Retry on Sync Failure
1. Submit incident offline: "Test Retry"
2. Go online
3. Manually break network (dev tools: disable network)
4. **Expected**: Sync fails, status shows **"❌ Failed"**
5. Edit incident or wait, check manual retry button appears

#### 4G: Queue Persistence Across App Restart
1. Submit incident offline: "Test Persistence"
2. Verify it's in **My Reports** with **"⏳ Pending"**
3. Close app completely (kill process)
4. Reopen app
5. **Expected**: Queued incident still visible, sync status intact

#### 4H: Queue Cleanup (30+ days)
1. Check database: `SELECT COUNT(*) FROM incident_queue WHERE created_at < NOW() - INTERVAL '30 days' AND status = 'SENT'`
2. **Expected**: Old sent incidents auto-deleted (if cleanup task exists)

---

## 📋 Test Execution Checklist

### Phase 1: Push Notifications
- [ ] Firebase credentials loaded successfully
- [ ] Web browser permission prompt appears
- [ ] Mobile app requests FCM permission
- [ ] Push notification appears on incident dispatch
- [ ] SMS fallback works when FCM unavailable
- [ ] Database has notification records with SENT status

### Phase 2: PDF/Excel Export
- [ ] Excel export generates and downloads
- [ ] PDF export generates and downloads
- [ ] Filters applied correctly to exports
- [ ] Export completes in < 5 seconds
- [ ] Files open correctly (no corruption)

### Phase 3: System Settings
- [ ] General settings save and persist
- [ ] SMTP config saved and encrypted
- [ ] API keys saved and encrypted
- [ ] Test email sends successfully
- [ ] Notification rules toggle and persist
- [ ] New config takes effect (test with real SMS/email)

### Phase 4: Offline Queue
- [ ] Incidents queue when offline
- [ ] Queue badge shows count
- [ ] Auto-sync on reconnection
- [ ] Status updates from Pending → Sent
- [ ] Multiple incidents sync correctly
- [ ] Queue persists across app restart
- [ ] Failed items show retry option

---

## 🐛 Known Issues / Troubleshooting

### Push Notifications Not Working
- **Check**: `FIREBASE_PROJECT_ID` in .env is filled
- **Check**: Firebase SDK installed: `npm ls firebase-admin`
- **Check**: Browser has permission: Settings → Notifications
- **Fix**: Restart backend: `npm start`

### Export Takes Too Long
- **Check**: Database has indexes on incident table
- **Fix**: Limit export to date range (last 30 days)

### System Settings Not Saving
- **Check**: Admin user role is `ADMIN` (not `RESPONSE_UNIT`)
- **Check**: `CONFIG_ENCRYPTION_KEY` env var is set
- **Fix**: Verify `systemConfigController.js` is imported in `app.js`

### Offline Queue Not Syncing
- **Check**: App has valid JWT token (login successful)
- **Check**: Network connectivity restored (toggle WiFi twice)
- **Fix**: Manually clear AsyncStorage: `AsyncStorage.removeItem('incident_queue')`

---

## 📊 Success Metrics

✅ **All 4 Features Working** = GAOIRS at 100% + Ready for Production
- Push Notifications: < 2 second delivery
- Exports: < 5 seconds for 500 incidents
- Settings: < 30 second save + encryption working
- Offline Queue: Syncs within 10 seconds of reconnect

---

## 🚀 Next: Deployment

Once all tests pass:
1. Set production Firebase credentials
2. Set production SMTP credentials
3. Run Prisma migrations: `npx prisma migrate deploy`
4. Deploy backend to production server
5. Deploy frontend (React) to Vercel/Netlify
6. Rebuild mobile app with production API URL
7. Monitor logs for errors

---

**Last Updated**: 2026-05-20
**Tester**: Team
**Target Completion**: 2026-05-21
