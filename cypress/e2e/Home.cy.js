// ===========================================
// HOME PAGE - E2E TESTS
// ===========================================

describe('Home Page Tests', () => {

  beforeEach(() => {
    cy.gotoPage('/');
  });

  it('should load home page successfully', () => {
    cy.url().should('include', '/');
    cy.get('body').should('be.visible');
  });

  it('should display header navigation', () => {
    cy.get('header').should('be.visible');
    cy.get('nav').should('exist');
  });

  it('should display hero section', () => {
    cy.get('h1').should('be.visible');
  });

  it('should display footer', () => {
    cy.get('footer').should('be.visible');
  });

  it('should have no broken links on homepage', () => {
    cy.get('a').each((link) => {
      if (link.prop('href')) {
        cy.request({ url: link.prop('href'), failOnStatusCode: false })
          .its('status')
          .should('be.lessThan', 400);
      }
    });
  });

});