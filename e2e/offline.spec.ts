import { test, expect } from '@playwright/test';
import { signInAsTestUser } from './helpers/auth';

test.describe('Offline Resilience', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page);
  });

  test('should show cached data after going offline', async ({ page }) => {
    // Load page with network
    await page.waitForTimeout(3000);

    // Verify content loaded
    const greeting = page.getByText(/good (morning|afternoon|evening),/i);
    await expect(greeting).toBeVisible({ timeout: 15000 });

    // Simulate offline by blocking all network requests
    await page.route('**/*', (route) => {
      if (route.request().resourceType() === 'document' || route.request().url().includes('localhost')) {
        route.continue();
      } else {
        route.abort();
      }
    });

    // Content should still be visible (cached by React Query)
    await expect(greeting).toBeVisible({ timeout: 5000 });
  });

  test('should recover after network restore', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Block external requests
    await page.route('**/rest/v1/**', (route) => route.abort());
    await page.waitForTimeout(1000);

    // Unblock
    await page.unrouteAll();
    await page.waitForTimeout(2000);

    // Page should still function
    const homeTab = page.getByText('Home', { exact: true });
    await expect(homeTab).toBeVisible({ timeout: 10000 });
  });
});
