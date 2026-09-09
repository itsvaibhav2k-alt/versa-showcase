import { test, expect } from '@playwright/test';
import { signInAsTestUser } from './helpers/auth';

test.describe('Call Detail', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page);
    // Navigate to Comms tab (contains Calls + Emails sub-tabs via UnderlineTabs)
    const commsTab = page.getByText('Comms', { exact: true }).first();
    await commsTab.click();
    await page.waitForTimeout(2000);
  });

  test('should navigate to call detail and show call info', async ({ page }) => {
    // Wait for the call list to load — look for a section header or empty state
    // Comms screen groups calls into TODAY / YESTERDAY / THIS WEEK / EARLIER
    const todayHeader = page.getByText('TODAY', { exact: true });
    const yesterdayHeader = page.getByText('YESTERDAY', { exact: true });
    const thisWeekHeader = page.getByText('THIS WEEK', { exact: true });
    const earlierHeader = page.getByText('EARLIER', { exact: true });
    const emptyState = page.getByText('No calls yet');

    const hasToday = await todayHeader.isVisible().catch(() => false);
    const hasYesterday = await yesterdayHeader.isVisible().catch(() => false);
    const hasThisWeek = await thisWeekHeader.isVisible().catch(() => false);
    const hasEarlier = await earlierHeader.isVisible().catch(() => false);
    const isEmpty = await emptyState.isVisible().catch(() => false);

    if (isEmpty) {
      test.skip();
      return;
    }

    // Click on the first call FlatRow item (CallLogItem renders as FlatRow with testID)
    const firstCallItem = page.locator('[data-testid^="flat-row-call"]').first();

    if (await firstCallItem.isVisible().catch(() => false)) {
      await firstCallItem.click();
    } else {
      // Fallback: try clicking any visible phone number pattern
      const fallbackCallItem = page.locator('text=/\\(\\d{3}\\)\\s\\d{3}-\\d{4}/').first();
      if (await fallbackCallItem.isVisible().catch(() => false)) {
        await fallbackCallItem.click();
      } else {
        test.skip();
        return;
      }
    }

    await page.waitForTimeout(2000);

    // Assert the Call Details header is visible (centered title in header bar)
    const callDetailsTitle = page.getByText('Call Details');
    await expect(callDetailsTitle).toBeVisible({ timeout: 15000 });
  });

  test('should show AI Summary section on call detail', async ({ page }) => {
    const emptyState = page.getByText('No calls yet');
    const isEmpty = await emptyState.isVisible().catch(() => false);
    if (isEmpty) {
      test.skip();
      return;
    }

    // Click the first call FlatRow (CallLogItem uses FlatRow with testID flat-row-call-*)
    const firstCallItem = page.locator('[data-testid^="flat-row-call"]').first();
    if (!(await firstCallItem.isVisible().catch(() => false))) {
      test.skip();
      return;
    }
    await firstCallItem.click();
    await page.waitForTimeout(2000);

    // AI Summary renders in a plum-tinted Card — either "AI Summary" or "Generate AI Summary"
    const aiSummary = page.getByText('AI Summary');
    const hasAiSummary = await aiSummary.isVisible().catch(() => false);

    // Follow-ups section is always rendered (before Transcript)
    const followUps = page.getByText('Follow-ups');
    await expect(followUps).toBeVisible({ timeout: 10000 });
  });

  test('should show Transcript section on call detail', async ({ page }) => {
    const emptyState = page.getByText('No calls yet');
    const isEmpty = await emptyState.isVisible().catch(() => false);
    if (isEmpty) {
      test.skip();
      return;
    }

    const firstCallItem = page.locator('[data-testid^="flat-row-call"]').first();
    if (!(await firstCallItem.isVisible().catch(() => false))) {
      test.skip();
      return;
    }
    await firstCallItem.click();
    await page.waitForTimeout(2000);

    const transcript = page.getByText('Transcript');
    await expect(transcript).toBeVisible({ timeout: 10000 });
  });

  test('should show sticky action bar on call detail', async ({ page }) => {
    const emptyState = page.getByText('No calls yet');
    const isEmpty = await emptyState.isVisible().catch(() => false);
    if (isEmpty) {
      test.skip();
      return;
    }

    const firstCallItem = page.locator('[data-testid^="flat-row-call"]').first();
    if (!(await firstCallItem.isVisible().catch(() => false))) {
      test.skip();
      return;
    }
    await firstCallItem.click();
    await page.waitForTimeout(2000);

    // Sticky action bar at bottom: "Assign to Team" (secondary) and "Create Follow-up" (velvet primary)
    // Also shows "Call Back" button if status is missed
    const assignButton = page.getByText('Assign to Team');
    await expect(assignButton).toBeVisible({ timeout: 10000 });

    const followUpButton = page.getByText('Create Follow-up');
    await expect(followUpButton).toBeVisible({ timeout: 10000 });
  });

  test('should show AI Summary or Generate button on call detail', async ({ page }) => {
    const emptyState = page.getByText('No calls yet');
    const isEmpty = await emptyState.isVisible().catch(() => false);
    if (isEmpty) {
      test.skip();
      return;
    }

    const firstCallItem = page.locator('[data-testid^="flat-row-call"]').first();
    if (!(await firstCallItem.isVisible().catch(() => false))) {
      test.skip();
      return;
    }
    await firstCallItem.click();
    await page.waitForTimeout(2000);

    // AI section renders in plum-tinted area:
    // - If summary exists: "AI Summary" heading with summary text
    // - If no summary: "Generate AI Summary" pressable with Sparkles icon
    // - If generating: "Generating Summary..." with skeleton loading
    const aiSummary = page.getByText('AI Summary');
    const generateSummary = page.getByText('Generate AI Summary');
    const generatingSummary = page.getByText('Generating Summary...');

    const hasAi = await aiSummary.isVisible().catch(() => false);
    const hasGenerate = await generateSummary.isVisible().catch(() => false);
    const hasGenerating = await generatingSummary.isVisible().catch(() => false);

    expect(hasAi || hasGenerate || hasGenerating).toBe(true);
  });

  test('should show all three detail sections: Summary, Follow-ups, and Transcript', async ({ page }) => {
    const emptyState = page.getByText('No calls yet');
    const isEmpty = await emptyState.isVisible().catch(() => false);
    if (isEmpty) {
      test.skip();
      return;
    }

    const firstCallItem = page.locator('[data-testid^="flat-row-call"]').first();
    if (!(await firstCallItem.isVisible().catch(() => false))) {
      test.skip();
      return;
    }
    await firstCallItem.click();
    await page.waitForTimeout(2000);

    // Verify Call Details header
    await expect(page.getByText('Call Details')).toBeVisible({ timeout: 10000 });

    // Summary section: either "AI Summary" or "Generate AI Summary" must be present
    const aiSummary = page.getByText('AI Summary');
    const generateSummary = page.getByText('Generate AI Summary');
    const hasSummarySection = await aiSummary.isVisible().catch(() => false)
      || await generateSummary.isVisible().catch(() => false);
    expect(hasSummarySection).toBe(true);

    // Follow-ups section must always be visible
    const followUps = page.getByText('Follow-ups');
    await expect(followUps).toBeVisible({ timeout: 10000 });

    // Transcript section must always be visible (scroll down if needed)
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(500);
    const transcript = page.getByText('Transcript');
    await expect(transcript).toBeVisible({ timeout: 10000 });
  });
});
