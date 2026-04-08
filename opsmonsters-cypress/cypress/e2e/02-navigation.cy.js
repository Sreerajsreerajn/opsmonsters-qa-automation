const HomePage = require('../../pages/HomePage');
const home = new HomePage();

describe('Navigation - Links and Menu', () => {
  beforeEach(() => {
    home.visitHome();
    cy.dismissCookieBanner();
  });

  context('Desktop Navigation', () => {
    it('should navigate to About page', () => {
      home.navAbout.first().click({ force: true });
      cy.url().should('include', '/about');
      cy.get('body').should('not.contain', '404');
    });
    it('should navigate to Services page', () => {
      home.navServices.first().click({ force: true });
      cy.url().should('include', '/services');
      cy.get('body').should('not.contain', '404');
    });
    it('should navigate to Careers page', () => {
      home.navCareers.first().click({ force: true });
      cy.url().should('include', '/careers');
      cy.get('body').should('not.contain', '404');
    });
    it('should navigate to Blogs page', () => {
      home.navBlogs.first().click({ force: true });
      cy.url().should('include', '/blogs');
      cy.get('body').should('not.contain', '404');
    });
    it('should navigate to Contact page', () => {
      home.navContact.first().click({ force: true });
      cy.url().should('include', '/contact');
      cy.get('body').should('not.contain', '404');
    });
  });

  context('Direct Page Load', () => {
    it('should load About page directly', () => {
      cy.visit('/about');
      cy.document().should('have.property', 'readyState', 'complete');
      cy.get('body').should('not.contain', '404');
    });
    it('should load Services page directly', () => {
      cy.visit('/services');
      cy.get('body').should('not.contain', '404');
    });
    it('should load Careers page directly', () => {
      cy.visit('/careers');
      cy.get('body').should('not.contain', '404');
    });
    it('should load Blogs page directly', () => {
      cy.visit('/blogs');
      cy.get('body').should('not.contain', '404');
    });
    it('should load Contact page directly', () => {
      cy.visit('/contact');
      cy.get('body').should('not.contain', '404');
    });
  });

  context('Browser Back Navigation', () => {
    it('should go back to homepage after visiting About', () => {
      home.navAbout.first().click({ force: true });
      cy.url().should('include', '/about');
      cy.go('back');
      cy.url().should('eq', 'https://www.opsmonsters.com/');
    });
  });

  context('404 Handling', () => {
    it('should handle invalid routes gracefully', () => {
      cy.visit('/this-page-does-not-exist-xyz', { failOnStatusCode: false });
      cy.get('body').should('exist');
    });
  });

  context('Link Integrity', () => {
    it('should have no empty href on anchor tags', () => {
      cy.get('a[href]').each(($) => {
        expect($.attr('href').trim()).to.not.equal('');
      });
    });
    it('should have mailto link for contact email', () => {
      cy.get('a[href*="mailto:consult@opsmonsters.com"]').should('exist');
    });
  });
});
