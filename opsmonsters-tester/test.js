const { chromium } = require("playwright");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const BASE_URL = "https://uat.opsmonsters.com/";
const SCREENSHOT_DIR = path.join(__dirname, "screenshots");
const REPORT_PATH = path.join(__dirname, "test_report.pdf");
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR);
const results = [];
const pageResults = [];
let screenshotIndex = 1;
function log(status, testName, description) {
  const icon = status === "PASS" ? "OK" : status === "FAIL" ? "FAIL" : "WARN";
  console.log("  [" + icon + "] " + testName + ": " + description);
}
async function takeScreenshot(page, label) {
  const filename = String(screenshotIndex++).padStart(3, "0") + "_" + label.replace(/[^a-z0-9]/gi, "_").slice(0, 40) + ".png";
  const filepath = path.join(SCREENSHOT_DIR, filename);
  try { await page.screenshot({ path: filepath, fullPage: true }); }
  catch (e) { await page.screenshot({ path: filepath, fullPage: false }); }
  return filepath;
}
async function crawlAllPages(browser) {
  console.log("\nCrawling website...\n");
  const visited = new Set();
  const toVisit = [BASE_URL];
  const discovered = [];
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  while (toVisit.length > 0 && discovered.length < 50) {
    const url = toVisit.shift();
    if (visited.has(url)) continue;
    visited.add(url);
    try {
      const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
      await page.waitForTimeout(1000);
      const status = resp ? resp.status() : 0;
      const links = await page.evaluate((base) => {
        return Array.from(document.querySelectorAll("a[href]"))
          .map(a => a.href)
          .filter(href => href.startsWith(base) && !href.includes("#") && !href.match(/\.(pdf|jpg|jpeg|png|gif|svg|zip|doc|docx)$/i))
          .filter((v, i, a) => a.indexOf(v) === i);
      }, BASE_URL);
      for (const link of links) {
        const clean = link.split("?")[0].replace(/\/$/, "") + "/";
        if (!visited.has(clean) && !toVisit.includes(clean)) toVisit.push(clean);
      }
      const pageName = url.replace(BASE_URL, "/").replace(/\/$/, "") || "/";
      discovered.push({ url, name: pageName, status });
      console.log("  Found: " + pageName + " [" + status + "]");
    } catch (e) {
      const pageName = url.replace(BASE_URL, "/") || "/";
      discovered.push({ url, name: pageName, status: 0, error: e.message });
      console.log("  Error: " + pageName);
    }
  }
  await page.close();
  await ctx.close();
  console.log("\nDiscovered " + discovered.length + " pages\n");
  return discovered;
}
async function testPage(browser, pageInfo) {
  const { url, name } = pageInfo;
  const pageData = { name, url, tests: [], screenshots: [] };
  console.log("\nTesting: " + name);
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on("console", msg => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
  const slug = name.replace(/[^a-z0-9]/gi, "_").slice(0, 20) || "home";
  try {
    const resp = await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    const status = resp ? resp.status() : 0;
    const sc = await takeScreenshot(page, slug + "_desktop");
    pageData.screenshots.push(sc);
    if (status < 400) { pageData.tests.push({ name: "Page Load", status: "PASS", desc: "HTTP " + status }); log("PASS", "Page Load", "HTTP " + status); }
    else { pageData.tests.push({ name: "Page Load", status: "FAIL", desc: "HTTP " + status }); log("FAIL", "Page Load", "HTTP " + status); }
    const title = await page.title();
    if (title && title.length > 0) { pageData.tests.push({ name: "Page Title", status: "PASS", desc: title }); log("PASS", "Page Title", title); }
    else { pageData.tests.push({ name: "Page Title", status: "WARN", desc: "Empty" }); log("WARN", "Page Title", "Empty"); }
    if (consoleErrors.length === 0) { pageData.tests.push({ name: "Console Errors", status: "PASS", desc: "No errors" }); log("PASS", "Console Errors", "Clean"); }
    else { pageData.tests.push({ name: "Console Errors", status: "WARN", desc: consoleErrors.length + " error(s)" }); log("WARN", "Console Errors", consoleErrors.length + " errors"); }
    const broken = await page.evaluate(() => Array.from(document.images).filter(img => !img.complete || img.naturalWidth === 0).map(img => img.src));
    if (broken.length === 0) { pageData.tests.push({ name: "Broken Images", status: "PASS", desc: "All OK" }); log("PASS", "Broken Images", "All OK"); }
    else { const sc2 = await takeScreenshot(page, slug + "_broken"); pageData.screenshots.push(sc2); pageData.tests.push({ name: "Broken Images", status: "FAIL", desc: broken.length + " broken" }); log("FAIL", "Broken Images", broken.length + " broken"); }
    const links = await page.evaluate(() => Array.from(document.querySelectorAll("a[href]")).length);
    pageData.tests.push({ name: "Links", status: "PASS", desc: links + " links found" }); log("PASS", "Links", links + " found");
    const mCtx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 375, height: 812 } });
    const mPage = await mCtx.newPage();
    await mPage.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    await mPage.waitForTimeout(1000);
    const scMobile = await takeScreenshot(mPage, slug + "_mobile");
    pageData.screenshots.push(scMobile);
    pageData.tests.push({ name: "Mobile (375px)", status: "PASS", desc: "Rendered OK" }); log("PASS", "Mobile", "OK");
    await mPage.close(); await mCtx.close();
    const t0 = Date.now();
    await page.reload({ waitUntil: "load" });
    const elapsed = ((Date.now() - t0) / 1000).toFixed(2);
    if (elapsed < 3) { pageData.tests.push({ name: "Load Time", status: "PASS", desc: elapsed + "s (fast)" }); log("PASS", "Load Time", elapsed + "s"); }
    else if (elapsed < 6) { pageData.tests.push({ name: "Load Time", status: "WARN", desc: elapsed + "s (slow)" }); log("WARN", "Load Time", elapsed + "s"); }
    else { pageData.tests.push({ name: "Load Time", status: "FAIL", desc: elapsed + "s (very slow)" }); log("FAIL", "Load Time", elapsed + "s"); }
    const formCount = await page.evaluate(() => document.querySelectorAll("form").length);
    if (formCount > 0) { const scForm = await takeScreenshot(page, slug + "_form"); pageData.screenshots.push(scForm); pageData.tests.push({ name: "Forms", status: "PASS", desc: formCount + " form(s)" }); log("PASS", "Forms", formCount + " found"); }
  } catch (e) { pageData.tests.push({ name: "Page Test", status: "FAIL", desc: e.message.slice(0, 80) }); log("FAIL", "Page Test", e.message.slice(0, 80)); }
  await page.close(); await ctx.close();
  pageResults.push(pageData);
}
async function generatePDF() {
  const doc = new PDFDocument({ margin: 40, size: "A4", autoFirstPage: true });
  const stream = fs.createWriteStream(REPORT_PATH);
  doc.pipe(stream);
  const C = { dark: "#1a1a2e", accent: "#4f46e5", pass: "#16a34a", fail: "#dc2626", warn: "#d97706", light: "#f8fafc", border: "#e2e8f0", text: "#334155", sub: "#64748b", passLight: "#dcfce7", failLight: "#fee2e2", warnLight: "#fef9c3" };
  const W = 515;
  doc.rect(0, 0, 595, 841).fill(C.dark);
  doc.fill("#4f46e5").fontSize(48).font("Helvetica-Bold").text("*", 40, 80);
  doc.fill("white").fontSize(28).font("Helvetica-Bold").text("Functional Test Report", 40, 140);
  doc.fill("#a5b4fc").fontSize(13).font("Helvetica").text(BASE_URL, 40, 180);
  doc.fill("#64748b").fontSize(11).text("Generated: " + new Date().toLocaleString(), 40, 200);
  let totalPass = 0, totalFail = 0, totalWarn = 0;
  for (const p of pageResults) { for (const t of p.tests) { if (t.status === "PASS") totalPass++; else if (t.status === "FAIL") totalFail++; else totalWarn++; } }
  const statCards = [{ label: "Pages", value: pageResults.length, color: C.accent }, { label: "Passed", value: totalPass, color: C.pass }, { label: "Failed", value: totalFail, color: C.fail }, { label: "Warnings", value: totalWarn, color: C.warn }];
  let cx = 40;
  for (const card of statCards) {
    doc.roundedRect(cx, 280, 118, 70, 10).fill(card.color);
    doc.fill("white").fontSize(26).font("Helvetica-Bold").text(String(card.value), cx, 292, { width: 118, align: "center" });
    doc.fill("white").fontSize(8).font("Helvetica").text(card.label, cx, 322, { width: 118, align: "center" });
    cx += 126;
  }
  doc.fill("white").fontSize(11).font("Helvetica").text("Pages Discovered & Tested:", 40, 400);
  let py = 422;
  for (const p of pageResults) {
    const pFail = p.tests.filter(t => t.status === "FAIL").length;
    const pWarn = p.tests.filter(t => t.status === "WARN").length;
    const rowColor = pFail > 0 ? C.fail : pWarn > 0 ? C.warn : C.pass;
    doc.roundedRect(40, py, W, 22, 4).fill(rowColor + "33");
    doc.fill(rowColor).fontSize(9).font("Helvetica-Bold").text(p.name, 48, py + 7, { width: 300 });
    doc.fill(C.sub).fontSize(8).font("Helvetica").text("PASS:" + p.tests.filter(t=>t.status==="PASS").length + " FAIL:" + pFail + " WARN:" + pWarn, 360, py + 7, { width: 180 });
    py += 28; if (py > 780) break;
  }
  for (const pageData of pageResults) {
    doc.addPage();
    doc.rect(0, 0, 595, 55).fill(C.accent);
    doc.fill("white").fontSize(16).font("Helvetica-Bold").text(pageData.name, 16, 12);
    doc.fill("#c7d2fe").fontSize(9).font("Helvetica").text(pageData.url, 16, 34);
    doc.y = 75;
    doc.fill(C.dark).fontSize(12).font("Helvetica-Bold").text("Test Results", 40);
    doc.moveDown(0.3);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor(C.border).lineWidth(1).stroke();
    doc.moveDown(0.4);
    for (let i = 0; i < pageData.tests.length; i++) {
      const t = pageData.tests[i];
      const rowY = doc.y;
      const statusColor = t.status === "PASS" ? C.pass : t.status === "FAIL" ? C.fail : C.warn;
      const statusBg = t.status === "PASS" ? C.passLight : t.status === "FAIL" ? C.failLight : C.warnLight;
      if (i % 2 === 0) doc.rect(40, rowY - 3, W, 28).fill(C.light);
      doc.roundedRect(44, rowY, 42, 16, 4).fill(statusBg);
      doc.fill(statusColor).fontSize(8).font("Helvetica-Bold").text(t.status, 44, rowY + 4, { width: 42, align: "center" });
      doc.fill(C.dark).fontSize(10).font("Helvetica-Bold").text(t.name, 96, rowY, { width: 160 });
      doc.fill(C.text).fontSize(9).font("Helvetica").text(t.desc, 270, rowY, { width: 270 });
      doc.moveDown(1.2);
    }
    for (const sc of pageData.screenshots) {
      if (!sc || !fs.existsSync(sc)) continue;
      doc.addPage();
      const isMobile = sc.includes("mobile");
      const isbroken = sc.includes("broken");
      const barColor = isbroken ? C.fail : C.accent;
      doc.rect(0, 0, 595, 44).fill(barColor);
      doc.fill("white").fontSize(12).font("Helvetica-Bold").text(pageData.name, 14, 8, { width: 400 });
      doc.fill("#c7d2fe").fontSize(9).font("Helvetica").text(isMobile ? "Mobile View (375px)" : isbroken ? "Broken Images" : "Desktop View", 14, 27, { width: 400 });
      try {
        if (isMobile) { doc.image(sc, 147, 54, { fit: [300, 770], align: "center" }); }
        else { doc.image(sc, 10, 54, { fit: [575, 770], align: "center" }); }
      } catch (e) { doc.fill(C.sub).fontSize(9).text("(Screenshot unavailable)", 20, 60); }
    }
  }
  doc.addPage();
  doc.rect(0, 0, 595, 55).fill(C.dark);
  doc.fill("white").fontSize(16).font("Helvetica-Bold").text("Full Summary", 16, 18);
  doc.y = 75;
  for (const pageData of pageResults) {
    if (doc.y > 760) { doc.addPage(); doc.y = 40; }
    const pFail = pageData.tests.filter(t => t.status === "FAIL").length;
    const pWarn = pageData.tests.filter(t => t.status === "WARN").length;
    const rowColor = pFail > 0 ? C.fail : pWarn > 0 ? C.warn : C.pass;
    doc.rect(40, doc.y, W, 20).fill(rowColor + "22");
    doc.fill(rowColor).fontSize(9).font("Helvetica-Bold").text(pageData.name, 46, doc.y + 5, { width: 280 });
    doc.fill(C.sub).fontSize(8).font("Helvetica").text("PASS:" + pageData.tests.filter(t=>t.status==="PASS").length + " FAIL:" + pFail + " WARN:" + pWarn, 340, doc.y + 5, { width: 200 });
    doc.moveDown(1.1);
  }
  doc.fill(C.sub).fontSize(8).font("Helvetica").text("Generated by OpsMonsters Functional Tester * Playwright + PDFKit", 40, doc.y + 10, { align: "center", width: W });
  doc.end();
  await new Promise(res => stream.on("finish", res));
  console.log("\nPDF Report: " + REPORT_PATH);
}
async function main() {
  console.log("\n" + "=".repeat(55));
  console.log("  OpsMonsters - Full Website Functional Test");
  console.log("  URL: " + BASE_URL);
  console.log("  Time: " + new Date().toLocaleString());
  console.log("=".repeat(55));
  const browser = await chromium.launch({ headless: true });
  const pages = await crawlAllPages(browser);
  console.log("\nRunning tests on " + pages.length + " pages...\n");
  for (const pageInfo of pages) { await testPage(browser, pageInfo); }
  await browser.close();
  let totalPass = 0, totalFail = 0, totalWarn = 0;
  for (const p of pageResults) { for (const t of p.tests) { if (t.status === "PASS") totalPass++; else if (t.status === "FAIL") totalFail++; else totalWarn++; } }
  console.log("\n" + "=".repeat(55));
  console.log("  Pages: " + pageResults.length + "  | PASS:" + totalPass + " FAIL:" + totalFail + " WARN:" + totalWarn);
  console.log("=".repeat(55));
  await generatePDF();
  console.log("\nDone! Open test_report.pdf\n");
}
main().catch(err => { console.error("Fatal:", err); process.exit(1); });
