// ============================================================
//  OpsMonsters vs Reference — Visual Comparison Report
//  Run: node compare.js
// ============================================================

const { chromium } = require("playwright");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const SITES = {
  reference: {
    name: "CreateStudio (Reference)",
    url: "https://createstudio.framer.media/",
    color: "#6366f1",
  },
  ours: {
    name: "OpsMonsters UAT",
    url: "https://uat.opsmonsters.com/",
    color: "#f97316",
  },
};

const PAGES_TO_COMPARE = [
  { path: "/",        label: "Homepage" },
  { path: "/about",   label: "About" },
  { path: "/services",label: "Services" },
  { path: "/contact", label: "Contact" },
  { path: "/blogs",   label: "Blog" },
];

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900,  label: "Desktop (1440px)" },
  { name: "mobile",  width: 390,  height: 844,  label: "Mobile (390px)" },
];

const SC_DIR  = path.join(__dirname, "compare_screenshots");
const OUT_PDF = path.join(__dirname, "comparison_report.pdf");

if (!fs.existsSync(SC_DIR)) fs.mkdirSync(SC_DIR);

// ─────────────────────────────────────────
// DESIGN ANALYSIS — What to check
// ─────────────────────────────────────────
const DESIGN_CRITERIA = [
  {
    category: "Visual Design",
    checks: [
      { id: "dark-bg",       label: "Dark background theme",          reference: "Deep #080808 black background throughout",       weight: "High" },
      { id: "typography",    label: "Large bold hero typography",      reference: "80px+ font for hero headings, tight letter-spacing", weight: "High" },
      { id: "whitespace",    label: "Generous whitespace / breathing", reference: "80-120px section padding, minimal clutter",     weight: "High" },
      { id: "color-accent",  label: "Minimal accent colors",          reference: "1–2 accent colors max, white on black palette",  weight: "Medium" },
      { id: "grid-borders",  label: "1px grid border separators",     reference: "Thin #222 borders dividing stat/grid blocks",    weight: "Medium" },
    ],
  },
  {
    category: "Navigation & Layout",
    checks: [
      { id: "fixed-nav",     label: "Fixed transparent nav",          reference: "Sticky nav with backdrop-blur, minimal links",   weight: "High" },
      { id: "nav-uppercase", label: "Uppercase nav items",            reference: "All nav labels in UPPERCASE, wide letter-spacing", weight: "Low" },
      { id: "section-nums",  label: "Section numbering (// 00.01°)",  reference: "Small section labels like // 00.01° above headings", weight: "Medium" },
      { id: "fullbleed",     label: "Full-bleed project cards",       reference: "Images extend edge-to-edge, no card borders",    weight: "High" },
    ],
  },
  {
    category: "Content & SEO",
    checks: [
      { id: "hero-video",    label: "Hero video/animation",           reference: "Autoplay background video in hero section",      weight: "Medium" },
      { id: "meta-desc",     label: "Meta descriptions present",      reference: "Each page has unique meta description",          weight: "High" },
      { id: "single-h1",     label: "Single H1 per page",            reference: "Only one H1 tag per page",                      weight: "High" },
      { id: "og-tags",       label: "Open Graph tags",                reference: "og:title, og:description, og:image on all pages", weight: "Medium" },
    ],
  },
  {
    category: "Performance",
    checks: [
      { id: "load-time",     label: "Page load under 3s",            reference: "All pages load under 3 seconds",                 weight: "High" },
      { id: "smooth-scroll", label: "Smooth scroll behavior",        reference: "scroll-behavior:smooth on html element",         weight: "Low" },
      { id: "font-loading",  label: "Custom font loading",           reference: "Inter or similar variable font with fallback",   weight: "Medium" },
    ],
  },
  {
    category: "Mobile Experience",
    checks: [
      { id: "no-overflow",   label: "No horizontal overflow",        reference: "Zero horizontal scroll at 390px",                weight: "High" },
      { id: "touch-targets", label: "Touch-friendly buttons (44px+)","reference": "All buttons/links min 44x44px touch area",     weight: "High" },
      { id: "readable-font", label: "Readable font size on mobile",  reference: "Min 16px body text on mobile viewport",         weight: "Medium" },
    ],
  },
];

