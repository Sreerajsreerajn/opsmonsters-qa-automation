// ============================================================
//  OpsMonsters Test Suite — Configuration File
//  Edit this file to configure your test targets & settings
// ============================================================

module.exports = {

  // ─────────────────────────────────────────────
  // SITES TO TEST
  // Add as many sites as needed
  // ─────────────────────────────────────────────
  sites: [
    {
      name: "OpsMonsters UAT",
      baseUrl: "https://uat.opsmonsters.com/",
      active: true,

      // Optional: Login credentials (leave null if no auth needed)
      auth: null,
      // auth: {
      //   loginUrl: "https://uat.opsmonsters.com/login",
      //   usernameSelector: 'input[name="email"]',
      //   passwordSelector: 'input[name="password"]',
      //   submitSelector: 'button[type="submit"]',
      //   username: "your@email.com",
      //   password: "yourpassword",
      //   successIndicator: ".dashboard",   // selector that appears after login
      // },

      // Optional: Pages to always include (even if not crawled)
      extraPages: [
        '/about',
        '/services',
        '/careers',
        '/blogs',
        '/contact',
        '/services/aurelis-beach',
        '/services/blackwell-motors',
        '/services/lindholm-aspen877',
        '/services/monolith-architecture',
        '/services/numeriq-fashion',
        '/terms-and-conditions',
        '/privacy-policy',
        '/cookies-policy',
        '/blogs/rethinking-product-design-with-intelligence',
        '/blogs/architecture-in-the-digital-way',
        '/blogs/how-automative-brands-win-online',
      ],

      // Optional: Pages to skip
      skipPages: [],
    },

    // Add more sites below:
    // {
    //   name: "Production Site",
    //   baseUrl: "https://opsmonsters.com/",
    //   active: false,
    //   auth: null,
    // },
  ],

  // ─────────────────────────────────────────────
  // CRAWL SETTINGS
  // ─────────────────────────────────────────────
  crawl: {
    maxPages: 60,           // Max pages to crawl per site
    timeout: 30000,         // Navigation timeout (ms)
    waitAfterLoad: 3000,    // Wait after page load (ms)
    ignoreExtensions: [".pdf", ".jpg", ".jpeg", ".png", ".gif", ".svg", ".zip", ".doc", ".docx"],
  },

  // ─────────────────────────────────────────────
  // TEST TOGGLES — Turn tests on/off
  // ─────────────────────────────────────────────
  tests: {
    functional:    true,   // Page load, broken images, links, forms
    performance:   true,   // Load time, DOM size, resource count
    seo:           true,   // Meta tags, H1, Open Graph, alt text
    accessibility: true,   // WCAG checks, labels, contrast, ARIA
    security:      true,   // Security headers, HTTPS, mixed content
    responsive:    true,   // Mobile (375px), Tablet (768px), Desktop (1280px)
    console:       true,   // JS console errors
    network:       true,   // 404 resources, slow requests
    forms:         true,   // Form field validation
    links:         true,   // Broken internal/external links
  },

  // ─────────────────────────────────────────────
  // PERFORMANCE THRESHOLDS
  // ─────────────────────────────────────────────
  thresholds: {
    loadTime: {
      pass: 3,    // seconds — PASS if under this
      warn: 6,    // seconds — WARN if between pass and this, FAIL if above
    },
    domNodes: {
      pass: 800,
      warn: 1500,
    },
    resourceCount: {
      pass: 50,
      warn: 100,
    },
    imageCount: {
      warn: 30,    // Warn if more than this many images on one page
    },
  },

  // ─────────────────────────────────────────────
  // VIEWPORTS FOR RESPONSIVE TESTING
  // ─────────────────────────────────────────────
  viewports: {
    mobile:  { width: 375,  height: 812,  label: "Mobile (iPhone 14)" },
    tablet:  { width: 768,  height: 1024, label: "Tablet (iPad)" },
    desktop: { width: 1280, height: 800,  label: "Desktop (1280px)" },
  },

  // ─────────────────────────────────────────────
  // REPORT SETTINGS
  // ─────────────────────────────────────────────
  report: {
    outputDir: "./reports",
    screenshotDir: "./screenshots",
    pdf: true,
    html: true,
    filename: "test-report",   // Will create test-report.pdf and test-report.html
    company: "OpsMonsters",
    preparedBy: "QA Team",
  },

  // ─────────────────────────────────────────────
  // BROWSER SETTINGS
  // ─────────────────────────────────────────────
  browser: {
    headless: true,
    slowMo: 0,
    ignoreHTTPSErrors: true,
  },
};