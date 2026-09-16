import { expect, test } from '@playwright/test';

const LANGUAGE_STORAGE_KEY = 'konusmatik_language';
const CHECKOUT_STORAGE_KEY = 'konusmatik_checkout_plan';

const user = {
  id: 'user-1',
  email: 'tester@konusmatik.com',
  full_name: 'Test User',
  phone: '5340000000',
  role: 'user',
};

const adminUser = {
  ...user,
  id: 'admin-1',
  email: 'admin@konusmatik.com',
  full_name: 'Admin User',
  role: 'admin',
};

const plans = [
  {
    id: 'tts-30k',
    code: 'tts_30k',
    name: '30.000 Karakter Text-to-Speech',
    type: 'tts',
    audience: 'individual',
    quota_amount: 30000,
    quota_unit: 'character',
    price_without_vat: 139,
    price_with_vat: 166.8,
    vat_rate: 20,
    sort_order: 1,
    download_enabled: true,
    is_active: true,
  },
  {
    id: 'asr-30m',
    code: 'asr_30m',
    name: '30 Dakika Audio Yaziya Cevirme',
    type: 'asr',
    audience: 'individual',
    quota_amount: 1800,
    quota_unit: 'second',
    price_without_vat: 39,
    price_with_vat: 46.8,
    vat_rate: 20,
    sort_order: 1,
    download_enabled: true,
    is_active: true,
  },
  {
    id: 'tts-enterprise',
    code: 'tts_enterprise',
    name: 'Kurumsal 5.000.000 Karakter Text-to-Speech',
    type: 'tts',
    audience: 'enterprise',
    quota_amount: 5000000,
    quota_unit: 'character',
    price_without_vat: 1949,
    price_with_vat: 2338.8,
    vat_rate: 20,
    sort_order: 2,
    download_enabled: true,
    is_active: true,
  },
];

const checkoutPlan = {
  planId: 'asr-30m',
  productCode: 'asr_30m',
  productName: '30 Dakika Audio Yaziya Cevirme',
  type: 'asr',
  audience: 'individual',
  amount: '30',
  unit: 'Dakika',
  price: 39,
  priceWithVat: 46.8,
};

const pageCases = [
  { route: '/', tr: 'Keşfet', en: 'Explore' },
  { route: '/seslendirme', tr: 'Metin Girişi', en: 'Text Input' },
  { route: '/desifre', tr: 'Ses Dosyası', en: 'Audio File' },
  { route: '/fiyatlar', tr: 'Paket Boyutu', en: 'Package Size' },
  { route: '/kurumsal', tr: 'Kurumsal', en: 'Enterprise' },
  { route: '/api-dokumantasyon', tr: 'Anahtar Oluşturun', en: 'Create an API Key' },
  { route: '/iletisim', tr: 'Konumlar', en: 'Locations' },
  { route: '/giris', tr: 'Giriş Yap', en: 'Log In' },
  { route: '/profile', tr: 'Profil ve Kullanım Hakları', en: 'Profile and Usage Allowances' },
  { route: '/admin', tr: 'Yönetim Paneli', en: 'Admin Panel', role: 'admin' },
  { route: '/checkout', tr: 'Fatura ve Ödeme Bilgileri', en: 'Billing and Payment Information', checkout: true },
  { route: '/payment/success', tr: 'Ödeme tamamlandı', en: 'Payment completed' },
  { route: '/payment/fail', tr: 'Ödeme tamamlanamadı', en: 'Payment could not be completed' },
];

function json(data, status = 200) {
  return {
    status,
    contentType: 'application/json',
    body: JSON.stringify(data),
  };
}

