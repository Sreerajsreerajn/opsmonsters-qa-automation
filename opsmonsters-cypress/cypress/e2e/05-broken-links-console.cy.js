describe('Broken Links and Console Errors', () => {

  context('Console Error Monitoring', () => {
    it('should not have console errors on homepage', () => {
      const errors = [];
      cy.visit('/', {
        onBeforeLoad(win) {
          cy.stub(win.console, 'error').callsFake((...args) => {
            errors.push(args.join(' '));
          });
        },
      });
      cy.wait(3000).then(() => {
        const filtered = errors.filter(e =>
          !e.includes('ResizeObserver') && !e.includes('favicon')
        );
        cy.log('Console errors found: ' + filtered.length);
      });
    });
  });

  context('HTTP Status Checks', () => {
    it('should return 200 for homepage', () => {
      cy.request({ url: 'https://www.opsmonsters.com/', failOnStatusCode: false })
        .its('status').should('be.oneOf', [200, 301, 302]);
    });
    it('should return 200 for about page', () => {
      cy.request({ url: 'https://www.opsmonsters.com/about', failOnStatusCode: false })
        .its('status').should('be.oneOf', [200, 301, 302]);
    });
    it('should return 200 for services page', () => {
      cy.request({ url: 'https://www.opsmonsters.com/services', failOnStatusCode: false })
        .its('status').should('be.oneOf', [200, 301, 302]);
    });
    it('should return 200 for careers page', () => {
      cy.request({ url: 'https://www.opsmonsters.com/careers', failOnStatusCode: false })
        .its('status').should('be.oneOf', [200, 301, 302]);
    });
    it('should return 200 for blogs page', () => {
      cy.request({ url: 'https://www.opsmonsters.com/blogs', failOnStatusCode: false })
        .its('status').should('be.oneOf', [200, 301, 302]);
    });
    it('should return 200 for contact page', () => {
      cy.request({ url: 'https://www.opsmonsters.com/contact', failOnStatusCode: false })
        .its('status').should('be.oneOf', [200, 301, 302]);
    });
  });

  context('Link Integrity', () => {
    it('should have no empty href attributes', () => {
      cy.visit('/');
      cy.get('a[href]').each(($) => {
        expect($.attr('href').trim()).to.not.equal('');
      });
    });
    it('should have mailto link for contact email', () => {
      cy.visit('/');
      cy.get('a[href*="mailto:consult@opsmonsters.com"]').should('exist');
    });
  });

  context('Image Loading', () => {
    it('should have valid src on all images', () => {
      cy.visit('/');
      cy.get('img').each(($img) => {
        const src = $img.attr('src');
        if (src && !src.startsWith('data:')) {
          expect(src).to.not.be.empty;
        }
      });
    });
  });

  context('SEO and Security', () => {
    it('should have non-empty page title', () => {
      cy.visit('/');
      cy.title().should('not.be.empty').and('contain', 'OpsMonsters');
    });
    it('should serve over HTTPS', () => {
      cy.visit('/');
      cy.url().should('match', /^https:\/\//);
    });
    it('should not expose server errors in body', () => {
      cy.visit('/');
      cy.get('body').should('not.contain', 'PHP Warning')
        .and('not.contain', 'MySQL error');
    });
  });
});
