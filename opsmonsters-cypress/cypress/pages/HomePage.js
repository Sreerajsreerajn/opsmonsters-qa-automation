const BasePage = require('./BasePage');
class HomePage extends BasePage {
  get logo()            { return cy.get('img[alt*="OpsMonsters Logo"], img[src*="opsmonsters-logo"]').first(); }
  get navAbout()        { return cy.contains('a', 'About'); }
  get navServices()     { return cy.contains('a', 'Services'); }
  get navCareers()      { return cy.contains('a', 'Careers'); }
  get navBlogs()        { return cy.contains('a', 'Blogs'); }
  get navContact()      { return cy.contains('a', 'Contact'); }
  get ctaLetsChatBtn()  { return cy.contains("Let's Chat"); }
  get ctaSeeWorkBtn()   { return cy.contains('See Work'); }
  get servicesSection() { return cy.contains('What we do'); }
  get footer()          { return cy.get('footer, [class*="footer"]').first(); }
  get footerEmail()     { return cy.contains('consult@opsmonsters.com'); }
  get footerPhone()     { return cy.contains('99949 53873'); }
  get footerAddress()   { return cy.contains('Coimbatore'); }

  visitHome() { this.visit('/'); }

  assertNavLinks() {
    this.navAbout.should('be.visible').and('have.attr', 'href').and('include', '/about');
    this.navServices.should('be.visible').and('have.attr', 'href').and('include', '/services');
    this.navCareers.should('be.visible').and('have.attr', 'href').and('include', '/careers');
    this.navBlogs.should('be.visible').and('have.attr', 'href').and('include', '/blogs');
    this.navContact.should('be.visible').and('have.attr', 'href').and('include', '/contact');
  }

  assertFooterInfo() {
    this.footer.scrollIntoView();
    this.footerEmail.should('exist');
    this.footerPhone.should('exist');
    this.footerAddress.should('exist');
  }

  assertServiceSections() {
    ['Generative AI','Quality Assurance','Design & Innovation','AI Systems','Development','SEO']
      .forEach(s => cy.contains(s).should('exist'));
  }
}
module.exports = HomePage;
