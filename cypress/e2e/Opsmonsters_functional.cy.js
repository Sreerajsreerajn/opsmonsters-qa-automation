// ===========================================
// OPSMONSTERS FUNCTIONAL - E2E TESTS
// ===========================================

describe('OpsMonsters Functional Tests', () => {

  beforeEach(() => {
    cy.gotoPage('/opsmonsters');
  });

  // ─── PAGE LOAD ───────────────────────────
  it('should load OpsMonsters page successfully', () => {
    cy.url().should('include', '/opsmonsters');
    cy.get('body').should('be.visible');
  });

  // ─── NAVIGATION ──────────────────────────
  it('should display main navigation', () => {
    cy.get('header').should('be.visible');
    cy.get('nav').should('exist');
  });

  // ─── FORM INTERACTIONS ───────────────────
  it('should display input form', () => {
    cy.get('form, [role="form"], .form-container').should('exist');
  });

  it('should type in input field', () => {
    cy.get('input[type="text"], textarea').first()
      .should('be.visible')
      .type('Test input text')
      .should('have.value', 'Test input text');
  });

  it('should submit form successfully', () => {
    cy.get('input[type="text"], textarea').first().type('Test query');
    cy.get('button[type="submit"], .submit-btn').click();
    cy.get('.response, .result, .output').should('be.visible');
  });

  // ─── BUTTONS ─────────────────────────────
  it('should have clickable buttons', () => {
    cy.get('button').each((btn) => {
      cy.wrap(btn).should('not.be.disabled');
    });
  });

  // ─── RESPONSIVE ──────────────────────────
  it('should be responsive on mobile', () => {
    cy.viewport('iphone-x');
    cy.get('body').should('be.visible');
    cy.get('header').should('be.visible');
  });

  it('should be responsive on tablet', () => {
    cy.viewport('ipad-2');
    cy.get('body').should('be.visible');
  });

});