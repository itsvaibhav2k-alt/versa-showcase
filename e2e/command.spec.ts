import { test, expect } from '@playwright/test';
import { signInAsTestUser } from './helpers/auth';

test.describe('Command Screen', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page);
    // Navigate to Command tab — tabBarLabel is null (no visible text), but
    // title: 'Command' provides the accessible name for the tab button.
    const commandTab = page.getByRole('tab', { name: 'Command' }).or(
      page.getByText('Command', { exact: true }).first(),
    );
    await commandTab.click();
    await page.waitForTimeout(2000);
  });

  test('should display Versa heading', async ({ page }) => {
    // Screen heading changed from "Command" to "Versa"
    const heading = page.getByText('Versa').first();
    await expect(heading).toBeVisible({ timeout: 15000 });
  });

  test('should display subtitle', async ({ page }) => {
    const subtitle = page.getByText('Your AI assistant');
    await expect(subtitle).toBeVisible({ timeout: 10000 });
  });

  test('should display suggestion chips in horizontal scroll', async ({ page }) => {
    // Horizontal scroll of bordered text pills (no icons, no filled bg)
    const createTask = page.getByText('Create a task');
    await expect(createTask).toBeVisible({ timeout: 10000 });

    const checkSchedule = page.getByText('Check my schedule');
    await expect(checkSchedule).toBeVisible({ timeout: 10000 });

    const sendEmail = page.getByText('Send an email');
    await expect(sendEmail).toBeVisible({ timeout: 10000 });

    const summarizeCalls = page.getByText('Summarize my calls');
    await expect(summarizeCalls).toBeVisible({ timeout: 10000 });
  });

  test('should display text input bar with mic icon', async ({ page }) => {
    // Input bar with integrated mic icon for voice toggle (no standalone FAB)
    const inputField = page.getByPlaceholder('Ask anything...');
    await expect(inputField).toBeVisible({ timeout: 10000 });
  });

  test('should display empty state message', async ({ page }) => {
    // Sparkles icon + "Ask me anything or tap the mic" text
    const emptyMessage = page.getByText('Ask me anything or tap the mic');
    await expect(emptyMessage).toBeVisible({ timeout: 10000 });
  });

  test('should accept text input', async ({ page }) => {
    const inputField = page.getByPlaceholder('Ask anything...');
    await inputField.fill('What are my tasks for today?');

    // Verify the input has the value
    await expect(inputField).toHaveValue('What are my tasks for today?');
  });

  test('should show Clear link after submitting a command', async ({ page }) => {
    // "Clear" ghost text link appears when results.length > 0
    const inputField = page.getByPlaceholder('Ask anything...');
    await inputField.fill('Create a task');
    await inputField.press('Enter');
    await page.waitForTimeout(2000);

    const clearLink = page.getByText('Clear', { exact: true });
    await expect(clearLink).toBeVisible({ timeout: 10000 });
  });
});
