# 🧪 OpsMonsters Functional Tester

Playwright JS + PDF Report generator for `https://uat.opsmonsters.com/`

---

## ⚙️ Setup (One Time)

```bash
# 1. Install dependencies
npm install

# 2. Install Chromium browser
npx playwright install chromium
```

---

## 🚀 Run Tests

```bash
npm test
```

---

## 📋 What Gets Tested

| # | Test | What it checks |
|---|------|----------------|
| 1 | Homepage Load | HTTP status, page loads without error |
| 2 | Page Title | `<title>` tag present and non-empty |
| 3 | Console Errors | No JS errors in browser console |
| 4 | Broken Images | All `<img>` tags load correctly |
| 5 | Navigation Links | Counts all `<a href>` links |
| 6 | Login Form | Form present, empty submit, invalid creds |
| 7 | Mobile (375px) | Renders on iPhone-size viewport |
| 8 | Tablet (768px) | Renders on iPad-size viewport |
| 9 | 404 Error Page | Unknown URL returns proper 404 |
| 10 | Page Load Time | PASS < 3s, WARN 3–6s, FAIL > 6s |
| 11 | Favicon | `<link rel="icon">` present |
| 12 | HTTPS / SSL | Site served over HTTPS |

---

## 📄 Output

- **`test_report.pdf`** — Full PDF report with screenshots
- **`screenshots/`** — All PNG screenshots captured during tests

---

## 🛠️ Requirements

- Node.js 16+
- Internet access to `uat.opsmonsters.com`
