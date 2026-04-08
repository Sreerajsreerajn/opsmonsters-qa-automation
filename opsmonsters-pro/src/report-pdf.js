// ============================================================
//  OpsMonsters Test Suite — PDF Report Generator v2.0
// ============================================================

const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const config = require("../config/config");

const REPORT_DIR = path.resolve(config.report.outputDir);

const C = {
  dark: "#0f172a", darkMid: "#1e293b", accent: "#4f46e5", accentLight: "#c7d2fe",
  pass: "#16a34a", fail: "#dc2626", warn: "#d97706",
  p1: "#7f1d1d", p2: "#dc2626", p3: "#d97706", p4: "#2563eb",
  light: "#f8fafc", border: "#e2e8f0", text: "#1e293b", sub: "#64748b",
  white: "white",
  passLight: "#dcfce7", failLight: "#fee2e2", warnLight: "#fef9c3",
};
const PW = 595, PH = 841, M = 40, W = PW - M * 2;

function getPriority(severity) {
  const map = {
    Critical: { label: "P1 - Critical", color: C.p1 },
    High:     { label: "P2 - High",     color: C.p2 },
    Medium:   { label: "P3 - Medium",   color: C.p3 },
    Low:      { label: "P4 - Low",      color: C.p4 },
  };
  return map[severity] || map.Low;
}

function statusColor(s) {
  return s === "PASS" ? C.pass : s === "FAIL" ? C.fail : C.warn;
}

