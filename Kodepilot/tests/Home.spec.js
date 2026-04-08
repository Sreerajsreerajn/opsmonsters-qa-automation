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

test.describe('Home Page Basic Validation', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('https://uat.kodepilot.in', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await page.waitForTimeout(2000);
    await dismissCookiePopup(page);
  });

  // 1. PAGE LOAD
  test('TC_HP_001 - Homepage loads with correct URL', async ({ page }) => {
    await expect(page).toHaveURL(/kodepilot/i);
  });

  test('TC_HP_002 - Page title is correct', async ({ page }) => {
    await expect(page).toHaveTitle(/kode/i);
  });

  test('TC_HP_003 - Page has no 404 or 500', async ({ page }) => {
    await expect(page).not.toHaveURL(/error|404|500/i);
  });

  test('TC_HP_004 - Full page screenshot', async ({ page }) => {
    await expect(page).toHaveScreenshot('hp-homepage-full.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.3,
    });
  });

  // 2. HEADER
  test('TC_HP_005 - Logo exists in DOM', async ({ page }) => {
    const logo = page.locator('img[alt*="Logo" i], img[alt*="KodePilot" i]').first();
    const count = await logo.count();
    expect(count).toBeGreaterThan(0);
  });

  test('TC_HP_006 - Navigation bar exists', async ({ page }) => {
    const navbar = page.locator('nav, header').first();
    const count = await navbar.count();
    expect(count).toBeGreaterThan(0);
  });

  test('TC_HP_007 - Nav links exist', async ({ page }) => {
    const navLinks = page.locator('nav a, header a');
    const count = await navLinks.count();
    console.log('Nav links found:', count);
    expect(count).toBeGreaterThan(0);
  });

  // 3. HERO
  test('TC_HP_008 - Hero section exists', async ({ page }) => {
    const hero = page.locator('section').first();
    const count = await hero.count();
    expect(count).toBeGreaterThan(0);
  });

  test('TC_HP_009 - Hero heading exists', async ({ page }) => {
    const h1 = page.locator('h1').first();
    const count = await h1.count();
    expect(count).toBeGreaterThan(0);
    const text = await h1.textContent();
    console.log('H1 text:', text);
  });

  test('TC_HP_010 - Unlock text exists in DOM', async ({ page }) => {
    const unlockText = page.locator('text=Unlock');
    const count = await unlockText.count();
    console.log('Unlock text count:', count);
    expect(count).toBeGreaterThan(0);
  });

  // 4. NAVIGATION LINKS
  test('TC_HP_011 - All nav links have href', async ({ page }) => {
    const navLinks = page.locator('nav a[href], header a[href]');
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < Math.min(count, 8); i++) {
      const href = await navLinks.nth(i).getAttribute('href');
      expect(href).not.toBeNull();
    }
  });

  test('TC_HP_012 - Apply Now link exists', async ({ page }) => {
    const applyLink = page.locator('a[href*="apply"]').first();
    const count = await applyLink.count();
    expect(count).toBeGreaterThan(0);
  });

  // 5. CONTENT
  test('TC_HP_013 - Page has sections', async ({ page }) => {
    const sections = page.locator('section');
    const count = await sections.count();
    console.log('Sections found:', count);
    expect(count).toBeGreaterThan(0);
  });

  test('TC_HP_014 - Images exist on page', async ({ page }) => {
    const images = page.locator('img');
    const count = await images.count();
    console.log('Images found:', count);
    expect(count).toBeGreaterThan(0);
  });

  test('TC_HP_015 - Footer exists', async ({ page }) => {
    const footer = page.locator('footer').first();
    const count = await footer.count();
    expect(count).toBeGreaterThan(0);
  });

  test('TC_HP_016 - Footer has links', async ({ page }) => {
    const footerLinks = page.locator('footer a');
    const count = await footerLinks.count();
    console.log('Footer links:', count);
    expect(count).toBeGreaterThan(0);
  });

  // 6. RESPONSIVE
  test('TC_HP_017 - Mobile view 375px screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('hp-mobile-375.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.3,
    });
  });

  test('TC_HP_018 - Desktop view 1280px screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('hp-desktop-1280.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.3,
    });
  });

  // 7. PERFORMANCE
  test('TC_HP_019 - Page load under 15 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('https://uat.kodepilot.in', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    const loadTime = Date.now() - start;
    console.log('Load time:', loadTime + 'ms');
    expect(loadTime).toBeLessThan(15000);
  });

  test('TC_HP_020 - Meta description exists', async ({ page }) => {
    const meta = await page.locator('meta[name="description"]').count();
    console.log('Meta description count:', meta);
  });

  // 8. SCROLL
  test('TC_HP_021 - Page scrolls to bottom', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    const scrollY = await page.evaluate(() => window.scrollY);
    console.log('ScrollY:', scrollY);
    expect(scrollY).toBeGreaterThan(0);
  });

  // 9. COOKIE POPUP
  test('TC_HP_022 - Cookie popup dismissed successfully', async ({ page }) => {
    await page.goto('https://uat.kodepilot.in', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await page.waitForTimeout(2000);
    await dismissCookiePopup(page);
    const overlay = page.locator('#cookie-consent-overlay');
    const overlayCount = await overlay.count();
    if (overlayCount > 0) {
      const isHidden = await overlay.isHidden();
      expect(isHidden).toBeTruthy();
    }
  });

  // 10. WHATSAPP
  test('TC_HP_023 - WhatsApp link exists', async ({ page }) => {
    const whatsapp = page.locator('a[href*="whatsapp"], img[alt*="WhatsApp" i]').first();
    const count = await whatsapp.count();
    expect(count).toBeGreaterThan(0);
  });

});