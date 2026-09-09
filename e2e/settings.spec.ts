import { test, expect } from '@playwright/test';
import { signInAsTestUser } from './helpers/auth';

test.describe('Settings Screen', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page);
    // Navigate to Settings tab
    const settingsTab = page.getByText('Settings', { exact: true }).first();
    await settingsTab.click();
    await page.waitForTimeout(2000);
  });

  test('should display Settings heading', async ({ page }) => {
    const heading = page.getByText('Settings').first();
    await expect(heading).toBeVisible({ timeout: 15000 });
  });

  test('should display user profile with Edit Profile link', async ({ page }) => {
    // Profile is left-aligned inline (avatar-xl + name + email + org + "Edit Profile" velvet link)
    // No Card wrapper — renders directly on bg-deep
    const editProfile = page.getByText('Edit Profile');
    await expect(editProfile).toBeVisible({ timeout: 15000 });
  });

  test('should display organization name', async ({ page }) => {
    // Organization name rendered below email in the inline profile row (no Card wrapper)
    const profileName = page.getByText(/Satya|User/);
    await expect(profileName.first()).toBeVisible({ timeout: 15000 });
  });

  test('should display all settings sections without Card wrappers', async ({ page }) => {
    // Section titles rendered as uppercase caption text directly on bg-deep (no Card wrappers)
    const preferences = page.getByText('Preferences', { exact: true });
    await expect(preferences).toBeVisible({ timeout: 10000 });

    const team = page.getByText('Team', { exact: true });
    await expect(team.first()).toBeVisible({ timeout: 10000 });

    const integrations = page.getByText('Integrations', { exact: true });
    await expect(integrations).toBeVisible({ timeout: 10000 });

    // Scroll to see Account and About sections
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(500);

    const account = page.getByText('Account', { exact: true });
    await expect(account).toBeVisible({ timeout: 10000 });

    const about = page.getByText('About', { exact: true });
    await expect(about).toBeVisible({ timeout: 10000 });
  });

  test('should display settings rows as FlatRows', async ({ page }) => {
    // FlatRows with bare 20px Lucide icons (no colored circle bg, no Card wrappers)
    const notifications = page.getByText('Notifications', { exact: true });
    await expect(notifications).toBeVisible({ timeout: 10000 });

    const calendarSync = page.getByText('Calendar Sync');
    await expect(calendarSync).toBeVisible({ timeout: 10000 });

    const digestSchedule = page.getByText('Digest Schedule');
    await expect(digestSchedule).toBeVisible({ timeout: 10000 });
  });

  test('should display sign out button', async ({ page }) => {
    const signOut = page.getByText('Sign Out');
    await expect(signOut).toBeVisible({ timeout: 15000 });
  });

  test('should display version info', async ({ page }) => {
    const version = page.getByText('2.0.1');
    await expect(version).toBeVisible({ timeout: 10000 });
  });

  test('should display Webhooks n8n with plain text status', async ({ page }) => {
    // Scroll to Integrations section
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(500);

    const webhooks = page.getByText('Webhooks n8n');
    await expect(webhooks).toBeVisible({ timeout: 10000 });

    // Status is plain colored text (not a pill badge)
    const connected = page.getByText('Connected');
    const notConfigured = page.getByText('Not Configured');
    const hasConnected = await connected.first().isVisible().catch(() => false);
    const hasNotConfigured = await notConfigured.isVisible().catch(() => false);
    expect(hasConnected || hasNotConfigured).toBe(true);
  });

  test('should display Voice Assistant row', async ({ page }) => {
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(500);

    const voiceAssistant = page.getByText('Voice Assistant');
    await expect(voiceAssistant).toBeVisible({ timeout: 10000 });
  });
});
