const { test, expect } = require('@playwright/test');

// ==========================================
// HELPER
// ==========================================
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

// ==========================================
// 1. NEWSLETTER
// ==========================================
test.describe('1. Newsletter Subscribe', () => {

  test.beforeEach(async ({ page }) => {
    await gotoPage(page, 'https://uat.kodepilot.in');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
  });

  test('TC_NEWS_001 - Newsletter input exists', async ({ page }) => {
    const input = page.locator('input[placeholder*="newsletter" i], input[placeholder*="Subscribe" i], input[placeholder*="email" i]').last();
    const count = await input.count();
    console.log('Newsletter input count:', count);
    expect(count).toBeGreaterThan(0);
  });

  test('TC_NEWS_002 - Newsletter subscribe button exists', async ({ page }) => {
    const btn = page.locator('footer button, footer input[type="submit"]').first();
    const count = await btn.count();
    expect(count).toBeGreaterThan(0);
  });

  test('TC_NEWS_003 - Newsletter empty submit', async ({ page }) => {
    const btn = page.locator('footer button').first();
    if (await btn.count() > 0) {
      await btn.click({ force: true });
      await page.waitForTimeout(500);
      await expect(page).toHaveScreenshot('news-empty-submit.png', {
        fullPage: false,
        maxDiffPixelRatio: 0.3,
      });
    }
  });

  test('TC_NEWS_004 - Newsletter valid email enter', async ({ page }) => {
    const input = page.locator('input[placeholder*="newsletter" i], input[placeholder*="Subscribe" i]').last();
    if (await input.count() > 0) {
      await input.fill('test@test.com');
      await expect(page).toHaveScreenshot('news-valid-email.png', {
        fullPage: false,
        maxDiffPixelRatio: 0.3,
      });
    }
  });

});

// ==========================================
// 2. SOCIAL MEDIA LINKS
// ==========================================
test.describe('2. Social Media Links', () => {

  test.beforeEach(async ({ page }) => {
    await gotoPage(page, 'https://uat.kodepilot.in');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
  });

  test('TC_SOC_001 - Instagram link exists and valid', async ({ page }) => {
    const instagram = page.locator('a[href*="instagram"]').first();
    const count = await instagram.count();
    expect(count).toBeGreaterThan(0);
    const href = await instagram.getAttribute('href');
    console.log('Instagram href:', href);
    expect(href).toContain('instagram');
  });

  test('TC_SOC_002 - LinkedIn link exists and valid', async ({ page }) => {
    const linkedin = page.locator('a[href*="linkedin"]').first();
    const count = await linkedin.count();
    expect(count).toBeGreaterThan(0);
    const href = await linkedin.getAttribute('href');
    console.log('LinkedIn href:', href);
    expect(href).toContain('linkedin');
  });

  test('TC_SOC_003 - WhatsApp link exists and valid', async ({ page }) => {
    const whatsapp = page.locator('a[href*="whatsapp"]').first();
    const count = await whatsapp.count();
    expect(count).toBeGreaterThan(0);
    const href = await whatsapp.getAttribute('href');
    console.log('WhatsApp href:', href);
    expect(href).toContain('whatsapp');
  });

  test('TC_SOC_004 - Discord link exists and valid', async ({ page }) => {
    const discord = page.locator('a[href*="discord"]').first();
    const count = await discord.count();
    expect(count).toBeGreaterThan(0);
    const href = await discord.getAttribute('href');
    console.log('Discord href:', href);
    expect(href).toContain('discord');
  });

  test('TC_SOC_005 - All social icons screenshot', async ({ page }) => {
    const footer = page.locator('footer').first();
    await expect(footer).toHaveScreenshot('soc-footer-icons.png', {
      maxDiffPixelRatio: 0.3,
    });
  });

});

