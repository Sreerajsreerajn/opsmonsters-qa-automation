const BasePage = require('./BasePage');
class ContactPage extends BasePage {
  get emailField()   { return cy.get('input[type="email"]').first(); }
  get messageField() { return cy.get('textarea').first(); }
  get submitButton() { return cy.get('button[type="submit"], button').first(); }
  get contactEmail() { return cy.contains('consult@opsmonsters.com'); }
  get contactPhone() { return cy.contains('99949 53873'); }

  visitContact() { this.visit('/contact'); }

  assertContactInfoVisible() {
    this.contactEmail.should('exist');
    this.contactPhone.should('exist');
  }
}
module.exports = ContactPage;
