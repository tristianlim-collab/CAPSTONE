# QUICK START - Test the Fixed App

## ✅ Step 1: Start Backend (5 min)
```bash
cd c:\Users\Tristan Zane\OneDrive\Desktop\CAPSTONE\backend
npm run dev
```
Wait for: `Server is running on port 3001`

## ✅ Step 2: Run Flutter App (5 min)
```bash
cd c:\Users\Tristan Zane\OneDrive\Desktop\CAPSTONE\reporter_app
flutter pub get
flutter run
```
Wait for emulator to load and app to start

## ✅ Step 3: Test Authentication (2 min)

### Test 3a: Register New Account
```
1. Open app → Shows login screen
2. Tap "Don't have an account? Register"
3. Fill form:
   - First Name: Test
   - Last Name: User
   - Email: testuser@example.com
   - Contact: 09123456789
   - Password: password123
4. Tap "Register"
5. Expected: ✅ Redirects to home screen
```

### Test 3b: Auto-Login After Restart
```
1. Kill app (press stop in VS Code)
2. Restart: flutter run
3. Expected: ✅ App launches directly to home (no login needed)
4. Token persisted automatically = SUCCESS
```

## ✅ Step 4: Test Location Detection (3 min)
```
1. From home, tap "Report Incident"
2. Scroll down to "Location" section
3. Tap "Detect Location"
4. Grant permission when prompted (in emulator: Settings > Apps > reporter_app > Permissions > Location > Allow)
5. Wait 5-10 seconds for location detection
6. Expected: ✅ Shows GPS coordinates & barangay/city name
7. Tap "Refresh" to re-detect
```

## ✅ Step 5: Test Photo Selection (2 min)
```
1. From incident form, tap "Add Photos"
2. Select 2-3 photos from emulator's gallery
3. Expected: ✅ Photos appear in grid (3 columns)
4. Tap X on a photo to remove
5. Try selecting 6+ photos
6. Expected: ✅ Warning "Max 5 photos allowed"
```

## ✅ Step 6: Complete Incident Report (5 min)
```
1. Fill complete form:
   - Photos: 1-2 selected
   - Location: Auto-detected (required)
   - Type: Select "FIRE" (red/orange color)
   - Description: "Test incident report"
   - Severity: HIGH (red button)
   - Name: "Test Reporter" (or blank = auto-fill)
   - Phone: 09123456789 (optional)

2. Scroll to bottom
3. Tap "Submit Report"
4. Wait for loading spinner
5. Expected: ✅ Shows success message with incident code (e.g., "INC-2026-0001")
6. Redirects back to home screen
```

## ✅ Step 7: Verify in My Reports (2 min)
```
1. From home, tap "My Reports"
2. Expected: ✅ See newly created incident in list
3. Shows:
   - Incident type with icon (FIRE)
   - Status badge (REPORTED)
   - Location (barangay/city)
   - Time elapsed
4. Tap incident → Detail modal opens
5. Close modal → Returns to list
```

## 🎉 SUCCESS CRITERIA

ALL of these should work:
- ✅ App connects to backend (no connection refused error)
- ✅ User can register and login
- ✅ Location detection shows real coordinates
- ✅ Photos display in preview grid
- ✅ Form submission creates incident with code
- ✅ Incident appears in My Reports
- ✅ App doesn't crash (no red screens)

---

## 🐛 TROUBLESHOOTING

### "Connection refused" Error
→ Check backend is running: `npm run dev` shows `port 3001`

### Location not detected
→ In emulator settings, grant location permission and set mock location

### Photos won't load
→ Grant camera + storage permissions in emulator settings

### Form won't submit
→ Ensure location is detected (required field)
→ Check description is not empty

---

## 📊 Test Results Checklist

| Item | Status | Time |
|------|--------|------|
| Backend running on 3001 | ⭐ | 1-2 min |
| App launches without error | ⭐ | 1 min |
| Can register account | ⭐ | 1 min |
| Auto-login after restart | ⭐ | 1 min |
| Location detection works | ⭐ | 2 min |
| Photo selection works | ⭐ | 2 min |
| Complete incident submission | ⭐ | 3 min |
| Incident appears in My Reports | ⭐ | 1 min |

**Total Test Time**: ~15-20 minutes for full verification

---

**Status**: Ready to test! 🚀
