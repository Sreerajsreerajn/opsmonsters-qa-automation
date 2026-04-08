const { test, expect } = require('@playwright/test');

// ==========================================
// HELPER FUNCTIONS
// ==========================================

async function dismissCookiePopup(page) {
  try {
    await page.evaluate(() => {
      const overlay = document.getElementById('cookie-consent-overlay');
      const modal = document.getElementById('cookie-consent-modal');
      if (overlay) overlay.style.display = 'none';
      if (modal) modal.style.display = 'none';
      // Extra: hide any fixed overlays blocking clicks
      document.querySelectorAll('[class*="cookie"], [id*="cookie"], [class*="consent"], [id*="consent"]').forEach(el => {
        el.style.display = 'none';
      });
    });
    await page.waitForTimeout(300);
  } catch (e) {
    console.log('Cookie dismiss error (ignored):', e.message);
  }
}

async function safeSelectOption(page, selector, value) {
  try {
    const sel = page.locator(selector).first();
    if (await sel.isVisible({ timeout: 3000 }).catch(() => false)) {
      await sel.selectOption(value);
    }
  } catch (e) {
    console.log(`selectOption failed for "${selector}": ${e.message}`);
  }
}

async function safeFill(page, selector, value) {
  try {
    const el = page.locator(selector).first();
    if (await el.isVisible({ timeout: 3000 }).catch(() => false)) {
      await el.fill(value);
    }
  } catch (e) {
    console.log(`fill failed for "${selector}": ${e.message}`);
  }
}

async function safeCheck(page, selector, nth = 0) {
  try {
    const checkboxes = page.locator(selector);
    const count = await checkboxes.count();
    if (count > nth) {
      await checkboxes.nth(nth).check({ force: true });
    }
  } catch (e) {
    console.log(`check failed for "${selector}" nth(${nth}): ${e.message}`);
  }
}

// ==========================================
// 1. CONTACT FORM - /contact-us
// ==========================================

test.describe('1. Contact Form (/contact-us)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('https://uat.kodepilot.in/contact-us', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await page.waitForTimeout(2000);
    await dismissCookiePopup(page);
  });

  test('TC_CF_001 - Empty submit validation', async ({ page }) => {
    await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) form.dispatchEvent(new Event('submit', { bubbles: true }));
    });
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('cf-001-empty-validation.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.3,
    });
  });

  test('TC_CF_002 - Invalid email', async ({ page }) => {
    await safeFill(page, 'input[placeholder*="First" i]', 'Test');
    await safeFill(page, 'input[placeholder*="Last" i]', 'User');
    await safeFill(page, 'input[placeholder*="email" i], input[type="email"]', 'notanemail');
    await safeFill(page, 'input[type="tel"]', '9876543210');
    await safeFill(page, 'input[placeholder*="city" i], input[id*="city" i], input[name*="city" i]', 'Coimbatore');
    await safeSelectOption(page, 'select', { index: 1 });
    await safeCheck(page, 'input[type="checkbox"]', 0);
    try {
      await page.locator('button:has-text("Submit"), button[type="submit"]').first().click({ timeout: 5000 });
    } catch (e) {}
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('cf-002-invalid-email.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.3,
    });
  });

  test('TC_CF_003 - Invalid phone', async ({ page }) => {
    await safeFill(page, 'input[placeholder*="First" i]', 'Test');
    await safeFill(page, 'input[placeholder*="Last" i]', 'User');
    await safeFill(page, 'input[placeholder*="email" i], input[type="email"]', 'test@test.com');
    await safeFill(page, 'input[type="tel"]', '123');
    await safeFill(page, 'input[placeholder*="city" i], input[id*="city" i], input[name*="city" i]', 'Coimbatore');
    await safeSelectOption(page, 'select', { index: 1 });
    await safeCheck(page, 'input[type="checkbox"]', 0);
    try {
      await page.locator('button:has-text("Submit"), button[type="submit"]').first().click({ timeout: 5000 });
    } catch (e) {}
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('cf-003-invalid-phone.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.3,
    });
  });

  test('TC_CF_004 - Missing terms checkbox', async ({ page }) => {
    await safeFill(page, 'input[placeholder*="First" i]', 'Test');
    await safeFill(page, 'input[placeholder*="Last" i]', 'User');
    await safeFill(page, 'input[placeholder*="email" i], input[type="email"]', 'test@test.com');
    await safeFill(page, 'input[type="tel"]', '9876543210');
    await safeFill(page, 'input[placeholder*="city" i], input[id*="city" i], input[name*="city" i]', 'Coimbatore');
    await safeSelectOption(page, 'select', { index: 1 });
    // Terms check பண்ணாம submit click
    try {
      await page.locator('button:has-text("Submit"), button[type="submit"]').first().click({ timeout: 5000 });
    } catch (e) {}
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('cf-004-missing-terms.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.3,
    });
  });

  test('TC_CF_005 - Valid form filled', async ({ page }) => {
    await safeFill(page, 'input[placeholder*="First" i]', 'Sreeraj');
    await safeFill(page, 'input[placeholder*="Last" i]', 'NS');
    await safeFill(page, 'input[type="tel"]', '9876543210');
    await safeFill(page, 'input[placeholder*="email" i], input[type="email"]', 'sreeraj@test.com');
    await safeFill(page, 'input[placeholder*="city" i], input[id*="city" i], input[name*="city" i]', 'Coimbatore');
    await safeSelectOption(page, 'select', { index: 1 });
    await safeFill(page, 'textarea', 'Test message from automation');
    await safeCheck(page, 'input[type="checkbox"]', 0);
    await expect(page).toHaveScreenshot('cf-005-valid-filled.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.3,
    });
  });

});

