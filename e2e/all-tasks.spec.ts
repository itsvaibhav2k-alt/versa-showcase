import { test, expect } from '@playwright/test';
import { signInAsTestUser } from './helpers/auth';

test.describe('All Tasks Screen', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page);
  });

  test('should open all tasks screen via direct navigation', async ({ page }) => {
    await page.goto('/(modals)/all-tasks', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // No semantic heading role in RN Web — match by text
    const heading = page.getByText('All Tasks');
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('should display UnderlineTabs filter tabs', async ({ page }) => {
    await page.goto('/(modals)/all-tasks', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Filter tabs are UnderlineTabs (not pill chips) — labels preserved
    const allTab = page.getByText('All', { exact: true });
    await expect(allTab).toBeVisible({ timeout: 10000 });

    const todoTab = page.getByText('To Do', { exact: true });
    await expect(todoTab).toBeVisible({ timeout: 10000 });

    const inProgressTab = page.getByText('In Progress', { exact: true });
    await expect(inProgressTab).toBeVisible({ timeout: 10000 });

    const doneTab = page.getByText('Done', { exact: true });
    await expect(doneTab).toBeVisible({ timeout: 10000 });
  });

  test('should display Close text link', async ({ page }) => {
    await page.goto('/(modals)/all-tasks', { timeout: 30000 });
    await page.waitForTimeout(2000);

    const closeButton = page.getByText('Close');
    await expect(closeButton).toBeVisible({ timeout: 10000 });
  });

  test('should display total tasks count', async ({ page }) => {
    await page.goto('/(modals)/all-tasks', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Subtitle format: "X task(s) total"
    const taskCount = page.getByText(/\d+ tasks? total/);
    await expect(taskCount).toBeVisible({ timeout: 10000 });
  });

  test('should display section headers for task groups', async ({ page }) => {
    await page.goto('/(modals)/all-tasks', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Task list uses SectionList with section headers: "TODAY", "UPCOMING", "COMPLETED"
    // At least one section or the empty state should be visible
    const todaySection = page.getByText('TODAY', { exact: true });
    const upcomingSection = page.getByText('UPCOMING', { exact: true });
    const completedSection = page.getByText('COMPLETED', { exact: true });
    const emptyState = page.getByText('No tasks found');

    const hasToday = await todaySection.isVisible().catch(() => false);
    const hasUpcoming = await upcomingSection.isVisible().catch(() => false);
    const hasCompleted = await completedSection.isVisible().catch(() => false);
    const isEmpty = await emptyState.isVisible().catch(() => false);

    expect(hasToday || hasUpcoming || hasCompleted || isEmpty).toBe(true);
  });
});
