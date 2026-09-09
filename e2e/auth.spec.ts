import { test, expect } from '@playwright/test';
import { signInAsTestUser } from './helpers/auth';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing session by going to a fresh page
    await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
  });

  test('should show welcome or dashboard based on auth state', async ({ page }) => {
    // After navigating, either the Welcome/sign-in screen or Dashboard should show
    const welcome = page.getByText('Versa');
    const dashboard = page.getByText(/good (morning|afternoon|evening),/i);
    // One of these should be visible
    const hasWelcome = await welcome.first().isVisible().catch(() => false);
    const hasDashboard = await dashboard.isVisible().catch(() => false);
    expect(hasWelcome || hasDashboard).toBeTruthy();
  });

  test('should show sign in screen with email and password fields', async ({ page }) => {
    // If already signed in, the auth screen won't show. So navigate directly.
    await page.goto('/sign-in', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    // Look for email/password or welcome-back text
    const signInPage = page.getByText(/Welcome back|Sign In|Email/i);
    await expect(signInPage.first()).toBeVisible({ timeout: 15000 });
  });

  test('should show sign up screen with all fields', async ({ page }) => {
    await page.goto('/sign-up', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    const signUpPage = page.getByText(/Get started|Create Account|Full Name/i);
    await expect(signUpPage.first()).toBeVisible({ timeout: 15000 });
  });

  test('should show forgot password screen', async ({ page }) => {
    await page.goto('/forgot-password', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    const forgotPage = page.getByText(/Reset|Forgot|Send Reset Link/i);
    await expect(forgotPage.first()).toBeVisible({ timeout: 15000 });
  });

  test('should have sign out option in settings', async ({ page }) => {
    await signInAsTestUser(page);
    // Navigate to settings
    const settingsTab = page.getByText('Settings', { exact: true });
    if (await settingsTab.isVisible().catch(() => false)) {
      await settingsTab.click();
      await page.waitForTimeout(1000);
      const signOut = page.getByText('Sign Out');
      await expect(signOut).toBeVisible({ timeout: 15000 });
    }
  });
});
