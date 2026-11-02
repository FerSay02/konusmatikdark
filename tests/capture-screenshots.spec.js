import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const outDir = path.resolve('test-screenshots');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const json = (data, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(data) });

async function setupMocks(page) {
  await page.route('**/api/v1/**', (route) => {
    const p = new URL(route.request().url()).pathname;
    if (p === '/api/v1/auth/registration-terms') return route.fulfill(json({ terms_version: 'v1.0-legal' }, 200));
    if (p === '/api/v1/auth/me' || p === '/api/v1/auth/refresh') return route.fulfill(json({}, 401));
    return route.fulfill(json({}));
  });
}

test('capture login, register, forgot password, mobile and english screenshots', async ({ page }) => {
  await setupMocks(page);

  // 1. TR Desktop Login
  await page.setViewportSize({ width: 1280, height: 850 });
  await page.goto('/giris');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '01-login-tr-desktop.png'), fullPage: true });

  // 2. TR Desktop Register
  const registerBtn = page.getByRole('button', { name: 'Kayıt Ol' }).first();
  if (await registerBtn.isVisible()) {
    await registerBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outDir, '02-register-tr-desktop.png'), fullPage: true });
  }

  // 3. TR Desktop Forgot Password
  const loginBtn = page.getByRole('button', { name: 'Giriş Yap' }).first();
  if (await loginBtn.isVisible()) {
    await loginBtn.click();
    await page.waitForTimeout(400);
  }
  const forgotLink = page.getByRole('link', { name: 'Şifremi Unuttum' });
  if (await forgotLink.isVisible()) {
    await forgotLink.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outDir, '03-forgot-password-tr-desktop.png'), fullPage: true });
  }

  // 4. TR Mobile 375px Login
  await page.setViewportSize({ width: 375, height: 750 });
  await page.goto('/giris');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outDir, '04-login-tr-mobile-375.png'), fullPage: true });

  // 5. TR Mobile 375px Register
  const mobileRegBtn = page.getByRole('button', { name: 'Kayıt Ol' }).first();
  if (await mobileRegBtn.isVisible()) {
    await mobileRegBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outDir, '05-register-tr-mobile-375.png'), fullPage: true });
  }

  // 6. EN Desktop Login
  await page.setViewportSize({ width: 1280, height: 850 });
  await page.evaluate(() => {
    localStorage.setItem('km_language_pref', 'en');
    localStorage.setItem('lang', 'en');
  });
  await page.goto('/giris');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outDir, '06-login-en-desktop.png'), fullPage: true });

  // 7. EN Mobile Login
  await page.setViewportSize({ width: 375, height: 750 });
  await page.screenshot({ path: path.join(outDir, '07-login-en-mobile-375.png'), fullPage: true });
});
