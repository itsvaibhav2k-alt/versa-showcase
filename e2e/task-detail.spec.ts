import { test, expect } from '@playwright/test';
import { signInAsTestUser } from './helpers/auth';

test.describe('Task Detail Screen', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page);
  });

  test('should show Task not found for non-existent ID', async ({ page }) => {
    // Navigate with a dummy task ID — should show "Task not found" since it is fake
    await page.goto('/task/00000000-0000-0000-0000-000000000000', {
      waitUntil: 'networkidle',
      timeout: 15000,
    });
    await page.waitForTimeout(3000);

    // Full-screen task detail renders "Task not found" (no Card wrapper)
    const taskNotFound = page.getByText('Task not found');
    await expect(taskNotFound).toBeVisible({ timeout: 10000 });
  });

  test('should show Task not found for invalid ID', async ({ page }) => {
    await page.goto('/task/invalid-id', {
      waitUntil: 'networkidle',
      timeout: 15000,
    });
    await page.waitForTimeout(3000);

    const notFound = page.getByText('Task not found');
    await expect(notFound).toBeVisible({ timeout: 10000 });
  });

  test('should show Go back link on not found state', async ({ page }) => {
    await page.goto('/task/invalid-id', {
      waitUntil: 'networkidle',
      timeout: 15000,
    });
    await page.waitForTimeout(3000);

    // "Go back" is a velvet-colored text link (not a bordered button)
    const goBack = page.getByText('Go back');
    await expect(goBack).toBeVisible({ timeout: 10000 });
  });
});
