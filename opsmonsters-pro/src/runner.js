// ============================================================
//  OpsMonsters Test Suite — Core Test Engine v2.0
// ============================================================

const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const config = require("../config/config");

const SCREENSHOT_DIR = path.resolve(config.report.screenshotDir);
const REPORT_DIR = path.resolve(config.report.outputDir);

[SCREENSHOT_DIR, REPORT_DIR].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

let screenshotIndex = 1;
let bugIndex = 1;

const allSiteResults = [];

// ─────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────
function log(status, category, testName, desc) {
  const icons = { PASS: "✅", FAIL: "❌", WARN: "⚠️ " };
  console.log("    " + (icons[status] || "  ") + " [" + category + "] " + testName + ": " + desc);
}

async function takeScreenshot(page, label) {
  const filename = String(screenshotIndex++).padStart(4, "0") + "_" + label.replace(/[^a-z0-9]/gi, "_").slice(0, 40) + ".png";
  const filepath = path.join(SCREENSHOT_DIR, filename);
  try { await page.screenshot({ path: filepath, fullPage: true }); }
  catch (e) { try { await page.screenshot({ path: filepath, fullPage: false }); } catch (e2) {} }
  return filepath;
}

function makeBug(severity, title, pageName, url, desc, steps, expected, actual, screenshot = null) {
  return {
    id: "BUG-" + String(bugIndex++).padStart(3, "0"),
    severity, title, page: pageName, url, desc, steps, expected, actual, screenshot,
    timestamp: new Date().toISOString(),
  };
}

function getPriority(severity) {
  const map = {
    Critical: { label: "P1 - Critical", color: "#7f1d1d", bg: "#fef2f2" },
    High:     { label: "P2 - High",     color: "#dc2626", bg: "#fee2e2" },
    Medium:   { label: "P3 - Medium",   color: "#d97706", bg: "#fef9c3" },
    Low:      { label: "P4 - Low",      color: "#2563eb", bg: "#eff6ff" },
  };
  return map[severity] || map.Low;
}

// ─────────────────────────────────────────────
// AUTH: Login and save session
// ─────────────────────────────────────────────
async function performLogin(browser, authConfig) {
  console.log("  🔐 Logging in to " + authConfig.loginUrl + "...");
  const ctx = await browser.newContext({ ignoreHTTPSErrors: config.browser.ignoreHTTPSErrors });
  const page = await ctx.newPage();
  try {
    await page.goto(authConfig.loginUrl, { waitUntil: "domcontentloaded", timeout: config.crawl.timeout });
    await page.waitForTimeout(1500);
    await page.fill(authConfig.usernameSelector, authConfig.username);
    await page.fill(authConfig.passwordSelector, authConfig.password);
    await page.click(authConfig.submitSelector);
    await page.waitForTimeout(3000);
    if (authConfig.successIndicator) {
      await page.waitForSelector(authConfig.successIndicator, { timeout: 10000 });
    }
    const storageState = await ctx.storageState();
    await page.close(); await ctx.close();
    console.log("  ✅ Login successful");
    return storageState;
  } catch (e) {
    await page.close(); await ctx.close();
    console.log("  ❌ Login failed: " + e.message.slice(0, 80));
    return null;
  }
}

