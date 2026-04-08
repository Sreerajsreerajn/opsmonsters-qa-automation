// ===========================================
// CYPRESS CUSTOM COMMANDS
// ===========================================

Cypress.Commands.add('dismissCookiePopup', () => {
  cy.window().then((win) => {
    win.document.querySelectorAll(
      '#cookie-consent-overlay, #cookie-consent-modal, [class*="cookie"], [id*="cookie"], [class*="consent"], [id*="consent"]'
    ).forEach((el) => {
      el.style.display = 'none';
      el.style.visibility = 'hidden';
      el.style.pointerEvents = 'none';
      el.style.zIndex = '-9999';
    });
  });
  cy.wait(300);
});

Cypress.Commands.add('gotoPage', (url) => {
  cy.visit(url, { timeout: 60000 });
  cy.wait(2000);
  cy.dismissCookiePopup();
});