import { test, expect } from '@playwright/test';
import { signInAsTestUser } from './helpers/auth';

test.describe('Quick Actions Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page);
  });

  test('should display all four quick actions with icon squares and labels', async ({ page }) => {
    // Quick actions render as icon-square + label pairs: "+ Task", "Call", "Email", "Remind"
    const task = page.getByText('+ Task', { exact: true });
    await expect(task).toBeVisible({ timeout: 15000 });

    const call = page.getByText('Call', { exact: true });
    await expect(call).toBeVisible({ timeout: 15000 });

    const email = page.getByText('Email', { exact: true });
    await expect(email).toBeVisible({ timeout: 15000 });

    const remind = page.getByText('Remind', { exact: true });
    await expect(remind).toBeVisible({ timeout: 15000 });
  });

  test('should navigate to task create when tapping + Task', async ({ page }) => {
    // Quick action label is "+ Task" (not "New Task")
    const task = page.getByText('+ Task', { exact: true });
    await task.click();
    await page.waitForTimeout(2000);

    // task-create modal should be open — look for the heading and submit button
    const heading = page.getByText('New Task');
    await expect(heading).toBeVisible({ timeout: 10000 });

    const createButton = page.getByText('Create Task');
    await expect(createButton).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to Comms tab when tapping Call', async ({ page }) => {
    const call = page.getByText('Call', { exact: true });
    await call.click();
    await page.waitForTimeout(2000);

    // Should navigate to Comms tab with Calls sub-tab active by default
    const quickCallInput = page.getByPlaceholder('Who should Versa call?');
    await expect(quickCallInput).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to Comms tab emails when tapping Email', async ({ page }) => {
    const email = page.getByText('Email', { exact: true });
    await email.first().click();
    await page.waitForTimeout(2000);

    // Should navigate to Comms tab with emails sub-tab (route: /(tabs)/comms?tab=emails)
    // The Comms screen header should be visible
    const commsHeader = page.getByText('Comms');
    await expect(commsHeader.first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to reminder create when tapping Remind', async ({ page }) => {
    const remind = page.getByText('Remind', { exact: true });
    await remind.click();
    await page.waitForTimeout(2000);

    // reminder-create modal should be open — heading is "New Reminder"
    const newReminder = page.getByText('New Reminder');
    await expect(newReminder).toBeVisible({ timeout: 10000 });
  });
});
