import { expect, test } from '@playwright/test';

const json = (data, status = 200) => ({
  status,
  contentType: 'application/json',
  body: JSON.stringify(data),
});

test('real profile uses the new layout without changing API contracts', async ({ page }) => {
  const apiCalls = [];
  let keys = [{ id: 'key-1', name: 'Production API', key_prefix: 'km_live_test', status: 'active', last_used_at: null }];

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();
    apiCalls.push({ path, method, body: request.postData() ? request.postDataJSON() : null });

    if (path === '/api/v1/auth/me') return route.fulfill(json({ id: 'user-1', role: 'user', email: 'test@konusmatik.com', full_name: 'Test Kullanıcı', phone: '5551234567' }));
    if (path === '/api/v1/me/entitlements') return route.fulfill(json({
      tts: { remaining: 5585531, quota_unit: 'character', download_enabled: true },
      asr: { remaining: 702306, quota_unit: 'second', download_enabled: true },
    }));
    if (path === '/api/v1/me/usage') return route.fulfill(json({
      tts: { committed: 100, reserved: 20, usage_unit: 'character' },
      asr: { committed: 60, reserved: 0, usage_unit: 'second' },
    }));
    if (path === '/api/v1/plans') return route.fulfill(json([
      { id: 'tts-personal', name: '1.000.000 Karakter Text-to-Speech', audience: 'individual', quota_amount: 1000000, quota_unit: 'character' },
      { id: 'asr-personal', name: '1.800 Dakika Ses Kaydını Yazıya Çevirme', audience: 'individual', quota_amount: 108000, quota_unit: 'second' },
      { id: 'tts-enterprise', name: 'Kurumsal 5.000.000 Karakter Text-to-Speech', audience: 'enterprise', quota_amount: 5000000, quota_unit: 'character' },
      { id: 'asr-enterprise', name: 'Kurumsal 10.000 Dakika Ses Kaydını Yazıya Çevirme', audience: 'enterprise', quota_amount: 600000, quota_unit: 'second' },
    ]));
    if (path === '/api/v1/me/entitlements/list') return route.fulfill(json([
      { id: 'e1', type: 'tts', plan_id: 'tts-personal', quota_unit: 'character', initial_quota: 1000000, remaining_quota: 934562, download_enabled: true, expires_at: null },
      { id: 'e2', type: 'asr', plan_id: 'asr-personal', quota_unit: 'second', initial_quota: 108000, remaining_quota: 107910, download_enabled: true, expires_at: null },
      { id: 'e3', type: 'tts', plan_id: 'tts-enterprise', quota_unit: 'character', initial_quota: 5000000, remaining_quota: 4650969, download_enabled: true, expires_at: null },
      { id: 'e4', type: 'asr', plan_id: 'asr-enterprise', quota_unit: 'second', initial_quota: 600000, remaining_quota: 594396, download_enabled: true, expires_at: null },
    ]));
    if (path === '/api/v1/me/api-keys' && method === 'POST') {
      keys = [{ id: 'key-2', name: 'Mobil Uygulama', key_prefix: 'km_live_new', status: 'active', last_used_at: null }, ...keys];
      return route.fulfill(json({ api_key: 'km_live_new_secret' }));
    }
    if (path === '/api/v1/me/api-keys' && method === 'GET') return route.fulfill(json(keys));
    if (path.startsWith('/api/v1/me/api-keys/') && method === 'DELETE') {
      keys = keys.filter((key) => key.id !== path.split('/').at(-1));
      return route.fulfill(json({ ok: true }));
    }
    return route.fulfill(json({ ok: true }));
  });

  await page.goto('/profile');

  await expect(page.getByRole('heading', { name: 'Profil ve Kullanım Hakları' })).toBeVisible();
  await expect(page.locator('.profile-preview-stats-v3 > article')).toHaveCount(4);
  await expect(page.locator('.profile-preview-plan-grid-v3 > article')).toHaveCount(4);
  await expect(page.getByText('4.650.969 karakter').first()).toBeVisible();
  await expect(page.getByText('9.906,6 dakika').first()).toBeVisible();

  const createForm = page.locator('.profile-preview-key-manager-v3 > form');
  const keyList = page.locator('.profile-preview-key-list-v3');
  const createFormBox = await createForm.boundingBox();
  const keyListBox = await keyList.boundingBox();
  expect(keyListBox.y).toBeGreaterThanOrEqual(createFormBox.y + createFormBox.height);

  await page.getByLabel('Anahtar adı').fill('Mobil Uygulama');
  await page.getByRole('button', { name: 'Yeni API Key Oluştur' }).click();
  const copyButton = page.getByRole('button', { name: 'Kopyala' });
  await expect(copyButton).toBeVisible();
  await expect(copyButton).toHaveText('');
  await expect.poll(() => apiCalls.some((call) => call.path === '/api/v1/me/api-keys' && call.method === 'POST' && call.body?.name === 'Mobil Uygulama')).toBe(true);
});

test('profile preview route has been removed', async ({ page }) => {
  await page.goto('/profil-onizleme');
  await expect(page.locator('.profile-page-v4')).toHaveCount(0);
  await expect(page.getByText('Tasarım önizlemesi')).toHaveCount(0);
});
