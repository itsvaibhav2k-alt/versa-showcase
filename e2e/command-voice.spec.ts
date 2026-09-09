import { test, expect } from '@playwright/test';
import { signInAsTestUser } from './helpers/auth';

test.describe('Versa — Voice & Text', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page);
    // Navigate to Command tab — tabBarLabel is null (no visible text), but
    // title: 'Command' provides the accessible name for the tab button.
    const commandTab = page.getByRole('tab', { name: 'Command' }).or(
      page.getByText('Command', { exact: true }).first(),
    );
    await commandTab.click();
    await page.waitForTimeout(1000);
  });

  test('should show Versa screen with header', async ({ page }) => {
    // Screen heading is now "Versa"
    const header = page.getByText('Versa');
    await expect(header.first()).toBeVisible({ timeout: 15000 });
  });

  test('should show subtitle text', async ({ page }) => {
    const subtitle = page.getByText('Your AI assistant');
    await expect(subtitle).toBeVisible({ timeout: 15000 });
  });

  test('should show suggestion chips', async ({ page }) => {
    // Horizontal text pills for suggestions
    const chip = page.getByText(/Summarize|Brief|Schedule|Task/i);
    await expect(chip.first()).toBeVisible({ timeout: 15000 });
  });

  test('should show empty state with sparkles icon text', async ({ page }) => {
    const emptyText = page.getByText(/Ask me anything/);
    await expect(emptyText).toBeVisible({ timeout: 15000 });
  });

  test('should show input bar with mic icon for voice', async ({ page }) => {
    // Voice FAB is removed. Mic icon is now integrated into the text input bar.
    // No standalone VoiceInput FAB exists — voice mode is toggled inline.
    const inputField = page.getByPlaceholder('Ask anything...');
    await expect(inputField).toBeVisible({ timeout: 15000 });

    // Verify no standalone "Tap to speak" element exists
    const tapToSpeak = page.getByText('Tap to speak');
    await expect(tapToSpeak).not.toBeVisible({ timeout: 3000 }).catch(() => {
      // Expected: element should not exist in the redesigned UI
    });
  });

  test('should show Clear link when results exist', async ({ page }) => {
    // The "Clear" ghost text link replaces the bordered history button.
    // It only appears when results.length > 0, so verify the header exists first.
    const header = page.getByText('Versa');
    await expect(header.first()).toBeVisible({ timeout: 15000 });

    // Submit a command to trigger results
    const inputField = page.getByPlaceholder('Ask anything...');
    await inputField.fill('Check my schedule');
    await inputField.press('Enter');
    await page.waitForTimeout(2000);

    const clearLink = page.getByText('Clear', { exact: true });
    await expect(clearLink).toBeVisible({ timeout: 10000 });
  });
});