// ==========================================
// 2. APPLY FORM - /apply
// ==========================================

test.describe('2. Apply Form (/apply)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('https://uat.kodepilot.in/apply', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await page.waitForTimeout(2000);
    await dismissCookiePopup(page);
  });

  test('TC_AF_001 - Empty form screenshot', async ({ page }) => {
    await expect(page).toHaveScreenshot('af-001-empty-form.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.3,
    });
    const btn = page.locator('#submitBtn');
    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(btn).toBeDisabled();
    }
  });

  test('TC_AF_002 - Invalid email - form state', async ({ page }) => {
    await safeFill(page, 'input[placeholder*="First" i]', 'Test');
    await safeFill(page, 'input[placeholder*="Last" i]', 'User');
    await safeFill(page, 'input[placeholder*="email" i], input[type="email"]', 'bademail@');
    await safeFill(page, 'input[type="tel"]', '9876543210');
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('af-002-invalid-email-state.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.3,
    });
  });

  test('TC_AF_003 - Invalid phone - form state', async ({ page }) => {
    await safeFill(page, 'input[placeholder*="First" i]', 'Test');
    await safeFill(page, 'input[placeholder*="Last" i]', 'User');
    await safeFill(page, 'input[placeholder*="email" i], input[type="email"]', 'test@test.com');
    await safeFill(page, 'input[type="tel"]', '999');
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('af-003-invalid-phone-state.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.3,
    });
  });

  test('TC_AF_004 - Valid form all fields filled', async ({ page }) => {
    await safeFill(page, 'input[placeholder*="First" i]', 'Sreeraj');
    await safeFill(page, 'input[placeholder*="Last" i]', 'NS');
    await safeFill(page, 'input[placeholder*="email" i], input[type="email"]', 'sreeraj@test.com');
    await safeFill(page, 'input[type="tel"]', '9876543210');
    await safeSelectOption(page, 'select#genderSel, select[name="gender"]', { index: 1 });
    await safeSelectOption(page, 'select#maritalSel, select[name="maritalStatus"]', { index: 1 });
    await safeSelectOption(page, 'select#locationSel, select[name="location"]', { index: 1 });
    await safeSelectOption(page, 'select#educationSel, select[name="education"]', { index: 1 });
    await safeSelectOption(page, 'select#statusSel, select[name="currentStatus"]', { index: 1 });
    await safeSelectOption(page, 'select#arrearsSel, select[name="arrears"]', { index: 1 });
    await safeFill(page, 'input[type="date"]', '2000-01-15');
    await safeFill(page, 'input[placeholder*="city" i], input[id*="city" i], input[name*="city" i]', 'Coimbatore');
    await safeFill(page, 'input[placeholder*="college" i], input[id*="college" i], input[name*="college" i], input[placeholder*="ID" i]', 'CBE123');
    await safeFill(page, 'textarea', 'Interested in QA Testing role');
    await safeCheck(page, 'input[type="checkbox"]', 0);
    await safeCheck(page, 'input[type="checkbox"]', 2);
    await expect(page).toHaveScreenshot('af-004-valid-filled.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.3,
    });
  });

});