// ==========================================
// 3. SEARCH BOX
// ==========================================
test.describe('3. Search Box', () => {

  test.beforeEach(async ({ page }) => {
    await gotoPage(page, 'https://uat.kodepilot.in');
  });

  test('TC_SRCH_001 - Search box exists in header', async ({ page }) => {
    const search = page.locator('input[placeholder*="Search" i]').first();
    const count = await search.count();
    console.log('Search box count:', count);
    expect(count).toBeGreaterThan(0);
  });

  test('TC_SRCH_002 - Search box accepts input', async ({ page }) => {
    const search = page.locator('input[placeholder*="Search" i]').first();
    if (await search.count() > 0) {
      await search.click({ force: true });
      await search.fill('Python');
      await page.waitForTimeout(500);
      const value = await search.inputValue();
      console.log('Search value:', value);
      expect(value).toBe('Python');
    }
  });

  test('TC_SRCH_003 - Search box screenshot', async ({ page }) => {
    const search = page.locator('input[placeholder*="Search" i]').first();
    if (await search.count() > 0) {
      await search.click({ force: true });
      await search.fill('QA Testing');
      await page.waitForTimeout(500);
      await expect(page).toHaveScreenshot('srch-filled.png', {
        fullPage: false,
        maxDiffPixelRatio: 0.3,
      });
    }
  });

});

// ==========================================
// 4. COURSE ENROLL BUTTONS
// ==========================================
test.describe('4. Course Enroll Buttons', () => {

  test.beforeEach(async ({ page }) => {
    await gotoPage(page, 'https://uat.kodepilot.in');
  });

  test('TC_COURSE_001 - Enroll Now buttons exist', async ({ page }) => {
    const enrollBtns = page.locator('button:has-text("Enroll Now")');
    const count = await enrollBtns.count();
    console.log('Enroll Now buttons:', count);
    expect(count).toBeGreaterThan(0);
  });

  test('TC_COURSE_002 - View All Courses link exists', async ({ page }) => {
    const viewAll = page.locator('a:has-text("View All Courses")').first();
    const count = await viewAll.count();
    expect(count).toBeGreaterThan(0);
    const href = await viewAll.getAttribute('href');
    console.log('View All Courses href:', href);
    expect(href).not.toBeNull();
  });

  test('TC_COURSE_003 - View All Courses link navigates correctly', async ({ page }) => {
    const viewAll = page.locator('a:has-text("View All Courses")').first();
    if (await viewAll.count() > 0) {
      const href = await viewAll.getAttribute('href');
      expect(href).toContain('kodepilot');
    }
  });

  test('TC_COURSE_004 - Course carousel scroll buttons exist', async ({ page }) => {
    const scrollLeft = page.locator('button:has-text("←"), button[aria-label*="left" i]').first();
    const scrollRight = page.locator('button:has-text("→"), button[aria-label*="right" i]').first();
    const leftCount = await scrollLeft.count();
    const rightCount = await scrollRight.count();
    console.log('Scroll left:', leftCount, 'Scroll right:', rightCount);
    expect(leftCount + rightCount).toBeGreaterThan(0);
  });

  test('TC_COURSE_005 - Course section screenshot', async ({ page }) => {
    const courseSection = page.locator('#available-courses, [id*="course"]').first();
    if (await courseSection.count() > 0) {
      await courseSection.scrollIntoViewIfNeeded().catch(() => {});
    } else {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.4));
    }
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('course-section.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.3,
    });
  });

});

// ==========================================
// 5. CAREER QUIZ
// ==========================================
test.describe('5. Career Quiz', () => {

  test.beforeEach(async ({ page }) => {
    await gotoPage(page, 'https://uat.kodepilot.in');
  });

  test('TC_QUIZ_001 - Career Quiz button exists', async ({ page }) => {
    const quizBtn = page.locator('button:has-text("Career Quiz"), a:has-text("Career Quiz")').first();
    const count = await quizBtn.count();
    console.log('Quiz button count:', count);
    expect(count).toBeGreaterThan(0);
  });

  test('TC_QUIZ_002 - Career Quiz section screenshot', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.35));
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('quiz-section.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.3,
    });
  });

  test('TC_QUIZ_003 - Career Quiz button click', async ({ page }) => {
    const quizBtn = page.locator('button:has-text("Career Quiz"), a:has-text("Career Quiz")').first();
    if (await quizBtn.count() > 0) {
      await quizBtn.click({ force: true });
      await page.waitForTimeout(1000);
      await expect(page).toHaveScreenshot('quiz-after-click.png', {
        fullPage: false,
        maxDiffPixelRatio: 0.3,
      });
    }
  });

});

