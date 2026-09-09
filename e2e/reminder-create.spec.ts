import { test, expect } from '@playwright/test';
import { signInAsTestUser } from './helpers/auth';

test.describe('Reminder Create Modal', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page);
    const greeting = page.getByText(/good (morning|afternoon|evening),/i);
    await expect(greeting).toBeVisible({ timeout: 15000 });
  });

  test('should open reminder create modal via direct navigation', async ({ page }) => {
    await page.goto('/(modals)/reminder-create', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // No semantic heading role in RN Web — match by text
    const heading = page.getByText('New Reminder');
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('should display Cancel as ghost text link', async ({ page }) => {
    await page.goto('/(modals)/reminder-create', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Cancel is a ghost text link (not a bordered button)
    const cancelText = page.getByText('Cancel');
    await expect(cancelText).toBeVisible({ timeout: 10000 });
  });

  test('should display form fields with Input labels', async ({ page }) => {
    await page.goto('/(modals)/reminder-create', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Input labels rendered by the Input component (non-uppercase)
    const titleLabel = page.getByText('Title', { exact: true });
    await expect(titleLabel).toBeVisible({ timeout: 10000 });

    const notesLabel = page.getByText('Notes', { exact: true });
    await expect(notesLabel).toBeVisible({ timeout: 10000 });

    const dateLabel = page.getByText('Date & Time', { exact: true });
    await expect(dateLabel).toBeVisible({ timeout: 10000 });

    // Placeholders
    const titleInput = page.getByPlaceholder('What do you want to remember?');
    await expect(titleInput).toBeVisible({ timeout: 10000 });

    const notesInput = page.getByPlaceholder('Add details...');
    await expect(notesInput).toBeVisible({ timeout: 10000 });

    const dateInput = page.getByPlaceholder('e.g. 2026-03-01 09:00');
    await expect(dateInput).toBeVisible({ timeout: 10000 });
  });

  test('should display Create Reminder submit button', async ({ page }) => {
    await page.goto('/(modals)/reminder-create', { timeout: 30000 });
    await page.waitForTimeout(2000);

    const createButton = page.getByText('Create Reminder');
    await expect(createButton).toBeVisible({ timeout: 10000 });
  });

  test('should allow filling in the title field', async ({ page }) => {
    await page.goto('/(modals)/reminder-create', { timeout: 30000 });
    await page.waitForTimeout(2000);

    const titleInput = page.getByPlaceholder('What do you want to remember?');
    await titleInput.fill('Call back John at 3pm');
    await expect(titleInput).toHaveValue('Call back John at 3pm');
  });

  test('should allow filling in the date field', async ({ page }) => {
    await page.goto('/(modals)/reminder-create', { timeout: 30000 });
    await page.waitForTimeout(2000);

    const dateInput = page.getByPlaceholder('e.g. 2026-03-01 09:00');
    await dateInput.fill('2026-03-15 14:00');
    await expect(dateInput).toHaveValue('2026-03-15 14:00');
  });
});
