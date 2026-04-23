# GAOIRS Flutter Reporter App - Setup & Testing Guide

## ✅ FIXES APPLIED (2026-04-22)

### 1. **Network Configuration Fix**
**Problem**: App was trying to connect to `localhost:3000` which doesn't work on Android emulator/devices
**Solution**: Updated `.env` file to use Android emulator special address `10.0.2.2:3001`
- `API_BASE_URL=http://10.0.2.2:3001`
- `SOCKET_IO_URL=http://10.0.2.2:3001`
- Backend port corrected from 3000 → 3001 (matching your backend .env)

### 2. **Android Permissions Configuration**
**Problem**: Missing location, camera, and storage permissions in AndroidManifest.xml
**Added Permissions**:
- `android.permission.ACCESS_FINE_LOCATION`
- `android.permission.ACCESS_COARSE_LOCATION`
- `android.permission.CAMERA`
- `android.permission.READ_EXTERNAL_STORAGE`
- `android.permission.WRITE_EXTERNAL_STORAGE`
- `android.permission.INTERNET`

---

## 📱 COMPLETE FEATURE CHECKLIST

### ✅ Authentication System
- [x] JWT token-based authentication
- [x] User registration with validation
- [x] Email/password login
- [x] Automatic token persistence (SharedPreferences)
- [x] Auto-login on app startup with token validation
- [x] Logout functionality
- [x] Token expiration handling

### ✅ Location Services
- [x] Geolocation detection (high accuracy)
- [x] 30-second timeout for location fetch
- [x] Reverse geocoding (OpenStreetMap Nominatim)
- [x] Barangay and city extraction
- [x] Location error handling with user-friendly messages
- [x] Refresh button to retry location detection
- [x] Fallback to default coordinates if location fails

### ✅ Photo Management
- [x] Multi-image picker (up to 5 photos max)
- [x] Photo preview grid (3-column layout)
- [x] Remove photos functionality
- [x] Image compression (1024x1024 max)
- [x] Local image handling ready for upload

### ✅ Incident Reporting Form
- [x] Unified single-page form (no more 2-step flow)
- [x] Form sections in order:
  1. Photo selection (optional)
  2. Location detection (required)
  3. Incident type dropdown with icons (required)
  4. Description text area (required)
  5. Severity selector: LOW, MEDIUM, HIGH, CRITICAL
  6. Reporter name (optional, defaults to logged-in user)
  7. Reporter phone (optional)
- [x] Real-time form validation before submit
- [x] Error handling and user feedback via SnackBars

### ✅ Incident Management
- [x] Create new incident reports
- [x] View "My Reports" page with incident listing
- [x] Real-time incident status display
- [x] Incident detail modal view
- [x] Incident code generation and display
- [x] Incident search and filtering

### ✅ Real-time Features
- [x] Socket.io client integration setup
- [x] Event listeners for real-time updates
- [x] Support for: new_incident, incident_status_updated, new_assignment events

### ✅ UI/UX Features
- [x] Material Design 3 theme
- [x] Light/Dark mode support (system-based)
- [x] Emergency type colors (5 types with unique colors)
- [x] Severity level color coding
- [x] Loading states and spinners
- [x] Error messages and alerts
- [x] Responsive layout for mobile devices

### ✅ Data Models
- [x] User model with role-based access
- [x] Incident model with PostGIS geometry support
- [x] IncidentType model with icon support
- [x] Evidence/Photo model structure

---

## 🚀 TESTING THE APP

### Prerequisites
1. **Backend Running**: Ensure Node.js backend is running on port `3001`
   ```bash
   cd backend
   npm run dev
   # or: node src/index.js
   ```

2. **Database**: Supabase PostgreSQL + PostGIS connected and seeded

3. **Flutter Environment**: Flutter SDK 3.11+ installed
   ```bash
   flutter --version
   ```

### Setup Steps

#### Step 1: Install Dependencies
```bash
cd reporter_app
flutter pub get
```

#### Step 2: Verify .env Configuration
File: `/reporter_app/.env`
```
API_BASE_URL=http://10.0.2.2:3001
SOCKET_IO_URL=http://10.0.2.2:3001
NOMINATIM_URL=https://nominatim.openstreetmap.org
```

#### Step 3: Run on Android Emulator
```bash
# Start emulator first (if not already running)
emulator -avd <emulator_name>

# Run the app
flutter run

# Or with specific device
flutter run -d <device_id>
```

#### Step 4: Run on Physical Device
**NOTE**: If using a physical device, update `.env` to use your machine's IP:
```
API_BASE_URL=http://YOUR_MACHINE_IP:3001
SOCKET_IO_URL=http://YOUR_MACHINE_IP:3001
```

For example, if your machine IP is `192.168.34.129`:
```
API_BASE_URL=http://192.168.34.129:3001
SOCKET_IO_URL=http://192.168.34.129:3001
```

Then rebuild:
```bash
flutter clean
flutter run
```

---

## 🧪 TESTING WORKFLOW

### Test 1: User Authentication
```
1. Open app → Redirected to login screen
2. Try login with non-existent account → Error message
3. Create account:
   - First Name: "Tan"
   - Last Name: "Lim"
   - Email: "test@example.com"
   - Contact: "09123456789"
   - Password: "password123" (min 8 chars)
4. Successfully registered → Navigates to Home screen
5. Logout → Redirected to login
6. Login with created account → Works properly
7. Kill and restart app → Auto-login with saved token ✅
```

### Test 2: Location Detection
```
1. Navigate to "Report Incident" → Form loads
2. Scroll to Location section
3. Tap "Detect Location" button
4. Grant location permission when prompted
5. Wait 5-10 seconds → Location detected with:
   - GPS coordinates (latitude/longitude)
   - Barangay name (from reverse geocoding)
   - City name
6. Tap "Refresh" to re-detect location
7. Verify coordinates and barangay display ✅
```

