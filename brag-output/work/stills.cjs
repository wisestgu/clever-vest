// Capture review stills at chosen times (seconds). Usage: node stills.cjs 1.2 2.9 ...
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const times = process.argv.slice(2).map(Number);
  const out = path.join(__dirname, 'stills');
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('http://localhost:5199/');
  await page.waitForFunction(() => window.__ready === true);
  await page.evaluate(() => document.fonts.ready);
  for (const t of times) {
    await page.evaluate((n) => window.__seek(n), t);
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    await page.screenshot({ path: path.join(out, `t${t.toFixed(2).padStart(5, '0')}.png`) });
  }
  console.log(errors.length ? errors.join('\n') : 'no errors');
  await browser.close();
})();
