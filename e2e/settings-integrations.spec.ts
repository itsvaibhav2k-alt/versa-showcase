import { test, expect } from '@playwright/test';
import { signInAsTestUser } from './helpers/auth';

test.describe('Settings & Integrations', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page);
    // Navigate to Settings tab
    const settingsTab = page.getByText('Settings', { exact: true });
    if (await settingsTab.isVisible().catch(() => false)) {
      await settingsTab.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should show Settings header', async ({ page }) => {
    const header = page.getByText('Settings').first();
    await expect(header).toBeVisible({ timeout: 15000 });
  });

  test('should show profile with user info', async ({ page }) => {
    // Profile is left-aligned inline row (no Card wrapper)
    const profileName = page.getByText(/Satya|User/);
    await expect(profileName.first()).toBeVisible({ timeout: 15000 });
  });

  test('should show Calendar Sync row in Integrations', async ({ page }) => {
    const calendarSync = page.getByText('Calendar Sync');
    await expect(calendarSync).toBeVisible({ timeout: 15000 });
  });

  test('should show Email Accounts row with status text', async ({ page }) => {
    const emailAccounts = page.getByText('Email Accounts');
    await expect(emailAccounts).toBeVisible({ timeout: 15000 });
    // "2 Active" is now plain colored text (not a pill badge)
    const activeText = page.getByText('2 Active');
    await expect(activeText).toBeVisible({ timeout: 15000 });
  });

  test('should show Sign Out button', async ({ page }) => {
    // Scroll down to see Sign Out
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    const signOut = page.getByText('Sign Out');
    await expect(signOut).toBeVisible({ timeout: 15000 });
  });

  test('should show Integrations section', async ({ page }) => {
    const integrations = page.getByText('Integrations');
    await expect(integrations.first()).toBeVisible({ timeout: 15000 });
  });

  test('should show Phone Configuration row', async ({ page }) => {
    const phoneConfig = page.getByText('Phone Configuration');
    await expect(phoneConfig).toBeVisible({ timeout: 15000 });
  });

  test('should show Voice Assistant row', async ({ page }) => {
    const voiceAssistant = page.getByText('Voice Assistant');
    await expect(voiceAssistant).toBeVisible({ timeout: 15000 });
  });

  test('should show Webhooks n8n row with plain text status', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    const webhooks = page.getByText('Webhooks n8n');
    await expect(webhooks).toBeVisible({ timeout: 15000 });

    // Connection status rendered as plain colored text (not a pill badge)
    const connected = page.getByText('Connected');
    const notConfigured = page.getByText('Not Configured');
    const hasConnected = await connected.first().isVisible().catch(() => false);
    const hasNotConfigured = await notConfigured.isVisible().catch(() => false);
    expect(hasConnected || hasNotConfigured).toBe(true);
  });

  test('should show version number', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    const version = page.getByText('2.0.1');
    await expect(version).toBeVisible({ timeout: 15000 });
  });
});
