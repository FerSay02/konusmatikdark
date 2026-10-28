import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test('legal pages have distinct prerendered HTML, no warning badges and clear draft status', async () => {
  const routes = ['/gizlilik-politikasi/', '/kullanim-kosullari/', '/kvkk-aydinlatma-metni/'];
  const titles = new Set();
  const sitemap = fs.readFileSync(path.resolve('dist/sitemap.xml'), 'utf8');
  for (const route of routes) {
    const html = fs.readFileSync(path.resolve('dist', route.slice(1), 'index.html'), 'utf8');
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
    expect(title, route).toBeTruthy();
    expect(titles.has(title), route).toBeFalsy();
    titles.add(title);
    expect(html).toContain(`<link rel="canonical" href="https://konusmatik.com${route}">`);
    expect(html).toContain('<h1>');
    expect(html).toContain('<h2>');
    expect(html).not.toContain('HOLD');
    expect(html).not.toContain('legal-hold-badge');
    expect(html).toContain('hukuki inceleme sonrasında yayımlanacaktır');
    expect(html).not.toContain('TODO');
    expect(html).toContain('content="noindex, nofollow"');
    expect(html).toContain('href="/"');
    expect(sitemap).not.toContain(`<loc>https://konusmatik.com${route}</loc>`);
  }
  const home = fs.readFileSync(path.resolve('dist/index.html'), 'utf8');
  for (const route of routes) expect(home).toContain(`href="${route}"`);
});

test('registration requires terms, keeps marketing optional and does not invent a session', async ({ page }) => {
  let registered;
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/v1/auth/me') return route.fulfill({ status: 401, contentType: 'application/json', body: '{}' });
    if (path === '/api/v1/auth/register') {
      registered = JSON.parse(route.request().postData() || '{}');
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    }
    if (path === '/api/v1/auth/login') return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    return route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
  });
  await page.goto('/giris');
  await page.getByRole('button', { name: 'Kayit Ol' }).first().click();
  await expect(page.getByText('Kayit sonrasi paket secerek')).toHaveCount(0);
  await expect(page.getByText('İlk Google kaydı adımlarını gör')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Google ile devam et' })).toBeDisabled();
  await expect(page.getByText('Güvenli sunucu doğrulaması')).toBeVisible();
  await page.locator('input[autocomplete="name"]').fill('Test Kullanıcı');
  await page.getByPlaceholder('5xxxxxxxxx').fill('5551234567');
  await page.getByPlaceholder('ornek@konusmatik.com').fill('test@example.com');
  await page.locator('input[autocomplete="new-password"]').first().fill('safe-pass-123');
  await page.locator('input[autocomplete="new-password"]').last().fill('safe-pass-123');
  const consent = page.locator('.login-consent input');
  expect(await consent.nth(1).isChecked()).toBeFalsy();
  await page.locator('.btn-login-submit').click();
  expect(registered).toBeUndefined();
  await consent.first().check();
  await page.locator('.btn-login-submit').click();
  await expect.poll(() => registered?.email).toBe('test@example.com');
  await expect(page).toHaveURL(/\/giris$/);
  await expect(page.getByRole('status')).toBeVisible();
  await page.locator('input[autocomplete="current-password"]').fill('safe-pass-123');
  await page.locator('.btn-login-submit').click();
  await expect(page.getByRole('alert')).toContainText('Oturum doğrulanamadı');
  await expect(page).toHaveURL(/\/giris$/);
});

test('auth and legal layouts remain usable on mobile and in both themes', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  await page.route('**/api/v1/auth/me', (route) => route.fulfill({ status: 401, contentType: 'application/json', body: '{}' }));
  for (const width of [320, 375, 768, 1280]) {
    await page.setViewportSize({ width, height: 820 });
    await page.goto('/giris');
    await expect(page.locator('.login-panel')).toBeVisible();
    await expect(page.locator('.site-loader')).toHaveCount(0);
    if (width === 375 || width === 1280) await page.screenshot({ path: testInfo.outputPath(`login-${width}.png`), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `auth ${width}`).toBeTruthy();
    if (width === 375) {
      await page.getByRole('button', { name: 'Kayit Ol' }).first().click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'registration 375').toBeTruthy();
      await page.screenshot({ path: testInfo.outputPath('register-375.png'), fullPage: true });
    }
    await page.goto('/gizlilik-politikasi/');
    await expect(page.getByRole('heading', { level: 1, name: 'Gizlilik Politikası' })).toBeVisible();
    await expect(page.locator('.site-loader')).toHaveCount(0);
    if (width === 375 || width === 1280) await page.screenshot({ path: testInfo.outputPath(`privacy-${width}.png`), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `legal ${width}`).toBeTruthy();
  }
  await page.setViewportSize({ width: 1280, height: 820 });
  await page.goto('/gizlilik-politikasi/');
  await expect(page.locator('.site-loader')).toHaveCount(0);
  await page.locator('.theme-toggle').first().click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', /light|dark/);
  await page.waitForTimeout(450);
  expect(await page.locator('.footer-col ul li a').first().evaluate((element) => getComputedStyle(element).color)).not.toBe('rgb(0, 0, 0)');
  await page.screenshot({ path: testInfo.outputPath('privacy-dark-1280.png'), fullPage: true });
  await page.locator('.language-toggle').first().click();
  await expect(page.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeVisible();
  await page.goto('/giris');
  await expect(page.locator('.site-loader')).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('login-dark-1280.png'), fullPage: true });
});
