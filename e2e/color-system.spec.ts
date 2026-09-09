import { test, expect } from '@playwright/test';
import { signInAsTestUser } from './helpers/auth';

test.describe('Color System - Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page);
  });

  test('HomeScreen has correct background color', async ({ page }) => {
    await page.waitForTimeout(2000);
    await expect(page).toHaveScreenshot('home-colors.png', {
      maxDiffPixels: 100,
      fullPage: true,
    });
  });

  test('TeamScreen visual check', async ({ page }) => {
    await page.getByText('Team', { exact: true }).click();
    await page.waitForTimeout(2000);
    await expect(page).toHaveScreenshot('team-colors.png', {
      maxDiffPixels: 100,
      fullPage: true,
    });
  });

  test('CommsScreen visual check', async ({ page }) => {
    await page.getByText('Comms', { exact: true }).click();
    await page.waitForTimeout(2000);
    await expect(page).toHaveScreenshot('comms-colors.png', {
      maxDiffPixels: 100,
      fullPage: true,
    });
  });

  test('CommandScreen visual check', async ({ page }) => {
    await page.getByText('Command', { exact: true }).click();
    await page.waitForTimeout(2000);
    await expect(page).toHaveScreenshot('command-colors.png', {
      maxDiffPixels: 100,
      fullPage: true,
    });
  });

  test('SettingsScreen visual check', async ({ page }) => {
    await page.getByText('Settings', { exact: true }).click();
    await page.waitForTimeout(2000);
    await expect(page).toHaveScreenshot('settings-colors.png', {
      maxDiffPixels: 100,
      fullPage: true,
    });
  });

  test('no old amber colors in rendered HTML', async ({ page }) => {
    const html = await page.content();
    // Old amber primary should not appear
    expect(html.toLowerCase()).not.toContain('#d4930d');
    // Old warm background should not appear
    expect(html.toLowerCase()).not.toContain('#f5f3ef');
  });
});