### Test 3: Photo Selection
```
1. In incident report form, tap "Add Photos"
2. Select 1 photo → Displays in grid
3. Select more photos (up to 5 total)
4. Verify 3-column grid layout
5. Tap X on a photo to remove it
6. Try selecting 6+ photos → Shows "Max 5 photos" warning
7. Verify photos are selected but not uploaded until submit ✅
```

### Test 4: Incident Type Selection
```
1. In form, tap Incident Type dropdown
2. See all 5 types with colors:
   - FIRE (orange)
   - MEDICAL_EMERGENCY (red)
   - ACCIDENT (amber)
   - CRIME-RELATED (purple)
   - OTHER (gray)
3. Select a type → Displays with color/icon
4. Change to different type → Updates properly ✅
```

### Test 5: Complete Incident Report
```
1. Fill entire form:
   - Photos: 2-3 images
   - Location: Auto-detect
   - Type: Select one
   - Description: "Traffic accident at main road"
   - Severity: "HIGH"
   - Name: "Juan Santos" (or leave blank)
   - Phone: "09123456789" (optional)
2. Tap "Submit Report"
3. Loading spinner appears
4. Success: Shows incident code (e.g., "INC-2026-0001")
5. Returns to home screen
6. Navigate to "My Reports" → New incident appears ✅
```

### Test 6: My Reports Viewing
```
1. Navigate to "My Reports"
2. See list of all incidents you reported
3. Each item shows:
   - Incident type with icon
   - Status badge (REPORTED, IN_PROGRESS, etc.)
   - Location (barangay, city)
   - Time ago
4. Tap an incident → Detail modal opens
5. Close modal → Returns to list ✅
```

### Test 7: Real-time Updates (requires multiple devices/sessions)
```
1. User A: Reports an incident
2. User B: Logs in and views incidents
3. Admin: Changes incident status
4. User A: Should receive real-time update (socket.io event)
5. Listen for console logs confirming socket events ✅
```

---

## 🐛 TROUBLESHOOTING

### Connection Refused Error
**Error**: `ClientException with SocketException: Connection refused`
**Solution**:
- Ensure backend is running: `npm run dev` in `/backend` folder
- Check `.env` has correct IP/port (10.0.2.2:3001 for emulator)
- Verify port 3001 is not blocked by firewall

### Location Permission Denied
**Error**: "Unable to get location. Please enable location services."
**Solution**:
- In Android emulator Settings → Apps → reporter_app → Permissions → Enable Location
- Or use: `adb shell pm grant com.gaoirsmobile android.permission.ACCESS_FINE_LOCATION`

### Photos Not Loading
**Error**: Blank grid or loading state
**Solution**:
- Grant camera + storage permissions
- Check image_picker plugin is installed: `flutter pub get`
- Ensure READ_EXTERNAL_STORAGE permission is granted

### App Crashes on Launch
**Error**: `DigestException` or version mismatch
**Solution**:
```bash
flutter clean
cd android
./gradlew clean  # or gradlew.bat on Windows
cd ..
flutter pub get
flutter run
```

### Backend Connection Timeout
**Error**: Network request takes >30 seconds
**Solution**:
- Ensure backend database (Supabase) connection is stable
- Check network connectivity: `ping 10.0.2.2` (emulator)
- Restart Android emulator: `emulator -avd <name> -wipe-data`

---

## 📊 MONITORING & DEBUGGING

### Enable Debug Logs
```bash
flutter run -v  # Verbose logging
```

### Check Device Logs
```bash
adb logcat | grep flutter  # Android only
```

### Network Debugging
Check API calls in console by adding:
```dart
// In api_service.dart, add before http.post():
debugPrint('Request: $uri');
debugPrint('Headers: $_headers');
debugPrint('Body: ${body}');
```

### Socket.io Events
Check console for socket events (search for `socket_` in logs):
- `socket_connected`
- `socket_error`
- `new_incident`
- `incident_status_updated`

---

## 📝 KNOWN LIMITATIONS

1. **Photo Upload**: Currently photos aren't uploaded to Cloudinary yet (POST /api/evidence/from-url needs implementation with base64)
2. **Socket.io Real-time**: Listeners are set up but require backend socket event broadcasts
3. **Offline Mode**: App requires internet connection (no offline queue)
4. **Multi-language**: English only (no i18n yet)
5. **Biometric Auth**: Not implemented (PIN login only)

---

## 🔄 Transferring Between Devices

### Android Emulator to Physical Device
1. Get your machine IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Update `.env`:
   ```
   API_BASE_URL=http://YOUR_IP:3001
   SOCKET_IO_URL=http://YOUR_IP:3001
   ```
3. Ensure backend allows CORS:
   ```
   CORS_ORIGIN="http://YOUR_IP:3000,..." (add your IP)
   ```
4. Rebuild: `flutter run`

### Emulator to Another Emulator
Use the same `.env` configuration (10.0.2.2:3001)

---

## ✨ NEXT STEPS

1. ✅ API integration working (register, login, incidents)
2. ⚠️ TODO: Cloudinary photo upload integration
3. ⚠️ TODO: Push notifications setup
4. ⚠️ TODO: Offline queue for incident reports
5. ⚠️ TODO: Response unit tracking on mobile
6. ⚠️ TODO: GPS live tracking broadcast to response team

---

## 📞 SUPPORT

**If you encounter issues**:
1. Check this troubleshooting guide
2. Run `flutter doctor` to diagnose environment issues
3. Check backend logs: `npm run dev` (with NODE_ENV=development)
4. Verify network connectivity to backend

---

Generated: 2026-04-22
