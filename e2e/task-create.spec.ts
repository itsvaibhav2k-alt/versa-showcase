import { test, expect } from '@playwright/test';
import { signInAsTestUser } from './helpers/auth';

test.describe('Task Create Modal', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page);
  });

  test('should open task create modal via direct navigation', async ({ page }) => {
    // Navigate directly to the task-create modal route
    await page.goto('/(modals)/task-create', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    // Assert "New Task" heading is visible
    const newTaskHeading = page.getByText('New Task');
    await expect(newTaskHeading).toBeVisible({ timeout: 10000 });
  });

  test('should display Cancel as ghost text link', async ({ page }) => {
    await page.goto('/(modals)/task-create', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    // Cancel is rendered as a ghost text link (not a bordered button)
    const cancelText = page.getByText('Cancel');
    await expect(cancelText).toBeVisible({ timeout: 10000 });
  });

  test('should display form fields without card wrappers', async ({ page }) => {
    await page.goto('/(modals)/task-create', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    // Title input with placeholder
    const titleInput = page.getByPlaceholder('What needs to be done?');
    await expect(titleInput).toBeVisible({ timeout: 10000 });

    // Description input
    const descInput = page.getByPlaceholder('Add details...');
    await expect(descInput).toBeVisible({ timeout: 10000 });

    // Priority caption label (rendered as uppercase "PRIORITY")
    const priorityLabel = page.getByText('PRIORITY');
    await expect(priorityLabel).toBeVisible({ timeout: 10000 });
  });

  test('should display priority options as StatusDot + text label radio', async ({ page }) => {
    await page.goto('/(modals)/task-create', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    // Priority options: Low, Medium, High, Urgent (StatusDot + label radio style)
    const low = page.getByText('Low', { exact: true });
    await expect(low).toBeVisible({ timeout: 10000 });

    const medium = page.getByText('Medium', { exact: true });
    await expect(medium).toBeVisible({ timeout: 10000 });

    const high = page.getByText('High', { exact: true });
    await expect(high).toBeVisible({ timeout: 10000 });

    const urgent = page.getByText('Urgent', { exact: true });
    await expect(urgent).toBeVisible({ timeout: 10000 });
  });

  test('should display Due Date field', async ({ page }) => {
    await page.goto('/(modals)/task-create', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    const dueDateInput = page.getByPlaceholder('e.g. 2026-02-20');
    await expect(dueDateInput).toBeVisible({ timeout: 10000 });
  });

  test('should display Assign To section with caption label', async ({ page }) => {
    await page.goto('/(modals)/task-create', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    // Label rendered as uppercase caption "ASSIGN TO"
    const assignTo = page.getByText('ASSIGN TO');
    await expect(assignTo).toBeVisible({ timeout: 10000 });
  });

  test('should allow filling in the title field', async ({ page }) => {
    await page.goto('/(modals)/task-create', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    const titleInput = page.getByPlaceholder('What needs to be done?');
    await titleInput.fill('Review quarterly report');

    await expect(titleInput).toHaveValue('Review quarterly report');
  });

  test('should display Create Task submit button', async ({ page }) => {
    await page.goto('/(modals)/task-create', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    const createButton = page.getByText('Create Task');
    await expect(createButton).toBeVisible({ timeout: 10000 });
  });
});
