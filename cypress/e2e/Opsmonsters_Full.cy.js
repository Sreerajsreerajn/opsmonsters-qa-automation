// ===========================================
// OPSMONSTERS FULL - E2E TESTS
// ===========================================

describe('OpsMonsters Full Flow Tests', () => {

  beforeEach(() => {
    cy.gotoPage('/');
  });

  // ─── COMPLETE USER JOURNEY ────────────────
  it('should complete full user journey', () => {
    // Step 1: Page loads
    cy.get('body').should('be.visible');

    // Step 2: User sees main content
    cy.get('h1, h2').first().should('be.visible');

    // Step 3: User interacts with form
    cy.get('input[type="text"], textarea').first()
      .type('Full test query');

    // Step 4: User submits
    cy.get('button[type="submit"], .submit-btn').click();

    // Step 5: Response appears
    cy.get('.response, .result, .output', { timeout: 15000 })
      .should('be.visible');
  });

  // ─── NAVIGATION FLOW ─────────────────────
  it('should navigate through all pages', () => {
    cy.get('nav a').each((link) => {
      const href = link.prop('href');
      if (href && !href.includes('mailto') && !href.includes('tel')) {
        cy.visit(href, { timeout: 60000 });
        cy.wait(1000);
        cy.dismissCookiePopup();
        cy.get('body').should('be.visible');
        cy.go('back');
        cy.wait(1000);
      }
    });
  });

  // ─── ERROR HANDLING ───────────────────────
  it('should handle empty form submission', () => {
    cy.get('button[type="submit"], .submit-btn').click();
    cy.get('.error, .error-message, [role="alert"]')
      .should('be.visible');
  });

  it('should handle very long input', () => {
    const longText = 'A'.repeat(500);
    cy.get('input[type="text"], textarea').first()
      .type(longText);
    cy.get('button[type="submit"], .submit-btn').click();
    cy.get('body').should('be.visible');
  });

  // ─── PERFORMANCE ─────────────────────────
  it('should load page within acceptable time', () => {
    cy.window().then((win) => {
      const loadTime = win.performance.timing.loadEventEnd
        - win.performance.timing.navigationStart;
      expect(loadTime).to.be.lessThan(10000); // 10 seconds
    });
  });

  // ─── ACCESSIBILITY ────────────────────────
  it('should have proper heading hierarchy', () => {
    cy.get('h1').should('have.length.at.least', 1);
  });

  it('should have alt text on images', () => {
    cy.get('img').each((img) => {
      cy.wrap(img).should('have.attr', 'alt');
    });
  });

});