async function mockApi(page, role = 'user') {
  const passwordResetRequests = [];
  const ttsRequests = [];

  await page.route('**/api/v1/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const activeUser = role === 'admin' ? adminUser : user;

    if (path === '/api/v1/auth/me') return route.fulfill(json(activeUser));
    if (path === '/api/v1/auth/logout') return route.fulfill(json({ ok: true }));
    if (path === '/api/v1/auth/refresh') return route.fulfill(json({ ok: true }));
    if (path === '/api/v1/plans') return route.fulfill(json(plans));
    if (path === '/api/v1/me/entitlements') {
      return route.fulfill(json({
        tts: { remaining: 30000, quota_unit: 'character', download_enabled: true },
        asr: { remaining: 1800, quota_unit: 'second', download_enabled: true },
      }));
    }
    if (path === '/api/v1/me/entitlements/list') {
      return route.fulfill(json([
        {
          id: 'ent-tts',
          type: 'tts',
          plan_id: 'tts-30k',
          quota_unit: 'character',
          initial_quota: 30000,
          remaining_quota: 30000,
          download_enabled: true,
          expires_at: null,
        },
      ]));
    }
    if (path === '/api/v1/me/usage') {
      return route.fulfill(json({
        tts: { committed: 0, reserved: 0, usage_unit: 'character' },
        asr: { committed: 0, reserved: 0, usage_unit: 'second' },
      }));
    }
    if (path === '/api/v1/me/api-keys') return route.fulfill(json([]));
    if (path === '/api/v1/admin/health/services') {
      return route.fulfill(json({ services: { database: 'ok', redis: 'ok', storage: 'ok', tts: 'ok', asr: 'ok' } }));
    }
    if (path === '/api/v1/admin/users') return route.fulfill(json([activeUser]));
    if (path === '/api/v1/admin/plans') return route.fulfill(json(plans));
    if (path.startsWith('/api/v1/admin/tts/jobs')) return route.fulfill(json([]));
    if (path.startsWith('/api/v1/admin/asr/jobs')) return route.fulfill(json([]));
    if (path.startsWith('/api/v1/admin/usage')) return route.fulfill(json([]));
    if (path.startsWith('/api/v1/admin/orders')) return route.fulfill(json([]));
    if (path.startsWith('/api/v1/admin/payments')) return route.fulfill(json([]));
    if (path === '/api/v1/auth/password-reset/request') {
      passwordResetRequests.push(JSON.parse(route.request().postData() || '{}'));
      return route.fulfill(json({ message: 'ok' }));
    }
    if (path === '/api/v1/public/tts/preview') {
      ttsRequests.push({ path, body: JSON.parse(route.request().postData() || '{}') });
      return route.fulfill({
        status: 200,
        contentType: 'audio/mpeg',
        body: 'fake-audio',
      });
    }
    if (path === '/api/v1/tts/jobs/download-sync-file') {
      ttsRequests.push({ path, body: JSON.parse(route.request().postData() || '{}') });
      return route.fulfill({
        status: 200,
        contentType: 'audio/mpeg',
        body: 'fake-audio',
      });
    }

    return route.fulfill(json({ ok: true }));
  });

  return { passwordResetRequests, ttsRequests };
}

async function resetLanguage(page) {
  await page.addInitScript((key) => {
    if (!sessionStorage.getItem('__i18n_test_initialized')) {
      localStorage.removeItem(key);
      sessionStorage.clear();
      sessionStorage.setItem('__i18n_test_initialized', '1');
    }
  }, LANGUAGE_STORAGE_KEY);
}

async function seedCheckout(page) {
  await page.addInitScript(([key, plan]) => {
    sessionStorage.setItem(key, JSON.stringify(plan));
  }, [CHECKOUT_STORAGE_KEY, checkoutPlan]);
}

function languageToggle(page) {
  return page.locator('.language-toggle');
}

async function toggleLanguage(page) {
  await languageToggle(page).focus();
  await page.keyboard.press('Enter');
}

async function expectActiveLanguage(page, language) {
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), LANGUAGE_STORAGE_KEY)).toBe(language);
  await expect.poll(() => page.evaluate(() => document.documentElement.lang)).toBe(language);
  await expect(languageToggle(page).locator('span.active').filter({ hasText: language.toUpperCase() })).toBeVisible();
}

async function expectTextState(page, routeCase, language) {
  const expected = language === 'en' ? routeCase.en : routeCase.tr;
  const unexpected = language === 'en' ? routeCase.tr : routeCase.en;
  await expect(page.getByText(expected, { exact: false }).first(), `${routeCase.route} should show ${language} sentinel`).toBeVisible();
  await expect(page.getByText(unexpected, { exact: false }).first(), `${routeCase.route} should not keep opposite sentinel`).toHaveCount(0);
}

