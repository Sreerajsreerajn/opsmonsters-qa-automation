const { test, expect } = require('@playwright/test');

test.describe('Chatbot Test Cases', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('https://uat.kodepilot.in', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await page.waitForTimeout(3000);
    await page.evaluate(() => {
      document.querySelectorAll(
        '#cookie-consent-overlay, #cookie-consent-modal, [class*="cookie"], [id*="cookie"]'
      ).forEach(el => (el.style.display = 'none'));
    });
  });

  test('TC_CHAT_001 - Verify WhatsApp button exists in header', async ({ page }) => {
    const whatsappHeader = page.locator('img[alt="WhatsApp"]').first();
    const count = await whatsappHeader.count();
    console.log('WhatsApp img count:', count);
    expect(count).toBeGreaterThan(0);
  });

  test('TC_CHAT_002 - Verify Chat on WhatsApp link exists in DOM', async ({ page }) => {
    const whatsappLink = page.locator('a:has-text("Chat on WhatsApp")').first();
    const count = await whatsappLink.count();
    console.log('Chat on WhatsApp links found:', count);
    expect(count).toBeGreaterThan(0);
    const href = await whatsappLink.getAttribute('href');
    console.log('href:', href);
  });

  test('TC_CHAT_003 - Verify Chat with Us on WhatsApp button exists', async ({ page }) => {
    const whatsappBtn = page.locator('a:has-text("Chat with Us on WhatsApp")');
    const count = await whatsappBtn.count();
    console.log('Chat with Us buttons found:', count);
    expect(count).toBeGreaterThan(0);
  });

  test('TC_CHAT_004 - Verify footer WhatsApp link href valid', async ({ page }) => {
    const footerWhatsapp = page.locator('footer a[href*="whatsapp"]').first();
    const count = await footerWhatsapp.count();
    console.log('Footer WhatsApp links found:', count);
    expect(count).toBeGreaterThan(0);
    const href = await footerWhatsapp.getAttribute('href');
    console.log('Footer WhatsApp href:', href);
    expect(href).toContain('whatsapp');
  });

  test('TC_CHAT_005 - Verify Still have questions text exists', async ({ page }) => {
    const stillHave = page.locator('text=Still have questions').first();
    const count = await stillHave.count();
    console.log('Still have questions found:', count);
    expect(count).toBeGreaterThan(0);
  });

});