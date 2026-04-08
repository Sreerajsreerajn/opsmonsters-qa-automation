// ============================================================
//  OpsMonsters Test Suite — HTML Report Generator v2.0
// ============================================================

const fs = require("fs");
const path = require("path");
const config = require("../config/config");

const REPORT_DIR = path.resolve(config.report.outputDir);

function getPriority(severity) {
  const map = {
    Critical: { label: "P1", full: "P1 - Critical", color: "#7f1d1d", bg: "#fef2f2", badge: "#dc2626" },
    High:     { label: "P2", full: "P2 - High",     color: "#dc2626", bg: "#fee2e2", badge: "#ef4444" },
    Medium:   { label: "P3", full: "P3 - Medium",   color: "#d97706", bg: "#fef9c3", badge: "#f59e0b" },
    Low:      { label: "P4", full: "P4 - Low",      color: "#2563eb", bg: "#eff6ff", badge: "#3b82f6" },
  };
  return map[severity] || map.Low;
}

async function generateHTML(allSiteResults) {
  const outputPath = path.join(REPORT_DIR, config.report.filename + ".html");

  let allBugsGlobal = [];
  let totalPass = 0, totalFail = 0, totalWarn = 0, totalPages = 0;
  for (const site of allSiteResults) {
    allBugsGlobal.push(...site.allBugs);
    totalPass += site.summary.pass;
    totalFail += site.summary.fail;
    totalWarn += site.summary.warn;
    totalPages += site.summary.pages;
  }

  const bugsHTML = allBugsGlobal.map(bug => {
    const pr = getPriority(bug.severity);
    const scPath = bug.screenshot ? path.relative(REPORT_DIR, bug.screenshot).replace(/\\/g, "/") : null;
    return `
    <div class="bug-card" data-severity="${bug.severity}" data-page="${bug.page}" data-category="${bug.category || ''}">
      <div class="bug-header" style="background:${pr.color}">
        <div class="bug-header-left">
          <span class="bug-id">${bug.id}</span>
          <span class="bug-title">${bug.title}</span>
        </div>
        <span class="priority-badge">${pr.full}</span>
      </div>
      <div class="bug-body">
        <div class="bug-meta">
          <span class="meta-tag">📄 ${bug.page}</span>
          <span class="meta-tag">🔗 ${bug.url}</span>
          ${bug.category ? `<span class="meta-tag">🏷️ ${bug.category}</span>` : ""}
        </div>
        <div class="bug-fields">
          <div class="field"><span class="field-label">Description</span><p>${bug.desc}</p></div>
          <div class="field"><span class="field-label">Steps to Reproduce</span><pre>${bug.steps}</pre></div>
          <div class="field two-col">
            <div><span class="field-label">Expected</span><p class="expected">${bug.expected}</p></div>
            <div><span class="field-label">Actual</span><p class="actual">${bug.actual}</p></div>
          </div>
          ${scPath ? `<div class="field"><span class="field-label">Screenshot</span><img class="bug-screenshot" src="../${scPath}" alt="Bug screenshot" loading="lazy" onclick="openLightbox(this.src)"/></div>` : ""}
        </div>
      </div>
    </div>`;
  }).join("\n");

  const pagesHTML = allSiteResults.map(site =>
    site.pages.map(pg => {
      const cats = Object.entries(pg.categories || {});
      return `
    <div class="page-card" data-status="${pg.summary.fail > 0 ? 'fail' : pg.summary.warn > 0 ? 'warn' : 'pass'}">
      <div class="page-header">
        <div>
          <span class="page-name">${pg.name}</span>
          <span class="page-url">${pg.url}</span>
        </div>
        <div class="page-stats">
          <span class="stat pass">✅ ${pg.summary.pass}</span>
          <span class="stat fail">❌ ${pg.summary.fail}</span>
          <span class="stat warn">⚠️ ${pg.summary.warn}</span>
          <span class="stat bugs">🐛 ${pg.bugs.length} bugs</span>
        </div>
      </div>
      <div class="category-breakdown">
        ${cats.map(([cat, s]) => `
          <div class="cat-row">
            <span class="cat-name">${cat}</span>
            <div class="cat-bars">
              ${s.pass > 0 ? `<span class="bar pass-bar" style="width:${Math.max(s.pass*20,20)}px">${s.pass} pass</span>` : ""}
              ${s.fail > 0 ? `<span class="bar fail-bar" style="width:${Math.max(s.fail*20,20)}px">${s.fail} fail</span>` : ""}
              ${s.warn > 0 ? `<span class="bar warn-bar" style="width:${Math.max(s.warn*20,20)}px">${s.warn} warn</span>` : ""}
            </div>
          </div>`).join("")}
      </div>
      ${pg.screenshots.length > 0 ? `
      <div class="screenshots-row">
        ${pg.screenshots.map(sc => {
          const rel = sc.path ? path.relative(REPORT_DIR, sc.path).replace(/\\/g, "/") : null;
          return rel ? `<div class="thumb-wrap"><img src="../${rel}" class="thumb" title="${sc.label}" loading="lazy" onclick="openLightbox(this.src)"/><span class="thumb-label">${sc.label}</span></div>` : "";
        }).join("")}
      </div>` : ""}
    </div>`;
    }).join("\n")
  ).join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Bug Report — ${allSiteResults.map(s=>s.name).join(", ")}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --dark: #0f172a; --accent: #4f46e5; --pass: #16a34a; --fail: #dc2626; --warn: #d97706;
    --p1: #7f1d1d; --p2: #dc2626; --p3: #d97706; --p4: #2563eb;
    --bg: #f8fafc; --card: #ffffff; --border: #e2e8f0; --text: #1e293b; --sub: #64748b;
  }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: var(--bg); color: var(--text); }

  /* HEADER */
  .header { background: var(--dark); padding: 28px 40px; border-bottom: 4px solid var(--accent); }
  .header h1 { color: white; font-size: 28px; font-weight: 800; }
  .header h1 span { color: var(--accent); }
  .header-meta { color: #94a3b8; font-size: 13px; margin-top: 6px; }

  /* NAV TABS */
  .tabs { background: white; border-bottom: 1px solid var(--border); display: flex; padding: 0 40px; position: sticky; top: 0; z-index: 100; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
  .tab { padding: 14px 20px; cursor: pointer; font-size: 13px; font-weight: 600; color: var(--sub); border-bottom: 3px solid transparent; transition: all 0.2s; white-space: nowrap; }
  .tab:hover { color: var(--accent); }
  .tab.active { color: var(--accent); border-bottom-color: var(--accent); }

  /* MAIN LAYOUT */
  .container { max-width: 1400px; margin: 0 auto; padding: 32px 40px; }
  .section { display: none; }
  .section.active { display: block; }

  /* STAT CARDS */
  .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-bottom: 32px; }
  .stat-card { background: var(--card); border-radius: 12px; padding: 20px; text-align: center; border: 1px solid var(--border); box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
  .stat-card .num { font-size: 36px; font-weight: 800; margin-bottom: 4px; }
  .stat-card .lbl { font-size: 11px; color: var(--sub); text-transform: uppercase; letter-spacing: 0.05em; }
  .stat-card.accent .num { color: var(--accent); }
  .stat-card.pass .num   { color: var(--pass); }
  .stat-card.fail .num   { color: var(--fail); }
  .stat-card.warn .num   { color: var(--warn); }
  .stat-card.p1 .num     { color: var(--p1); }

  /* FILTERS */
  .filters { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 24px; align-items: center; }
  .filter-btn { padding: 7px 16px; border-radius: 20px; border: 1.5px solid var(--border); background: white; cursor: pointer; font-size: 12px; font-weight: 600; color: var(--sub); transition: all 0.2s; }
  .filter-btn:hover, .filter-btn.active { background: var(--accent); color: white; border-color: var(--accent); }
  .filter-btn.p1.active { background: var(--p1); border-color: var(--p1); }
  .filter-btn.p2.active { background: var(--p2); border-color: var(--p2); }
  .filter-btn.p3.active { background: var(--p3); border-color: var(--p3); }
  .filter-btn.p4.active { background: var(--p4); border-color: var(--p4); }
  .search-box { padding: 7px 14px; border: 1.5px solid var(--border); border-radius: 20px; font-size: 12px; width: 220px; outline: none; }
  .search-box:focus { border-color: var(--accent); }
  .count-badge { margin-left: auto; font-size: 12px; color: var(--sub); }

  /* BUG CARDS */
  .bug-card { background: var(--card); border-radius: 12px; border: 1px solid var(--border); margin-bottom: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06); transition: box-shadow 0.2s; }
  .bug-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
  .bug-card.hidden { display: none; }
  .bug-header { padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .bug-header-left { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
  .bug-id { color: rgba(255,255,255,0.7); font-size: 11px; font-weight: 700; white-space: nowrap; }
  .bug-title { color: white; font-size: 14px; font-weight: 700; }
  .priority-badge { background: rgba(0,0,0,0.25); color: white; padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; white-space: nowrap; }
  .bug-body { padding: 16px 18px; }
  .bug-meta { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
  .meta-tag { background: var(--bg); border: 1px solid var(--border); border-radius: 6px; padding: 3px 10px; font-size: 11px; color: var(--sub); }
  .bug-fields { display: flex; flex-direction: column; gap: 14px; }
  .field { }
  .field-label { display: inline-block; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--sub); margin-bottom: 6px; }
  .field p, .field pre { font-size: 13px; color: var(--text); line-height: 1.6; }
  .field pre { background: var(--bg); padding: 10px 14px; border-radius: 8px; border: 1px solid var(--border); white-space: pre-wrap; font-family: inherit; }
  .field.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .expected { color: var(--pass) !important; }
  .actual { color: var(--fail) !important; }
  .bug-screenshot { width: 100%; max-height: 400px; object-fit: contain; border-radius: 8px; border: 1px solid var(--border); cursor: zoom-in; margin-top: 4px; }

  /* PAGE CARDS */
  .page-card { background: var(--card); border-radius: 12px; border: 1px solid var(--border); margin-bottom: 20px; overflow: hidden; }
  .page-card.hidden { display: none; }
  .page-header { padding: 16px 20px; display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; border-bottom: 1px solid var(--border); }
  .page-name { font-size: 15px; font-weight: 700; display: block; }
  .page-url { font-size: 11px; color: var(--sub); }
  .page-stats { display: flex; gap: 10px; flex-wrap: wrap; }
  .stat { font-size: 12px; font-weight: 600; }
  .stat.pass { color: var(--pass); }
  .stat.fail { color: var(--fail); }
  .stat.warn { color: var(--warn); }
  .stat.bugs { color: var(--accent); }
  .category-breakdown { padding: 14px 20px; display: flex; flex-direction: column; gap: 8px; }
  .cat-row { display: flex; align-items: center; gap: 12px; }
  .cat-name { font-size: 11px; font-weight: 600; color: var(--sub); width: 110px; text-align: right; }
  .cat-bars { display: flex; gap: 4px; align-items: center; }
  .bar { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; color: white; white-space: nowrap; }
  .pass-bar { background: var(--pass); }
  .fail-bar { background: var(--fail); }
  .warn-bar { background: var(--warn); }
  .screenshots-row { padding: 12px 20px; display: flex; gap: 12px; overflow-x: auto; border-top: 1px solid var(--border); background: var(--bg); }
  .thumb-wrap { display: flex; flex-direction: column; align-items: center; gap: 4px; flex-shrink: 0; }
  .thumb { width: 160px; height: 100px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border); cursor: zoom-in; }
  .thumb-label { font-size: 9px; color: var(--sub); text-align: center; max-width: 160px; }

  /* LIGHTBOX */
  .lightbox { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.92); z-index: 9999; align-items: center; justify-content: center; }
  .lightbox.open { display: flex; }
  .lightbox img { max-width: 92vw; max-height: 92vh; border-radius: 8px; object-fit: contain; }
  .lightbox-close { position: absolute; top: 20px; right: 28px; color: white; font-size: 36px; cursor: pointer; font-weight: 300; line-height: 1; }

  /* PRIORITY LEGEND */
  .legend { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 24px; }
  .legend-item { display: flex; align-items: center; gap: 8px; font-size: 12px; }
  .legend-dot { width: 12px; height: 12px; border-radius: 50%; }

  @media (max-width: 768px) {
    .container { padding: 20px; }
    .field.two-col { grid-template-columns: 1fr; }
    .stats-grid { grid-template-columns: repeat(2, 1fr); }
  }
</style>
</head>
<body>

<div class="header">
  <h1><span>BUG</span> REPORT — ${allSiteResults.map(s => s.name).join(" & ")}</h1>
  <div class="header-meta">
    Generated: ${new Date().toLocaleString()} &nbsp;|&nbsp;
    Tool: OpsMonsters Test Suite v2.0 (Playwright) &nbsp;|&nbsp;
    Prepared by: ${config.report.preparedBy}
  </div>
</div>

<div class="tabs">
  <div class="tab active" onclick="switchTab('dashboard')">📊 Dashboard</div>
  <div class="tab" onclick="switchTab('bugs')">🐛 Bugs (${allBugsGlobal.length})</div>
  <div class="tab" onclick="switchTab('pages')">📄 Pages (${totalPages})</div>
</div>

<!-- DASHBOARD -->
<div class="section active" id="section-dashboard">
<div class="container">
  <div class="stats-grid">
    <div class="stat-card accent"><div class="num">${totalPages}</div><div class="lbl">Pages Tested</div></div>
    <div class="stat-card fail"><div class="num">${allBugsGlobal.length}</div><div class="lbl">Total Bugs</div></div>
    <div class="stat-card pass"><div class="num">${totalPass}</div><div class="lbl">Tests Passed</div></div>
    <div class="stat-card fail"><div class="num">${totalFail}</div><div class="lbl">Tests Failed</div></div>
    <div class="stat-card warn"><div class="num">${totalWarn}</div><div class="lbl">Warnings</div></div>
  </div>

  <h2 style="margin-bottom:16px;font-size:16px">Bugs by Priority</h2>
  <div class="stats-grid">
    <div class="stat-card p1"><div class="num" style="color:var(--p1)">${allBugsGlobal.filter(b=>b.severity==="Critical").length}</div><div class="lbl">P1 Critical</div></div>
    <div class="stat-card"><div class="num" style="color:var(--p2)">${allBugsGlobal.filter(b=>b.severity==="High").length}</div><div class="lbl">P2 High</div></div>
    <div class="stat-card"><div class="num" style="color:var(--p3)">${allBugsGlobal.filter(b=>b.severity==="Medium").length}</div><div class="lbl">P3 Medium</div></div>
    <div class="stat-card"><div class="num" style="color:var(--p4)">${allBugsGlobal.filter(b=>b.severity==="Low").length}</div><div class="lbl">P4 Low</div></div>
  </div>

  <h2 style="margin-bottom:16px;font-size:16px">Sites Tested</h2>
  ${allSiteResults.map(site => `
  <div style="background:white;border-radius:12px;border:1px solid var(--border);padding:20px;margin-bottom:16px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <div>
        <div style="font-weight:700;font-size:15px">${site.name}</div>
        <div style="font-size:12px;color:var(--sub)">${site.baseUrl} &nbsp;|&nbsp; ${site.duration}s &nbsp;|&nbsp; ${site.summary.pages} pages</div>
      </div>
      <div style="display:flex;gap:12px">
        <span style="color:var(--pass);font-weight:700">✅ ${site.summary.pass}</span>
        <span style="color:var(--fail);font-weight:700">❌ ${site.summary.fail}</span>
        <span style="color:var(--warn);font-weight:700">⚠️ ${site.summary.warn}</span>
        <span style="color:var(--accent);font-weight:700">🐛 ${site.allBugs.length}</span>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px">
      ${site.pages.map(pg => {
        const st = pg.summary.fail>0 ? "fail" : pg.summary.warn>0 ? "warn" : "pass";
        const col = pg.summary.fail>0 ? "#fee2e2" : pg.summary.warn>0 ? "#fef9c3" : "#dcfce7";
        const tcol = pg.summary.fail>0 ? "var(--fail)" : pg.summary.warn>0 ? "var(--warn)" : "var(--pass)";
        return `<div style="background:${col};border-radius:8px;padding:8px 12px;font-size:12px">
          <div style="font-weight:700;color:${tcol}">${pg.name}</div>
          <div style="color:var(--sub);font-size:11px">${pg.bugs.length} bugs · ${pg.summary.fail} fail · ${pg.summary.warn} warn</div>
        </div>`;
      }).join("")}
    </div>
  </div>`).join("")}
</div>
</div>

<!-- BUGS -->
<div class="section" id="section-bugs">
<div class="container">
  <div class="legend">
    <div class="legend-item"><div class="legend-dot" style="background:var(--p1)"></div> P1 Critical</div>
    <div class="legend-item"><div class="legend-dot" style="background:var(--p2)"></div> P2 High</div>
    <div class="legend-item"><div class="legend-dot" style="background:var(--p3)"></div> P3 Medium</div>
    <div class="legend-item"><div class="legend-dot" style="background:var(--p4)"></div> P4 Low</div>
  </div>
  <div class="filters">
    <button class="filter-btn active" onclick="filterBugs('all',this)">All (${allBugsGlobal.length})</button>
    <button class="filter-btn p1" onclick="filterBugs('Critical',this)">P1 Critical (${allBugsGlobal.filter(b=>b.severity==="Critical").length})</button>
    <button class="filter-btn p2" onclick="filterBugs('High',this)">P2 High (${allBugsGlobal.filter(b=>b.severity==="High").length})</button>
    <button class="filter-btn p3" onclick="filterBugs('Medium',this)">P3 Medium (${allBugsGlobal.filter(b=>b.severity==="Medium").length})</button>
    <button class="filter-btn p4" onclick="filterBugs('Low',this)">P4 Low (${allBugsGlobal.filter(b=>b.severity==="Low").length})</button>
    <input class="search-box" type="text" placeholder="🔍 Search bugs..." oninput="searchBugs(this.value)"/>
    <span class="count-badge" id="bug-count">${allBugsGlobal.length} bugs</span>
  </div>
  <div id="bugs-list">${bugsHTML}</div>
</div>
</div>

<!-- PAGES -->
<div class="section" id="section-pages">
<div class="container">
  <div class="filters">
    <button class="filter-btn active" onclick="filterPages('all',this)">All Pages (${totalPages})</button>
    <button class="filter-btn p2" onclick="filterPages('fail',this)">❌ Failed</button>
    <button class="filter-btn p3" onclick="filterPages('warn',this)">⚠️ Warnings</button>
    <button class="filter-btn" style="--accent:var(--pass)" onclick="filterPages('pass',this)">✅ Passed</button>
  </div>
  <div id="pages-list">${pagesHTML}</div>
</div>
</div>

<!-- LIGHTBOX -->
<div class="lightbox" id="lightbox" onclick="closeLightbox()">
  <span class="lightbox-close">&times;</span>
  <img id="lightbox-img" src="" alt=""/>
</div>

<script>
function switchTab(name) {
  document.querySelectorAll(".tab").forEach((t,i) => t.classList.remove("active"));
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  const tabs = ["dashboard","bugs","pages"];
  document.querySelectorAll(".tab")[tabs.indexOf(name)].classList.add("active");
  document.getElementById("section-"+name).classList.add("active");
}

let currentFilter = "all";
let currentSearch = "";

function filterBugs(severity, btn) {
  currentFilter = severity;
  document.querySelectorAll("#section-bugs .filter-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  applyBugFilters();
}

function searchBugs(val) {
  currentSearch = val.toLowerCase();
  applyBugFilters();
}

function applyBugFilters() {
  const cards = document.querySelectorAll(".bug-card");
  let visible = 0;
  cards.forEach(card => {
    const severityMatch = currentFilter === "all" || card.dataset.severity === currentFilter;
    const searchMatch = !currentSearch ||
      card.textContent.toLowerCase().includes(currentSearch);
    if (severityMatch && searchMatch) {
      card.classList.remove("hidden");
      visible++;
    } else {
      card.classList.add("hidden");
    }
  });
  document.getElementById("bug-count").textContent = visible + " bugs";
}

function filterPages(status, btn) {
  document.querySelectorAll("#section-pages .filter-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  document.querySelectorAll(".page-card").forEach(card => {
    card.classList.toggle("hidden", status !== "all" && card.dataset.status !== status);
  });
}

function openLightbox(src) {
  document.getElementById("lightbox-img").src = src;
  document.getElementById("lightbox").classList.add("open");
}

function closeLightbox() {
  document.getElementById("lightbox").classList.remove("open");
}

document.addEventListener("keydown", e => { if (e.key === "Escape") closeLightbox(); });
</script>
</body>
</html>`;

  fs.writeFileSync(outputPath, html);
  console.log("  ✅ HTML Report: " + outputPath);
}

module.exports = { generateHTML };
