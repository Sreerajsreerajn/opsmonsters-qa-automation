describe('Performance and Accessibility', () => {

  context('Page Load Speed', () => {
    it('should load homepage within 10 seconds', () => {
      const start = Date.now();
      cy.visit('/');
      cy.document().should('have.property', 'readyState', 'complete').then(() => {
        const duration = Date.now() - start;
        cy.log('Homepage load time: ' + duration + 'ms');
        expect(duration).to.be.lessThan(10000);
      });
    });
    it('should load contact page within 10 seconds', () => {
      const start = Date.now();
      cy.visit('/contact');
      cy.document().should('have.property', 'readyState', 'complete').then(() => {
        const duration = Date.now() - start;
        cy.log('Contact page load time: ' + duration + 'ms');
        expect(duration).to.be.lessThan(10000);
      });
    });
  });

  context('Image Alt Tags', () => {
    it('should have alt attribute on all images', () => {
      cy.visit('/');
      cy.get('img').each(($img) => {
        expect($img[0].hasAttribute('alt'), 'Missing alt: ' + $img.attr('src')).to.be.true;
      });
    });
  });

  context('Keyboard Navigation', () => {
    it('should allow Tab focus on nav links', () => {
      cy.visit('/');
      cy.get('nav a').first().focus().should('be.focused');
    });
    it('should have focusable interactive elements', () => {
      cy.visit('/');
      cy.get('a, button').first().focus();
      cy.focused().should('exist');
    });
  });

  context('Semantic HTML', () => {
    it('should have navigation landmark', () => {
      cy.visit('/');
      cy.get('nav, [role="navigation"]').should('exist');
    });
    it('should have h1 on homepage', () => {
      cy.visit('/');
      cy.get('h1').should('exist');
    });
    it('should have main content area', () => {
      cy.visit('/');
      cy.get('main, [role="main"], section').should('exist');
    });
  });

  context('Viewport Meta Tag', () => {
    it('should have mobile viewport meta tag', () => {
      cy.visit('/');
      cy.get('head meta[name="viewport"]').should('exist')
        .and('have.attr', 'content')
        .and('include', 'width=device-width');
    });
  });

  context('Security', () => {
    it('should not expose server errors in body', () => {
      cy.visit('/');
      cy.get('body').should('not.contain', 'PHP Warning')
        .and('not.contain', 'MySQL error')
        .and('not.contain', 'stack trace');
    });
  });
});
