import fs from 'node:fs';
import path from 'node:path';
import { preview } from 'vite';
import { chromium } from '@playwright/test';

const phase = process.argv[2] || 'latest';
if (!/^[a-z0-9-]+$/.test(phase)) throw new Error('Screenshot label must use lowercase letters, digits or hyphens.');
const root = path.resolve('docs/corporate-qa');
fs.mkdirSync(root, { recursive: true });
const server = await preview({ preview: { host: '127.0.0.1', port: 4181, strictPort: true } });
const browser = await chromium.launch();
const results = [];
try {
  for (const theme of ['dark', 'light']) {
    for (const width of [320, 375, 768, 1024, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      await page.addInitScript(() => {
        window.__corporateCls = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__corporateCls += entry.value;
        }).observe({ type: 'layout-shift', buffered: true });
      });
      await page.addInitScript((value) => localStorage.setItem('konusmatik-theme', value), theme);
      await page.goto('http://127.0.0.1:4181/kurumsal');
      await page.locator('.site-loader').waitFor({ state: 'hidden', timeout: 15000 });
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: path.join(root, `${phase}-${theme}-${width}.png`), fullPage: true });
      const metrics = await page.evaluate(() => {
        const box = (selector) => {
          const element = document.querySelector(selector);
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height), font: style.fontSize, line: style.lineHeight };
        };
        return {
          viewport: innerWidth, pageWidth: document.documentElement.scrollWidth,
          hero: box('.eco-hero'), headline: box('.eco-hero h1'), heroScene: box('.eco-hero-scene'),
          description: box('.eco-product-description'), feature: box('.eco-features li'), productLink: box('.eco-product-link'),
          firstVisual: box('.eco-product .eco-visual'), network: box('.eco-network-map'),
          activeAnimations: document.getAnimations().filter((animation) => animation.playState === 'running').length,
          fontsStatus: document.fonts.status,
          cls: Number((window.__corporateCls || 0).toFixed(4)),
        };
      });
      results.push({ theme, width, ...metrics });
      await page.close();
    }
  }
} finally {
  await browser.close();
  await server.close();
}
fs.writeFileSync(path.join(root, `${phase}-metrics.json`), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results));
