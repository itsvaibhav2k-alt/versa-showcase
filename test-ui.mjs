import { chromium } from 'playwright';

const BASE = 'http://localhost:8081';
const SCREENSHOTS_DIR = './test-screenshots';

async function run() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 14 size
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  console.log('📱 Opening app at', BASE);
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Screenshot 1: Dashboard / Home
  console.log('📸 Screenshot: Dashboard Home');
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/01-dashboard.png`, fullPage: false });

  // Scroll down to see more of the dashboard
  await page.evaluate(() => {
    const scrollable = document.querySelector('[data-testid="scroll-view"]') || document.querySelector('main') || document.documentElement;
    scrollable.scrollTop = 400;
  });
  await page.waitForTimeout(1000);
  console.log('📸 Screenshot: Dashboard Scrolled');
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/02-dashboard-scrolled.png`, fullPage: false });

  // Navigate to Team tab
  console.log('🔄 Navigating to Team tab...');
  const teamTab = page.getByText('Team', { exact: true }).first();
  if (await teamTab.isVisible()) {
    await teamTab.click();
    await page.waitForTimeout(2000);
  }
  console.log('📸 Screenshot: Team Hub');
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/03-team.png`, fullPage: false });

  // Navigate to Calls tab
  console.log('🔄 Navigating to Calls tab...');
  const callsTab = page.getByText('Calls', { exact: true }).first();
  if (await callsTab.isVisible()) {
    await callsTab.click();
    await page.waitForTimeout(2000);
  }
  console.log('📸 Screenshot: Calls');
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/04-calls.png`, fullPage: false });

  // Navigate to Command tab
  console.log('🔄 Navigating to Command tab...');
  const commandTab = page.getByText('Command', { exact: true }).first();
  if (await commandTab.isVisible()) {
    await commandTab.click();
    await page.waitForTimeout(2000);
  }
  console.log('📸 Screenshot: Command');
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/05-command.png`, fullPage: false });

  // Navigate to Settings tab
  console.log('🔄 Navigating to Settings tab...');
  const settingsTab = page.getByText('Settings', { exact: true }).first();
  if (await settingsTab.isVisible()) {
    await settingsTab.click();
    await page.waitForTimeout(2000);
  }
  console.log('📸 Screenshot: Settings');
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/06-settings.png`, fullPage: false });

  console.log('\n✅ All screenshots saved to ./test-screenshots/');
  console.log('🔍 Keeping browser open for manual inspection...');

  // Go back to dashboard for final review
  const homeTab = page.getByText('Home', { exact: true }).first();
  if (await homeTab.isVisible()) {
    await homeTab.click();
    await page.waitForTimeout(1000);
  }

  // Keep browser open for 60 seconds for manual inspection
  await page.waitForTimeout(60000);
  await browser.close();
}

run().catch(console.error);
