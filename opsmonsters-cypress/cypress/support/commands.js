Cypress.Commands.add('dismissCookieBanner', () => {
  cy.log('Cookie banner check');
});

Cypress.Commands.add('setViewport', (name) => {
  const v = { mobile:[375,812], tablet:[768,1024], desktop:[1280,720], wide:[1920,1080] };
  const [w,h] = v[name] || v.desktop;
  cy.viewport(w, h);
});

Cypress.Commands.add('screenshotWithLabel', (label) => {
  cy.screenshot('opsmonsters-' + label + '-' + Date.now());
});
