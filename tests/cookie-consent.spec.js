import { test, expect } from '@playwright/test';

test('optional services wait for consent and withdrawal removes Maps', async ({ page }) => {
  const mapRequests = [];
  page.on('request', (request) => { if (/google\.com\/maps/.test(request.url())) mapRequests.push(request.url()); });
  await page.goto('/iletisim');
  const banner = page.locator('.cookie-banner');
  await expect(banner).toBeVisible();
  await expect(page.locator('.contact-maps iframe')).toHaveCount(0);
  expect(mapRequests).toEqual([]);
  await expect(banner.getByRole('button')).toHaveCount(3);
  const sizes = await banner.getByRole('button').evaluateAll((buttons) => buttons.map((button) => [Math.round(button.getBoundingClientRect().height), getComputedStyle(button).backgroundColor]));
  expect(new Set(sizes.map(([height]) => height)).size).toBe(1);
  expect(new Set(sizes.map(([, color]) => color)).size).toBe(1);
  await banner.getByRole('button', { name: 'Tercihleri Yönet' }).click();
  const dialog = page.getByRole('dialog', { name: 'Çerez tercihleri' });
  await expect(dialog).toBeVisible();
  for (const category of ['İşlevsel', 'Analitik', 'Pazarlama']) await expect(dialog.locator('.cookie-category').filter({ hasText: category }).locator('input')).not.toBeChecked();
  await dialog.locator('.cookie-category').filter({ hasText: 'İşlevsel' }).locator('input').check();
  await dialog.getByRole('button', { name: 'Seçimlerimi kaydet' }).click();
  await expect(page.locator('.contact-maps iframe')).toHaveCount(2);
  await page.reload();
  await expect(banner).toHaveCount(0);
  await expect(page.locator('.contact-maps iframe')).toHaveCount(2);
  await page.getByRole('button', { name: 'Çerez Tercihlerini Yönet' }).click();
  await dialog.getByRole('button', { name: 'İzni geri çek' }).click();
  await expect(page.locator('.contact-maps iframe')).toHaveCount(0);
  expect(mapRequests.length).toBeGreaterThan(0);
  const consent = await page.evaluate(() => JSON.parse(localStorage.getItem('konusmatik_cookie_consent')));
  expect(consent.selectedCategories).toEqual({ necessary: true, functional: false, analytics: false, marketing: false });
});

test('reject, accept and English controls persist without tracking requests', async ({ page }) => {
  const tracking = [];
  page.on('request', (request) => { if (/google-analytics|googletagmanager|doubleclick|facebook\.com\/tr/.test(request.url())) tracking.push(request.url()); });
  await page.goto('/');
  await page.getByRole('button', { name: 'İsteğe Bağlıları Reddet' }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('konusmatik_cookie_consent')).selectedCategories)).toEqual({ necessary: true, functional: false, analytics: false, marketing: false });
  await page.getByRole('button', { name: 'Çerez Tercihlerini Yönet' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Tümünü kabul et' }).click();
  await page.reload();
  await expect(page.locator('.cookie-banner')).toHaveCount(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('konusmatik_cookie_consent')).selectedCategories)).toEqual({ necessary: true, functional: true, analytics: true, marketing: true });
  expect(tracking).toEqual([]);
  await page.getByRole('button', { name: 'İngilizceye geç' }).click();
  await page.getByRole('button', { name: 'Cookie Preferences' }).click();
  await expect(page.getByRole('dialog', { name: 'Cookie preferences' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('mobile banner and modal stay inside viewport in both themes', async ({ page }) => {
  for (const width of [320, 375]) {
    await page.setViewportSize({ width, height: 700 });
    await page.goto('/');
    await expect(page.locator('.cookie-banner')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    await page.screenshot({ path: `test-results/cookie-banner-${width}.png` });
    await page.getByRole('button', { name: 'Tercihleri Yönet' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    await page.screenshot({ path: `test-results/cookie-dialog-${width}.png` });
    await page.getByRole('dialog').getByRole('button', { name: 'Kapat' }).click();
    await page.evaluate(() => localStorage.setItem('konusmatik-theme', 'light'));
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  }
});