// ─────────────────────────────────────────────
// CRAWLER
// ─────────────────────────────────────────────
async function crawlSite(browser, siteConfig, storageState) {
  console.log("\n  🔍 Crawling " + siteConfig.baseUrl + "...");
  const visited = new Set();
  const toVisit = [siteConfig.baseUrl, ...(siteConfig.extraPages || []).map(p => siteConfig.baseUrl + p.replace(/^\//, ""))];
  const discovered = [];

  const ctxOpts = { ignoreHTTPSErrors: config.browser.ignoreHTTPSErrors, viewport: { width: 1280, height: 800 } };
  if (storageState) ctxOpts.storageState = storageState;

  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();

  while (toVisit.length > 0 && discovered.length < config.crawl.maxPages) {
    const url = toVisit.shift();
    const cleanUrl = url.split("?")[0].replace(/\/$/, "") + "/";
    if (visited.has(cleanUrl)) continue;
    visited.add(cleanUrl);

    // Skip pages
    const pagePath = url.replace(siteConfig.baseUrl, "/");
    if ((siteConfig.skipPages || []).some(skip => pagePath.includes(skip))) {
      console.log("    ⏭️  Skipped: " + pagePath);
      continue;
    }

    try {
      const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: config.crawl.timeout });
      await page.waitForTimeout(config.crawl.waitAfterLoad / 2);
      const status = resp ? resp.status() : 0;

      let links = [];
      try {
        links = await page.evaluate((base, ignoreExt) => {
          return Array.from(document.querySelectorAll("a[href]"))
            .map(a => a.href)
            .filter(href => {
              if (!href.startsWith(base)) return false;
              if (href.includes("#")) return false;
              return !ignoreExt.some(ext => href.toLowerCase().endsWith(ext));
            })
            .filter((v, i, a) => a.indexOf(v) === i);
        }, siteConfig.baseUrl, config.crawl.ignoreExtensions);
      } catch(evalErr) { links = []; }

      for (const link of links) {
        const cl = link.split("?")[0].replace(/\/$/, "") + "/";
        if (!visited.has(cl) && !toVisit.includes(cl)) toVisit.push(cl);
      }

      const pageName = url.replace(siteConfig.baseUrl, "/").replace(/\/$/, "") || "/";
      discovered.push({ url, name: pageName, status });
      console.log("    📄 " + pageName + " [" + status + "]");
    } catch (e) {
      const pageName = url.replace(siteConfig.baseUrl, "/").replace(/\/$/, "") || "/";
      discovered.push({ url, name: pageName, status: 0, crawlError: e.message.slice(0, 100) });
      console.log("    ⚠️  " + pageName + " [error]");
    }
  }

  await page.close(); await ctx.close();
  console.log("  ✅ Crawled " + discovered.length + " pages\n");
  return discovered;
}

// ─────────────────────────────────────────────
// PAGE TESTER
// ─────────────────────────────────────────────
async function testPage(browser, pageInfo, siteConfig, storageState) {
  const { url, name } = pageInfo;
  const pageData = {
    name, url,
    tests: [],
    bugs: [],
    screenshots: [],
    categories: {},
    summary: { pass: 0, fail: 0, warn: 0 },
  };

  console.log("\n  " + "─".repeat(48));
  console.log("  🌐 " + name);
  console.log("  " + "─".repeat(48));

  const addTest = (category, testName, status, desc) => {
    pageData.tests.push({ category, testName, status, desc });
    if (!pageData.categories[category]) pageData.categories[category] = { pass: 0, fail: 0, warn: 0 };
    pageData.categories[category][status.toLowerCase()]++;
    pageData.summary[status.toLowerCase()]++;
    log(status, category, testName, desc);
  };

  const ctxOpts = {
    ignoreHTTPSErrors: config.browser.ignoreHTTPSErrors,
    viewport: { width: config.viewports.desktop.width, height: config.viewports.desktop.height },
  };
  if (storageState) ctxOpts.storageState = storageState;

  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();

  const consoleErrors = [];
  const networkLog = [];
  page.on("console", msg => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
  page.on("response", resp => {
    networkLog.push({ url: resp.url(), status: resp.status() });
  });

  const slug = name.replace(/[^a-z0-9]/gi, "_").slice(0, 20) || "home";

  try {
    const t0 = Date.now();
    const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: config.crawl.timeout });
    await page.waitForTimeout(config.crawl.waitAfterLoad);
    const loadTime = ((Date.now() - t0) / 1000).toFixed(2);
    const httpStatus = resp ? resp.status() : 0;
    const respHeaders = resp ? resp.headers() : {};

    const scDesktop = await takeScreenshot(page, slug + "_desktop");
    pageData.screenshots.push({ path: scDesktop, label: config.viewports.desktop.label, type: "desktop" });

    // ══════════════════════════════════
    // FUNCTIONAL TESTS
    // ══════════════════════════════════
    if (config.tests.functional) {
      console.log("  📋 Functional");

      // Page Load
      if (httpStatus > 0 && httpStatus < 400) {
        addTest("Functional", "Page Load", "PASS", "HTTP " + httpStatus);
      } else {
        addTest("Functional", "Page Load", "FAIL", "HTTP " + httpStatus);
        pageData.bugs.push(makeBug("Critical", "Page Load Failed (HTTP " + httpStatus + ")", name, url,
          "Page returned HTTP " + httpStatus + ". Users cannot access this page.",
          "1. Open browser\n2. Navigate to: " + url,
          "HTTP 200 — Page loads successfully",
          "HTTP " + httpStatus, scDesktop));
      }

      // Page Title
      const title = await page.title();
      if (title && title.length >= 10) {
        addTest("Functional", "Page Title", "PASS", '"' + title.slice(0, 60) + '"');
      } else if (title && title.length > 0) {
        addTest("Functional", "Page Title", "WARN", "Title too short: \"" + title + "\"");
      } else {
        addTest("Functional", "Page Title", "FAIL", "Empty or missing title tag");
        pageData.bugs.push(makeBug("Medium", "Missing Page Title", name, url,
          "The <title> tag is empty or missing. Affects SEO and browser tabs.",
          "1. Navigate to: " + url + "\n2. Check browser tab / view-source",
          "Descriptive page title (30-60 chars)", "No title tag", scDesktop));
      }

      // Broken Images
      const brokenImgs = await page.evaluate(() =>
        Array.from(document.images)
          .filter(img => !img.complete || img.naturalWidth === 0)
          .map(img => img.src)
      );
      if (brokenImgs.length === 0) {
        addTest("Functional", "Broken Images", "PASS", "All images loaded correctly");
      } else {
        const scBroken = await takeScreenshot(page, slug + "_broken_images");
        pageData.screenshots.push({ path: scBroken, label: "Broken Images (" + brokenImgs.length + ")", type: "broken" });
        addTest("Functional", "Broken Images", "FAIL", brokenImgs.length + " broken image(s)");
        pageData.bugs.push(makeBug("High", brokenImgs.length + " Broken Image(s)", name, url,
          brokenImgs.length + " image(s) failed to load, degrading page appearance and user experience.",
          "1. Navigate to: " + url + "\n2. Observe broken image icons\n3. Open DevTools (F12) > Network > Filter: Img\n4. Check for 404 responses",
          "All images display correctly",
          brokenImgs.slice(0, 5).map((s, i) => (i+1) + ". " + s.split("/").slice(-2).join("/")).join("\n"),
          scBroken));
      }

      // Favicon
      const favicon = await page.evaluate(() => {
        const el = document.querySelector('link[rel*="icon"]');
        return el ? el.href : null;
      });
      addTest("Functional", "Favicon", favicon ? "PASS" : "WARN", favicon ? favicon.split("/").slice(-1)[0] : "No favicon tag found");

      // Links count
      const linkCount = await page.evaluate(() => document.querySelectorAll("a[href]").length);
      addTest("Functional", "Navigation Links", "PASS", linkCount + " links found on page");

      // Forms
      if (config.tests.forms) {
        const forms = await page.evaluate(() =>
          Array.from(document.querySelectorAll("form")).map(f => ({
            inputs: f.querySelectorAll("input:not([type=hidden]),textarea,select").length,
            hasSubmit: !!f.querySelector('[type=submit],button'),
          }))
        );
        if (forms.length > 0) {
          const scForm = await takeScreenshot(page, slug + "_form");
          pageData.screenshots.push({ path: scForm, label: "Form(s) Detected (" + forms.length + ")", type: "form" });
          addTest("Functional", "Forms", "PASS", forms.length + " form(s), " + forms.reduce((a,f)=>a+f.inputs,0) + " input fields");
          // Check for forms without submit
          const noSubmit = forms.filter(f => !f.hasSubmit).length;
          if (noSubmit > 0) {
            addTest("Functional", "Form Submit Button", "WARN", noSubmit + " form(s) missing submit button");
            pageData.bugs.push(makeBug("Medium", "Form Missing Submit Button", name, url,
              noSubmit + " form(s) have no submit button. Users may be unable to submit.",
              "1. Navigate to: " + url + "\n2. Locate form(s)\n3. Check for submit button",
              "Each form has a clear submit button",
              noSubmit + " form(s) missing submit button", scForm));
          }
        }
      }
    }

    // ══════════════════════════════════
    // CONSOLE & NETWORK TESTS
    // ══════════════════════════════════
    if (config.tests.console) {
      console.log("  🖥️  Console & Network");
      const appErrors = consoleErrors.filter(e => !e.includes("tawk.to") && !e.includes("CORS") && !e.includes("favicon"));
      const thirdParty = consoleErrors.filter(e => e.includes("tawk.to") || e.includes("CORS"));

      if (appErrors.length === 0 && thirdParty.length === 0) {
        addTest("Console", "JS Console", "PASS", "No errors detected");
      } else if (appErrors.length > 0) {
        addTest("Console", "JS Console", "FAIL", appErrors.length + " application error(s)");
        pageData.bugs.push(makeBug("High", "JavaScript Errors in Console (" + appErrors.length + ")", name, url,
          appErrors.length + " JS error(s) found. May indicate broken functionality.",
          "1. Navigate to: " + url + "\n2. Open DevTools (F12)\n3. Click Console tab\n4. Reload page",
          "Zero console errors",
          appErrors.slice(0, 3).join("\n").slice(0, 300), scDesktop));
      } else {
        addTest("Console", "JS Console", "WARN", "Third-party CORS errors (tawk.to)");
        pageData.bugs.push(makeBug("Low", "Third-Party CORS Errors (tawk.to)", name, url,
          "Live chat widget (tawk.to) blocked by CORS policy. Chat may not function.",
          "1. Navigate to: " + url + "\n2. Open DevTools > Console",
          "No CORS errors", "tawk.to blocked by CORS policy", scDesktop));
      }

      // Network 404s
      if (config.tests.network) {
        const net404 = networkLog.filter(r => r.status === 404 && !r.url.includes("tawk.to"));
        if (net404.length === 0) {
          addTest("Network", "Resource 404s", "PASS", "No missing resources");
        } else {
          addTest("Network", "Resource 404s", "WARN", net404.length + " resource(s) returning 404");
          pageData.bugs.push(makeBug("Medium", net404.length + " Missing Network Resources (404)", name, url,
            net404.length + " resource(s) returned 404. May cause broken images, fonts, or scripts.",
            "1. Navigate to: " + url + "\n2. DevTools > Network tab\n3. Reload\n4. Filter by status 404",
            "All resources return HTTP 200",
            net404.slice(0, 4).map((r, i) => (i+1) + ". " + r.url.split("/").slice(-2).join("/")).join("\n"),
            scDesktop));
        }
      }
    }

    // ══════════════════════════════════
    // PERFORMANCE TESTS
    // ══════════════════════════════════
    if (config.tests.performance) {
      console.log("  ⚡ Performance");
      const th = config.thresholds;

      // Load time
      const lt = parseFloat(loadTime);
      if (lt < th.loadTime.pass) {
        addTest("Performance", "Load Time", "PASS", loadTime + "s ✓");
      } else if (lt < th.loadTime.warn) {
        addTest("Performance", "Load Time", "WARN", loadTime + "s (threshold: " + th.loadTime.pass + "s)");
        pageData.bugs.push(makeBug("Medium", "Slow Page Load (" + loadTime + "s)", name, url,
          "Page took " + loadTime + "s to load. Recommended threshold is " + th.loadTime.pass + "s.",
          "1. Navigate to: " + url + "\n2. DevTools > Network > Check total load time",
          "Load time under " + th.loadTime.pass + "s", loadTime + "s", scDesktop));
      } else {
        addTest("Performance", "Load Time", "FAIL", loadTime + "s (very slow!)");
        pageData.bugs.push(makeBug("High", "Very Slow Page Load (" + loadTime + "s)", name, url,
          "Page took " + loadTime + "s — severely impacts UX, SEO, and bounce rate.",
          "1. Navigate to: " + url + "\n2. DevTools > Network > Check load time\n3. Check for large unoptimized assets",
          "Load time under " + th.loadTime.pass + "s", loadTime + "s", scDesktop));
      }

      // DOM size
      const domNodes = await page.evaluate(() => document.querySelectorAll("*").length);
      if (domNodes < th.domNodes.pass) {
        addTest("Performance", "DOM Size", "PASS", domNodes + " nodes (healthy)");
      } else if (domNodes < th.domNodes.warn) {
        addTest("Performance", "DOM Size", "WARN", domNodes + " nodes (large)");
      } else {
        addTest("Performance", "DOM Size", "FAIL", domNodes + " nodes (excessive — impacts render speed)");
        pageData.bugs.push(makeBug("Medium", "Excessive DOM Size (" + domNodes + " nodes)", name, url,
          "DOM has " + domNodes + " nodes. Large DOMs slow rendering, memory usage, and style calculations.",
          "1. DevTools > Elements — observe total node count\n2. Lighthouse > Performance audit",
          "Under " + th.domNodes.pass + " DOM nodes", domNodes + " nodes", scDesktop));
      }

      // Resource count
      const resCount = networkLog.length;
      if (resCount < th.resourceCount.pass) {
        addTest("Performance", "Resource Count", "PASS", resCount + " resources (lean)");
      } else if (resCount < th.resourceCount.warn) {
        addTest("Performance", "Resource Count", "WARN", resCount + " resources (moderate)");
      } else {
        addTest("Performance", "Resource Count", "FAIL", resCount + " resources (too many)");
        pageData.bugs.push(makeBug("Medium", "Too Many Network Resources (" + resCount + ")", name, url,
          "Page loads " + resCount + " resources. Excessive requests degrade performance.",
          "1. DevTools > Network > Reload\n2. Count total requests",
          "Under " + th.resourceCount.pass + " resources", resCount + " resources", scDesktop));
      }

      // Web Vitals (basic)
      const vitals = await page.evaluate(() => {
        const nav = performance.getEntriesByType("navigation")[0];
        if (!nav) return null;
        return {
          ttfb: Math.round(nav.responseStart - nav.requestStart),
          domInteractive: Math.round(nav.domInteractive),
          domComplete: Math.round(nav.domComplete),
        };
      });
      if (vitals) {
        const ttfbOk = vitals.ttfb < 600;
        addTest("Performance", "TTFB (Time to First Byte)", ttfbOk ? "PASS" : "WARN", vitals.ttfb + "ms" + (ttfbOk ? " ✓" : " (>600ms)"));
        addTest("Performance", "DOM Interactive", "PASS", vitals.domInteractive + "ms");
      }
    }

    // ══════════════════════════════════
    // SEO TESTS
    // ══════════════════════════════════
    if (config.tests.seo) {
      console.log("  🔍 SEO");

      const seo = await page.evaluate(() => {
        const meta = (n) => { const el = document.querySelector('meta[name="'+n+'"],meta[property="'+n+'"]'); return el ? el.content : null; };
        return {
          description: meta("description"),
          ogTitle: meta("og:title"),
          ogDesc: meta("og:description"),
          ogImage: meta("og:image"),
          twitterCard: meta("twitter:card"),
          canonical: document.querySelector('link[rel="canonical"]')?.href || null,
          h1s: Array.from(document.querySelectorAll("h1")).map(h => h.innerText.trim()),
          h2Count: document.querySelectorAll("h2").length,
          noindex: !!document.querySelector('meta[content*="noindex"]'),
          imgsNoAlt: Array.from(document.images).filter(i => !i.alt || !i.alt.trim()).length,
          wordCount: document.body ? document.body.innerText.split(/\s+/).filter(Boolean).length : 0,
        };
      });

      // Meta description
      if (seo.description && seo.description.length >= 50) {
        addTest("SEO", "Meta Description", "PASS", seo.description.slice(0, 70) + "...");
      } else if (seo.description) {
        addTest("SEO", "Meta Description", "WARN", "Too short (" + seo.description.length + " chars)");
      } else {
        addTest("SEO", "Meta Description", "FAIL", "Missing meta description");
        pageData.bugs.push(makeBug("Medium", "Missing Meta Description", name, url,
          "No <meta name='description'> tag. Critical for SEO click-through rates.",
          "1. View page source\n2. Search for <meta name=\"description\">",
          "Meta description with 150-160 characters", "No meta description found", scDesktop));
      }

      // H1
      if (seo.h1s.length === 1) {
        addTest("SEO", "H1 Tag", "PASS", '"' + seo.h1s[0].slice(0, 50) + '"');
      } else if (seo.h1s.length === 0) {
        addTest("SEO", "H1 Tag", "FAIL", "No H1 tag found");
        pageData.bugs.push(makeBug("Medium", "Missing H1 Tag", name, url,
          "Page has no <h1> tag. H1 is critical for SEO structure.",
          "1. View page source\n2. Search for <h1>",
          "One descriptive <h1> per page", "No H1 found", scDesktop));
      } else {
        addTest("SEO", "H1 Tag", "WARN", seo.h1s.length + " H1 tags (only 1 recommended)");
      }

      // Open Graph
      if (seo.ogTitle && seo.ogDesc && seo.ogImage) {
        addTest("SEO", "Open Graph", "PASS", "og:title, og:description, og:image present");
      } else {
        addTest("SEO", "Open Graph", "WARN", "Incomplete OG tags (affects social sharing)");
        pageData.bugs.push(makeBug("Low", "Incomplete Open Graph Tags", name, url,
          "Missing: " + [!seo.ogTitle && "og:title", !seo.ogDesc && "og:description", !seo.ogImage && "og:image"].filter(Boolean).join(", "),
          "1. View page source\n2. Search for <meta property=\"og:\"",
          "og:title, og:description, og:image all present",
          "Missing OG tags", scDesktop));
      }

      // Canonical
      addTest("SEO", "Canonical URL", seo.canonical ? "PASS" : "WARN",
        seo.canonical ? seo.canonical.replace(siteConfig.baseUrl, "/") : "No canonical tag");

      // noindex check
      if (seo.noindex) {
        addTest("SEO", "Robots Meta", "WARN", "Page has noindex — won't appear in search");
        pageData.bugs.push(makeBug("Low", "Page Has noindex Meta Tag", name, url,
          "Page is marked as noindex and will not be crawled by search engines.",
          "1. View page source\n2. Search for noindex",
          "Page should be indexed (unless intentional)",
          "noindex meta tag found", scDesktop));
      } else {
        addTest("SEO", "Robots Meta", "PASS", "Page is indexable");
      }

      // Images alt text
      if (seo.imgsNoAlt === 0) {
        addTest("SEO", "Image Alt Texts", "PASS", "All images have alt attributes");
      } else {
        addTest("SEO", "Image Alt Texts", "WARN", seo.imgsNoAlt + " image(s) missing alt text");
        pageData.bugs.push(makeBug("Low", seo.imgsNoAlt + " Images Missing Alt Text", name, url,
          seo.imgsNoAlt + " image(s) have no alt attribute. Impacts SEO and screen readers.",
          "1. View page source\n2. Find <img> tags without alt=\"\"",
          "All images have descriptive alt text",
          seo.imgsNoAlt + " images missing alt", scDesktop));
      }

      // Word count
      if (seo.wordCount >= 300) {
        addTest("SEO", "Content Length", "PASS", seo.wordCount + " words");
      } else {
        addTest("SEO", "Content Length", "WARN", seo.wordCount + " words (under 300 — thin content)");
      }
    }

    // ══════════════════════════════════
    // ACCESSIBILITY TESTS
    // ══════════════════════════════════
    if (config.tests.accessibility) {
      console.log("  ♿ Accessibility");

      const a11y = await page.evaluate(() => {
        const inputsNoLabel = Array.from(document.querySelectorAll("input,select,textarea"))
          .filter(el => {
            if (["hidden","submit","button","reset","image"].includes(el.type)) return false;
            const hasLabel = el.id && document.querySelector('label[for="' + el.id + '"]');
            const hasAria = el.getAttribute("aria-label") || el.getAttribute("aria-labelledby");
            return !hasLabel && !hasAria;
          }).length;

        const btnsNoText = Array.from(document.querySelectorAll("button,a"))
          .filter(el => {
            const hasText = el.innerText.trim().length > 0;
            const hasAria = el.getAttribute("aria-label") || el.getAttribute("title");
            const hasImg = el.querySelector("img[alt]");
            return !hasText && !hasAria && !hasImg;
          }).length;

        const hasLang = document.documentElement.lang && document.documentElement.lang.length > 0;
        const hasMain = !!document.querySelector("main, [role='main']");
        const hasNav = !!document.querySelector("nav, [role='navigation']");
        const hasSkipLink = !!document.querySelector('a[href="#main"],a[href="#content"],a[href="#maincontent"],.skip-link,.skip-to-content');
        const tabIndex = Array.from(document.querySelectorAll("[tabindex]")).filter(el => parseInt(el.tabIndex) > 0).length;
        const emptyLinks = Array.from(document.querySelectorAll("a")).filter(a => !a.innerText.trim() && !a.getAttribute("aria-label") && !a.querySelector("img")).length;

        return { inputsNoLabel, btnsNoText, hasLang, hasMain, hasNav, hasSkipLink, tabIndex, emptyLinks };
      });

      addTest("Accessibility", "HTML Lang Attribute", a11y.hasLang ? "PASS" : "FAIL",
        a11y.hasLang ? "lang attribute present" : "Missing lang attribute on <html>");
      if (!a11y.hasLang) pageData.bugs.push(makeBug("Medium", "Missing lang Attribute on <html>", name, url,
        "The <html> element has no lang attribute. Required for screen readers.",
        "1. View page source\n2. Check <html> opening tag",
        '<html lang="en">', "No lang attribute", scDesktop));

      addTest("Accessibility", "Landmark Regions", a11y.hasMain ? "PASS" : "WARN",
        (a11y.hasMain ? "✓ <main>" : "✗ No <main>") + " " + (a11y.hasNav ? "✓ <nav>" : "✗ No <nav>"));

      addTest("Accessibility", "Form Labels", a11y.inputsNoLabel === 0 ? "PASS" : "FAIL",
        a11y.inputsNoLabel === 0 ? "All inputs have labels" : a11y.inputsNoLabel + " input(s) missing labels");
      if (a11y.inputsNoLabel > 0) pageData.bugs.push(makeBug("High", a11y.inputsNoLabel + " Form Input(s) Missing Labels", name, url,
        a11y.inputsNoLabel + " form input(s) have no associated label. Breaks accessibility for screen reader users.",
        "1. Navigate to: " + url + "\n2. Locate form inputs\n3. Check each input for <label for=''> or aria-label",
        "All inputs have visible labels or aria-label",
        a11y.inputsNoLabel + " inputs without labels", scDesktop));

      addTest("Accessibility", "Button/Link Text", a11y.btnsNoText === 0 ? "PASS" : "WARN",
        a11y.btnsNoText === 0 ? "All buttons/links have text" : a11y.btnsNoText + " empty button(s)/link(s)");

      addTest("Accessibility", "Skip Navigation Link", a11y.hasSkipLink ? "PASS" : "WARN",
        a11y.hasSkipLink ? "Skip link found" : "No skip-to-content link");

      addTest("Accessibility", "Positive tabindex", a11y.tabIndex === 0 ? "PASS" : "WARN",
        a11y.tabIndex === 0 ? "No positive tabindex used" : a11y.tabIndex + " element(s) with positive tabindex");
    }

    // ══════════════════════════════════
    // SECURITY TESTS
    // ══════════════════════════════════
    if (config.tests.security) {
      console.log("  🔒 Security");

      // HTTPS
      const isHttps = url.startsWith("https://");
      addTest("Security", "HTTPS", isHttps ? "PASS" : "FAIL",
        isHttps ? "Site served over HTTPS ✓" : "Site NOT using HTTPS!");
      if (!isHttps) pageData.bugs.push(makeBug("Critical", "Site Not Using HTTPS", name, url,
        "Site is served over plain HTTP. User data is exposed and SEO is penalized.",
        "1. Navigate to: " + url + "\n2. Check browser address bar",
        "Site uses HTTPS with valid SSL", "Site uses HTTP", scDesktop));

      // Security headers
      const secHeaders = {
        "x-frame-options": respHeaders["x-frame-options"],
        "x-content-type-options": respHeaders["x-content-type-options"],
        "strict-transport-security": respHeaders["strict-transport-security"],
        "content-security-policy": respHeaders["content-security-policy"],
        "referrer-policy": respHeaders["referrer-policy"],
        "permissions-policy": respHeaders["permissions-policy"],
      };

      const missingHeaders = Object.entries(secHeaders).filter(([k, v]) => !v).map(([k]) => k);
      const presentHeaders = Object.entries(secHeaders).filter(([k, v]) => !!v).map(([k]) => k);

      if (missingHeaders.length === 0) {
        addTest("Security", "Security Headers", "PASS", "All 6 security headers present");
      } else if (missingHeaders.length <= 2) {
        addTest("Security", "Security Headers", "WARN", missingHeaders.length + " missing: " + missingHeaders.join(", "));
        pageData.bugs.push(makeBug("Medium", "Missing Security Headers (" + missingHeaders.length + ")", name, url,
          "Missing security headers: " + missingHeaders.join(", "),
          "1. Check response headers in DevTools > Network > " + name + " > Headers",
          "All security headers present",
          "Missing: " + missingHeaders.join(", "), scDesktop));
      } else {
        addTest("Security", "Security Headers", "FAIL", missingHeaders.length + " missing headers");
        pageData.bugs.push(makeBug("High", "Multiple Missing Security Headers (" + missingHeaders.length + ")", name, url,
          "Missing critical security headers expose the site to attacks (XSS, clickjacking, MIME sniffing).",
          "1. DevTools > Network > select page request > Headers tab\n2. Check for security headers",
          "X-Frame-Options, X-Content-Type-Options, HSTS, CSP all present",
          "Missing: " + missingHeaders.join("\n"), scDesktop));
      }

      // Mixed content
      const mixedContent = networkLog.filter(r => r.url.startsWith("http://") && isHttps).length;
      addTest("Security", "Mixed Content", mixedContent === 0 ? "PASS" : "FAIL",
        mixedContent === 0 ? "No mixed content" : mixedContent + " HTTP resource(s) on HTTPS page");
      if (mixedContent > 0) pageData.bugs.push(makeBug("High", "Mixed Content (" + mixedContent + " HTTP Resources)", name, url,
        mixedContent + " resource(s) loaded over HTTP on an HTTPS page. Browsers may block these.",
        "1. DevTools > Network > Filter by http://\n2. Identify mixed content resources",
        "All resources loaded over HTTPS",
        mixedContent + " HTTP resources found", scDesktop));
    }

    // ══════════════════════════════════
    // RESPONSIVE TESTS
    // ══════════════════════════════════
    if (config.tests.responsive) {
      console.log("  📱 Responsive");

      for (const [vpName, vp] of Object.entries(config.viewports)) {
        if (vpName === "desktop") continue; // Already tested
        const vpCtx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: vp.width, height: vp.height } });
        const vpPage = await vpCtx.newPage();
        try {
          await vpPage.goto(url, { waitUntil: "domcontentloaded", timeout: config.crawl.timeout });
          await vpPage.waitForTimeout(1500);

          // Check for horizontal scroll (overflow)
          const hasOverflow = await vpPage.evaluate((w) => document.body.scrollWidth > w, vp.width);
          const scVp = await takeScreenshot(vpPage, slug + "_" + vpName);
          pageData.screenshots.push({ path: scVp, label: vp.label, type: vpName });

          if (hasOverflow) {
            addTest("Responsive", vp.label, "FAIL", "Horizontal overflow detected at " + vp.width + "px");
            pageData.bugs.push(makeBug("High", "Horizontal Overflow on " + vp.label, name, url,
              "Page content overflows horizontally at " + vp.width + "px viewport width. Causes horizontal scrolling on mobile.",
              "1. Open DevTools (F12)\n2. Toggle device toolbar\n3. Set width to " + vp.width + "px\n4. Observe horizontal scroll",
              "No horizontal overflow at " + vp.width + "px",
              "Content overflows at " + vp.width + "px", scVp));
          } else {
            addTest("Responsive", vp.label, "PASS", "No overflow, renders correctly at " + vp.width + "px");
          }
        } catch (e) {
          addTest("Responsive", vp.label, "FAIL", "Failed to render at " + vp.width + "px");
        }
        await vpPage.close(); await vpCtx.close();
      }
    }

  } catch (e) {
    const scErr = await takeScreenshot(page, slug + "_error").catch(() => null);
    if (scErr) pageData.screenshots.push({ path: scErr, label: "Error State", type: "error" });
    pageData.tests.push({ category: "Functional", testName: "Page Test", status: "FAIL", desc: e.message.slice(0, 100) });
    pageData.summary.fail++;
    pageData.bugs.push(makeBug("Critical", "Page Could Not Be Tested", name, url,
      "Automated testing failed to complete for this page.",
      "1. Navigate to: " + url,
      "Page loads and is fully testable",
      e.message.slice(0, 200), scErr));
    console.log("  ❌ FATAL: " + e.message.slice(0, 80));
  }

  await page.close(); await ctx.close();
  return pageData;
}

