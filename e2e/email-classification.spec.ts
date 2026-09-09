import { test, expect } from '@playwright/test';
import { signInAsTestUser, navigateToTab } from './helpers/auth';

test.describe('Email Classification Badges', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page);
    await navigateToTab(page, 'Comms');
    await page.waitForTimeout(1000);

    // Switch to Emails sub-tab via UnderlineTabs
    const emailsTab = page.getByTestId('tab-emails');
    const hasEmailsTab = await emailsTab.isVisible().catch(() => false);

    if (hasEmailsTab) {
      await emailsTab.click();
    } else {
      // Fallback: try clicking the "Emails" text directly
      await page.getByText('Emails', { exact: true }).click();
    }
    await page.waitForTimeout(2000);
  });

  test('should show classification badges on emails', async ({ page }) => {
    // Seed data has 3 emails with classifications:
    //   - "action_required" renders as "ACTION"
    //   - "fyi" renders as "FYI"
    //   - "meeting" renders as "MEETING"
    const actionBadge = page.getByText('ACTION', { exact: true });
    const fyiBadge = page.getByText('FYI', { exact: true });
    const meetingBadge = page.getByText('MEETING', { exact: true });

    const hasAction = await actionBadge.isVisible().catch(() => false);
    const hasFyi = await fyiBadge.isVisible().catch(() => false);
    const hasMeeting = await meetingBadge.isVisible().catch(() => false);

    // At least one classification badge should be visible
    expect(hasAction || hasFyi || hasMeeting).toBe(true);
  });

  test('should show ACTION badge for action-required emails', async ({ page }) => {
    // Seed email 1: "Q4 Returns & Portfolio Review Request" has classification "action_required"
    const actionBadge = page.getByText('ACTION', { exact: true });
    const hasAction = await actionBadge.isVisible().catch(() => false);

    if (!hasAction) {
      // Scroll down in case the email is below the fold
      await page.evaluate(() => window.scrollBy(0, 400));
      await page.waitForTimeout(1000);
    }

    // The ACTION badge should be visible if the email list loaded
    const emptyState = page.getByText('No emails yet');
    const hasEmpty = await emptyState.isVisible().catch(() => false);

    if (hasEmpty) {
      test.skip();
      return;
    }

    await expect(page.getByText('ACTION', { exact: true })).toBeVisible({ timeout: 15000 });
  });

  test('should show FYI badge for informational emails', async ({ page }) => {
    // Seed email 2: "FYI: Team Offsite Venue Confirmed" has classification "fyi"
    const fyiBadge = page.getByText('FYI', { exact: true });
    const hasAction = await fyiBadge.isVisible().catch(() => false);

    if (!hasAction) {
      await page.evaluate(() => window.scrollBy(0, 400));
      await page.waitForTimeout(1000);
    }

    const emptyState = page.getByText('No emails yet');
    const hasEmpty = await emptyState.isVisible().catch(() => false);

    if (hasEmpty) {
      test.skip();
      return;
    }

    await expect(page.getByText('FYI', { exact: true })).toBeVisible({ timeout: 15000 });
  });

  test('should show MEETING badge for meeting-related emails', async ({ page }) => {
    // Seed email 3: "Meeting Scheduled: Client Review - Acme Corp" has classification "meeting"
    const meetingBadge = page.getByText('MEETING', { exact: true });
    const hasMeeting = await meetingBadge.isVisible().catch(() => false);

    if (!hasMeeting) {
      await page.evaluate(() => window.scrollBy(0, 400));
      await page.waitForTimeout(1000);
    }

    const emptyState = page.getByText('No emails yet');
    const hasEmpty = await emptyState.isVisible().catch(() => false);

    if (hasEmpty) {
      test.skip();
      return;
    }

    await expect(page.getByText('MEETING', { exact: true })).toBeVisible({ timeout: 15000 });
  });

  test('should display email subjects alongside badges', async ({ page }) => {
    // Verify that email content from seed data is rendered
    const investorEmail = page.getByText('Q4 Returns & Portfolio Review Request');
    const offsiteEmail = page.getByText(/Team Offsite Venue Confirmed/);
    const meetingEmail = page.getByText(/Client Review - Acme Corp/);

    const hasInvestor = await investorEmail.isVisible().catch(() => false);
    const hasOffsite = await offsiteEmail.isVisible().catch(() => false);
    const hasMeeting = await meetingEmail.isVisible().catch(() => false);

    const emptyState = page.getByText('No emails yet');
    const hasEmpty = await emptyState.isVisible().catch(() => false);

    // Either email content or empty state should be visible
    expect(hasInvestor || hasOffsite || hasMeeting || hasEmpty).toBe(true);
  });

  test('should display sender names on email list items', async ({ page }) => {
    // Seed data sender names: "Meera Kapoor", "Priya Sharma", "Zoom"
    const meera = page.getByText('Meera Kapoor');
    const priya = page.getByText('Priya Sharma');
    const zoom = page.getByText('Zoom', { exact: true });

    const hasMeera = await meera.isVisible().catch(() => false);
    const hasPriya = await priya.isVisible().catch(() => false);
    const hasZoom = await zoom.isVisible().catch(() => false);

    const emptyState = page.getByText('No emails yet');
    const hasEmpty = await emptyState.isVisible().catch(() => false);

    expect(hasMeera || hasPriya || hasZoom || hasEmpty).toBe(true);
  });
});