// ─────────────────────────────────────────
// CAPTURE SCREENSHOTS
// ─────────────────────────────────────────
async function captureScreenshots(browser) {
  const results = {};

  for (const [siteKey, site] of Object.entries(SITES)) {
    results[siteKey] = { name: site.name, url: site.url, color: site.color, pages: {} };

    for (const pageInfo of PAGES_TO_COMPARE) {
      const pageUrl = siteKey === "reference"
        ? site.url.replace(/\/$/, "") + (pageInfo.path === "/" ? "" : pageInfo.path)
        : site.url.replace(/\/$/, "") + pageInfo.path;

      results[siteKey].pages[pageInfo.path] = { label: pageInfo.label, shots: {}, metrics: {} };

      for (const vp of VIEWPORTS) {
        const ctx = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          ignoreHTTPSErrors: true,
        });
        const page = await ctx.newPage();
        const scPath = path.join(SC_DIR, `${siteKey}_${pageInfo.path.replace(/\//g, "_") || "home"}_${vp.name}.png`);

        try {
          console.log(`  📸 ${site.name} — ${pageInfo.label} (${vp.label})`);
          const t0 = Date.now();
          const resp = await page.goto(pageUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
          await page.waitForTimeout(2500);
          const loadTime = ((Date.now() - t0) / 1000).toFixed(2);

          await page.screenshot({ path: scPath, fullPage: false, timeout: 15000 });

          // Collect metrics
          const metrics = await page.evaluate(() => {
            const bg = getComputedStyle(document.body).backgroundColor;
            const h1s = document.querySelectorAll("h1").length;
            const metaDesc = document.querySelector('meta[name="description"]')?.content || "";
            const hasNav = !!document.querySelector("nav");
            const hasVideo = !!document.querySelector("video");
            const bodyOverflow = document.body.scrollWidth > window.innerWidth;
            const fontSize = parseFloat(getComputedStyle(document.body).fontSize);
            const hasSmooth = getComputedStyle(document.documentElement).scrollBehavior === "smooth";
            const buttons = Array.from(document.querySelectorAll("button, a")).filter(el => {
              const r = el.getBoundingClientRect();
              return r.width > 0 && r.height > 0 && r.height < 44;
            }).length;
            const titleLen = document.title.length;
            return { bg, h1s, metaDesc: metaDesc.length, hasNav, hasVideo, bodyOverflow, fontSize, hasSmooth, smallButtons: buttons, titleLen };
          });

          results[siteKey].pages[pageInfo.path].shots[vp.name] = scPath;
          results[siteKey].pages[pageInfo.path].metrics[vp.name] = { ...metrics, loadTime, status: resp?.status() || 0 };

        } catch (e) {
          console.log(`  ⚠️  Failed: ${e.message.slice(0, 60)}`);
          results[siteKey].pages[pageInfo.path].shots[vp.name] = null;
          results[siteKey].pages[pageInfo.path].metrics[vp.name] = { error: e.message.slice(0, 100) };
        }

        await page.close(); await ctx.close();
      }
    }
  }

  return results;
}