// ─────────────────────────────────────────────
// MAIN RUNNER
// ─────────────────────────────────────────────
async function runSite(browser, siteConfig) {
  console.log("\n" + "═".repeat(55));
  console.log("  🌐 Site: " + siteConfig.name);
  console.log("  📍 URL: " + siteConfig.baseUrl);
  console.log("═".repeat(55));

  const siteResult = {
    name: siteConfig.name,
    baseUrl: siteConfig.baseUrl,
    startTime: new Date(),
    pages: [],
    allBugs: [],
    summary: { pages: 0, pass: 0, fail: 0, warn: 0, bugs: 0 },
  };

  // Login if configured
  let storageState = null;
  if (siteConfig.auth) {
    storageState = await performLogin(browser, siteConfig.auth);
  }

  // Crawl
  const discoveredPages = await crawlSite(browser, siteConfig, storageState);

  // Test each page
  console.log("\n  🧪 Testing " + discoveredPages.length + " pages...");
  for (const pageInfo of discoveredPages) {
    const pageData = await testPage(browser, pageInfo, siteConfig, storageState);
    siteResult.pages.push(pageData);
    siteResult.allBugs.push(...pageData.bugs);
    siteResult.summary.pages++;
    siteResult.summary.pass += pageData.summary.pass;
    siteResult.summary.fail += pageData.summary.fail;
    siteResult.summary.warn += pageData.summary.warn;
    siteResult.summary.bugs += pageData.bugs.length;
  }

  siteResult.endTime = new Date();
  siteResult.duration = ((siteResult.endTime - siteResult.startTime) / 1000).toFixed(0);
  return siteResult;
}

