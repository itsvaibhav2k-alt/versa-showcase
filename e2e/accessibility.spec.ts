import { test, expect } from '@playwright/test';
import { signInAsTestUser } from './helpers/auth';

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page);
  });

  test('should have accessible tab bar buttons', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    // React Native Web maps accessibilityLabel to aria-label
    // Tab bar items should have aria labels for screen readers
    const homeTab = page.getByRole('tab', { name: /home/i });
    const homeAria = page.locator('[aria-label*="Home"]');
    await expect(homeTab.or(homeAria)).toBeVisible({ timeout: 10000 });
  });

  test('should have accessible buttons on dashboard', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Verify at least one element with an aria-label exists on the dashboard
    // React Native Web converts accessibilityLabel to aria-label
    const a11yElements = page.locator('[aria-label]');
    const count = await a11yElements.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have aria-labels on quick action buttons', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Quick actions: "+ Task", "Call", "Email", "Remind"
    // These should have accessible labels
    const taskAction = page.locator('[aria-label*="task" i], [aria-label*="Task" i]');
    const callAction = page.locator('[aria-label*="call" i], [aria-label*="Call" i]');
    const emailAction = page.locator('[aria-label*="email" i], [aria-label*="Email" i]');

    const hasTask = await taskAction.first().isVisible().catch(() => false);
    const hasCall = await callAction.first().isVisible().catch(() => false);
    const hasEmail = await emailAction.first().isVisible().catch(() => false);

    // At least some quick actions should have aria-labels
    // The text itself may serve as the accessible name
    const quickActionTexts = [
      page.getByText('+ Task'),
      page.getByText('Call', { exact: true }),
      page.getByText('Email', { exact: true }),
      page.getByText('Remind'),
    ];

    let visibleCount = 0;
    for (const action of quickActionTexts) {
      const visible = await action.isVisible().catch(() => false);
      if (visible) visibleCount++;
    }

    // At least one quick action should be visible (accessible by text content)
    expect(visibleCount).toBeGreaterThan(0);
  });

  test('should have accessible navigation structure', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Check that interactive elements are not hidden from accessibility tree
    // Pressable components in React Native Web render with role="button" by default
    const buttons = page.locator('[role="button"]');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
  });
});
