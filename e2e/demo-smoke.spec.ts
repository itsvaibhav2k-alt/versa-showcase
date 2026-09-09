import { test, expect } from '@playwright/test';
import { signInAsTestUser, navigateToTab } from './helpers/auth';

test.describe('Demo Smoke Test', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page);
  });

  test('dashboard loads with greeting, stats, and schedule', async ({ page }) => {
    // Greeting
    const greeting = page.getByText(/good (morning|afternoon|evening)/i);
    await expect(greeting).toBeVisible({ timeout: 15000 });

    // Stat line
    const statLine = page.getByTestId('stat-line');
    await expect(statLine).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/tasks?/)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/meetings?/)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/follow-ups?/)).toBeVisible({ timeout: 10000 });

    // Quick actions
    await expect(page.getByText('+ Task')).toBeVisible({ timeout: 10000 });

    // Scroll to AI briefing and schedule
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(1000);

    // AI Briefing card or generate button
    const hasBriefing = await page.getByText('VERSA AI').isVisible().catch(() => false);
    const hasGenerate = await page.getByText('Generate Briefing').isVisible().catch(() => false);
    expect(hasBriefing || hasGenerate).toBe(true);

    // Schedule section
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(500);
    const hasSchedule = await page.getByText('SCHEDULE').isVisible().catch(() => false);
    const hasTodaySchedule = await page.getByText("TODAY'S SCHEDULE").isVisible().catch(() => false);
    expect(hasSchedule || hasTodaySchedule).toBe(true);
  });

  test('team tab shows members and task board', async ({ page }) => {
    await navigateToTab(page, 'Team');

    // Team members section
    await expect(page.getByText('Team')).toBeVisible({ timeout: 10000 });

    // At least one team member name visible
    const hasPriya = await page.getByText('Priya').isVisible().catch(() => false);
    const hasRahul = await page.getByText('Rahul').isVisible().catch(() => false);
    const hasAnita = await page.getByText('Anita').isVisible().catch(() => false);
    expect(hasPriya || hasRahul || hasAnita).toBe(true);
  });

  test('comms tab shows calls with detail navigation', async ({ page }) => {
    await navigateToTab(page, 'Comms');
    await page.waitForTimeout(2000);

    // Calls sub-tab should be active by default
    await expect(page.getByText('Calls')).toBeVisible({ timeout: 10000 });

    // Click first call item
    const firstCall = page.locator('[data-testid^="flat-row-call"]').first();
    const hasCall = await firstCall.isVisible().catch(() => false);
    if (!hasCall) {
      test.skip();
      return;
    }
    await firstCall.click();
    await page.waitForTimeout(2000);

    // Call detail loaded
    await expect(page.getByText('Call Details')).toBeVisible({ timeout: 15000 });

    // AI Summary or Generate button
    const hasAi = await page.getByText('AI Summary').isVisible().catch(() => false);
    const hasGenBtn = await page.getByText('Generate AI Summary').isVisible().catch(() => false);
    expect(hasAi || hasGenBtn).toBe(true);

    // Follow-ups section
    await expect(page.getByText('Follow-ups')).toBeVisible({ timeout: 10000 });

    // Transcript section (may need scroll)
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(500);
    await expect(page.getByText('Transcript')).toBeVisible({ timeout: 10000 });

    // Action bar
    await expect(page.getByText('Create Follow-up')).toBeVisible({ timeout: 10000 });
  });

  test('emails sub-tab shows email list', async ({ page }) => {
    await navigateToTab(page, 'Comms');
    await page.waitForTimeout(2000);

    // Switch to Emails sub-tab
    const emailsTab = page.getByText('Emails').first();
    await emailsTab.click();
    await page.waitForTimeout(2000);

    // Should show email list or compose button
    const hasCompose = await page.locator('[data-testid="compose-email-btn"]').isVisible().catch(() => false);
    const hasEmails = await page.getByText(/Inbox|Sent|Drafts/).first().isVisible().catch(() => false);
    expect(hasCompose || hasEmails).toBe(true);
  });

  test('command tab shows AI assistant interface', async ({ page }) => {
    await navigateToTab(page, 'Command');
    await page.waitForTimeout(2000);

    // "Versa" heading
    await expect(page.getByText('Versa').first()).toBeVisible({ timeout: 10000 });

    // Input bar or suggestion chips
    const hasInput = await page.getByPlaceholder(/ask/i).isVisible().catch(() => false);
    const hasChips = await page.getByText(/schedule|tasks|briefing/i).first().isVisible().catch(() => false);
    expect(hasInput || hasChips).toBe(true);
  });

  test('settings tab shows profile and all sections', async ({ page }) => {
    await navigateToTab(page, 'Settings');
    await page.waitForTimeout(2000);

    // Settings header
    await expect(page.getByText('Settings').first()).toBeVisible({ timeout: 10000 });

    // Profile info
    await expect(page.getByText('Satya')).toBeVisible({ timeout: 10000 });

    // Scroll to see all sections
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(500);

    // Integrations section
    await expect(page.getByText('Webhooks n8n')).toBeVisible({ timeout: 10000 });

    // Sign Out at bottom
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(500);
    await expect(page.getByText('Sign Out')).toBeVisible({ timeout: 10000 });
  });
});