async function main() {
  console.log("\n" + "█".repeat(55));
  console.log("  OpsMonsters Test Suite v2.0");
  console.log("  " + new Date().toLocaleString());
  console.log("█".repeat(55));

  const browser = await chromium.launch({ headless: config.browser.headless, slowMo: config.browser.slowMo });
  const activeSites = config.sites.filter(s => s.active);

  if (activeSites.length === 0) {
    console.log("\n❌ No active sites in config/config.js");
    process.exit(1);
  }

  for (const siteConfig of activeSites) {
    const result = await runSite(browser, siteConfig);
    allSiteResults.push(result);
  }

  await browser.close();

  // Print summary
  console.log("\n\n" + "█".repeat(55));
  console.log("  FINAL RESULTS");
  console.log("█".repeat(55));
  for (const site of allSiteResults) {
    console.log("\n  " + site.name);
    console.log("  Pages: " + site.summary.pages + " | Bugs: " + site.summary.bugs);
    console.log("  ✅ " + site.summary.pass + " PASS  ❌ " + site.summary.fail + " FAIL  ⚠️  " + site.summary.warn + " WARN");
    console.log("  ⏱️  Duration: " + site.duration + "s");
  }

  // Save results JSON
  const jsonPath = path.join(REPORT_DIR, "results.json");
  fs.writeFileSync(jsonPath, JSON.stringify({ sites: allSiteResults, generatedAt: new Date() }, null, 2));
  console.log("\n  📊 Results saved: " + jsonPath);

  // Generate reports
  console.log("\n  📄 Generating reports...\n");
  if (config.report.pdf) {
    const { generatePDF } = require("./report-pdf");
    await generatePDF(allSiteResults);
  }
  if (config.report.html) {
    const { generateHTML } = require("./report-html");
    await generateHTML(allSiteResults);
  }

  console.log("\n✅ All done!\n");
}

main().catch(err => { console.error("\n❌ Fatal error:", err); process.exit(1); });