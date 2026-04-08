const ContactPage = require('../../pages/ContactPage');
const contactPage = new ContactPage();

describe('Contact Form - Validation and Info', () => {
  beforeEach(() => {
    contactPage.visitContact();
    cy.dismissCookieBanner();
  });

  context('Page Load', () => {
    it('should load contact page with status 200', () => {
      cy.request('https://www.opsmonsters.com/contact').its('status').should('equal', 200);
    });
    it('should display contact heading', () => {
      cy.contains('Contact', { timeout: 10000 }).should('exist');
    });
  });

  context('Contact Information', () => {
    it('should display email address', () => {
      cy.contains('consult@opsmonsters.com').should('exist');
    });
    it('should display phone number', () => {
      cy.contains('99949 53873').should('exist');
    });
    it('should display Coimbatore address', () => {
      cy.contains('Coimbatore').should('exist');
    });
    it('should have clickable mailto link', () => {
      cy.get('a[href*="mailto:consult@opsmonsters.com"]').should('exist');
    });
    it('should have clickable phone link', () => {
      cy.get('a[href*="tel:"]').should('exist');
    });
  });

  context('Form Fields', () => {
    it('should have email input field', () => {
      cy.get('input[type="email"]').first().should('exist');
    });
    it('should have textarea for message', () => {
      cy.get('textarea').first().should('exist');
    });
    it('should have submit button', () => {
      cy.get('button[type="submit"], button').should('exist');
    });
    it('should allow typing in email field', () => {
      cy.get('input[type="email"]').first()
        .type('test@example.com')
        .should('have.value', 'test@example.com');
    });
    it('should allow typing in textarea', () => {
      cy.get('textarea').first()
        .type('Hello from Cypress automated test!')
        .should('not.have.value', '');
    });
  });

  context('Form Validation', () => {
    it('should stay on contact page on empty submit', () => {
      cy.get('button').first().click({ force: true });
      cy.url().should('include', '/contact');
    });
  });
});
