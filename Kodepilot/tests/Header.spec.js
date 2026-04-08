const { test, expect } = require('@playwright/test');

async function dismissCookiePopup(page) {
  try {
    await page.evaluate(() => {
      document.querySelectorAll(
        '#cookie-consent-overlay, #cookie-consent-modal, [class*="cookie"], [id*="cookie"], [class*="consent"], [id*="consent"]'
      ).forEach(el => {
        el.style.display = 'none';
        el.style.visibility = 'hidden';
        el.style.pointerEvents = 'none';
        el.style.zIndex = '-9999';
      });
    });
    await page.waitForTimeout(300);
  } catch (e) {}
}

test.describe('Header Navigation Test Cases', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('https://uat.kodepilot.in', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await page.waitForTimeout(2000);
    await dismissCookiePopup(page);
  });

  test('TC_NAV_001 - Verify header is present', async ({ page }) => {
    const header = page.locator('header, nav').first();
    const count = await header.count();
    expect(count).toBeGreaterThan(0);
  });

  test('TC_NAV_002 - Verify logo exists', async ({ page }) => {
    const logo = page.locator('img[alt*="Logo" i], img[alt*="KodePilot" i], header img, nav img').first();
    const count = await logo.count();
    expect(count).toBeGreaterThan(0);
  });

  test('TC_NAV_003 - Verify Apply Now link exists', async ({ page }) => {
    const applyLink = page.locator('a[href*="apply"]').first();
    const count = await applyLink.count();
    expect(count).toBeGreaterThan(0);
    const href = await applyLink.getAttribute('href');
    expect(href).toContain('apply');
  });

  test('TC_NAV_004 - Verify Jobs/Walk-in link exists', async ({ page }) => {
    const jobsLink = page.locator('a[href*="jobs"]').first();
    const count = await jobsLink.count();
    expect(count).toBeGreaterThan(0);
    const href = await jobsLink.getAttribute('href');
    expect(href).toContain('jobs');
  });

  test('TC_NAV_005 - Verify Contact Us link exists', async ({ page }) => {
    const contactLink = page.locator('a[href*="contact"]').first();
    const count = await contactLink.count();
    expect(count).toBeGreaterThan(0);
  });

  test('TC_NAV_006 - Verify nav links have valid hrefs', async ({ page }) => {
    const navLinks = page.locator('nav a[href], header a[href]');
    const count = await navLinks.count();
    console.log('Total nav links:', count);
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < Math.min(count, 8); i++) {
      const href = await navLinks.nth(i).getAttribute('href');
      expect(href).not.toBeNull();
      console.log(`Nav link ${i + 1}: ${href}`);
    }
  });

  test('TC_NAV_007 - Header screenshot', async ({ page }) => {
    const header = page.locator('header, nav').first();
    const count = await header.count();
    if (count > 0) {
      await expect(page).toHaveScreenshot('header-full.png', {
        fullPage: false,
        maxDiffPixelRatio: 0.3,
      });
    }
  });

});