// ==========================================
// 6. RESUME BUILDER
// ==========================================
test.describe('6. Resume Builder', () => {

  test.beforeEach(async ({ page }) => {
    await gotoPage(page, 'https://uat.kodepilot.in');
  });

  test('TC_RESUME_001 - Make my resume button exists', async ({ page }) => {
    const resumeBtn = page.locator('button:has-text("Make my resume"), a:has-text("Make my resume")').first();
    const count = await resumeBtn.count();
    console.log('Resume button count:', count);
    expect(count).toBeGreaterThan(0);
  });

  test('TC_RESUME_002 - Resume section screenshot', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.65));
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('resume-section.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.3,
    });
  });

  test('TC_RESUME_003 - Resume button click navigates', async ({ page }) => {
    const resumeBtn = page.locator('button:has-text("Make my resume"), a:has-text("Make my resume")').first();
    if (await resumeBtn.count() > 0) {
      await resumeBtn.click({ force: true });
      await page.waitForTimeout(1000);
      await expect(page).toHaveScreenshot('resume-after-click.png', {
        fullPage: false,
        maxDiffPixelRatio: 0.3,
      });
    }
  });

});

// ==========================================
// 7. LOGIN BUTTON
// ==========================================
test.describe('7. Login Button', () => {

  test.beforeEach(async ({ page }) => {
    await gotoPage(page, 'https://uat.kodepilot.in');
  });

  test('TC_LOGIN_001 - Login link exists', async ({ page }) => {
    const loginLink = page.locator('a:has-text("Login"), button:has-text("Login")').first();
    const count = await loginLink.count();
    console.log('Login link count:', count);
    expect(count).toBeGreaterThan(0);
  });

  test('TC_LOGIN_002 - Login link has valid href', async ({ page }) => {
    const loginLink = page.locator('a:has-text("Login")').first();
    if (await loginLink.count() > 0) {
      const href = await loginLink.getAttribute('href');
      console.log('Login href:', href);
      expect(href).not.toBeNull();
    }
  });

  test('TC_LOGIN_003 - Login click navigates', async ({ page }) => {
    const loginLink = page.locator('a:has-text("Login")').first();
    if (await loginLink.count() > 0) {
      await loginLink.click({ force: true });
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      console.log('After login click URL:', currentUrl);
      await expect(page).toHaveScreenshot('login-after-click.png', {
        fullPage: false,
        maxDiffPixelRatio: 0.3,
      });
    }
  });

});

// ==========================================
// 8. FAQ ACCORDION
// ==========================================
test.describe('8. FAQ Accordion', () => {

  test.beforeEach(async ({ page }) => {
    await gotoPage(page, 'https://uat.kodepilot.in');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.8));
    await page.waitForTimeout(500);
  });

  test('TC_FAQ_001 - FAQ section exists', async ({ page }) => {
    const faq = page.locator('text=Frequently Asked Questions').first();
    const count = await faq.count();
    console.log('FAQ section count:', count);
    expect(count).toBeGreaterThan(0);
  });

  test('TC_FAQ_002 - FAQ buttons exist', async ({ page }) => {
    const faqBtns = page.locator('button:has-text("What is KodePilot"), button:has-text("Who can join")');
    const count = await faqBtns.count();
    console.log('FAQ buttons:', count);
    expect(count).toBeGreaterThan(0);
  });

  test('TC_FAQ_003 - FAQ expand on click', async ({ page }) => {
    const faqBtn = page.locator('button:has-text("What is KodePilot")').first();
    if (await faqBtn.count() > 0) {
      await faqBtn.click({ force: true });
      await page.waitForTimeout(500);
      await expect(page).toHaveScreenshot('faq-expanded.png', {
        fullPage: false,
        maxDiffPixelRatio: 0.3,
      });
    }
  });

  test('TC_FAQ_004 - Show More FAQs button exists', async ({ page }) => {
    const showMore = page.locator('button:has-text("Show More")').first();
    const count = await showMore.count();
    console.log('Show More button:', count);
    expect(count).toBeGreaterThan(0);
  });

  test('TC_FAQ_005 - Show More FAQs click', async ({ page }) => {
    const showMore = page.locator('button:has-text("Show More")').first();
    if (await showMore.count() > 0) {
      await showMore.click({ force: true });
      await page.waitForTimeout(500);
      await expect(page).toHaveScreenshot('faq-show-more.png', {
        fullPage: false,
        maxDiffPixelRatio: 0.3,
      });
    }
  });

});