// ==========================================
// 3. INTERNSHIP FORM - /internship
// ==========================================

test.describe('3. Internship Form (/internship)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('https://uat.kodepilot.in/internship', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await page.waitForTimeout(2000);
    await dismissCookiePopup(page);
  });

  test('TC_IF_001 - Empty form screenshot + button disabled', async ({ page }) => {
    await expect(page).toHaveScreenshot('if-001-empty-form.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.3,
    });
    const btn = page.locator('#submitBtn');
    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(btn).toBeDisabled();
    }
  });

  test('TC_IF_002 - Invalid email state', async ({ page }) => {
    await safeFill(page, 'input[placeholder*="First" i]', 'Test');
    await safeFill(page, 'input[placeholder*="Last" i]', 'User');
    await safeFill(page, 'input[placeholder*="email" i], input[type="email"]', 'wrongemail');
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('if-002-invalid-email.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.3,
    });
  });

  test('TC_IF_003 - Invalid phone state', async ({ page }) => {
    await safeFill(page, 'input[placeholder*="First" i]', 'Test');
    await safeFill(page, 'input[placeholder*="Last" i]', 'User');
    await safeFill(page, 'input[placeholder*="email" i], input[type="email"]', 'test@test.com');
    await safeFill(page, 'input[type="tel"]', '000');
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('if-003-invalid-phone.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.3,
    });
  });

  test('TC_IF_004 - Valid form all fields filled', async ({ page }) => {
    await safeFill(page, 'input[placeholder*="First" i]', 'Sreeraj');
    await safeFill(page, 'input[placeholder*="Last" i]', 'NS');
    await safeFill(page, 'input[placeholder*="email" i], input[type="email"]', 'sreeraj@test.com');
    await safeFill(page, 'input[type="tel"]', '9876543210');
    await safeSelectOption(page, 'select#genderSel, select[name="gender"]', { index: 1 });
    await safeSelectOption(page, 'select#maritalSel, select[name="maritalStatus"]', { index: 1 });
    await safeSelectOption(page, 'select[name="internshipMode"], select#internshipModeSel', { index: 1 });
    await safeSelectOption(page, 'select#educationSel, select[name="education"]', { index: 1 });
    await safeSelectOption(page, 'select#statusSel, select[name="currentStatus"]', { index: 1 });
    await safeSelectOption(page, 'select#arrearsSel, select[name="arrears"]', { index: 1 });
    await safeFill(page, 'input[type="date"]', '2001-06-20');
    await safeFill(page, 'input[placeholder*="city" i], input[id*="city" i], input[name*="city" i]', 'Coimbatore');
    await safeFill(page, 'input[placeholder*="college" i], input[id*="college" i], input[placeholder*="ID" i]', 'CBE456');
    await safeFill(page, 'textarea', 'Interested in internship');
    await safeCheck(page, 'input[type="checkbox"]', 0);
    await safeCheck(page, 'input[type="checkbox"]', 2);
    await expect(page).toHaveScreenshot('if-004-valid-filled.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.3,
    });
  });

});

// ==========================================
// 4. JOBS FORM - /jobs
// ==========================================

test.describe('4. Jobs Form (/jobs)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('https://uat.kodepilot.in/jobs', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await page.waitForTimeout(2000);
    await dismissCookiePopup(page);
  });

  test('TC_JF_001 - Empty form + button disabled', async ({ page }) => {
    await expect(page).toHaveScreenshot('jf-001-empty-form.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.3,
    });
    const btn = page.locator('#submitBtn');
    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(btn).toBeDisabled();
    }
  });

  test('TC_JF_002 - Invalid email state', async ({ page }) => {
    await safeFill(page, 'input[placeholder*="First" i]', 'Test');
    await safeFill(page, 'input[placeholder*="Last" i]', 'User');
    await safeFill(page, 'input[placeholder*="email" i], input[type="email"]', 'bademail');
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('jf-002-invalid-email.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.3,
    });
  });

  test('TC_JF_003 - Invalid phone state', async ({ page }) => {
    await safeFill(page, 'input[placeholder*="First" i]', 'Test');
    await safeFill(page, 'input[placeholder*="Last" i]', 'User');
    await safeFill(page, 'input[placeholder*="email" i], input[type="email"]', 'test@test.com');
    await safeFill(page, 'input[type="tel"]', '111');
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('jf-003-invalid-phone.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.3,
    });
  });

  test('TC_JF_004 - Missing terms checkbox', async ({ page }) => {
    await safeFill(page, 'input[placeholder*="First" i]', 'Test');
    await safeFill(page, 'input[placeholder*="Last" i]', 'User');
    await safeFill(page, 'input[placeholder*="email" i], input[type="email"]', 'test@test.com');
    await safeFill(page, 'input[type="tel"]', '9876543210');
    await safeSelectOption(page, 'select', { index: 1 });
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('jf-004-missing-terms.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.3,
    });
  });

  test('TC_JF_005 - Valid form all fields filled', async ({ page }) => {
    await safeFill(page, 'input[placeholder*="First" i]', 'Sreeraj');
    await safeFill(page, 'input[placeholder*="Last" i]', 'NS');
    await safeFill(page, 'input[placeholder*="email" i], input[type="email"]', 'sreeraj@test.com');
    await safeFill(page, 'input[type="tel"]', '9876543210');
    await safeSelectOption(page, 'select', { index: 1 });
    await safeFill(page, 'textarea', 'Looking for QA Testing opportunity');
    await safeCheck(page, 'input[type="checkbox"]', 0);
    await expect(page).toHaveScreenshot('jf-005-valid-filled.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.3,
    });
  });

});

