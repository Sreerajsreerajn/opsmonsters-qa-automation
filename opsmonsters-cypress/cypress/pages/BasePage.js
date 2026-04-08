class BasePage {
  visit(path = '/') {
    cy.visit(path);
    cy.document().should('have.property', 'readyState', 'complete');
  }
  getElement(selector) { return cy.get(selector, { timeout: 15000 }); }
  urlShouldContain(segment) { cy.url().should('include', segment); }
  clickElement(selector) { cy.get(selector).should('be.visible').click(); }
  assertTitle(expectedTitle) { cy.title().should('contain', expectedTitle); }
}
module.exports = BasePage;
