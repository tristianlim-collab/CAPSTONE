# GAOIRS Flutter - Platform Setup Guide

## Android Configuration

### 1. Update AndroidManifest.xml

Edit `android/app/src/main/AndroidManifest.xml` and add these permissions before the `<application>` tag:

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.INTERNET" />
```

### 2. Update build.gradle

Edit `android/app/build.gradle` and ensure:

```gradle
android {
    compileSdkVersion 33

    defaultConfig {
        minSdkVersion 21
        targetSdkVersion 33
        // ... rest of config
    }
}
```

### 3. Add Dependencies

The `image_picker`, `geolocator`, and `permission_handler` packages require additional Android configuration.

For **image_picker**, ensure you have:
- Image picker will request CAMERA and READ_EXTERNAL_STORAGE at runtime

For **geolocator**, ensure location permission request works:
- The app will request location permissions at runtime when "Detect Location" is tapped

## iOS Configuration

### 1. Update Info.plist

Edit `ios/Runner/Info.plist` and add these keys (use Xcode or text editor):

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>GAOIRS needs access to your location to report incidents accurately and map them on our emergency response system.</string>

<key>NSLocationAlwaysUsageDescription</key>
<string>GAOIRS needs continuous location access for incident tracking.</string>

<key>NSCameraUsageDescription</key>
<string>Allow camera access to take photos as evidence when reporting incidents.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>Allow photo library access to select incident evidence photos.</string>

<key>NSPhotoLibraryAddUsageDescription</key>
<string>Allow saving incident evidence photos to your library.</string>
```

### 2. Update Podfile

Edit `ios/Podfile` and ensure:

```ruby
platform :ios, '12.0'

post_install do |installer|
  installer.pods_project.targets.each do |target|
    flutter_additional_ios_build_settings(target)
    target.build_configurations.each do |config|
      config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= [
        '$(inherited)',
        'PERMISSION_LOCATION=1',
        'PERMISSION_CAMERA=1',
        'PERMISSION_PHOTOS=1',
      ]
    end
  end
end
```

### 3. Build Requirements

Ensure Xcode is configured:
- Xcode 14.0+
- iOS Deployment Target: 12.0 or later
- CocoaPods up to date: `sudo gem install cocoapods`

## Google Maps Configuration (Future Use)

### Android
1. Get API key from [Google Cloud Console](https://console.cloud.google.com)
2. Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<meta-data
    android:name="com.google.android.geo.API_KEY"
    android:value="YOUR_API_KEY_HERE" />
```

### iOS
1. Add to `ios/Runner/Info.plist`:
```xml
<key>com.google.ios.maps.API_KEY</key>
<string>YOUR_API_KEY_HERE</string>
```

## Running the App

After configuration:

```bash
# Install dependencies
flutter pub get

# Clean build
flutter clean

# Run on Android
flutter run -d android

# Run on iOS
flutter run -d ios

# Build release APK
flutter build apk --release

# Build release iOS
flutter build ios --release
```

## Troubleshooting

### Location Permission Issues
- **Android**: Ensure device has location enabled in Settings
- **iOS**: Check Privacy → Location Services in device settings

### Image Picker Issues
- **Android**: Ensure minimum SDK is 21+
- **iOS**: Check photo library permission in device settings

### Socket.io Connection Issues
- Ensure backend server is running and accessible
- Update `.env` file with correct API_BASE_URL and SOCKET_IO_URL
- Check firewall/network settings allow WebSocket connections

## Development Tips

1. **Hot Reload**: Press `r` during `flutter run` to reload code
2. **Hot Restart**: Press `R` for full app restart
3. **Debug**: Press `d` to launch on device
4. **Logs**: Use `flutter logs` to view console output
5. **Verbose**: Run with `flutter run -v` for detailed logs

## Next Steps

1. Configure Android and iOS as per above
2. Get API keys for Google Maps (if needed)
3. Test location detection on device
4. Test photo picker functionality
5. Integrate Cloudinary for image uploads
6. Set up push notifications
