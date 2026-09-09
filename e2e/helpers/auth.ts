import { Page, expect } from '@playwright/test';

function requireTestUser() {
  const email = process.env.E2E_USER_EMAIL?.trim();
  const password = process.env.E2E_USER_PASSWORD;
  if (!email || !password?.trim()) {
    throw new Error('E2E_USER_EMAIL and E2E_USER_PASSWORD are required for an isolated test account');
  }
  return { email, password };
}

/**
 * Sign in by filling the sign-in form. The app redirects unauthenticated
 * users to /sign-in, so we navigate there and submit credentials.
 */
export async function signInAsTestUser(page: Page): Promise<void> {
  const TEST_USER = requireTestUser();
  // Go to sign-in page
  await page.goto('/sign-in', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(3000);

  // Fill in credentials
  const emailInput = page.getByPlaceholder('you@company.com');
  const passwordInput = page.getByPlaceholder('Enter your password');

  await emailInput.fill(TEST_USER.email);
  await passwordInput.fill(TEST_USER.password);

  // Click the Sign In button (it's inside a Button component)
  const signInButton = page.getByRole('button', { name: 'Sign In' });
  // Fallback: try clicking text if role selector doesn't work
  if (await signInButton.isVisible().catch(() => false)) {
    await signInButton.click();
  } else {
    // The Button component renders as a Pressable with Text inside
    await page.getByText('Sign In', { exact: true }).last().click();
  }

  // Wait for the auth flow to complete and redirect to dashboard
  // The sign-in flow: auth → fetchUserProfile → fetchOrganization → router.replace('/(tabs)')
  // This can take several seconds with network calls
  await page.waitForURL('**/*(tabs)*', { timeout: 20000 }).catch(() => {
    // URL might not change visibly with Expo Router — wait for dashboard content instead
  });

  // Wait for dashboard content to appear (greeting text)
  await page.getByText(/good (morning|afternoon|evening)/i)
    .waitFor({ state: 'attached', timeout: 15000 })
    .catch(() => {
      // If greeting doesn't appear, the sign-in might have failed or is still loading
    });

  await page.waitForTimeout(2000);
}

/**
 * Navigate to a tab by clicking its label in the bottom tab bar.
 */
export async function navigateToTab(page: Page, tabName: string): Promise<void> {
  const tab = page.getByText(tabName, { exact: true }).first();
  await tab.click();
  await page.waitForTimeout(1500);
}
