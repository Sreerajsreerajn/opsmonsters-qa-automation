const BasePage = require('./BasePage');
class NavigationPage extends BasePage {
  visitPage(path) { this.visit(path); }
  assertNoPageErrors() {
    cy.get('body').should('not.contain', '404');
    cy.get('body').should('not.contain', 'Server Error');
  }
}
module.exports = NavigationPage;
