import { test, expect } from '@playwright/test';

const EXPO_URL = 'http://localhost:8081';

test.describe('GAOIRS Mobile Citizen App Black-Box Test Suite', () => {

  test('should render mobile emergency home interface', async ({ page }) => {
    await page.goto(EXPO_URL);
    // Verify emergency button or main header elements
    await expect(page.getByText(/Emergency Report/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('should display citizen stats cards', async ({ page }) => {
    await page.goto(EXPO_URL);
    await expect(page.getByText(/TOTAL REPORTS/i).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/ACTIVE/i).first()).toBeVisible();
  });

  test('should display recent activity section header', async ({ page }) => {
    await page.goto(EXPO_URL);
    await expect(page.getByText(/RECENT ACTIVITY/i).first()).toBeVisible({ timeout: 15000 });
  });

});
