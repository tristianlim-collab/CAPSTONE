# 🧪 Quick Start: Testing GAOIRS Features

**Time to Complete**: ~2 hours for all tests
**Difficulty**: Easy (mostly UI clicks + verification)

---

## 🏁 Setup (5 minutes)

### Terminal 1: Start Backend
```bash
cd backend
npm start

# Expected output:
# ✓ Connected to Supabase
# ✓ Server running on port 3001
# ✓ Firebase initialized successfully
```

### Terminal 2: Start Frontend
```bash
cd frontend
npm run dev

# Expected output:
# ✓ Vite dev server running on http://localhost:5173
```

### Terminal 3: Start Mobile App
```bash
cd reporter_app
npm start

# Expected output:
# ✓ Expo dev server ready
# Choose: press w for web, or scan QR with Expo Go app
```

---

## ✅ Test Phase 1: Push Notifications (20 minutes)

### 1A: Browser Notification Permission
1. Open http://localhost:5173 in browser
2. Look for **permission prompt** at top
3. Click **"Allow"**
4. Should see toast: "✅ Notifications enabled"

**Result**: ✅ Pass / ❌ Fail

---

### 1B: Test Sending Notification
1. Go to **Admin Dashboard** → **Incident Management**
2. Find any incident (or create test one)
3. Click **"Assign"** → Select a response unit
4. **Check browser** for desktop notification
5. **Check mobile app** for push notification

**Expected**:
- 🔔 Notification appears in browser
- 📲 Notification appears on mobile (if token sent)
- ⏱️ Within 2 seconds of assignment

**Result**: ✅ Pass / ❌ Fail / ⚠️ Partial (need to debug)

---

## ✅ Test Phase 2: PDF/Excel Export (15 minutes)

### 2A: Export to Excel
1. Go to **Admin Dashboard** → **Incident Archive**
2. Click **"Export as Excel"** button (look for ⬇️ or "Download")
3. File should download automatically
4. **Open the file** (Excel, Sheets, or LibreOffice)
5. Verify:
   - Columns present: Code, Type, Status, Severity, Location, Date
   - Data rows match incidents shown on screen
   - File size < 5MB

**Result**: ✅ Pass / ❌ Fail / ⚠️ (missing columns)

---

### 2B: Export to PDF
1. Same location: **Incident Archive**
2. Click **"Export as PDF"** button
3. File downloads as `incidents_YYYY-MM-DD.pdf`
4. **Open the PDF** in browser or PDF reader
5. Verify:
   - Header says "GAOIRS Report"
   - Table with incident data visible
   - Page numbers at bottom

**Result**: ✅ Pass / ❌ Fail / ⚠️ (formatting issue)

---

### 2C: Test with Filters
1. Go to **Analytics** page
2. Set date range filter (e.g., "Last 7 Days")
3. Click **"Download Report"**
4. Verify exported file only contains incidents from selected date range

**Result**: ✅ Pass / ❌ Fail / ⚠️ (filters not applied)

---

## ✅ Test Phase 3: System Settings (20 minutes)

### 3A: Load Settings Page
1. Go to **Admin Dashboard** → **System Settings**
2. Should see **5 tabs**:
   - General Info
   - Roles & Permissions
   - Notification Rules
   - SMTP Server
   - API Keys

**Result**: ✅ Pass / ❌ Fail

---

### 3B: Test General Settings
1. Click **"General Info"** tab
2. Change "Organization Name" to something like "Test Municipality 2026"
3. Click **"Save Changes"**
4. Should see toast: "✅ Configurations saved successfully"
5. **Refresh page** and verify changes persist

