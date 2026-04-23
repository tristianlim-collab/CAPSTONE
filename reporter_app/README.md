# GAOIRS Reporter Mobile App (Flutter)

A Flutter mobile application for reporting incidents in real-time as part of the GAOIRS (Geospatial Approach to Optimize Incident Response System).

## 📱 Features

- **Authentication**: Login/Register with JWT-based authentication
- **Incident Reporting**: Unified form to report incidents with:
  - Photo evidence (up to 5 images)
  - Real-time location detection
  - Emergency type selection
  - Severity level classification
  - Detailed description
  - Personal information
- **My Reports**: View all incidents you've reported with status tracking
- **Real-time Updates**: Socket.io integration for live incident status updates
- **Offline Support**: Secure token storage for seamless re-authentication
- **iOS & Android**: Fully responsive for both platforms

## 🚀 Getting Started

### Prerequisites
- Flutter SDK 3.41.4+
- Dart 3.11.1+
- An active backend server (Node.js/Express)
- Android Studio (for Android) or Xcode (for iOS)

### Installation

1. **Navigate to project directory**:
   ```bash
   cd reporter_app
   ```

2. **Install dependencies**:
   ```bash
   flutter pub get
   ```

3. **Configure environment**:
   Edit `.env` file with your backend URLs:
   ```
   API_BASE_URL=http://your-backend-url:3000
   SOCKET_IO_URL=http://your-backend-url:3000
   NOMINATIM_URL=https://nominatim.openstreetmap.org
   ```

4. **Run the app**:
   ```bash
   # Development
   flutter run

   # iOS
   flutter run -d ios

   # Android
   flutter run -d android
   ```

## 📁 Project Structure

```
reporter_app/
├── lib/
│   ├── main.dart                 # App entry point
│   ├── theme/
│   │   └── app_theme.dart       # Material 3 theme configuration
│   ├── models/                  # Data models
│   │   ├── user.dart
│   │   ├── incident.dart
│   │   └── incident_type.dart
│   ├── services/               # Business logic services
│   │   ├── api_service.dart    # HTTP client for API calls
│   │   └── location_service.dart # Geolocation & reverse geocoding
│   ├── providers/              # State management
│   │   ├── auth_provider.dart  # Authentication state
│   │   └── socket_provider.dart # Socket.io connection
│   └── screens/               # UI screens
│       ├── auth/             # Authentication screens
│       │   ├── login_screen.dart
│       │   └── register_screen.dart
│       └── reporter/         # Reporter screens
│           ├── reporter_home_screen.dart
│           ├── incident_report_form_screen.dart
│           └── my_reports_screen.dart
├── .env                        # Environment variables
├── pubspec.yaml               # Flutter dependencies
└── README.md                   # This file
```

## 🔧 Configuration

### Android Setup

1. **Update `android/app/src/main/AndroidManifest.xml`**:
   ```xml
   <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
   <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
   <uses-permission android:name="android.permission.CAMERA" />
   <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
   ```

2. **Set minimum SDK** in `android/app/build.gradle`:
   ```gradle
   minSdkVersion 21
   ```

### iOS Setup

1. **Update `ios/Runner/Info.plist`**:
   ```xml
   <key>NSLocationWhenInUseUsageDescription</key>
   <string>This app needs access to your location to report incidents accurately</string>
   <key>NSCameraUsageDescription</key>
   <string>This app needs access to your camera to upload incident photos</string>
   <key>NSPhotoLibraryUsageDescription</key>
   <string>This app needs access to your photo library</string>
   ```

## 📦 Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| provider | ^6.1.0 | State management |
| http | ^1.1.0 | HTTP client |
| geolocator | ^9.0.2 | GPS geolocation |
| geocoding | ^2.1.1 | Reverse geocoding |
| image_picker | ^1.0.4 | Photo/image selection |
| socket_io_client | ^2.0.1 | Real-time communication |
| jwt_decoder | ^2.0.1 | JWT token decoding |
| shared_preferences | ^2.2.2 | Local token storage |
| intl | ^0.19.0 | Date/time formatting |
| permission_handler | ^12.0.1 | Device permissions |
| google_maps_flutter | ^2.5.3 | Maps (future use) |

## 🔌 API Integration

The app communicates with the backend via these main endpoints:

- **Auth**: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- **Incidents**: `POST /api/incidents`, `GET /api/incidents`, `GET /api/incidents/:id`
- **Types**: `GET /api/incident-types`
- **Evidence**: `POST /api/evidence`, `GET /api/evidence/:incidentId`

## 🧪 Testing

```bash
# Run tests
flutter test

# Build APK
flutter build apk --release

# Build iOS
flutter build ios --release
```

## 📝 Authentication Flow

1. User launches app → checks JWT token validity
2. If token valid and not expired → auto-login to home screen
3. If no token or expired → redirect to login screen
4. Token stored in `SharedPreferences` for persistence
5. Token included in all API requests via `Authorization: Bearer {token}` header

## 🗺️ Location Services

- **Detection**: 30-second timeout, high accuracy
- **Reverse Geocoding**: Uses OpenStreetMap Nominatim (with Flutter Geocoding fallback)
- **Fallback**: Form allows manual entry if location detection fails

## 🔐 Security Notes

- JWT tokens stored securely in `SharedPreferences`
- Tokens validated on app startup
- Expired tokens trigger re-authentication
- All API requests require valid Bearer token
- Location data only transmitted with incidents

## 🚧 Future Enhancements

- [ ] Cloudinary image upload integration
- [ ] Push notifications for incident status updates
- [ ] Offline incident queue and sync
- [ ] Map view integration
- [ ] Incident search and filtering
- [ ] Multi-language support
- [ ] Biometric authentication

## 📞 Support

For issues or feature requests, please refer to the main CAPSTONE project documentation.

## 📄 License

Part of the GAOIRS capstone project.
