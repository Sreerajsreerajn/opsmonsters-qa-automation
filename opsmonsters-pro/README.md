# OpsMonsters Test Suite v2.0
> Production-Grade Automated Testing — Playwright + PDF + HTML Reports

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Install Chromium
npx playwright install chromium

# 3. Run all tests
npm test
```

---

## ⚙️ Configuration

Edit `config/config.js` to:
- Add/remove sites to test
- Configure login credentials
- Toggle test categories on/off
- Adjust performance thresholds
- Set report options

---

## 📋 What Gets Tested

| Category | Tests |
|----------|-------|
| **Functional** | Page load, title, broken images, favicon, links, forms |
| **Performance** | Load time, DOM size, resource count, TTFB, Web Vitals |
| **SEO** | Meta description, H1, Open Graph, canonical, alt text, word count |
| **Accessibility** | Lang attr, form labels, button text, landmark regions, skip links |
| **Security** | HTTPS, 6 security headers, mixed content |
| **Responsive** | Mobile (375px), Tablet (768px) — overflow detection |
| **Console** | JS errors, third-party CORS |
| **Network** | 404 resources |

---

## 🔐 Login / Auth Support

In `config/config.js`, set the `auth` field for any site:

```js
auth: {
  loginUrl: "https://yoursite.com/login",
  usernameSelector: 'input[name="email"]',
  passwordSelector: 'input[name="password"]',
  submitSelector: 'button[type="submit"]',
  username: "your@email.com",
  password: "yourpassword",
  successIndicator: ".dashboard",
}
```

---

## 🌐 Multiple Sites

Add multiple sites in `config/config.js`:

```js
sites: [
  { name: "UAT",  baseUrl: "https://uat.opsmonsters.com/",  active: true  },
  { name: "Prod", baseUrl: "https://opsmonsters.com/",      active: false },
]
```

---

## 📊 Output Reports

After running, check the `reports/` folder:

| File | Description |
|------|-------------|
| `test-report.pdf` | Professional PDF — Cover, Bug Index, Bug Details with screenshots, Page Summary |
| `test-report.html` | Interactive HTML — Filter by priority, search bugs, zoom screenshots |
| `results.json` | Raw JSON data for CI/CD integration |

---

## 🏷️ Priority System

| Priority | Severity | Action |
|----------|----------|--------|
| P1 | Critical | Blocker — fix immediately |
| P2 | High | Major — fix before release |
| P3 | Medium | Notable — fix in next sprint |
| P4 | Low | Minor — fix when possible |

---

## 📁 Project Structure

```
opsmonsters-test-suite/
├── config/
│   └── config.js          ← Edit this!
├── src/
│   ├── runner.js           ← Test engine
│   ├── report-pdf.js       ← PDF generator
│   └── report-html.js      ← HTML generator
├── reports/                ← Output reports
├── screenshots/            ← Captured screenshots
└── package.json
```