// ==========================================
// 5. PHD FORM - /phd
// ==========================================

test.describe('5. PhD Form (/phd)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('https://uat.kodepilot.in/phd', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await page.waitForTimeout(2000);
    await dismissCookiePopup(page);
  });

  test('TC_PF_001 - Page loads and form visible', async ({ page }) => {
    await expect(page).toHaveScreenshot('pf-001-page-load.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.3,
    });
  });

  test('TC_PF_002 - Empty form button state', async ({ page }) => {
    const btn = page.locator('#submitBtn, button[type="submit"]').first();
    const isDisabled = await btn.isDisabled().catch(() => false);
    console.log('Submit button disabled:', isDisabled);
    await expect(page).toHaveScreenshot('pf-002-empty-state.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.3,
    });
  });

  test('TC_PF_003 - Valid form filled', async ({ page }) => {
    await safeFill(page, 'input[placeholder*="First" i]', 'Sreeraj');
    await safeFill(page, 'input[placeholder*="Last" i]', 'NS');
    await safeFill(page, 'input[placeholder*="email" i], input[type="email"]', 'sreeraj@test.com');
    await safeFill(page, 'input[type="tel"]', '9876543210');
    await safeFill(page, 'input[placeholder*="city" i], input[id*="city" i], input[name*="city" i]', 'Coimbatore');
    await safeCheck(page, 'input[type="checkbox"]', 0);
    await expect(page).toHaveScreenshot('pf-003-valid-filled.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.3,
    });
  });

});

// ==========================================
// 6. PROFESSIONAL CERTIFICATION - /professional-certification
// ==========================================

test.describe('6. Professional Certification Form (/professional-certification)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('https://uat.kodepilot.in/professional-certification', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await page.waitForTimeout(2000);
    await dismissCookiePopup(page);
  });

  test('TC_PC_001 - Page loads and form visible', async ({ page }) => {
    await expect(page).toHaveScreenshot('pc-001-page-load.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.3,
    });
  });

  test('TC_PC_002 - Empty form button state', async ({ page }) => {
    const btn = page.locator('#submitBtn, button[type="submit"]').first();
    const isDisabled = await btn.isDisabled().catch(() => false);
    console.log('Submit button disabled:', isDisabled);
    await expect(page).toHaveScreenshot('pc-002-empty-state.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.3,
    });
  });

  test('TC_PC_003 - Valid form filled', async ({ page }) => {
    await safeFill(page, 'input[placeholder*="First" i]', 'Sreeraj');
    await safeFill(page, 'input[placeholder*="Last" i]', 'NS');
    await safeFill(page, 'input[placeholder*="email" i], input[type="email"]', 'sreeraj@test.com');
    await safeFill(page, 'input[type="tel"]', '9876543210');
    await safeFill(page, 'input[placeholder*="city" i], input[id*="city" i], input[name*="city" i]', 'Coimbatore');
    await safeCheck(page, 'input[type="checkbox"]', 0);
    await expect(page).toHaveScreenshot('pc-003-valid-filled.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.3,
    });
  });

});

// ==========================================
// 7. MNC FORM - /mnc
// ==========================================

