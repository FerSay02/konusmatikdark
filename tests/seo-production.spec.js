import { test, expect } from '@playwright/test';
import { preview } from 'vite';
import { readdirSync } from 'node:fs';
import { seoPages } from '../content/seo-pages.mjs';

const paths = seoPages.map((item) => `/${item.section}/${item.slug}/`);
let previewServer;
test.use({ baseURL: 'http://127.0.0.1:4174' });

test.beforeAll(async () => {
  previewServer = await preview({ preview: { host: '127.0.0.1', port: 4174, strictPort: true } });
});

test.afterAll(async () => {
  await previewServer?.close();
});

test('cookie policy is prerendered, noindex and excluded from sitemap', async ({ request }) => {
  const response = await request.get('/cerez-politikasi/');
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain('<h1>Çerez Politikası</h1>');
  expect(html).toContain('<h2>Çerez ve benzer teknolojiler nedir?</h2>');
  expect(html).toContain('content="noindex, nofollow"');
  expect(html).toContain('href="https://konusmatik.com/cerez-politikasi/"');
  expect(html).toContain('Google Maps');
  expect(html).toContain('hukuki onay bekleyen bir taslaktır');
  expect(html).not.toContain('legal-hold-badge');
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).not.toContain('/cerez-politikasi/');
  expect([...sitemap.matchAll(/<loc>/g)]).toHaveLength(29);
});

test('corporate product illustrations use Turkish labels and switch to English', async ({ request, page }) => {
  const html = await (await request.get('/kurumsal')).text();
  for (const label of ['GÖRÜŞME VE DUYGU ANALİZİ', 'SİNYAL / İÇGÖRÜ', 'BELGE → YAPILANDIRILMIŞ VERİ', 'SES / NETLİK']) expect(html).toContain(label);
  expect(html).not.toContain('CONVERSATION & EMOTION INTELLIGENCE');
  await page.goto('/kurumsal');
  await page.getByRole('button', { name: 'İngilizceye geç' }).click();
  await expect(page.locator('.eco-product--deeppoint .eco-category')).toHaveText('CONVERSATION & EMOTION INTELLIGENCE');
  await expect(page.locator('.eco-visual--deeppoint .eco-visual-caption')).toContainText('SIGNAL / INSIGHT');
});

test('corporate phone is consistent in raw contact HTML, footer and Organization schema', async ({ request, page }) => {
  const contact = await request.get('/iletisim');
  expect(contact.status()).toBe(200);
  const html = await contact.text();
  expect(html).toContain('+90 312 577 17 15');
  expect(html).toContain('tel:+903125771715');
  expect(html).toContain('"telephone":"+903125771715"');
  expect(html).not.toContain('+90 505 855 87 27');
  const article = await (await request.get('/rehber/turkce-metni-sese-cevirme/')).text();
  expect(article).toContain('"telephone":"+903125771715"');
  await page.goto('/iletisim');
  await expect(page.locator('a[href="tel:+903125771715"]')).toHaveCount(2);
});

test('production blocks new registration and Google sign-in while legal/backend gates are closed', async ({ page }) => {
  let registrationRequests = 0;
  await page.route('**/api/v1/**', async (route) => {
    if (new URL(route.request().url()).pathname === '/api/v1/auth/register') registrationRequests += 1;
    return route.fulfill({ status: 401, contentType: 'application/json', body: '{}' });
  });
  await page.goto('/giris');
  await expect(page.getByRole('button', { name: 'Kayıt Ol' })).toBeDisabled();
  await expect(page.locator('.login-registration-hold')).toContainText('Yeni kayıtlar');
  await expect(page.getByRole('button', { name: 'Google ile devam et' })).toBeDisabled();
  expect(registrationRequests).toBe(0);
  expect(await page.locator('script[src="https://accounts.google.com/gsi/client"]').count()).toBe(0);
});

test('production JS/CSS assets and TTS/ASR pages remain accessible', async ({ request, page }) => {
  const home = await (await request.get('/')).text();
  const referencedAssets = [...home.matchAll(/(?:src|href)="(\/assets\/[^"]+\.(?:js|css))"/g)].map((match) => match[1]);
  const assets = [...readdirSync('dist/assets').filter((file) => /\.(?:js|css)$/.test(file)).map((file) => `/assets/${file}`), '/seo-content.css'];
  expect(referencedAssets.length).toBeGreaterThanOrEqual(2);
  for (const asset of referencedAssets) expect(assets).toContain(asset);
  for (const asset of assets) {
    const response = await request.get(asset);
    expect(response.status(), asset).toBe(200);
    expect(response.headers()['content-type'], asset).toMatch(asset.endsWith('.js') ? /javascript/ : /css/);
  }
  await page.goto('/seslendirme');
  await expect(page.getByText('Metin Girişi').first()).toBeVisible();
  await page.goto('/desifre');
  await expect(page.getByText('Ses Dosyası').first()).toBeVisible();
});

test('production checkout cannot start payment while legal release is on HOLD', async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('konusmatik_checkout_plan', JSON.stringify({
      planId: 'asr-30m', productName: '30 Dakika Deşifre', type: 'asr', audience: 'individual',
      amount: '30', unit: 'Dakika', price: 39, priceWithVat: 46.8,
    }));
  });
  let paymentRequests = 0;
  await page.route('**/api/v1/**', async (route) => {
    if (new URL(route.request().url()).pathname === '/api/v1/payments/paytr/token') paymentRequests += 1;
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
  });
  await page.goto('/checkout');
  await expect(page.locator('.checkout-release-status')).toContainText('Ödeme şu anda kullanılamıyor');
  await expect(page.locator('.checkout-pay-btn')).toBeDisabled();
  await expect(page.locator('.checkout-agreements a[href="/kvkk-aydinlatma-metni/"]')).toBeVisible();
  expect(paymentRequests).toBe(0);
});

test('all 20 pages deliver indexable HTML, metadata and structured data', async ({ request }) => {
  expect(paths).toHaveLength(20);
  const sitemapResponse = await request.get('/sitemap.xml');
  expect(sitemapResponse.status()).toBe(200);
  const sitemap = await sitemapResponse.text();
  const robotsResponse = await request.get('/robots.txt');
  expect(robotsResponse.status()).toBe(200);
  const robots = await robotsResponse.text();
  expect(robots).toContain('Sitemap: https://konusmatik.com/sitemap.xml');

  for (const item of seoPages) {
    const route = `/${item.section}/${item.slug}/`;
    const response = await request.get(route);
    expect(response.status(), route).toBe(200);
    expect(response.headers()['x-robots-tag'] || '', route).not.toMatch(/noindex|nofollow/i);
    expect(response.headers()['content-type'], route).toMatch(/text\/html/i);
    const html = await response.text();
    expect(html, route).toContain(`<title>${item.title}</title>`);
    expect(html, route).toContain(`<h1>${item.h1}</h1>`);
    expect(html, route).toContain(`<link rel="canonical" href="https://konusmatik.com${route}">`);
    expect(html, route).toContain('<meta name="robots" content="index, follow">');
    expect(html, route).toContain('name="description"');
    expect(html, route).toContain('"@type":"BreadcrumbList"');
    expect(html, route).toContain(item.sections[0].h2);
    if (item.faq?.length) expect(html, route).toContain(`<h3>${item.faq[0].question}</h3>`);
    expect(html, route).not.toContain('/@vite/client');
    expect(html, route).not.toContain('/src/main.jsx');
    expect(html, route).not.toContain('<div id="root"></div>');
    expect((html.match(/<title>/g) || []).length, route).toBe(1);
    expect((html.match(/<link rel="canonical"/g) || []).length, route).toBe(1);
    expect(sitemap, route).toContain(`<loc>https://konusmatik.com${route}</loc>`);
    expect(robots, route).not.toContain(`Disallow: ${route}`);
  }
});

test('homepage raw HTML is prerendered and links to SEO solutions', async ({ request }) => {
  const response = await request.get('/');
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain('<h1>');
  expect(html).toContain('Türkçe yapay zekâ seslendirme');
  for (const route of ['/cozumler/turkce-seslendirme/', '/cozumler/sesten-metne/', '/cozumler/on-premise-tts/']) expect(html).toContain(`href="${route}"`);
  expect(html).not.toContain('<div id="root"></div>');
  expect(html).not.toContain('/@vite/client');
  expect(html).not.toContain('/src/main.jsx');
});

test('legal routes have no warning badges and disclose review status in their first HTML', async ({ request }) => {
  const sitemap = await (await request.get('/sitemap.xml')).text();
  for (const route of ['/gizlilik-politikasi/', '/kullanim-kosullari/', '/kvkk-aydinlatma-metni/']) {
    const response = await request.get(route);
    expect(response.status(), route).toBe(200);
    const html = await response.text();
    expect(html, route).toMatch(/<meta name="robots" content="noindex, nofollow"\s*\/?\s*>/);
    expect(html, route).toContain(`<link rel="canonical" href="https://konusmatik.com${route}">`);
    expect(html, route).not.toContain('HOLD');
    expect(html, route).not.toContain('legal-hold-badge');
    expect(html, route).toContain('hukuki inceleme sonrasında yayımlanacaktır');
    expect(html, route).toContain('<h1>');
    expect(html, route).toContain('<h2>');
    expect(html, route).toContain('href="/"');
    expect(html, route).not.toContain('TODO');
    expect(html, route).not.toContain('<div id="root"></div>');
    expect(sitemap, route).not.toContain(`<loc>https://konusmatik.com${route}</loc>`);
  }
});

test('all internal page links resolve and unknown pages are 404', async ({ request }) => {
  const hrefs = new Set();
  for (const route of paths) {
    const html = await (await request.get(route)).text();
    for (const [, href] of html.matchAll(/href="(\/[^"#?]+)"/g)) {
      if (href.startsWith('/images/') || href === '/seo-content.css') continue;
      hrefs.add(href);
    }
  }
  for (const href of hrefs) expect((await request.get(href)).status(), href).toBe(200);
  for (const path of ['/rehber/yok/', '/cozumler/yok/', '/olmayan-sayfa']) {
    expect((await request.get(path)).status(), path).toBe(404);
  }
  const redirect = await request.get('/cozumler/yapay-zeka-seslendirme', { maxRedirects: 0 });
  expect([301, 308]).toContain(redirect.status());
});

test('representative guide and solution remain readable on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ['/rehber/turkce-metni-sese-cevirme/', '/cozumler/otomatik-altyazi/']) {
    await page.goto(route);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.seo-prose section').first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), route).toBeTruthy();
  }
});

test('corporate ecosystem renders in both themes without mobile overflow', async ({ page, request }) => {
  const source = await (await request.get('/kurumsal')).text();
  expect(source).toContain('<h1 id="eco-title">Farklı teknolojiler.<br/><em>Tek bir inovasyon ekosistemi.</em></h1>');
  expect(source).toContain('Yapay zekâ destekli OCR');
  expect(source).toContain('"@type":"WebPage"');
  expect(source).toContain('"@type":"ItemList"');
  for (const [name, url] of [
    ['DOCULYSIS', 'https://doculysis.com/'],
    ['DEEPPOINT', 'https://deeppointai.com/'],
    ['CLEAR VOICE', 'https://clearvoice.com.tr/'],
  ]) {
    expect(source).toContain(name);
    expect(source).toContain(`href="${url}"`);
  }

  for (const theme of ['dark', 'light']) {
    await page.addInitScript((value) => localStorage.setItem('konusmatik-theme', value), theme);
    for (const width of [320, 375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/kurumsal');
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await expect(page.locator('.ecosystem-page h1')).toBeVisible();
      await expect(page.locator('.site-loader')).toBeHidden({ timeout: 15000 });
      await expect(page.locator('.eco-product')).toHaveCount(3);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${theme} ${width}px overflow`).toBeTruthy();
      for (const href of ['https://doculysis.com/', 'https://deeppointai.com/', 'https://clearvoice.com.tr/', 'https://deepzeka.com/']) {
        const link = page.locator(`.ecosystem-page a[href="${href}"]`);
        await expect(link).toHaveAttribute('target', '_blank');
        await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      }
      if (width === 1440 || width === 375) await page.screenshot({ path: `test-results/corporate-${theme}-${width}.png`, fullPage: true });
    }
  }
});

test('corporate scenes work by keyboard and respect reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/kurumsal');
  await expect(page.locator('.site-loader')).toBeHidden({ timeout: 15000 });
  await expect(page.locator('.eco-hero-scene')).not.toHaveClass(/is-animated/);
  const audio = page.locator('.eco-audio-wave');
  await expect(audio).toHaveAttribute('aria-label', /Gürültülü kayıt/);
  await page.getByRole('button', { name: 'Sonra' }).click();
  await expect(audio).toHaveClass(/is-clean/);
  await expect(audio).toHaveAttribute('aria-label', /Net konuşma/);
  await page.getByRole('button', { name: 'Önce' }).click();
  await expect(audio).not.toHaveClass(/is-clean/);
  const deeppoint = page.getByRole('button', { name: /DEEPPOINT/ });
  await deeppoint.focus();
  await expect(deeppoint).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.eco-network-detail')).toContainText('DEEPPOINT');
});

test('DeepZeka CTA hover does not run a looping border animation or shift the button', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/kurumsal');
  await expect(page.locator('.site-loader')).toBeHidden({ timeout: 15000 });
  if (await page.locator('.cookie-banner').count()) await page.getByRole('button', { name: 'İsteğe Bağlıları Reddet' }).click();
  const cta = page.locator('.eco-closing-link');
  await cta.scrollIntoViewIfNeeded();
  await expect(cta).toBeInViewport();
  const before = await cta.boundingBox();
  expect(await cta.evaluate((element) => getComputedStyle(element, '::before').animationName)).toBe('none');
  await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
  await page.waitForTimeout(220);
  const after = await cta.boundingBox();
  expect(Math.abs(after.x - before.x)).toBeLessThan(1);
  expect(Math.abs(after.y - before.y)).toBeLessThan(1);
  expect(await cta.evaluate((element) => getComputedStyle(element, '::before').animationName)).toBe('none');
  await page.screenshot({ path: testInfo.outputPath('deepzeka-cta-hover.png') });
});

test('corporate scroll stays natural and ambient motion stops offscreen', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto('/kurumsal');
  await expect(page.locator('.site-loader')).toBeHidden({ timeout: 15000 });
  await page.evaluate(() => document.fonts.ready);
  const heroHeight = await page.locator('.eco-hero').evaluate((element) => element.getBoundingClientRect().height);
  expect(heroHeight).toBeLessThan(700);
  await page.locator('.eco-hero-link').click();
  await expect(page).toHaveURL(/#products$/);
  const headingTop = await page.locator('#eco-products-title').evaluate((element) => element.getBoundingClientRect().top);
  expect(headingTop).toBeGreaterThan(50);
  const firstPosition = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 650);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(firstPosition + 300);
  await page.locator('.eco-network').scrollIntoViewIfNeeded();
  await expect.poll(() => page.locator('.eco-hero').evaluate((element) => element.getBoundingClientRect().bottom)).toBeLessThan(0);
  await expect(page.locator('.eco-hero-scene')).not.toHaveClass(/is-animated/);
  await page.locator('.eco-closing-link').scrollIntoViewIfNeeded();
  await expect(page.locator('.eco-closing-link')).toBeInViewport();
  await page.locator('.eco-network-node--1').focus();
  await expect(page.locator('.eco-network-node--1')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.eco-network-detail')).toContainText('DOCULYSIS');
});
