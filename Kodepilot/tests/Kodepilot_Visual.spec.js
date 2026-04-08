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

async function gotoAndWait(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2000);
  await dismissCookiePopup(page);
}

const PAGES = [
  { name: 'home',           url: 'https://uat.kodepilot.in' },
  { name: 'contact',        url: 'https://uat.kodepilot.in/contact-us' },
  { name: 'apply',          url: 'https://uat.kodepilot.in/apply' },
  { name: 'internship',     url: 'https://uat.kodepilot.in/internship' },
  { name: 'jobs',           url: 'https://uat.kodepilot.in/jobs' },
  { name: 'phd',            url: 'https://uat.kodepilot.in/phd' },
  { name: 'mnc',            url: 'https://uat.kodepilot.in/mnc' },
  { name: 'enquiry',        url: 'https://uat.kodepilot.in/enquiry' },
];

// ==========================================
// 1. FULL PAGE SCREENSHOTS
// ==========================================
test.describe('1. Full Page Visual Screenshots', () => {

  for (const pg of PAGES) {
    test(`VIS_FULL_${pg.name.toUpperCase()} - Full page screenshot of /${pg.name}`, async ({ page }) => {
      await gotoAndWait(page, pg.url);
      await expect(page).toHaveScreenshot(`full-${pg.name}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.3,
      });
    });
  }

});

// ==========================================
// 2. COMPONENT SCREENSHOTS
// ==========================================
test.describe('2. Component Visual Screenshots', () => {

  test.beforeEach(async ({ page }) => {
    await gotoAndWait(page, 'https://uat.kodepilot.in');
  });

  test('VIS_COMP_001 - Navbar screenshot', async ({ page }) => {
    await expect(page).toHaveScreenshot('comp-navbar.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.3,
    });
  });

  test('VIS_COMP_002 - Hero section screenshot', async ({ page }) => {
    await expect(page).toHaveScreenshot('comp-hero.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.3,
    });
  });

  test('VIS_COMP_003 - Footer screenshot', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    const footer = page.locator('footer').first();
    if (await footer.count() > 0) {
      await expect(footer).toHaveScreenshot('comp-footer.png', {
        maxDiffPixelRatio: 0.3,
      });
    }
  });

  test('VIS_COMP_004 - Above the fold screenshot', async ({ page }) => {
    await expect(page).toHaveScreenshot('comp-above-fold.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.3,
    });
  });

});

// ==========================================
// 3. RESPONSIVE — 3 viewports only (fast)
// ==========================================
test.describe('3. Responsive Visual Tests', () => {

  const VIEWPORTS = [
    { name: 'mobile',   width: 375,  height: 812  },
    { name: 'tablet',   width: 768,  height: 1024 },
    { name: 'desktop',  width: 1280, height: 800  },
  ];

  const KEY_PAGES = [
    { name: 'home',    url: 'https://uat.kodepilot.in' },
    { name: 'contact', url: 'https://uat.kodepilot.in/contact-us' },
    { name: 'jobs',    url: 'https://uat.kodepilot.in/jobs' },
  ];

  for (const vp of VIEWPORTS) {
    for (const pg of KEY_PAGES) {
      test(`VIS_RESP_${vp.name.toUpperCase()}_${pg.name.toUpperCase()} - ${vp.width}px × ${pg.name}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await gotoAndWait(page, pg.url);
        await expect(page).toHaveScreenshot(`resp-${vp.name}-${pg.name}.png`, {
          fullPage: true,
          maxDiffPixelRatio: 0.3,
        });
      });
    }
  }

});

// ==========================================
// 4. INTERACTION VISUAL TESTS
// ==========================================
test.describe('4. Interaction Visual Tests', () => {

  test.beforeEach(async ({ page }) => {
    await gotoAndWait(page, 'https://uat.kodepilot.in');
  });

  test('VIS_INT_001 - Scroll 50% screenshot', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.5));
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('int-scroll-50pct.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.3,
    });
  });

  test('VIS_INT_002 - Scroll to bottom screenshot', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('int-scroll-bottom.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.3,
    });
  });

  test('VIS_INT_003 - Mobile menu 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('int-mobile-view.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.3,
    });
  });

});

// ==========================================
// 5. FORM PAGES VISUAL
// ==========================================
test.describe('5. Form Pages Visual Tests', () => {

  const FORM_PAGES = [
    { name: 'contact',   url: 'https://uat.kodepilot.in/contact-us' },
    { name: 'apply',     url: 'https://uat.kodepilot.in/apply' },
    { name: 'jobs',      url: 'https://uat.kodepilot.in/jobs' },
    { name: 'enquiry',   url: 'https://uat.kodepilot.in/enquiry' },
  ];

  for (const fp of FORM_PAGES) {
    test(`VIS_FORM_${fp.name.toUpperCase()} - ${fp.name} form empty state`, async ({ page }) => {
      await gotoAndWait(page, fp.url);
      await expect(page).toHaveScreenshot(`form-empty-${fp.name}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.3,
      });
    });
  }

});

// ==========================================
// 6. DARK MODE
// ==========================================
test.describe('6. Dark Mode Visual Tests', () => {

  test('VIS_DARK_001 - Homepage dark mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await gotoAndWait(page, 'https://uat.kodepilot.in');
    await expect(page).toHaveScreenshot('dark-homepage.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.3,
    });
  });

});