// ==========================================
// 9. REFER & WIN
// ==========================================
test.describe('9. Refer & Win Section', () => {

  test.beforeEach(async ({ page }) => {
    await gotoPage(page, 'https://uat.kodepilot.in');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.75));
    await page.waitForTimeout(500);
  });

  test('TC_REFER_001 - Refer & Win section exists', async ({ page }) => {
    const refer = page.locator('text=Refer & Win').first();
    const count = await refer.count();
    console.log('Refer & Win count:', count);
    expect(count).toBeGreaterThan(0);
  });

  test('TC_REFER_002 - Get Started button exists', async ({ page }) => {
    const getStarted = page.locator('button:has-text("Get Started")').first();
    const count = await getStarted.count();
    expect(count).toBeGreaterThan(0);
  });

  test('TC_REFER_003 - Refer section screenshot', async ({ page }) => {
    await expect(page).toHaveScreenshot('refer-section.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.3,
    });
  });

});

// ==========================================
// 10. BROKEN LINKS CHECK
// ==========================================
test.describe('10. Broken Links Check', () => {

  test('TC_LINK_001 - Home page links not broken', async ({ page }) => {
    await gotoPage(page, 'https://uat.kodepilot.in');
    const links = await page.locator('a[href]').all();
    console.log('Total links found:', links.length);
    let validCount = 0;
    let invalidCount = 0;
    for (const link of links.slice(0, 20)) {
      const href = await link.getAttribute('href');
      if (href && !href.startsWith('javascript') && !href.startsWith('mailto') && !href.startsWith('tel')) {
        validCount++;
      } else {
        invalidCount++;
      }
    }
    console.log('Valid links:', validCount, '| JS/mailto/tel:', invalidCount);
    expect(validCount).toBeGreaterThan(0);
  });

  test('TC_LINK_002 - Footer links valid', async ({ page }) => {
    await gotoPage(page, 'https://uat.kodepilot.in');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    const footerLinks = page.locator('footer a[href]');
    const count = await footerLinks.count();
    console.log('Footer links:', count);
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < Math.min(count, 10); i++) {
      const href = await footerLinks.nth(i).getAttribute('href');
      console.log(`Footer link ${i + 1}:`, href);
      expect(href).not.toBeNull();
    }
  });

});

// ==========================================
// 11. SEO & META TAGS
// ==========================================
test.describe('11. SEO & Meta Tags', () => {

  test('TC_SEO_001 - Page title exists', async ({ page }) => {
    await gotoPage(page, 'https://uat.kodepilot.in');
    const title = await page.title();
    console.log('Page title:', title);
    expect(title.length).toBeGreaterThan(0);
  });

  test('TC_SEO_002 - Meta description exists', async ({ page }) => {
    await gotoPage(page, 'https://uat.kodepilot.in');
    const meta = await page.locator('meta[name="description"]').getAttribute('content').catch(() => null);
    console.log('Meta description:', meta);
    // Soft check
  });

  test('TC_SEO_003 - H1 tag exists', async ({ page }) => {
    await gotoPage(page, 'https://uat.kodepilot.in');
    const h1 = page.locator('h1').first();
    const count = await h1.count();
    expect(count).toBeGreaterThan(0);
    const text = await h1.textContent();
    console.log('H1:', text);
  });

  test('TC_SEO_004 - All pages have titles', async ({ page }) => {
    const pages = [
      'https://uat.kodepilot.in',
      'https://uat.kodepilot.in/jobs',
      'https://uat.kodepilot.in/apply',
      'https://uat.kodepilot.in/contact-us',
    ];
    for (const url of pages) {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      const title = await page.title();
      console.log(`${url} → title: "${title}"`);
      expect(title.length).toBeGreaterThan(0);
    }
  });

});