// ─────────────────────────────────────────
// ANALYSE DIFFERENCES
// ─────────────────────────────────────────
function analyseGaps(data) {
  const findings = [];
  const ref = data.reference;
  const ours = data.ours;

  for (const pageInfo of PAGES_TO_COMPARE) {
    const refM  = ref.pages[pageInfo.path]?.metrics?.desktop || {};
    const oursM = ours.pages[pageInfo.path]?.metrics?.desktop || {};
    const refMob  = ref.pages[pageInfo.path]?.metrics?.mobile || {};
    const oursMob = ours.pages[pageInfo.path]?.metrics?.mobile || {};

    if (refM.error || oursM.error) continue;

    const pageName = pageInfo.label;

    // Background color
    const refIsDark = refM.bg && (refM.bg.includes("0, 0, 0") || refM.bg.includes("8, 8, 8") || refM.bg.includes("15, 15"));
    const oursIsDark = oursM.bg && (oursM.bg.includes("0, 0, 0") || oursM.bg.includes("8, 8, 8") || oursM.bg.includes("15, 15"));
    if (refIsDark && !oursIsDark) {
      findings.push({ page: pageName, severity: "High", category: "Visual Design", title: "Light Background — Should be Dark", desc: `Reference uses deep black (#080808). OpsMonsters uses a light background (${oursM.bg}). Entire site theme needs to switch to dark.`, fix: "Set body { background: #080808; color: #f0f0f0; } globally. Update all section backgrounds to dark variants.", ref: "Dark: " + (refM.bg || "–"), actual: "Light: " + (oursM.bg || "–") });
    }

    // H1 count
    if (refM.h1s === 1 && oursM.h1s > 1) {
      findings.push({ page: pageName, severity: "High", category: "SEO", title: `Multiple H1 Tags (${oursM.h1s} found, should be 1)`, desc: `Reference site uses exactly 1 H1 per page. OpsMonsters has ${oursM.h1s} H1 tags on ${pageName}, which hurts SEO ranking and page structure.`, fix: "Keep only one <h1> per page. Convert others to <h2>, <h3> etc.", ref: "1 H1 tag", actual: `${oursM.h1s} H1 tags` });
    }

    // Meta description
    if (refM.metaDesc > 50 && oursM.metaDesc < 50) {
      findings.push({ page: pageName, severity: "Medium", category: "SEO", title: "Missing or Short Meta Description", desc: `Reference has a full meta description (${refM.metaDesc} chars). OpsMonsters has only ${oursM.metaDesc} chars on ${pageName}.`, fix: "Add unique meta description per page (150-160 characters).", ref: `${refM.metaDesc} chars`, actual: `${oursM.metaDesc} chars` });
    }

    // Load time
    if (parseFloat(refM.loadTime) < 3 && parseFloat(oursM.loadTime) > 3) {
      findings.push({ page: pageName, severity: oursM.loadTime > 6 ? "High" : "Medium", category: "Performance", title: `Slow Page Load (${oursM.loadTime}s vs ${refM.loadTime}s)`, desc: `Reference loads in ${refM.loadTime}s. OpsMonsters takes ${oursM.loadTime}s on ${pageName} — ${Math.round((oursM.loadTime / refM.loadTime) * 100 - 100)}% slower.`, fix: "Optimize images (use WebP), lazy-load below-fold content, reduce JS bundle size, enable CDN caching.", ref: `${refM.loadTime}s`, actual: `${oursM.loadTime}s` });
    }

    // Mobile overflow
    if (!refMob.bodyOverflow && oursMob.bodyOverflow) {
      findings.push({ page: pageName, severity: "High", category: "Mobile", title: "Horizontal Overflow on Mobile", desc: `Reference has zero horizontal scroll on mobile. OpsMonsters content overflows at 390px on ${pageName}, forcing users to scroll sideways.`, fix: "Add max-width:100%; overflow-x:hidden to containers. Check for fixed-width elements.", ref: "No overflow", actual: "Overflow detected at 390px" });
    }

    // Hero video
    if (pageInfo.path === "/" && refM.hasVideo && !oursM.hasVideo) {
      findings.push({ page: pageName, severity: "Medium", category: "Visual Design", title: "Missing Hero Video / Animation", desc: "Reference site has an autoplay background video in the hero section, creating an immersive first impression. OpsMonsters has a static hero.", fix: "Add a short (5-10s), muted, looping WebM/MP4 video as hero background. Use <video autoplay muted loop playsinline>.", ref: "Hero video present", actual: "Static image only" });
    }

    // Smooth scroll
    if (refM.hasSmooth && !oursM.hasSmooth) {
      findings.push({ page: pageName, severity: "Low", category: "UX", title: "Missing Smooth Scroll Behavior", desc: "Reference uses CSS smooth scrolling for a polished navigation feel. OpsMonsters uses instant/jump scroll.", fix: "Add html { scroll-behavior: smooth; } to global CSS.", ref: "scroll-behavior: smooth", actual: "Default (instant)" });
    }

    // Font size on mobile
    if (oursMob.fontSize && oursMob.fontSize < 16) {
      findings.push({ page: pageName, severity: "Medium", category: "Mobile", title: `Body Font Too Small on Mobile (${oursMob.fontSize}px)`, desc: `Mobile body font is ${oursMob.fontSize}px on ${pageName}. Minimum recommended is 16px to prevent iOS auto-zoom and ensure readability.`, fix: "Set body { font-size: 16px; } minimum. Use responsive font sizing with clamp().", ref: "16px+", actual: `${oursMob.fontSize}px` });
    }
  }

  return findings;
}