test.describe('TR/EN language toggle matrix', () => {
  for (const routeCase of pageCases) {
    test(`${routeCase.route} toggles TR -> EN -> TR and persists on reload`, async ({ page }) => {
      await mockApi(page, routeCase.role);
      await resetLanguage(page);
      if (routeCase.checkout) await seedCheckout(page);

      await page.goto(routeCase.route);
      await expectActiveLanguage(page, 'tr');
      await expectTextState(page, routeCase, 'tr');

      await toggleLanguage(page);
      await expectActiveLanguage(page, 'en');
      await expectTextState(page, routeCase, 'en');

      await page.reload();
      await expectActiveLanguage(page, 'en');
      await expectTextState(page, routeCase, 'en');

      await toggleLanguage(page);
      await expectActiveLanguage(page, 'tr');
      await expectTextState(page, routeCase, 'tr');

      await page.reload();
      await expectActiveLanguage(page, 'tr');
      await expectTextState(page, routeCase, 'tr');
    });
  }

  test('language survives navbar navigation in both directions', async ({ page }) => {
    await mockApi(page);
    await resetLanguage(page);

    await page.goto('/api-dokumantasyon');
    await toggleLanguage(page);
    await expectActiveLanguage(page, 'en');
    await expectTextState(page, pageCases.find((item) => item.route === '/api-dokumantasyon'), 'en');

    await page.locator('.nav-links .nav-item').filter({ hasText: 'Pricing' }).click();
    await expect(page).toHaveURL(/\/fiyatlar$/);
    await expectActiveLanguage(page, 'en');
    await expectTextState(page, pageCases.find((item) => item.route === '/fiyatlar'), 'en');

    await toggleLanguage(page);
    await expectActiveLanguage(page, 'tr');
    await page.locator('.nav-links .nav-item').filter({ hasText: 'API' }).click();
    await expect(page).toHaveURL(/\/api-dokumantasyon$/);
    await expectActiveLanguage(page, 'tr');
    await expectTextState(page, pageCases.find((item) => item.route === '/api-dokumantasyon'), 'tr');
  });

  test('checkout field validation message follows selected language', async ({ page }) => {
    await mockApi(page);
    await resetLanguage(page);
    await seedCheckout(page);

    await page.goto('/checkout');
    await toggleLanguage(page);
    await expectActiveLanguage(page, 'en');

    const address = page.locator('textarea[required]').first();
    const message = await address.evaluate((element) => {
      element.reportValidity();
      return element.validationMessage;
    });
    expect(message).toBe('Please fill out this field.');

    await toggleLanguage(page);
    await expectActiveLanguage(page, 'tr');
    const trMessage = await address.evaluate((element) => {
      element.reportValidity();
      return element.validationMessage;
    });
    expect(trMessage).toBe('Lütfen bu alanı doldurun.');
  });

  test('forgot password request sends English locale when site is in English mode', async ({ page }) => {
    const { passwordResetRequests } = await mockApi(page);
    await resetLanguage(page);

    await page.goto('/giris');
    await toggleLanguage(page);
    await expectActiveLanguage(page, 'en');

    await page.getByText('Forgot password', { exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Reset your password' })).toBeVisible();
    await page.locator('input[type="email"]').fill('tester@konusmatik.com');
    await page.getByRole('button', { name: 'Send Code' }).click();

    await expect.poll(() => passwordResetRequests.length).toBe(1);
    expect(passwordResetRequests[0]).toEqual({ email: 'tester@konusmatik.com', language: 'en' });
  });

  test('forgot password request sends Turkish locale when site is in Turkish mode', async ({ page }) => {
    const { passwordResetRequests } = await mockApi(page);
    await resetLanguage(page);

    await page.goto('/giris');
    await expectActiveLanguage(page, 'tr');

    await page.getByText('Şifremi unuttum', { exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Şifrenizi sıfırlayın' })).toBeVisible();
    await page.locator('input[type="email"]').fill('tester@konusmatik.com');
    await page.getByRole('button', { name: 'Kod Gönder' }).click();

    await expect.poll(() => passwordResetRequests.length).toBe(1);
    expect(passwordResetRequests[0]).toEqual({ email: 'tester@konusmatik.com', language: 'tr' });
  });

  test('tts page shows engine version selector in Turkish and English', async ({ page }) => {
    await mockApi(page);
    await resetLanguage(page);

    await page.goto('/seslendirme');
    await expect(page.getByText('Motor Versiyonu', { exact: false })).toBeVisible();
    await expect(page.getByRole('button', { name: /Versiyon 1/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Versiyon 2/i })).toBeVisible();

    await toggleLanguage(page);
    await expect(page.getByText('Engine Version', { exact: false })).toBeVisible();
    await expect(page.getByRole('button', { name: /Version 1/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Version 2/i })).toBeVisible();
  });

  test('tts page sends engine_version v2 for preview and package download', async ({ page }) => {
    const { ttsRequests } = await mockApi(page);
    await resetLanguage(page);

    await page.goto('/seslendirme');
    await page.getByRole('button', { name: /Versiyon 2/i }).click();
    await page.locator('.tts-textarea').fill('Merhaba dunya');
    await page.getByRole('button', { name: 'Önizleme' }).click();

    await expect.poll(() => ttsRequests.length).toBe(1);
    expect(ttsRequests[0].path).toBe('/api/v1/public/tts/preview');
    expect(ttsRequests[0].body.engine_version).toBe('v2');

    await page.reload();
    await page.getByRole('button', { name: /Versiyon 2/i }).click();
    await page.locator('.tts-textarea').fill('Paketli indirme metni');
    await page.getByRole('button', { name: 'Seslendir ve İndir' }).click();

    await expect.poll(() => ttsRequests.length).toBe(2);
    expect(ttsRequests[1].path).toBe('/api/v1/tts/jobs/download-sync-file');
    expect(ttsRequests[1].body.engine_version).toBe('v2');
  });
});
