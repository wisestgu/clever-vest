// Render every frame of the composition: frame i shows t = i / FPS exactly.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const FPS = 30;
const DURATION = 24;

(async () => {
  const out = path.join(__dirname, 'frames');
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://localhost:5199/');
  await page.waitForFunction(() => window.__ready === true);
  await page.evaluate(() => document.fonts.ready);
  // Warm every scene once so async assets (QR codes, fonts in all weights) are ready before capture.
  for (const t of [1, 4, 7, 11, 13.5, 15, 16, 18, 19.5, 21, 23]) {
    await page.evaluate((n) => window.__seek(n), t);
    await page.waitForTimeout(150);
  }
  await page.evaluate(() => document.fonts.ready);
  const total = Math.round(FPS * DURATION);
  const started = Date.now();
  for (let i = 0; i < total; i++) {
    await page.evaluate((n) => window.__seek(n), i / FPS);
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r())));
    await page.screenshot({ path: path.join(out, `${String(i).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 94 });
    if (i % 120 === 0) console.log(`frame ${i}/${total} (${((Date.now() - started) / 1000).toFixed(0)}s)`);
  }
  console.log(errors.length ? `errors:\n${errors.join('\n')}` : 'no errors', `done in ${((Date.now() - started) / 1000).toFixed(0)}s`);
  await browser.close();
})();
