// ===========================================
// OPSMONSTERS - E2E TESTS
// ===========================================

describe('OpsMonsters Website Tests', () => {

  beforeEach(() => {
    cy.gotoPage('/');
  });

  // ─── HOME PAGE ────────────────────────────
  it('should load OpsMonsters homepage', () => {
    cy.url().should('exist');
    cy.get('body').should('be.visible');
    cy.title().should('not.be.empty');
  });

  it('should display OpsMonsters branding', () => {
    cy.get('img[alt*="OpsMonsters"], .logo, header img')
      .should('exist');
  });

  // ─── NAVIGATION ──────────────────────────
  it('should have working navigation menu', () => {
    cy.get('nav').should('be.visible');
    cy.get('nav a').should('have.length.at.least', 1);
  });

  it('should open mobile menu', () => {
    cy.viewport('iphone-x');
    cy.get('.hamburger, .menu-toggle, [aria-label="menu"]')
      .click();
    cy.get('nav, .mobile-menu').should('be.visible');
  });

  // ─── CONTACT / FORMS ─────────────────────
  it('should display contact form', () => {
    cy.get('a[href*="contact"], nav a').contains(/contact/i).click();
    cy.wait(1000);
    cy.get('form').should('exist');
  });

  it('should validate required fields in contact form', () => {
    cy.get('a[href*="contact"], nav a').contains(/contact/i).click();
    cy.wait(1000);
    cy.get('button[type="submit"]').click();
    cy.get('input:invalid, .error').should('exist');
  });

  // ─── FOOTER ──────────────────────────────
  it('should display footer with links', () => {
    cy.get('footer').should('be.visible');
    cy.get('footer a').should('have.length.at.least', 1);
  });

  it('should have social media links in footer', () => {
    cy.get('footer a[href*="linkedin"], footer a[href*="twitter"], footer a[href*="instagram"]')
      .should('exist');
  });

  // ─── SEO BASICS ──────────────────────────
  it('should have meta description', () => {
    cy.get('head meta[name="description"]')
      .should('have.attr', 'content')
      .and('not.be.empty');
  });

  it('should have proper page title', () => {
    cy.title().should('include', 'OpsMonsters');
  });

});