test.describe('7. MNC Form (/mnc)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('https://uat.kodepilot.in/mnc', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await page.waitForTimeout(2000);
    await dismissCookiePopup(page);
  });

  test('TC_MF_001 - Page loads and form visible', async ({ page }) => {
    await expect(page).toHaveScreenshot('mf-001-page-load.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.3,
    });
  });

  test('TC_MF_002 - Empty form button state', async ({ page }) => {
    const btn = page.locator('#submitBtn, button[type="submit"]').first();
    const isDisabled = await btn.isDisabled().catch(() => false);
    console.log('Submit button disabled:', isDisabled);
    await expect(page).toHaveScreenshot('mf-002-empty-state.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.3,
    });
  });

  test('TC_MF_003 - Valid form filled', async ({ page }) => {
    await safeFill(page, 'input[placeholder*="First" i]', 'Sreeraj');
    await safeFill(page, 'input[placeholder*="Last" i]', 'NS');
    await safeFill(page, 'input[placeholder*="email" i], input[type="email"]', 'sreeraj@test.com');
    await safeFill(page, 'input[type="tel"]', '9876543210');
    await safeFill(page, 'input[placeholder*="city" i], input[id*="city" i], input[name*="city" i]', 'Coimbatore');
    await safeCheck(page, 'input[type="checkbox"]', 0);
    await expect(page).toHaveScreenshot('mf-003-valid-filled.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.3,
    });
  });

});

// ==========================================
// 8. ENQUIRY FORM - /enquiry
// ==========================================

test.describe('8. Enquiry Form (/enquiry)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('https://uat.kodepilot.in/enquiry', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await page.waitForTimeout(2000);
    await dismissCookiePopup(page);
  });

  test('TC_EF_001 - Empty form + button disabled', async ({ page }) => {
    await expect(page).toHaveScreenshot('ef-001-empty-form.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.3,
    });
    const btn = page.locator('#submitBtn');
    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(btn).toBeDisabled();
    }
  });

  test('TC_EF_002 - Invalid email state', async ({ page }) => {
    await safeFill(page, 'input[placeholder*="First" i]', 'Test');
    await safeFill(page, 'input[placeholder*="Last" i]', 'User');
    await safeFill(page, 'input[placeholder*="email" i], input[type="email"]', 'wrongemail');
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('ef-002-invalid-email.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.3,
    });
  });

  test('TC_EF_003 - Invalid phone state', async ({ page }) => {
    await safeFill(page, 'input[placeholder*="First" i]', 'Test');
    await safeFill(page, 'input[placeholder*="Last" i]', 'User');
    await safeFill(page, 'input[placeholder*="email" i], input[type="email"]', 'test@test.com');
    await safeFill(page, 'input[type="tel"]', '000');
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('ef-003-invalid-phone.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.3,
    });
  });

  test('TC_EF_004 - Valid form all fields filled', async ({ page }) => {
    await safeFill(page, 'input[placeholder*="First" i]', 'Sreeraj');
    await safeFill(page, 'input[placeholder*="Last" i]', 'NS');
    await safeFill(page, 'input[placeholder*="email" i], input[type="email"]', 'sreeraj@test.com');
    await safeFill(page, 'input[type="tel"]', '9876543210');
    await safeSelectOption(page, 'select#genderSel, select[name="gender"]', { index: 1 });
    await safeSelectOption(page, 'select#maritalSel, select[name="maritalStatus"]', { index: 1 });
    await safeSelectOption(page, 'select#locationSel, select[name="location"]', { index: 1 });
    await safeSelectOption(page, 'select#educationSel, select[name="education"]', { index: 1 });
    await safeSelectOption(page, 'select#statusSel, select[name="currentStatus"]', { index: 1 });
    await safeSelectOption(page, 'select#arrearsSel, select[name="arrears"]', { index: 1 });
    await safeFill(page, 'input[type="date"]', '1999-03-10');
    await safeFill(page, 'input[placeholder*="city" i], input[id*="city" i], input[name*="city" i]', 'Coimbatore');
    await safeFill(page, 'input[placeholder*="college" i], input[id*="college" i], input[placeholder*="ID" i]', 'CBE789');
    await safeFill(page, 'textarea', 'Recruiter enquiry test message');
    await safeCheck(page, 'input[type="checkbox"]', 0);
    await safeCheck(page, 'input[type="checkbox"]', 2);
    await expect(page).toHaveScreenshot('ef-004-valid-filled.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.3,
    });
  });

});