**Result**: ✅ Pass / ❌ Fail / ⚠️ (changes don't persist)

---

### 3C: Test SMTP Configuration
1. Click **"SMTP Server"** tab
2. Fill in fields with test values:
   ```
   Host: smtp.gmail.com
   Port: 587
   User: your-test@gmail.com
   Password: your-app-password
   From: gaoirs@test.municipality.ph
   ```
3. Click **"Save Changes"**
4. Password field should show as `••••••••` after save
5. Verify in database: password is encrypted

**Result**: ✅ Pass / ❌ Fail / ⚠️ (encryption not working)

---

### 3D: Test Notification Rules
1. Click **"Notification Rules"** tab
2. Toggle "Critical Incident Summaries" OFF
3. Toggle "SMS Dispatch Alerts" ON
4. Click **"Save Changes"**
5. **Refresh page** and verify toggle states persist

**Result**: ✅ Pass / ❌ Fail / ⚠️ (toggles reset on refresh)

---

## ✅ Test Phase 4: Offline Queue (25 minutes)

### 4A: Submit Incident Offline
1. Open **Mobile App** (Expo or physical device)
2. **Disable WiFi & cellular data** (Airplane mode)
3. Go to **"Report Incident"**
4. Fill in form:
   - Type: Fire
   - Severity: HIGH
   - Description: "Test offline incident"
5. Tap **"Submit"**
6. Should see toast: "📲 Queued offline - will send when connected"

**Result**: ✅ Pass / ❌ Fail (no offline handling)

---

### 4B: Verify Queue Display
1. Go to **"My Reports"** screen
2. Look for **status badge** showing **"⏳ Pending"**
3. Should show incident in list with queue status

**Result**: ✅ Pass / ❌ Fail / ⚠️ (no queue indicator)

---

### 4C: Re-enable Internet & Test Auto-Sync
1. Turn WiFi/cellular back ON
2. **Wait 5-10 seconds** (auto-sync should trigger)
3. Status badge should change: **"⏳ Pending"** → **"✅ Sent"**
4. Should see toast: "✅ Queued incident synced!"
5. Go to **Admin Dashboard** → **Incident Archive**
6. Verify incident now appears in main list

**Result**: ✅ Pass / ⏳ Pending / ❌ Fail / ⚠️ (manual retry needed)

---

### 4D: Test Multiple Queued Incidents
1. Go offline again
2. Submit 3 different incidents:
   - "Medical Emergency" - HIGH
   - "Crime-Related" - CRITICAL
   - "Accident" - LOW
3. Badge should show **"⏳ Pending (3)"**
4. Go online and wait for sync
5. All 3 should become **"✅ Sent"**

**Result**: ✅ Pass / ⚠️ Partial sync / ❌ Fail

---

### 4E: Test Queue Persistence (Optional)
1. Submit incident offline: "Persistence Test"
2. Close mobile app **completely**
3. Reopen mobile app
4. Go to **"My Reports"**
5. Incident should **still be visible** with **"⏳ Pending"** status

**Result**: ✅ Pass / ⚠️ Data lost / ❌ Crash

---

## 📋 Test Results Form

Copy and fill out:

```
GAOIRS Feature Test Results - [Your Name]
Date: [Date]
Time Taken: ___ hours

FEATURE 1: PUSH NOTIFICATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1A Browser Permission      ✅ Pass  / ⏳ Pending / ❌ Fail
1B Firebase Notification   ✅ Pass  / ⏳ Pending / ❌ Fail
Notes: _______________________________________________

FEATURE 2: PDF/EXCEL EXPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2A Export to Excel         ✅ Pass  / ⏳ Pending / ❌ Fail
2B Export to PDF           ✅ Pass  / ⏳ Pending / ❌ Fail
2C Filter & Export         ✅ Pass  / ⏳ Pending / ❌ Fail
Notes: _______________________________________________

FEATURE 3: SYSTEM SETTINGS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3A Load Settings Page      ✅ Pass  / ⏳ Pending / ❌ Fail
3B General Settings Save   ✅ Pass  / ⏳ Pending / ❌ Fail
3C SMTP Config + Encrypt   ✅ Pass  / ⏳ Pending / ❌ Fail
3D Notification Rules      ✅ Pass  / ⏳ Pending / ❌ Fail
Notes: _______________________________________________

FEATURE 4: OFFLINE QUEUE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4A Offline Submission      ✅ Pass  / ⏳ Pending / ❌ Fail
4B Queue Display Badge     ✅ Pass  / ⏳ Pending / ❌ Fail
4C Auto-Sync on Online     ✅ Pass  / ⏳ Pending / ❌ Fail
4D Multiple Incidents      ✅ Pass  / ⏳ Pending / ❌ Fail
4E Persistence             ✅ Pass  / ⏳ Pending / ❌ Fail
Notes: _______________________________________________

OVERALL: ✅ All Pass / ⚠️ Some Issues / ❌ Critical Failures

Issues Found:
1. ___________________________________________________
2. ___________________________________________________
3. ___________________________________________________

Recommendations:
___________________________________________________
___________________________________________________
```

---

## 🔧 Troubleshooting

### Push Notification Not Appearing
```
Check: Is Firebase initialized in backend console?
Fix: Backend must have printed "Firebase Admin SDK initialized successfully"

Check: Does user have browser notification permission?
Fix: Settings → Notifications → Allow for your site

Check: Is fcm_token stored on mobile login?
Fix: Check backend User table for fcm_token field
```

### Export Button Missing
```
Check: Are you logged in as ADMIN?
Fix: Admin users only can export

Check: Does IncidentArchive component render?
Fix: Check for React errors in console

Check: Is reportAPI imported?
Fix: frontend/src/api/index.js must have reportAPI.export()
```

### Settings Don't Save
```
Check: Are you ADMIN role?
Fix: Only admins can modify system config

Check: Is CONFIG_ENCRYPTION_KEY set in .env?
Fix: Add: CONFIG_ENCRYPTION_KEY="your-32-char-secret-key"

Check: Any errors in backend console?
Fix: Look for "systemConfigController" errors
```

### Offline Queue Not Syncing
```
Check: Is WiFi actually turned back on?
Fix: Toggle WiFi twice to restart network

Check: Is user logged in with valid JWT?
Fix: Re-login if token expired

Check: Any errors in mobile console?
Fix: Would show in Expo developer tools
```

---

## ✅ Success Criteria

**🎯 All 4 Features Pass**: GAOIRS is ready for production
**⚠️ 3/4 Features Pass**: Minor bugs to fix, ~1 day
**⚠️ 2/4 Features Pass**: Major bugs to fix, ~3 days
**❌ < 2 Features Pass**: Architecture issues, ~1 week

---

## 🚀 What's Next

- ✅ If all tests pass → Ready for production deployment
- ⚠️ If some fail → Report issues → Fix → Re-test
- 📊 Collect results → Create deployment plan
- 🎉 Launch!

---

**Start testing now!** 🧪
