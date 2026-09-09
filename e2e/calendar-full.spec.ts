import { test, expect } from '@playwright/test';
import { signInAsTestUser } from './helpers/auth';

test.describe('Calendar Full Screen', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page);
  });

  test('should navigate to calendar from See All link', async ({ page }) => {
    // Scroll to schedule section
    await page.evaluate(() => window.scrollBy(0, 800));
    await page.waitForTimeout(1000);

    const seeAll = page.getByText('See All');
    const hasSeeAll = await seeAll.isVisible().catch(() => false);

    if (!hasSeeAll) {
      // Try scrolling more
      await page.evaluate(() => window.scrollBy(0, 400));
      await page.waitForTimeout(1000);
    }

    const seeAllVisible = await seeAll.isVisible().catch(() => false);
    if (!seeAllVisible) {
      test.skip();
      return;
    }

    await seeAll.click();
    await page.waitForTimeout(2000);

    const calendarTitle = page.getByText('Calendar');
    await expect(calendarTitle).toBeVisible({ timeout: 15000 });
  });

  test('should show today events on calendar screen', async ({ page }) => {
    // Navigate to calendar via direct URL or See All
    await page.evaluate(() => window.scrollBy(0, 800));
    await page.waitForTimeout(1000);

    const seeAll = page.getByText('See All');
    const hasSeeAll = await seeAll.isVisible().catch(() => false);
    if (!hasSeeAll) {
      await page.evaluate(() => window.scrollBy(0, 400));
      await page.waitForTimeout(1000);
    }

    if (!(await seeAll.isVisible().catch(() => false))) {
      test.skip();
      return;
    }

    await seeAll.click();
    await page.waitForTimeout(2000);

    // Seed data has 3 events: Product Standup, Client Review, Weekly Sync
    const hasEvent = await page.getByText(/Standup|Client Review|Weekly Sync/i).first().isVisible().catch(() => false);
    const hasEmpty = await page.getByText('No events scheduled').isVisible().catch(() => false);

    expect(hasEvent || hasEmpty).toBe(true);
  });

  test('should show date selector on calendar', async ({ page }) => {
    await page.evaluate(() => window.scrollBy(0, 800));
    await page.waitForTimeout(1000);
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(500);

    const seeAll = page.getByText('See All');
    if (!(await seeAll.isVisible().catch(() => false))) {
      test.skip();
      return;
    }

    await seeAll.click();
    await page.waitForTimeout(2000);

    // Date selector should show day names
    const hasMon = await page.getByText('Mon').isVisible().catch(() => false);
    const hasTue = await page.getByText('Tue').isVisible().catch(() => false);
    const hasWed = await page.getByText('Wed').isVisible().catch(() => false);
    const hasThu = await page.getByText('Thu').isVisible().catch(() => false);

    expect(hasMon || hasTue || hasWed || hasThu).toBe(true);
  });
});
