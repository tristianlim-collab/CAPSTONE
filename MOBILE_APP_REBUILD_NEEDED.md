# 🔧 MOBILE APP REBUILD REQUIRED

## Problem
The Flutter mobile app code was updated to send reporter phone number to the backend, but **the compiled app needs to be rebuilt** for the changes to take effect.

**Changes Made**:
- ✅ `reporter_app/lib/services/api_service.dart` - Now includes `reporter_name` and `reporter_phone` in incident creation request
- ✅ `reporter_app/lib/models/incident.dart` - Properly parses reporter info from responses
- ✅ Backend now accepts and stores these fields
- ✅ Frontend now displays these fields correctly

**Current Status**:
- Backend is ready ✅
- Frontend is ready ✅
- Mobile app CODE is updated ✅
- Mobile app BINARY (APK/IPA) is OLD ❌ - NEEDS REBUILD

---

## How to Rebuild the Mobile App

### **Step 1: Clean the project**
```bash
cd C:\Users\Tristan Zane\OneDrive\Desktop\CAPSTONE\reporter_app
flutter clean
```

### **Step 2: Get dependencies**
```bash
flutter pub get
```

### **Step 3: Build for Android (APK)**
```bash
flutter build apk --release
```
Or for debug (testing):
```bash
flutter build apk --debug
```

### **Step 4: Deploy to emulator/device**
```bash
flutter install  # if device is connected
```
Or manually:
```bash
adb install build/app/outputs/flutter-apk/app-release.apk
```

### **Step 5: Test**
1. Open the rebuilt mobile app
2. Create a new incident report
3. **Enter a phone number different from your default** (e.g., +639123456789)
4. Submit the incident
5. Go to admin dashboard
6. Click on the incident marker
7. Verify the phone number matches what you entered ✅

---

## What the App Will Now Do

After rebuild:
1. **Reporter fills form**:
   - Name: "Juan Dela Cruz"
   - Phone: "+639123456789"
   - Incident type: "Fire"

2. **App sends to backend**:
   ```json
   {
     "incident_type_id": "...",
     "description": "...",
     "reporter_name": "Juan Dela Cruz",
     "reporter_phone": "+639123456789"
   }
   ```

3. **Backend saves**:
   - incident.reporter_name = "Juan Dela Cruz"
   - incident.reporter_phone = "+639123456789"

4. **Admin sees accurate info**:
   - Name: Juan Dela Cruz ✅ (not "Community Reporter")
   - Phone: +639123456789 ✅ (not the auth user's default)

---

## Timeline

- Backend ready: **2026-04-28 03:00 AM** ✅
- Frontend ready: **2026-04-28 03:30 AM** ✅
- Mobile app code updated: **2026-04-28 03:45 AM** ✅
- Mobile app needs rebuild: **NOW** ❌

---

## Technical Details

**Changes in Code**:
- Backend `incidentController.js`: Added `reporter_name`, `reporter_phone` extraction from request
- Backend `socketService.js`: Includes these fields in all socket broadcasts
- Frontend `IncidentMarker.jsx`: Displays form-provided fields with priority over auth user fields
- Mobile `api_service.dart`: Sends `reporter_name` and `reporter_phone` in request body

**Why Rebuild is Needed**:
- Flutter compiles Dart code into native code for each platform
- Changes to Dart files are compiled into the binary
- Running the app without rebuild uses the old compiled binary
- The rebuild process regenerates the binary with new code

---

## After Rebuild

Once you rebuild and run the app:
1. All phone numbers entered by reporters will be accurate
2. All names entered by reporters will be accurate
3. Admin dashboard will show exact reporter info
4. No more showing default phone numbers

✅ **System will be fully functional**