async function generatePDF(allSiteResults) {
  const outputPath = path.join(REPORT_DIR, config.report.filename + ".pdf");
  const doc = new PDFDocument({ margin: 0, size: "A4", autoFirstPage: true });
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  for (const site of allSiteResults) {
    const allBugs = site.allBugs;

    // ════════════════════════════════════════
    // COVER PAGE
    // ════════════════════════════════════════
    if (allSiteResults.indexOf(site) > 0) doc.addPage();

    doc.rect(0, 0, PW, PH).fill(C.dark);
    doc.rect(0, 0, PW, 5).fill(C.accent);

    // Title
    doc.fill(C.accent).fontSize(72).font("Helvetica-Bold").text("BUG", M, 70);
    doc.fill(C.white).fontSize(72).font("Helvetica-Bold").text("REPORT", M, 150);
    doc.rect(M, 238, 100, 4).fill(C.accent);

    doc.fill(C.accentLight).fontSize(14).font("Helvetica-Bold").text(site.name, M, 256);
    doc.fill(C.sub).fontSize(10).font("Helvetica")
      .text("URL: " + site.baseUrl, M, 278)
      .text("Date: " + new Date(site.startTime).toLocaleString(), M, 294)
      .text("Duration: " + site.duration + "s", M, 310)
      .text("Prepared by: " + config.report.preparedBy, M, 326)
      .text("Tool: OpsMonsters Test Suite v2.0 (Playwright)", M, 342);

    // Priority guide
    doc.fill(C.white).fontSize(12).font("Helvetica-Bold").text("Priority Guide", M, 388);
    const priorities = [
      { label: "P1 — Critical", sub: "Blocker. Must fix immediately.", color: C.p1 },
      { label: "P2 — High",     sub: "Major impact. Fix before release.", color: C.p2 },
      { label: "P3 — Medium",   sub: "Notable issue. Fix in next sprint.", color: C.p3 },
      { label: "P4 — Low",      sub: "Minor issue. Fix when possible.", color: C.p4 },
    ];
    let py = 410;
    for (const p of priorities) {
      doc.rect(M, py, 8, 30).fill(p.color);
      doc.fill(C.white).fontSize(10).font("Helvetica-Bold").text(p.label, M + 16, py + 4);
      doc.fill(C.sub).fontSize(8).font("Helvetica").text(p.sub, M + 16, py + 18);
      py += 40;
    }

    // Stats cards
    doc.fill(C.white).fontSize(12).font("Helvetica-Bold").text("Summary", M, 574);
    const cards = [
      { label: "Pages",   value: site.summary.pages,  color: C.accent },
      { label: "Bugs",    value: allBugs.length,        color: C.p2     },
      { label: "Passed",  value: site.summary.pass,    color: C.pass   },
      { label: "Failed",  value: site.summary.fail,    color: C.fail   },
      { label: "Warnings",value: site.summary.warn,    color: C.warn   },
    ];
    let cx = M;
    for (const card of cards) {
      doc.roundedRect(cx, 594, 95, 62, 8).fill(card.color);
      doc.fill(C.white).fontSize(24).font("Helvetica-Bold").text(String(card.value), cx, 603, { width: 95, align: "center" });
      doc.fill(C.white).fontSize(7).font("Helvetica").text(card.label, cx, 632, { width: 95, align: "center" });
      cx += 103;
    }

    // Bug severity
    doc.fill(C.white).fontSize(12).font("Helvetica-Bold").text("Bugs by Priority", M, 672);
    const sevCards = [
      { label: "P1 Critical", value: allBugs.filter(b => b.severity === "Critical").length, color: C.p1 },
      { label: "P2 High",     value: allBugs.filter(b => b.severity === "High").length,     color: C.p2 },
      { label: "P3 Medium",   value: allBugs.filter(b => b.severity === "Medium").length,   color: C.p3 },
      { label: "P4 Low",      value: allBugs.filter(b => b.severity === "Low").length,      color: C.p4 },
    ];
    cx = M;
    for (const s of sevCards) {
      doc.roundedRect(cx, 692, 118, 56, 8).fill(s.color);
      doc.fill(C.white).fontSize(22).font("Helvetica-Bold").text(String(s.value), cx, 700, { width: 118, align: "center" });
      doc.fill(C.white).fontSize(8).font("Helvetica").text(s.label, cx, 726, { width: 118, align: "center" });
      cx += 126;
    }

    doc.rect(0, PH - 32, PW, 32).fill(C.darkMid);
    doc.fill(C.sub).fontSize(8).font("Helvetica")
      .text("CONFIDENTIAL — For Developer / QA use only  |  " + config.report.company, M, PH - 18, { width: W, align: "center" });

    // ════════════════════════════════════════
    // BUG INDEX PAGE
    // ════════════════════════════════════════
    doc.addPage();
    doc.rect(0, 0, PW, 56).fill(C.dark);
    doc.rect(0, 0, PW, 4).fill(C.accent);
    doc.fill(C.white).fontSize(18).font("Helvetica-Bold").text("Bug Index — " + site.name, M, 16);
    doc.fill(C.sub).fontSize(9).font("Helvetica").text(allBugs.length + " bugs across " + site.summary.pages + " pages", M, 38);

    // Table header
    doc.rect(M, 64, W, 22).fill(C.accent);
    doc.fill(C.white).fontSize(8).font("Helvetica-Bold")
      .text("ID",       M + 4,   70)
      .text("PRIORITY", M + 52,  70)
      .text("TITLE",    M + 138, 70)
      .text("CATEGORY", M + 360, 70)
      .text("PAGE",     M + 440, 70);

    let iy = 88;
    for (let i = 0; i < allBugs.length; i++) {
      const bug = allBugs[i];
      if (iy > 800) { doc.addPage(); iy = 30; }
      const pr = getPriority(bug.severity);
      doc.rect(M, iy, W, 24).fill(i % 2 === 0 ? "#f8fafc" : "white");
      doc.rect(M, iy, 3, 24).fill(pr.color);
      doc.fill(C.sub).fontSize(7).font("Helvetica-Bold").text(bug.id, M + 6, iy + 8, { width: 42 });
      doc.roundedRect(M + 50, iy + 5, 82, 14, 3).fill(pr.color);
      doc.fill(C.white).fontSize(6.5).font("Helvetica-Bold").text(pr.label, M + 50, iy + 9, { width: 82, align: "center" });
      doc.fill(C.text).fontSize(8).font("Helvetica").text(bug.title.slice(0, 44), M + 138, iy + 8, { width: 216 });
      doc.fill(C.sub).fontSize(7).font("Helvetica").text((bug.category || "").slice(0, 16), M + 360, iy + 8, { width: 76 });
      doc.fill(C.sub).fontSize(7).font("Helvetica").text(bug.page.slice(0, 18), M + 440, iy + 8, { width: 110 });
      iy += 26;
    }

    // ════════════════════════════════════════
    // PER-BUG DETAIL PAGES
    // ════════════════════════════════════════
    for (const bug of allBugs) {
      doc.addPage();
      const pr = getPriority(bug.severity);

      // Header
      doc.rect(0, 0, PW, 66).fill(pr.color);
      doc.rect(0, 0, PW, 4).fill(pr.color);
      doc.fill(C.white).fontSize(8).font("Helvetica").text(bug.id + "  |  " + site.name, M, 12);
      doc.fill(C.white).fontSize(15).font("Helvetica-Bold").text(bug.title, M, 26, { width: PW - M * 2 - 110 });
      // Priority badge
      doc.roundedRect(PW - M - 105, 16, 105, 34, 6).fill("rgba(0,0,0,0.25)");
      doc.fill(C.white).fontSize(10).font("Helvetica-Bold").text(pr.label, PW - M - 105, 26, { width: 105, align: "center" });

      doc.y = 80;

      const fields = [
        { label: "PAGE",               value: bug.page + "\n" + bug.url },
        { label: "DESCRIPTION",        value: bug.desc },
        { label: "STEPS TO REPRODUCE", value: bug.steps },
        { label: "EXPECTED RESULT",    value: bug.expected },
        { label: "ACTUAL RESULT",      value: bug.actual },
      ];

      for (const field of fields) {
        if (doc.y > 570) break;
        const fieldY = doc.y;
        doc.rect(M, fieldY, W, 1).fill(C.border);
        doc.y = fieldY + 7;
        doc.fill(C.sub).fontSize(7).font("Helvetica-Bold").text(field.label, M, doc.y, { width: 110 });
        const lines = field.value.split("\n").length;
        const vh = Math.max(16, lines * 13 + 6);
        doc.fill(C.text).fontSize(9).font("Helvetica").text(field.value || "—", M + 115, fieldY + 7, { width: W - 115 });
        doc.y = fieldY + vh + 10;
      }

      // Screenshot
      if (bug.screenshot && fs.existsSync(bug.screenshot)) {
        const scY = doc.y + 10;
        if (scY < 640) {
          doc.rect(M, scY - 4, W, 1).fill(C.border);
          doc.fill(C.sub).fontSize(7).font("Helvetica-Bold").text("SCREENSHOT", M, scY + 4);
          const maxH = PH - scY - 50;
          try {
            doc.image(bug.screenshot, M, scY + 18, { fit: [W, maxH], align: "center" });
          } catch (e) {}
        }
      }

      // Footer
      doc.rect(0, PH - 26, PW, 26).fill("#f1f5f9");
      doc.fill(C.sub).fontSize(7).font("Helvetica")
        .text(bug.id + "  |  " + pr.label + "  |  " + bug.page + "  |  " + new Date(bug.timestamp).toLocaleString(), M, PH - 16, { width: W });
    }

    // ════════════════════════════════════════
    // SCREENSHOT PAGES
    // ════════════════════════════════════════
    for (const pageData of site.pages) {
      for (const sc of pageData.screenshots) {
        if (!sc || !sc.path || !fs.existsSync(sc.path)) continue;
        doc.addPage();
        const barColor = sc.type === "broken" ? C.fail
          : sc.type === "mobile"  ? "#0891b2"
          : sc.type === "tablet"  ? "#0e7490"
          : sc.type === "form"    ? C.pass
          : sc.type === "error"   ? C.p1
          : C.accent;

        doc.rect(0, 0, PW, 46).fill(barColor);
        doc.fill(C.white).fontSize(13).font("Helvetica-Bold").text(pageData.name, M, 9, { width: W });
        doc.fill(C.accentLight).fontSize(9).font("Helvetica").text(sc.label + "  |  " + pageData.url, M, 28, { width: W });

        try {
          if (sc.type === "mobile") {
            doc.image(sc.path, 148, 54, { fit: [300, PH - 76], align: "center" });
          } else {
            doc.image(sc.path, M - 10, 54, { fit: [PW - M, PH - 74], align: "center" });
          }
        } catch (e) {
          doc.fill(C.sub).fontSize(9).text("(Screenshot unavailable)", M, 70);
        }

        doc.rect(0, PH - 22, PW, 22).fill("#f1f5f9");
        doc.fill(C.sub).fontSize(7).font("Helvetica")
          .text(pageData.name + "  |  " + sc.label + "  |  " + new Date().toLocaleDateString(), M, PH - 12, { width: W });
      }
    }

    // ════════════════════════════════════════
    // SUMMARY TABLE
    // ════════════════════════════════════════
    doc.addPage();
    doc.rect(0, 0, PW, 56).fill(C.dark);
    doc.rect(0, 0, PW, 4).fill(C.accent);
    doc.fill(C.white).fontSize(18).font("Helvetica-Bold").text("Page Summary — " + site.name, M, 16);
    doc.fill(C.sub).fontSize(9).font("Helvetica").text(site.summary.pages + " pages tested", M, 38);

    doc.rect(M, 64, W, 22).fill(C.accent);
    doc.fill(C.white).fontSize(8).font("Helvetica-Bold")
      .text("PAGE",    M + 4,   70)
      .text("BUGS",    M + 254, 70)
      .text("PASS",    M + 308, 70)
      .text("FAIL",    M + 352, 70)
      .text("WARN",    M + 396, 70)
      .text("STATUS",  M + 446, 70);

    let sy = 90;
    for (const pd of site.pages) {
      if (sy > 780) { doc.addPage(); sy = 40; }
      const pFail = pd.summary.fail, pWarn = pd.summary.warn, pPass = pd.summary.pass;
      const st = pFail > 0 ? "FAIL" : pWarn > 0 ? "WARN" : "PASS";
      const sc = pFail > 0 ? C.fail : pWarn > 0 ? C.warn : C.pass;
      const bg = pFail > 0 ? "#fff5f5" : pWarn > 0 ? "#fffbeb" : "#f0fdf4";
      doc.rect(M, sy, W, 26).fill(bg);
      doc.rect(M, sy, 3, 26).fill(sc);
      doc.fill(C.text).fontSize(9).font("Helvetica-Bold").text(pd.name, M + 8, sy + 8, { width: 240 });
      doc.fill(C.fail).fontSize(9).font("Helvetica-Bold").text(String(pd.bugs.length), M + 257, sy + 8, { width: 44, align: "center" });
      doc.fill(C.pass).fontSize(9).font("Helvetica").text(String(pPass), M + 312, sy + 8, { width: 34, align: "center" });
      doc.fill(C.fail).fontSize(9).font("Helvetica").text(String(pFail), M + 356, sy + 8, { width: 34, align: "center" });
      doc.fill(C.warn).fontSize(9).font("Helvetica").text(String(pWarn), M + 400, sy + 8, { width: 34, align: "center" });
      doc.roundedRect(M + 442, sy + 6, 52, 14, 3).fill(sc);
      doc.fill(C.white).fontSize(7).font("Helvetica-Bold").text(st, M + 442, sy + 10, { width: 52, align: "center" });
      sy += 30;
    }

    doc.rect(0, PH - 26, PW, 26).fill("#f1f5f9");
    doc.fill(C.sub).fontSize(7).font("Helvetica")
      .text("OpsMonsters Test Suite v2.0  |  Playwright + PDFKit  |  " + new Date().toLocaleString(), M, PH - 16, { width: W, align: "center" });
  }

  doc.end();
  await new Promise(res => stream.on("finish", res));
  console.log("  ✅ PDF Report: " + outputPath);
}

module.exports = { generatePDF };