// ─────────────────────────────────────────
// PDF GENERATOR
// ─────────────────────────────────────────
function toB64(filepath) {
  if (!filepath || !fs.existsSync(filepath)) return null;
  try { return fs.readFileSync(filepath); } catch (e) { return null; }
}

async function generatePDF(data, findings) {
  const doc = new PDFDocument({ margin: 0, size: "A4", autoFirstPage: true });
  const stream = fs.createWriteStream(OUT_PDF);
  doc.pipe(stream);

  const PW = 595, PH = 841, M = 40, W = PW - M * 2;
  const C = {
    dark: "#0a0a0a", dark2: "#111", dark3: "#1a1a1a",
    ref: "#6366f1", ours: "#f97316",
    pass: "#22c55e", fail: "#ef4444", warn: "#eab308",
    text: "#f0f0f0", sub: "#666", sub2: "#333",
    border: "#1e1e1e", white: "white",
  };

  function sevColor(s) { return s==="High"?"#ef4444":s==="Medium"?"#eab308":"#6366f1"; }
  function sevBg(s) { return s==="High"?"#450a0a":s==="Medium"?"#422006":"#1e1b4b"; }

  // ══════════════════════════════
  // COVER PAGE
  // ══════════════════════════════
  doc.rect(0, 0, PW, PH).fill(C.dark);
  doc.rect(0, 0, PW, 4).fill(C.ref);

  doc.fill(C.ref).fontSize(11).font("Helvetica-Bold")
    .text("// 00.01°", M, 60, { characterSpacing: 2 });
  doc.fill(C.text).fontSize(52).font("Helvetica-Bold")
    .text("Visual", M, 84, { lineGap: -4 });
  doc.fill(C.text).fontSize(52).font("Helvetica-Bold")
    .text("Comparison", M, 140, { lineGap: -4 });
  doc.fill(C.text).fontSize(52).font("Helvetica-Bold")
    .text("Report", M, 196);

  doc.rect(M, 270, 60, 2).fill(C.ref);

  // Site cards
  const siteCards = [
    { label: "REFERENCE", name: "CreateStudio", url: "createstudio.framer.media", color: C.ref },
    { label: "OUR SITE",  name: "OpsMonsters UAT", url: "uat.opsmonsters.com", color: C.ours },
  ];
  let cx = M;
  for (const card of siteCards) {
    doc.rect(cx, 290, 235, 90).fill(C.dark3);
    doc.rect(cx, 290, 235, 3).fill(card.color);
    doc.fill(card.color).fontSize(8).font("Helvetica-Bold")
      .text(card.label, cx + 16, 306, { characterSpacing: 2 });
    doc.fill(C.text).fontSize(14).font("Helvetica-Bold")
      .text(card.name, cx + 16, 322);
    doc.fill(C.sub).fontSize(9).font("Helvetica")
      .text(card.url, cx + 16, 342);
    cx += 245;
  }

  doc.fill(C.sub).fontSize(8).font("Helvetica")
    .text("Generated: " + new Date().toLocaleString(), M, 398, { characterSpacing: 0.5 });
  doc.fill(C.sub).fontSize(8).text("Tool: OpsMonsters Test Suite v2.0 — Playwright", M, 414);

  // Summary stats
  doc.fill(C.ref).fontSize(11).font("Helvetica-Bold")
    .text("// 00.02°", M, 460, { characterSpacing: 2 });
  doc.fill(C.text).fontSize(18).font("Helvetica-Bold").text("Gap Summary", M, 478);

  const highCount   = findings.filter(f => f.severity === "High").length;
  const medCount    = findings.filter(f => f.severity === "Medium").length;
  const lowCount    = findings.filter(f => f.severity === "Low").length;

  const sumCards = [
    { label: "Total Gaps", value: findings.length, color: C.ref },
    { label: "High Priority", value: highCount, color: C.fail },
    { label: "Medium", value: medCount, color: C.warn },
    { label: "Low", value: lowCount, color: "#6366f1" },
  ];
  cx = M;
  for (const s of sumCards) {
    doc.rect(cx, 508, 116, 72, 0).fill(C.dark3);
    doc.rect(cx, 508, 116, 3).fill(s.color);
    doc.fill(s.color).fontSize(32).font("Helvetica-Bold").text(String(s.value), cx, 520, { width: 116, align: "center" });
    doc.fill(C.sub).fontSize(8).font("Helvetica").text(s.label, cx, 558, { width: 116, align: "center", characterSpacing: 0.5 });
    cx += 124;
  }

  // Category breakdown
  doc.fill(C.ref).fontSize(11).font("Helvetica-Bold").text("// 00.03°", M, 610, { characterSpacing: 2 });
  doc.fill(C.text).fontSize(18).font("Helvetica-Bold").text("Gaps by Category", M, 628);

  const cats = {};
  findings.forEach(f => { cats[f.category] = (cats[f.category] || 0) + 1; });
  let py = 660;
  for (const [cat, count] of Object.entries(cats)) {
    doc.rect(M, py, W, 24).fill(C.dark3);
    doc.rect(M, py, 3, 24).fill(C.ref);
    doc.fill(C.text).fontSize(10).font("Helvetica-Bold").text(cat, M + 12, py + 8);
    doc.fill(C.ref).fontSize(10).font("Helvetica-Bold").text(String(count) + " gaps", M + 12, py + 8, { width: W - 24, align: "right" });
    py += 30;
  }

  doc.rect(0, PH - 30, PW, 30).fill(C.dark3);
  doc.fill(C.sub).fontSize(7).font("Helvetica")
    .text("CONFIDENTIAL — OpsMonsters QA Report", M, PH - 16, { width: W, align: "center" });

  // ══════════════════════════════
  // GAP ANALYSIS — INDEX
  // ══════════════════════════════
  doc.addPage();
  doc.rect(0, 0, PW, PH).fill(C.dark);
  doc.rect(0, 0, PW, 4).fill(C.ref);

  doc.fill(C.ref).fontSize(11).font("Helvetica-Bold").text("// 00.04°", M, 44, { characterSpacing: 2 });
  doc.fill(C.text).fontSize(28).font("Helvetica-Bold").text("Gap Index", M, 62);
  doc.fill(C.sub).fontSize(10).font("Helvetica").text(findings.length + " differences found across " + PAGES_TO_COMPARE.length + " pages", M, 94);

  // Table header
  doc.rect(M, 118, W, 24).fill(C.ref);
  doc.fill(C.white).fontSize(8).font("Helvetica-Bold")
    .text("ID",       M + 4,  124)
    .text("SEVERITY", M + 40, 124)
    .text("TITLE",    M + 110, 124)
    .text("CATEGORY", M + 360, 124)
    .text("PAGE",     M + 440, 124);

  let iy = 144;
  for (let i = 0; i < findings.length; i++) {
    const f = findings[i];
    if (iy > 800) { doc.addPage(); doc.rect(0,0,PW,PH).fill(C.dark); iy = 40; }
    const sc = sevColor(f.severity);
    doc.rect(M, iy, W, 26).fill(i % 2 === 0 ? C.dark2 : C.dark3);
    doc.rect(M, iy, 2, 26).fill(sc);
    doc.fill(C.sub).fontSize(8).font("Helvetica-Bold").text("G-" + String(i+1).padStart(2,"0"), M + 6, iy + 9, { width: 30 });
    doc.roundedRect(M + 38, iy + 6, 66, 14, 3).fill(sevBg(f.severity));
    doc.fill(sc).fontSize(7).font("Helvetica-Bold").text(f.severity, M + 38, iy + 10, { width: 66, align: "center" });
    doc.fill(C.text).fontSize(8).font("Helvetica").text(f.title.slice(0, 46), M + 110, iy + 9, { width: 244 });
    doc.fill(C.sub).fontSize(7).font("Helvetica").text(f.category, M + 360, iy + 9, { width: 74 });
    doc.fill(C.sub).fontSize(7).font("Helvetica").text(f.page, M + 440, iy + 9, { width: 110 });
    iy += 28;
  }

  // ══════════════════════════════
  // PER-GAP DETAIL PAGES
  // ══════════════════════════════
  for (let i = 0; i < findings.length; i++) {
    const f = findings[i];
    doc.addPage();
    doc.rect(0, 0, PW, PH).fill(C.dark);
    const sc = sevColor(f.severity);
    doc.rect(0, 0, PW, 4).fill(sc);

    doc.fill(sc).fontSize(10).font("Helvetica-Bold")
      .text("G-" + String(i+1).padStart(2,"0") + "  //  " + f.severity.toUpperCase() + " PRIORITY  //  " + f.category.toUpperCase(), M, 22, { characterSpacing: 1 });
    doc.fill(C.text).fontSize(20).font("Helvetica-Bold").text(f.title, M, 40, { width: W });

    doc.y = 90;

    const fields = [
      { label: "PAGE",        value: f.page },
      { label: "DESCRIPTION", value: f.desc },
      { label: "FIX / ACTION", value: f.fix },
      { label: "REFERENCE",   value: f.ref, color: C.ref },
      { label: "ACTUAL",      value: f.actual, color: sc },
    ];

    for (const field of fields) {
      if (doc.y > 560) break;
      const fy = doc.y;
      doc.rect(M, fy, W, 0.5).fill(C.dark3);
      doc.y = fy + 8;
      doc.fill(C.sub).fontSize(7).font("Helvetica-Bold")
        .text(field.label, M, doc.y, { characterSpacing: 1.5 });
      const lines = Math.ceil((field.value || "").length / 80);
      const vh = Math.max(16, lines * 14 + 4);
      doc.fill(field.color || C.text).fontSize(10).font("Helvetica")
        .text(field.value || "—", M + 130, fy + 8, { width: W - 130 });
      doc.y = fy + vh + 18;
    }

    // Screenshots — side by side
    const scY = doc.y + 8;
    if (scY < 560) {
      const refShot  = toB64(data.reference.pages["/"]?.shots?.desktop);
      const oursShot = toB64(data.ours.pages["/"]?.shots?.desktop);

      // Find matching page screenshot
      const matchPage = PAGES_TO_COMPARE.find(p => p.label === f.page);
      const pagePath = matchPage ? matchPage.path : "/";
      const refShotPage  = toB64(data.reference.pages[pagePath]?.shots?.desktop);
      const oursShotPage = toB64(data.ours.pages[pagePath]?.shots?.desktop);

      doc.rect(M, scY, W, 0.5).fill(C.dark3);
      doc.fill(C.sub).fontSize(7).font("Helvetica-Bold")
        .text("SCREENSHOTS", M, scY + 8, { characterSpacing: 1.5 });

      const imgY = scY + 26;
      const halfW = (W - 12) / 2;
      const imgH  = Math.min(220, PH - imgY - 50);

      // Reference label
      doc.rect(M, imgY - 20, halfW, 18).fill(C.ref + "22");
      doc.fill(C.ref).fontSize(8).font("Helvetica-Bold")
        .text("REFERENCE — " + SITES.reference.name, M + 6, imgY - 14);

      // Ours label
      doc.rect(M + halfW + 12, imgY - 20, halfW, 18).fill(C.ours + "22");
      doc.fill(C.ours).fontSize(8).font("Helvetica-Bold")
        .text("OURS — " + SITES.ours.name, M + halfW + 18, imgY - 14);

      if (refShotPage) {
        try { doc.image(refShotPage, M, imgY, { fit: [halfW, imgH] }); } catch(e){}
      } else {
        doc.rect(M, imgY, halfW, imgH).fill(C.dark3);
        doc.fill(C.sub).fontSize(9).text("Screenshot unavailable", M, imgY + imgH/2 - 8, { width: halfW, align: "center" });
      }

      if (oursShotPage) {
        try { doc.image(oursShotPage, M + halfW + 12, imgY, { fit: [halfW, imgH] }); } catch(e){}
      } else {
        doc.rect(M + halfW + 12, imgY, halfW, imgH).fill(C.dark3);
        doc.fill(C.sub).fontSize(9).text("Screenshot unavailable", M + halfW + 12, imgY + imgH/2 - 8, { width: halfW, align: "center" });
      }
    }

    doc.rect(0, PH - 28, PW, 28).fill(C.dark3);
    doc.fill(C.sub).fontSize(7).font("Helvetica")
      .text("G-" + String(i+1).padStart(2,"0") + "  |  " + f.severity + "  |  " + f.page + "  |  " + new Date().toLocaleDateString(), M, PH - 16, { width: W });
  }

  // ══════════════════════════════
  // FULL PAGE SCREENSHOT COMPARISON
  // ══════════════════════════════
  for (const pageInfo of PAGES_TO_COMPARE) {
    for (const vp of VIEWPORTS) {
      const refShot  = toB64(data.reference.pages[pageInfo.path]?.shots?.[vp.name]);
      const oursShot = toB64(data.ours.pages[pageInfo.path]?.shots?.[vp.name]);
      if (!refShot && !oursShot) continue;

      doc.addPage();
      doc.rect(0, 0, PW, PH).fill(C.dark);
      doc.rect(0, 0, PW, 4).fill(C.ref);

      doc.fill(C.ref).fontSize(9).font("Helvetica-Bold")
        .text("// SCREENSHOT COMPARISON", M, 16, { characterSpacing: 1.5 });
      doc.fill(C.text).fontSize(16).font("Helvetica-Bold")
        .text(pageInfo.label + " — " + vp.label, M, 32);

      const halfW = (W - 10) / 2;
      const imgY  = 68;
      const imgH  = PH - imgY - 40;

      // Reference
      doc.rect(M, imgY - 20, halfW, 18).fill(C.ref + "33");
      doc.fill(C.ref).fontSize(8).font("Helvetica-Bold")
        .text("REFERENCE", M + 6, imgY - 14, { characterSpacing: 1 });
      doc.fill(C.sub).fontSize(7).text(SITES.reference.url, M + 6, imgY - 5);

      if (refShot) {
        try { doc.image(refShot, M, imgY, { fit: [halfW, imgH] }); } catch(e){}
      } else {
        doc.rect(M, imgY, halfW, imgH).fill(C.dark3);
        doc.fill(C.sub).fontSize(9).text("Not available", M, imgY + 80, { width: halfW, align: "center" });
      }

      // Ours
      const ox = M + halfW + 10;
      doc.rect(ox, imgY - 20, halfW, 18).fill(C.ours + "33");
      doc.fill(C.ours).fontSize(8).font("Helvetica-Bold")
        .text("OPSMONSTERS UAT", ox + 6, imgY - 14, { characterSpacing: 1 });
      doc.fill(C.sub).fontSize(7).text(SITES.ours.url, ox + 6, imgY - 5);

      if (oursShot) {
        try { doc.image(oursShot, ox, imgY, { fit: [halfW, imgH] }); } catch(e){}
      } else {
        doc.rect(ox, imgY, halfW, imgH).fill(C.dark3);
        doc.fill(C.sub).fontSize(9).text("Not available", ox, imgY + 80, { width: halfW, align: "center" });
      }

      doc.rect(0, PH - 24, PW, 24).fill(C.dark3);
      doc.fill(C.sub).fontSize(7).font("Helvetica")
        .text(pageInfo.label + " — " + vp.label, M, PH - 14, { width: W });
    }
  }

  // ══════════════════════════════
  // FINAL RECOMMENDATIONS
  // ══════════════════════════════
  doc.addPage();
  doc.rect(0, 0, PW, PH).fill(C.dark);
  doc.rect(0, 0, PW, 4).fill(C.ref);

  doc.fill(C.ref).fontSize(11).font("Helvetica-Bold").text("// 00.05°", M, 44, { characterSpacing: 2 });
  doc.fill(C.text).fontSize(28).font("Helvetica-Bold").text("Recommendations", M, 62);

  const high = findings.filter(f => f.severity === "High");
  const med  = findings.filter(f => f.severity === "Medium");
  const low  = findings.filter(f => f.severity === "Low");

  let ry = 110;
  for (const [label, items, color] of [["HIGH PRIORITY — Fix Immediately", high, "#ef4444"], ["MEDIUM — Fix in Next Sprint", med, "#eab308"], ["LOW — Fix When Possible", low, "#6366f1"]]) {
    if (items.length === 0) continue;
    if (ry > 750) { doc.addPage(); doc.rect(0,0,PW,PH).fill(C.dark); ry = 40; }
    doc.rect(M, ry, W, 22).fill(color + "22");
    doc.rect(M, ry, 3, 22).fill(color);
    doc.fill(color).fontSize(9).font("Helvetica-Bold").text(label, M + 10, ry + 7, { characterSpacing: 1 });
    ry += 28;
    for (const f of items) {
      if (ry > 780) { doc.addPage(); doc.rect(0,0,PW,PH).fill(C.dark); ry = 40; }
      doc.rect(M, ry, W, 20).fill(C.dark2);
      doc.fill(C.text).fontSize(9).font("Helvetica-Bold").text("→ " + f.title, M + 10, ry + 6, { width: 340 });
      doc.fill(C.sub).fontSize(8).font("Helvetica").text(f.page, M + 360, ry + 6, { width: 150, align: "right" });
      ry += 24;
    }
    ry += 12;
  }

  doc.rect(0, PH - 28, PW, 28).fill(C.dark3);
  doc.fill(C.sub).fontSize(7).font("Helvetica")
    .text("OpsMonsters Visual Comparison Report  |  OpsMonsters Test Suite v2.0  |  " + new Date().toLocaleString(), M, PH - 16, { width: W, align: "center" });

  doc.end();
  await new Promise(res => stream.on("finish", res));
  console.log("\n📄 PDF saved: " + OUT_PDF);
}

// ─────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────
async function main() {
  console.log("\n" + "█".repeat(52));
  console.log("  OpsMonsters Visual Comparison Report");
  console.log("  " + new Date().toLocaleString());
  console.log("█".repeat(52) + "\n");

  const browser = await chromium.launch({ headless: true });

  console.log("📸 Capturing screenshots...\n");
  const data = await captureScreenshots(browser);
  await browser.close();

  console.log("\n🔍 Analysing design gaps...\n");
  const findings = analyseGaps(data);
  console.log("  Found " + findings.length + " gaps\n");
  findings.forEach((f, i) => console.log("  G-" + String(i+1).padStart(2,"0") + " [" + f.severity + "] " + f.title));

  console.log("\n📄 Generating PDF...\n");
  await generatePDF(data, findings);

  console.log("\n✅ Done!\n");
  console.log("  📄 Report: comparison_report.pdf");
  console.log("  📁 Screenshots: compare_screenshots/\n");
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });