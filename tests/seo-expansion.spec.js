import { test, expect } from '@playwright/test';
import { expandedSeoPages } from '../content/seo-expansion.mjs';

test('expanded SEO routes return crawlable HTML and unknown routes return 404', async ({ request }) => {
  for (const page of expandedSeoPages) {
    const route = `/${page.section}/${page.slug}/`;
    const response = await request.get(route);
    expect(response.status(), route).toBe(200);
    const html = await response.text();
    expect(html).toContain(`<h1>${page.h1}</h1>`);
    expect(html).toContain(`<link rel="canonical" href="https://konusmatik.com${route}">`);
    expect(html).toContain('<meta name="robots" content="index, follow">');
  }
  expect((await request.get('/cozumler/bilinmeyen-cozum/')).status()).toBe(404);
});

test('solution hub links to published pages and mobile content fits', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/cozumler/');
  for (const item of expandedSeoPages) await expect(page.locator(`a[href="/cozumler/${item.slug}/"]`).first()).toBeVisible();
  await page.goto('/cozumler/yapay-zeka-seslendirme/');
  await expect(page.locator('audio source[src$="deniz_bilimsel_gunes.wav"]')).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});
