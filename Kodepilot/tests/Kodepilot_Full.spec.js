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

async function gotoPage(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2000);
  await dismissCookiePopup(page);
}

test.describe('Kodepilot Full Website Testing', () => {

  // ==========================================
  // VISUAL TESTS
  // ==========================================
  test.describe('Visual Tests', () => {

    test('TC_VIS_001 - Homepage visual', async ({ page }) => {
      await gotoPage(page, 'https://uat.kodepilot.in');
      await expect(page).toHaveScreenshot('homepage.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.3,
      });
    });

    test('TC_VIS_002 - Jobs page visual', async ({ page }) => {
      await gotoPage(page, 'https://uat.kodepilot.in/jobs');
      await expect(page).toHaveScreenshot('jobs.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.3,
      });
    });

    test('TC_VIS_003 - Internship page visual', async ({ page }) => {
      await gotoPage(page, 'https://uat.kodepilot.in/internship');
      await expect(page).toHaveScreenshot('internship.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.3,
      });
    });

    test('TC_VIS_004 - Contact page visual', async ({ page }) => {
      await gotoPage(page, 'https://uat.kodepilot.in/contact-us');
      await expect(page).toHaveScreenshot('contact.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.3,
      });
    });

    test('TC_VIS_005 - Apply page visual', async ({ page }) => {
      await gotoPage(page, 'https://uat.kodepilot.in/apply');
      await expect(page).toHaveScreenshot('apply.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.3,
      });
    });

  });

  // ==========================================
  // FORM TESTS
  // ==========================================
  test.describe('Form Tests', () => {

    test('TC_FORM_001 - Contact form loads', async ({ page }) => {
      await gotoPage(page, 'https://uat.kodepilot.in/contact-us');
      const form = page.locator('form').first();
      const count = await form.count();
      expect(count).toBeGreaterThan(0);
    });

    test('TC_FORM_002 - Apply form loads', async ({ page }) => {
      await gotoPage(page, 'https://uat.kodepilot.in/apply');
      const form = page.locator('form').first();
      const count = await form.count();
      expect(count).toBeGreaterThan(0);
    });

    test('TC_FORM_003 - Jobs form loads', async ({ page }) => {
      await gotoPage(page, 'https://uat.kodepilot.in/jobs');
      const form = page.locator('form').first();
      const count = await form.count();
      expect(count).toBeGreaterThan(0);
    });

  });

  // ==========================================
  // E2E TESTS
  // ==========================================
  test.describe('E2E Tests', () => {

    test('TC_E2E_001 - Homepage load and navigate to Jobs', async ({ page }) => {
      await gotoPage(page, 'https://uat.kodepilot.in');
      const jobsLink = page.locator('a[href*="jobs"]').first();
      const count = await jobsLink.count();
      expect(count).toBeGreaterThan(0);
      await jobsLink.click({ force: true });
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(/jobs/i);
    });

    test('TC_E2E_002 - Homepage to Internship navigation', async ({ page }) => {
      await gotoPage(page, 'https://uat.kodepilot.in');
      const internshipLink = page.locator('a[href*="internship"]').first();
      const count = await internshipLink.count();
      expect(count).toBeGreaterThan(0);
      await internshipLink.click({ force: true });
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(/internship/i);
    });

    test('TC_E2E_003 - Homepage to Apply Now flow', async ({ page }) => {
      await gotoPage(page, 'https://uat.kodepilot.in');
      const applyLink = page.locator('a[href*="apply"]').first();
      await applyLink.click({ force: true });
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(/apply/i);
    });

    test('TC_E2E_004 - Homepage to Contact Us flow', async ({ page }) => {
      await gotoPage(page, 'https://uat.kodepilot.in');
      const contactLink = page.locator('a[href*="contact"]').first();
      await contactLink.click({ force: true });
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(/contact/i);
    });

    test('TC_E2E_005 - All main pages load successfully', async ({ page }) => {
      const pages = [
        'https://uat.kodepilot.in',
        'https://uat.kodepilot.in/jobs',
        'https://uat.kodepilot.in/apply',
        'https://uat.kodepilot.in/contact-us',
        'https://uat.kodepilot.in/internship',
      ];
      for (const url of pages) {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await expect(page).not.toHaveURL(/error|404|500/i);
        console.log('✅ Loaded:', url);
      }
    });

    test('TC_E2E_006 - Navbar links exist', async ({ page }) => {
      await gotoPage(page, 'https://uat.kodepilot.in');
      const links = ['jobs', 'apply', 'contact', 'internship'];
      for (const link of links) {
        const navLink = page.locator(`a[href*="${link}"]`).first();
        const count = await navLink.count();
        console.log(`Link "${link}" count:`, count);
        expect(count).toBeGreaterThan(0);
      }
    });

  });

});