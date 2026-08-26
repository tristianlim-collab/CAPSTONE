# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: mobile.spec.js >> GAOIRS Mobile Citizen App Black-Box Test Suite >> should display citizen stats cards
- Location: tests\mobile.spec.js:13:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/TOTAL REPORTS/i).first()
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for getByText(/TOTAL REPORTS/i).first()

```

```yaml
- text: "{\"id\":\"55722a6a-b511-490b-bc3a-2fef17757afc\",\"createdAt\":\"2026-08-24T14:47:54.668Z\",\"runtimeVersion\":\"exposdk:54.0.0\",\"launchAsset\":{\"key\":\"bundle\",\"contentType\":\"application/javascript\",\"url\":\"http://127.0.0.1:8081/index.bundle?platform=ios&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.bytecode=1&transform.routerRoot=app&unstable_transformProfile=hermes-stable\"},\"assets\":[],\"metadata\":{},\"extra\":{\"eas\":{},\"expoClient\":{\"name\":\"GAOIRS Reporter\",\"slug\":\"gaoirs-reporter\",\"version\":\"1.0.0\",\"orientation\":\"portrait\",\"icon\":\"./assets/icon.png\",\"userInterfaceStyle\":\"light\",\"newArchEnabled\":true,\"splash\":{\"image\":\"./assets/splash-icon.png\",\"resizeMode\":\"contain\",\"backgroundColor\":\"#ffffff\",\"imageUrl\":\"http://127.0.0.1:8081/assets/./assets/splash-icon.png\"},\"ios\":{\"supportsTablet\":true,\"bundleIdentifier\":\"com.gaoirs.reporter\",\"infoPlist\":{\"NSLocationWhenInUseUsageDescription\":\"GAOIRS needs your location to report emergencies precisely.\",\"NSCameraUsageDescription\":\"GAOIRS needs camera access to capture emergency evidence.\"}},\"android\":{\"package\":\"com.gaoirs.reporter\",\"adaptiveIcon\":{\"foregroundImage\":\"./assets/adaptive-icon.png\",\"backgroundColor\":\"#ffffff\",\"foregroundImageUrl\":\"http://127.0.0.1:8081/assets/./assets/adaptive-icon.png\"},\"permissions\":[\"ACCESS_COARSE_LOCATION\",\"ACCESS_FINE_LOCATION\",\"CAMERA\",\"READ_EXTERNAL_STORAGE\",\"WRITE_EXTERNAL_STORAGE\",\"android.permission.ACCESS_COARSE_LOCATION\",\"android.permission.ACCESS_FINE_LOCATION\",\"android.permission.CAMERA\",\"android.permission.RECORD_AUDIO\"],\"edgeToEdgeEnabled\":true},\"plugins\":[[\"expo-location\",{\"locationAlwaysPermission\":\"Allow GAOIRS to detect your location even in background for emergency tracking.\"}],[\"expo-camera\",{\"cameraPermission\":\"Allow GAOIRS to use the camera for evidence reporting.\"}]],\"_internal\":{\"isDebug\":false,\"projectRoot\":\"C:\\\\Users\\\\Tristan Zane\\\\OneDrive\\\\Desktop\\\\CAPSTONE\\\\reporter_app\",\"dynamicConfigPath\":{},\"staticConfigPath\":\"C:\\\\Users\\\\Tristan Zane\\\\OneDrive\\\\Desktop\\\\CAPSTONE\\\\reporter_app\\\\app.json\",\"packageJsonPath\":\"C:\\\\Users\\\\Tristan Zane\\\\OneDrive\\\\Desktop\\\\CAPSTONE\\\\reporter_app\\\\package.json\",\"pluginHistory\":{\"expo-location\":{\"name\":\"expo-location\",\"version\":\"19.0.8\"},\"expo-camera\":{\"name\":\"expo-camera\",\"version\":\"17.0.10\"}}},\"sdkVersion\":\"54.0.0\",\"platforms\":[\"ios\",\"android\"],\"iconUrl\":\"http://127.0.0.1:8081/assets/./assets/icon.png\",\"hostUri\":\"127.0.0.1:8081\"},\"expoGo\":{\"debuggerHost\":\"127.0.0.1:8081\",\"developer\":{\"tool\":\"expo-cli\",\"projectRoot\":\"C:\\\\Users\\\\Tristan Zane\\\\OneDrive\\\\Desktop\\\\CAPSTONE\\\\reporter_app\"},\"packagerOpts\":{\"dev\":true},\"mainModuleName\":\"index\"},\"scopeKey\":\"@anonymous/gaoirs-reporter-0eede694-4ce2-4526-8f94-fd352e83969f\"}}"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | const EXPO_URL = 'http://localhost:8081';
  4  | 
  5  | test.describe('GAOIRS Mobile Citizen App Black-Box Test Suite', () => {
  6  | 
  7  |   test('should render mobile emergency home interface', async ({ page }) => {
  8  |     await page.goto(EXPO_URL);
  9  |     // Verify emergency button or main header elements
  10 |     await expect(page.getByText(/Emergency Report/i).first()).toBeVisible({ timeout: 15000 });
  11 |   });
  12 | 
  13 |   test('should display citizen stats cards', async ({ page }) => {
  14 |     await page.goto(EXPO_URL);
> 15 |     await expect(page.getByText(/TOTAL REPORTS/i).first()).toBeVisible({ timeout: 15000 });
     |                                                            ^ Error: expect(locator).toBeVisible() failed
  16 |     await expect(page.getByText(/ACTIVE/i).first()).toBeVisible();
  17 |   });
  18 | 
  19 |   test('should display recent activity section header', async ({ page }) => {
  20 |     await page.goto(EXPO_URL);
  21 |     await expect(page.getByText(/RECENT ACTIVITY/i).first()).toBeVisible({ timeout: 15000 });
  22 |   });
  23 | 
  24 | });
  25 | 
```