import { test, expect } from '@playwright/test';
import { signInAsTestUser } from './helpers/auth';

test.describe('Email Compose Modal', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page);
    await page.waitForTimeout(2000);
  });

  test('should open email compose modal via direct navigation', async ({ page }) => {
    await page.goto('/(modals)/email-compose', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    // Should show "Compose Email" header
    const composeHeader = page.getByText('Compose Email');
    await expect(composeHeader).toBeVisible({ timeout: 10000 });
  });

  test('should display AI hero banner', async ({ page }) => {
    await page.goto('/(modals)/email-compose', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    // AI banner text: "Versa will draft and send on your behalf"
    const aiBanner = page.getByText('Versa will draft and send on your behalf');
    await expect(aiBanner).toBeVisible({ timeout: 10000 });
  });

  test('should show To and Subject fields with caption labels', async ({ page }) => {
    await page.goto('/(modals)/email-compose', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    // Caption labels are uppercase
    await expect(page.getByText('TO')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('SUBJECT (OPTIONAL)')).toBeVisible({ timeout: 10000 });

    // Input placeholders
    await expect(page.getByPlaceholder('recipient@example.com')).toBeVisible({ timeout: 10000 });
    await expect(page.getByPlaceholder('Versa generates if blank')).toBeVisible({ timeout: 10000 });
  });

  test('should show prompt field with caption label', async ({ page }) => {
    await page.goto('/(modals)/email-compose', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    // Caption label "WHAT SHOULD VERSA WRITE?"
    await expect(page.getByText('WHAT SHOULD VERSA WRITE?')).toBeVisible({ timeout: 10000 });

    // Prompt placeholder
    const promptInput = page.getByPlaceholder(/Follow up on our meeting/);
    await expect(promptInput).toBeVisible({ timeout: 10000 });
  });

  test('should show tone selector options as icon + label chips', async ({ page }) => {
    await page.goto('/(modals)/email-compose', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    // TONE caption label
    await expect(page.getByText('TONE')).toBeVisible({ timeout: 10000 });

    // Tone chip labels
    await expect(page.getByText('Professional')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Friendly')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Urgent')).toBeVisible({ timeout: 10000 });
  });

  test('should show Preview Draft and Send Directly buttons', async ({ page }) => {
    await page.goto('/(modals)/email-compose', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    // Primary action: "Preview Draft" (velvet button with Sparkles icon)
    await expect(page.getByText('Preview Draft')).toBeVisible({ timeout: 10000 });

    // Secondary action: "Send Directly" (outlined button)
    await expect(page.getByText('Send Directly')).toBeVisible({ timeout: 10000 });
  });

  test('should have clickable Send Directly button', async ({ page }) => {
    await page.goto('/(modals)/email-compose', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    const sendDirectly = page.getByText('Send Directly');
    await expect(sendDirectly).toBeVisible({ timeout: 10000 });
    await expect(sendDirectly).toBeEnabled({ timeout: 5000 });

    // The button should be clickable (it triggers edge function-based send flow)
    // We don't actually click to avoid triggering a real send, just verify it's interactive
    const isClickable = await sendDirectly.isEnabled();
    expect(isClickable).toBe(true);
  });

  test('should have clickable Preview Draft button', async ({ page }) => {
    await page.goto('/(modals)/email-compose', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    const previewDraft = page.getByText('Preview Draft');
    await expect(previewDraft).toBeVisible({ timeout: 10000 });
    await expect(previewDraft).toBeEnabled({ timeout: 5000 });
  });

  test('should show validation errors when Send Directly clicked without fields', async ({ page }) => {
    await page.goto('/(modals)/email-compose', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    // Click Send Directly without filling in required fields
    const sendDirectly = page.getByText('Send Directly');
    await sendDirectly.click();
    await page.waitForTimeout(1000);

    // Should show validation error for missing recipient and prompt
    const recipientError = page.getByText('Recipient is required');
    const promptError = page.getByText('Please describe what to write');

    const hasRecipientError = await recipientError.isVisible().catch(() => false);
    const hasPromptError = await promptError.isVisible().catch(() => false);

    expect(hasRecipientError || hasPromptError).toBe(true);
  });

  test('should show Cancel as ghost text link', async ({ page }) => {
    await page.goto('/(modals)/email-compose', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    await expect(page.getByText('Cancel')).toBeVisible({ timeout: 10000 });
  });
});
