// ===========================================
// OPSMONSTERS VISUAL - E2E TESTS
// ===========================================

describe('OpsMonsters Visual Tests', () => {

  beforeEach(() => {
    cy.gotoPage('/');
  });

  // ─── VISUAL ELEMENTS ─────────────────────
  it('should display logo', () => {
    cy.get('img[alt*="logo"], .logo, #logo').should('be.visible');
  });

  it('should display hero section with correct styling', () => {
    cy.get('h1').should('be.visible').and('not.be.empty');
  });

  it('should display images correctly', () => {
    cy.get('img').each((img) => {
      cy.wrap(img)
        .should('be.visible')
        .and(($img) => {
          expect($img[0].naturalWidth).to.be.greaterThan(0);
        });
    });
  });

  it('should have correct font rendering', () => {
    cy.get('body').should('have.css', 'font-family');
  });

  it('should have correct color scheme', () => {
    cy.get('body').should('have.css', 'background-color');
  });

  // ─── LAYOUT ──────────────────────────────
  it('should have proper page layout on desktop', () => {
    cy.viewport(1280, 720);
    cy.get('main, .main-content, #main').should('be.visible');
  });

  it('should have proper page layout on mobile', () => {
    cy.viewport('iphone-x');
    cy.get('main, .main-content, #main').should('be.visible');
  });

  // ─── SCREENSHOTS ─────────────────────────
  it('should take screenshot of full page', () => {
    cy.screenshot('opsmonsters-full-page', { capture: 'fullPage' });
  });

  it('should take screenshot of header', () => {
    cy.get('header').screenshot('opsmonsters-header');
  });

});