const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('KodePilot Critical UAT Flows', () => {

  test('Contact form should show ERP config missing bug', async ({ page }) => {
    page.on('dialog', async dialog => {
      console.log('Dialog:', dialog.message());
      expect(dialog.message()).toContain('ERP');
      await dialog.accept();
    });

    await page.goto('https://uat.kodepilot.in/contact-us');

    // Cookie popup
    const acceptBtn = page.getByRole('button', { name: 'Accept All' });
    if (await acceptBtn.isVisible().catch(() => false)) {
      await acceptBtn.click();
    }

    await page.getByRole('textbox', { name: 'First Name *' }).fill('QA');
    await page.getByRole('textbox', { name: 'Last Name *' }).fill('TEST');
    await page.getByRole('textbox', { name: 'Email *' }).fill('qatest232323@gmail.com');
    await page.getByRole('textbox', { name: 'Phone *' }).fill('8754107788');
    await page.getByRole('textbox', { name: 'Current City *' }).fill('Coimbatore');

    await page.getByLabel('Current Status').selectOption('Student');

    const consent = page.locator('#consentWrapper');
    if (await consent.isVisible()) {
      await consent.click();
    }

    await page.getByRole('button', { name: 'Submit Your Details →' }).click();
  });

  test('Resume upload should show submission failed bug', async ({ page }) => {
    page.on('dialog', async dialog => {
      console.log('Dialog:', dialog.message());
      expect(dialog.message()).toContain('Submission failed');
      await dialog.accept();
    });

    await page.goto('https://uat.kodepilot.in/resume');

    const acceptBtn = page.getByRole('button', { name: 'Accept All' });
    if (await acceptBtn.isVisible().catch(() => false)) {
      await acceptBtn.click();
    }

    await page.getByRole('textbox', { name: 'Full Name *' }).fill('QA');
    await page.getByRole('textbox', { name: 'Mobile Number *' }).fill('8754107788');
    await page.getByRole('textbox', { name: 'Email *' }).fill('qatest112233@gmail.com');

    const filePath = path.join(__dirname, '../SREERAJ RESUME.pdf');
    await page.locator('input[type="file"]').setInputFiles(filePath);

    await page.getByRole('button', { name: 'Submit Resume' }).click();
  });

});