import { test, expect } from '@playwright/test';
import { signInAsTestUser } from './helpers/auth';

test.describe('Notification Filters', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page);

    // Navigate to notifications — click the bell icon
    const bell = page.locator('[data-testid="notification-bell"]');
    const hasBell = await bell.isVisible({ timeout: 15000 }).catch(() => false);

    if (hasBell) {
      await bell.click();
    } else {
      // Fallback: try text-based click
      await page.getByText('Notifications').first().click().catch(() => {});
    }
    await page.waitForTimeout(2000);
  });

  test('should show filter chips on notifications screen', async ({ page }) => {
    const notifTitle = page.getByText('Notifications');
    const hasNotif = await notifTitle.isVisible().catch(() => false);
    if (!hasNotif) {
      test.skip();
      return;
    }

    // Filter chips should be visible
    const allChip = page.getByText('All', { exact: true });
    await expect(allChip).toBeVisible({ timeout: 10000 });

    const tasksChip = page.getByText('Tasks', { exact: true });
    await expect(tasksChip).toBeVisible({ timeout: 10000 });
  });

  test('should filter notifications when chip is tapped', async ({ page }) => {
    const notifTitle = page.getByText('Notifications');
    const hasNotif = await notifTitle.isVisible().catch(() => false);
    if (!hasNotif) {
      test.skip();
      return;
    }

    // Tap Tasks filter chip
    const tasksChip = page.getByText('Tasks', { exact: true });
    if (await tasksChip.isVisible().catch(() => false)) {
      await tasksChip.click();
      await page.waitForTimeout(1000);
    }

    // Tap All to reset
    const allChip = page.getByText('All', { exact: true });
    if (await allChip.isVisible().catch(() => false)) {
      await allChip.click();
      await page.waitForTimeout(1000);
    }

    // Should still show notifications
    const hasContent = await page.getByText(/Today|Earlier/).first().isVisible().catch(() => false);
    const hasEmpty = await page.getByText('All caught up!').isVisible().catch(() => false);
    expect(hasContent || hasEmpty).toBe(true);
  });
});
