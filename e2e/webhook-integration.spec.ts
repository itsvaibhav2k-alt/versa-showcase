import { test, expect } from '@playwright/test';
import { signInAsTestUser } from './helpers/auth';

test.describe('Webhook Integration', () => {

  test.describe('Call Detail - AI Summary', () => {
    test.beforeEach(async ({ page }) => {
      await signInAsTestUser(page);
      // Tab bar shows "Comms" (not "Calls") — Comms tab contains calls + emails sub-tabs
      const commsTab = page.getByText('Comms', { exact: true }).first();
      await commsTab.click();
      await page.waitForTimeout(2000);
    });

    test('should show AI Summary or Generate AI Summary on call detail', async ({ page }) => {
      const emptyState = page.getByText('No calls yet');
      const isEmpty = await emptyState.isVisible().catch(() => false);
      if (isEmpty) {
        test.skip();
        return;
      }

      // Call items are now FlatRows — click the first one by testID
      const firstCall = page.locator('[data-testid^="flat-row-call"]').first();
      if (!(await firstCall.isVisible().catch(() => false))) {
        test.skip();
        return;
      }
      await firstCall.click();
      await page.waitForTimeout(2000);

      // Should show either "AI Summary" (has summary) or "Generate AI Summary" (no summary)
      const aiSummary = page.getByText('AI Summary');
      const generateButton = page.getByText('Generate AI Summary');

      const hasAiSummary = await aiSummary.isVisible().catch(() => false);
      const hasGenerateButton = await generateButton.isVisible().catch(() => false);

      expect(hasAiSummary || hasGenerateButton).toBe(true);
    });

    test('should show follow-ups section on call detail', async ({ page }) => {
      const emptyState = page.getByText('No calls yet');
      const isEmpty = await emptyState.isVisible().catch(() => false);
      if (isEmpty) {
        test.skip();
        return;
      }

      const firstCall = page.locator('[data-testid^="flat-row-call"]').first();
      if (!(await firstCall.isVisible().catch(() => false))) {
        test.skip();
        return;
      }
      await firstCall.click();
      await page.waitForTimeout(2000);

      const followUps = page.getByText('Follow-ups');
      await expect(followUps).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Dashboard - Morning Briefing', () => {
    test.beforeEach(async ({ page }) => {
      await signInAsTestUser(page);
    });

    test('should display AI briefing hero card or generate button', async ({ page }) => {
      // MorningBriefingCard renders as Card variant="ai" with "VERSA AI" header or Generate button
      const aiBriefing = page.getByText('VERSA AI');
      const generateBriefing = page.getByText('Generate Briefing');

      // Scroll down to find it
      await page.evaluate(() => window.scrollBy(0, 300));
      await page.waitForTimeout(1000);

      const hasBriefing = await aiBriefing.isVisible().catch(() => false);
      const hasGenerateButton = await generateBriefing.isVisible().catch(() => false);

      // At least one should be visible (the card always renders)
      expect(hasBriefing || hasGenerateButton).toBe(true);
    });

    test('should still show stat line with pills (regression)', async ({ page }) => {
      // StatLine renders pills: each pill has a value + label (e.g. "3" "tasks")
      const statLine = page.getByTestId('stat-line');
      await expect(statLine).toBeVisible({ timeout: 15000 });

      const tasksText = page.getByText(/tasks?/);
      await expect(tasksText).toBeVisible({ timeout: 15000 });

      const meetingsText = page.getByText(/meetings?/);
      await expect(meetingsText).toBeVisible({ timeout: 15000 });

      const followUpsText = page.getByText(/follow-ups?/);
      await expect(followUpsText).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Settings - Webhook Status', () => {
    test.beforeEach(async ({ page }) => {
      await signInAsTestUser(page);
      const settingsTab = page.getByText('Settings', { exact: true }).first();
      await settingsTab.click();
      await page.waitForTimeout(2000);
    });

    test('should display Webhooks n8n FlatRow with plain text status', async ({ page }) => {
      // Scroll to Integrations section — settings rows are FlatRows (no Card wrappers)
      await page.evaluate(() => window.scrollBy(0, 500));
      await page.waitForTimeout(500);

      const webhooksRow = page.getByText('Webhooks n8n');
      await expect(webhooksRow).toBeVisible({ timeout: 10000 });

      // Status is plain colored text (not a pill badge) — velvet for Connected, coral for Not Configured
      const connected = page.getByText('Connected');
      const notConfigured = page.getByText('Not Configured');

      const hasConnected = await connected.first().isVisible().catch(() => false);
      const hasNotConfigured = await notConfigured.isVisible().catch(() => false);

      expect(hasConnected || hasNotConfigured).toBe(true);
    });

    test('should display Digest Schedule row', async ({ page }) => {
      // Digest Schedule is in the Preferences section, rendered as a FlatRow
      const digestSchedule = page.getByText('Digest Schedule');
      await expect(digestSchedule).toBeVisible({ timeout: 10000 });
    });

    test('should still show Sign Out button (regression)', async ({ page }) => {
      await page.evaluate(() => window.scrollBy(0, 800));
      await page.waitForTimeout(500);

      const signOut = page.getByText('Sign Out');
      await expect(signOut).toBeVisible({ timeout: 15000 });
    });
  });
});
