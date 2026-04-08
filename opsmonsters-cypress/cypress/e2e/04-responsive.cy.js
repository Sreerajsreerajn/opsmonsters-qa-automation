const HomePage = require('../../pages/HomePage');
const home = new HomePage();

describe('Responsive Design - Mobile Tablet Desktop', () => {

  context('Mobile View 375x812', () => {
    beforeEach(() => {
      cy.viewport(375, 812);
      home.visitHome();
      cy.dismissCookieBanner();
    });
    it('should load homepage on mobile', () => {
      cy.title().should('contain', 'OpsMonsters');
    });
    it('should display logo on mobile', () => {
      home.logo.should('exist');
    });
    it('should display footer on mobile', () => {
      cy.scrollTo('bottom');
      cy.contains('Coimbatore').should('exist');
    });
    it('should not have horizontal scroll on mobile', () => {
      cy.window().then((win) => {
        expect(win.document.documentElement.scrollWidth).to.be.lte(win.innerWidth + 20);
      });
    });
    it('should take mobile screenshot', () => {
      cy.screenshotWithLabel('mobile-homepage');
    });
  });

  context('Tablet View 768x1024', () => {
    beforeEach(() => {
      cy.viewport(768, 1024);
      home.visitHome();
      cy.dismissCookieBanner();
    });
    it('should load homepage on tablet', () => {
      cy.document().should('have.property', 'readyState', 'complete');
    });
    it('should display navigation on tablet', () => {
      cy.get('nav, header').should('exist');
    });
    it('should take tablet screenshot', () => {
      cy.screenshotWithLabel('tablet-homepage');
    });
  });

  context('Desktop View 1280x720', () => {
    beforeEach(() => {
      cy.viewport(1280, 720);
      home.visitHome();
      cy.dismissCookieBanner();
    });
    it('should display full nav bar on desktop', () => {
      home.assertNavLinks();
    });
    it('should display all hero CTAs on desktop', () => {
      home.ctaLetsChatBtn.should('exist');
      home.ctaSeeWorkBtn.should('exist');
    });
    it('should take desktop screenshot', () => {
      cy.screenshotWithLabel('desktop-homepage');
    });
  });

  context('Wide Screen 1920x1080', () => {
    beforeEach(() => {
      cy.viewport(1920, 1080);
      home.visitHome();
      cy.dismissCookieBanner();
    });
    it('should render correctly on wide screen', () => {
      cy.contains('OpsMonsters').should('exist');
    });
    it('should take widescreen screenshot', () => {
      cy.screenshotWithLabel('widescreen-homepage');
    });
  });

  context('Contact Page Responsive', () => {
    it('should render contact page on mobile', () => {
      cy.viewport(375, 812);
      cy.visit('/contact');
      cy.contains('Contact', { timeout: 10000 }).should('exist');
    });
    it('should render contact page on tablet', () => {
      cy.viewport(768, 1024);
      cy.visit('/contact');
      cy.contains('Contact', { timeout: 10000 }).should('exist');
    });
    it('should render contact page on desktop', () => {
      cy.viewport(1280, 720);
      cy.visit('/contact');
      cy.contains('Contact', { timeout: 10000 }).should('exist');
    });
  });
});
