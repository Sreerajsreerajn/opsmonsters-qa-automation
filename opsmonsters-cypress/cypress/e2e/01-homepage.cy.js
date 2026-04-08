const home = {
  visitHome() { cy.visit('/'); },
  logo()       { return cy.get('img[src*="opsmonsters-logo"], img[alt*="OpsMonsters"]').first(); },
  navAbout()   { return cy.contains('a', 'About'); },
  navServices(){ return cy.contains('a', 'Services'); },
  navCareers() { return cy.contains('a', 'Careers'); },
  navBlogs()   { return cy.contains('a', 'Blogs'); },
  navContact() { return cy.contains('a', 'Contact'); },
  ctaLetsChat(){ return cy.contains("Let's Chat"); },
  ctaSeeWork() { return cy.contains('See Work'); },
  services()   { return cy.contains('What we do'); },
  footer()     { return cy.get('footer').first(); },
};

describe('Homepage - Loading and UI Elements', () => {
  beforeEach(() => {
    cy.visit('https://www.opsmonsters.com');
  });

  context('Page Load', () => {
    it('should load with HTTP 200', () => {
      cy.request('https://www.opsmonsters.com/').its('status').should('equal', 200);
    });
    it('should have correct title', () => {
      cy.title().should('contain', 'OpsMonsters');
    });
    it('should fully load', () => {
      cy.document().should('have.property', 'readyState', 'complete');
    });
  });

  context('Logo and Branding', () => {
    it('should display logo', () => {
      cy.get('img').first().should('exist');
    });
    it('should display tagline', () => {
      cy.contains('Operations').should('exist');
    });
  });

  context('Hero Section', () => {
    it('should display hero heading', () => {
      cy.contains('Ideas that run the real world').should('exist');
    });
    it('should display Lets Chat button', () => {
      cy.contains("Let's Chat").should('exist');
    });
    it('should display See Work button', () => {
      cy.contains('See Work').should('exist');
    });
  });

  context('Navigation', () => {
    it('should display About link', () => {
      cy.contains('a', 'About').should('be.visible');
    });
    it('should display Services link', () => {
      cy.contains('a', 'Services').should('be.visible');
    });
    it('should display Contact link', () => {
      cy.contains('a', 'Contact').should('be.visible');
    });
  });

  context('Services Section', () => {
    it('should display What we do', () => {
      cy.scrollTo('center');
      cy.contains('What we do').should('exist');
    });
    it('should display Generative AI', () => {
      cy.contains('Generative AI').should('exist');
    });
    it('should display Quality Assurance', () => {
      cy.contains('Quality Assurance').should('exist');
    });
  });

  context('Footer', () => {
    it('should display email', () => {
      cy.scrollTo('bottom');
      cy.contains('consult@opsmonsters.com').should('exist');
    });
    it('should display Coimbatore', () => {
      cy.scrollTo('bottom');
      cy.contains('Coimbatore').should('exist');
    });
  });
});
