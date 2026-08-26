import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5713';

test.describe('GAOIRS Full System Black-Box Test Suite', () => {

  // -------------------------------------------------------------
  // 1. PUBLIC CITIZEN REPORTER MODULE
  // -------------------------------------------------------------
  test.describe('Public Citizen Reporter Module', () => {

    test('should allow public access to emergency home page', async ({ page }) => {
      await page.goto(`${BASE_URL}/reporter/home`);
      await expect(page).toHaveURL(`${BASE_URL}/reporter/home`);
      await expect(page.getByRole('button', { name: /Emergency Report/i }).first()).toBeVisible();
    });

    test('should navigate from reporter home to emergency submission form', async ({ page }) => {
      await page.goto(`${BASE_URL}/reporter/home`);
      await page.getByRole('button', { name: /Emergency Report/i }).first().click();
      await expect(page).toHaveURL(/.*reporter\/report/);
    });

    test('should load incident report form elements correctly', async ({ page }) => {
      await page.goto(`${BASE_URL}/reporter/report`);
      await expect(page.getByRole('heading', { name: /Emergency Report/i })).toBeVisible();
    });
  });

  // -------------------------------------------------------------
  // 2. AUTHENTICATION & ACCESS CONTROL
  // -------------------------------------------------------------
  test.describe('Authentication & Access Control', () => {

    test('should redirect unauthenticated user accessing /admin/dashboard to /login', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/dashboard`);
      await expect(page).toHaveURL(/.*login/);
    });

    test('should redirect unauthenticated user accessing /response/dashboard to /login', async ({ page }) => {
      await page.goto(`${BASE_URL}/response/dashboard`);
      await expect(page).toHaveURL(/.*login/);
    });

    test('should render all critical login page UI elements', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await expect(page.getByPlaceholder('Enter your email')).toBeVisible();
      await expect(page.getByPlaceholder('Enter your password')).toBeVisible();
      await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible();
    });

    test('should display registration form elements', async ({ page }) => {
      await page.goto(`${BASE_URL}/register`);
      await expect(page.getByPlaceholder('John Doe')).toBeVisible();
      await expect(page.getByPlaceholder('john@example.com')).toBeVisible();
      await expect(page.getByRole('button', { name: /Register/i })).toBeVisible();
    });

    test('should show error message on invalid login attempt', async ({ page }) => {
      await page.route('**/api/auth/login', route => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Invalid email or password' }),
        });
      });

      await page.goto(`${BASE_URL}/login`);
      await page.getByPlaceholder('Enter your email').fill('invalid@test.com');
      await page.getByPlaceholder('Enter your password').fill('wrongpassword');
      await page.getByRole('button', { name: /Sign In/i }).click();

      await expect(page.getByText('Invalid email or password')).toBeVisible({ timeout: 5000 });
    });
  });

  // -------------------------------------------------------------
  // 3. ADMIN PORTAL USER JOURNEYS
  // -------------------------------------------------------------
  test.describe('Admin Portal Journeys', () => {

    test.beforeEach(async ({ page }) => {
      // Mock Auth Context /auth/me API call
      await page.route('**/api/auth/me', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'admin-1',
            name: 'Admin User',
            email: 'admin@gaoirs.gov',
            role: 'ADMIN'
          }),
        });
      });

      // Catch backend data routes so pages don't stall
      await page.route('**/api/**', route => {
        if (!route.request().url().includes('/auth/')) {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([]),
          });
        } else {
          route.continue();
        }
      });

      await page.addInitScript(() => {
        window.localStorage.setItem('token', 'mock-admin-token');
      });
    });

    test('should render Admin Dashboard upon authorization', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/dashboard`);
      await expect(page).toHaveURL(`${BASE_URL}/admin/dashboard`);
    });

    test('should access Verification Queue page', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/verification`);
      await expect(page).toHaveURL(/.*admin\/verification/);
    });

    test('should access User Management module', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/users`);
      await expect(page).toHaveURL(/.*admin\/users/);
    });

    test('should access Response Unit Management module', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/response-units`);
      await expect(page).toHaveURL(/.*admin\/response-units/);
    });

    test('should access Analytics and Reporting module', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/analytics`);
      await expect(page).toHaveURL(/.*admin\/analytics/);
    });
  });

  // -------------------------------------------------------------
  // 4. RESPONSE UNIT PORTAL JOURNEYS
  // -------------------------------------------------------------
  test.describe('Response Unit Portal Journeys', () => {

    test.beforeEach(async ({ page }) => {
      await page.route('**/api/auth/me', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'unit-1',
            name: 'Fire Station 1',
            email: 'fire1@gaoirs.gov',
            role: 'RESPONSE_UNIT'
          }),
        });
      });

      await page.route('**/api/**', route => {
        if (!route.request().url().includes('/auth/')) {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([]),
          });
        } else {
          route.continue();
        }
      });

      await page.addInitScript(() => {
        window.localStorage.setItem('token', 'mock-unit-token');
      });
    });

    test('should access Responder Map view', async ({ page }) => {
      await page.goto(`${BASE_URL}/response/map`);
      await expect(page).toHaveURL(/.*response\/map/);
    });

    test('should access Responder Active Incidents page', async ({ page }) => {
      await page.goto(`${BASE_URL}/response/incidents`);
      await expect(page).toHaveURL(/.*response\/incidents/);
    });
  });

});
