import { test, expect } from '@playwright/test';

const json = (data, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(data) });

async function setup(page, { versions = ['server-v1'], termsStatus = 200, responses = [] } = {}) {
  let versionReads = 0;
  const registrations = [];
  await page.route('**/api/v1/**', (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/v1/auth/registration-terms') return route.fulfill(json({ terms_version: versions[Math.min(versionReads++, versions.length - 1)] }, termsStatus));
    if (path === '/api/v1/auth/register') {
      registrations.push(route.request().postDataJSON());
      const result = responses.shift() || { status: 201 };
      return route.fulfill(json(result.body || { user: { id: '1', email: 'test@example.com' } }, result.status));
    }
    if (path === '/api/v1/auth/me' || path === '/api/v1/auth/refresh') return route.fulfill(json({}, 401));
    return route.fulfill(json({}));
  });
  await page.goto('/giris');
  await page.getByRole('button', { name: 'Kayit Ol' }).first().click();
  return registrations;
}

async function fill(page, phone = '5551234567') {
  await page.locator('input[autocomplete="name"]').fill('Test User');
  await page.getByPlaceholder('5xxxxxxxxx').fill(phone);
  await page.getByPlaceholder('ornek@konusmatik.com').fill('test@example.com');
  await page.locator('input[autocomplete="new-password"]').first().fill('StrongPass123');
  await page.locator('input[autocomplete="new-password"]').last().fill('StrongPass123');
}

test('server version and explicit acceptance are required for registration', async ({ page }) => {
  const registrations = await setup(page);
  await expect(page.getByText('Koşullar sürümü: server-v1')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Kullanım Koşulları', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Gizlilik Politikası', exact: true })).toBeVisible();
  await fill(page);
  await page.locator('.btn-login-submit').click();
  expect(registrations).toHaveLength(0);
  await page.locator('#login-terms-accepted').check();
  await page.locator('.btn-login-submit').click();
  await expect.poll(() => registrations.length).toBe(1);
  expect(registrations[0]).toEqual({ email: 'test@example.com', password: 'StrongPass123', full_name: 'Test User', phone: '5551234567', terms_accepted: true, terms_version: 'server-v1' });
  await expect(page.locator('.login-help-text[role="status"]')).toContainText('Kayıt tamam');
});

test('428 clears acceptance and explains the requirement', async ({ page }) => {
  const registrations = await setup(page, { responses: [{ status: 428, body: { detail: { code: 'terms_acceptance_required' } } }] });
  await expect(page.getByText('Koşullar sürümü: server-v1')).toBeVisible();
  await fill(page);
  await page.locator('#login-terms-accepted').check();
  await page.locator('.btn-login-submit').click();
  await expect(page.getByRole('alert')).toContainText('Kullanım Koşulları kabul edilmelidir');
  await expect(page.locator('#login-terms-accepted')).not.toBeChecked();
  expect(registrations).toHaveLength(1);
});

test('409 reloads version and requires fresh explicit acceptance', async ({ page }) => {
  const registrations = await setup(page, { versions: ['server-v1', 'server-v2'], responses: [{ status: 409, body: { detail: { code: 'terms_version_mismatch' } } }, { status: 201 }] });
  await expect(page.getByText('Koşullar sürümü: server-v1')).toBeVisible();
  await fill(page);
  await page.locator('#login-terms-accepted').check();
  await page.locator('.btn-login-submit').click();
  await expect(page.getByText('Koşullar sürümü: server-v2')).toBeVisible();
  await expect(page.getByText('Koşullar güncellendi.', { exact: false })).toBeVisible();
  await expect(page.locator('#login-terms-accepted')).not.toBeChecked();
  await page.locator('.btn-login-submit').click();
  expect(registrations).toHaveLength(1);
  await page.locator('#login-terms-accepted').check();
  await page.locator('.btn-login-submit').click();
  await expect.poll(() => registrations.length).toBe(2);
  expect(registrations.map((item) => item.terms_version)).toEqual(['server-v1', 'server-v2']);
});

test('unavailable terms fail closed without using a build-time version', async ({ page }) => {
  const registrations = await setup(page, { termsStatus: 503 });
  await expect(page.getByRole('alert')).toContainText('Güncel koşullar alınamadı');
  await expect(page.locator('#login-terms-accepted')).toBeDisabled();
  await expect(page.locator('.btn-login-submit')).toBeDisabled();
  expect(registrations).toHaveLength(0);
});

test('server 503 on registration blocks retry until terms are reloaded', async ({ page }) => {
  const registrations = await setup(page, { responses: [{ status: 503, body: { detail: { code: 'terms_unavailable' } } }] });
  await expect(page.getByText('Koşullar sürümü: server-v1')).toBeVisible();
  await fill(page);
  await page.locator('#login-terms-accepted').check();
  await page.locator('.btn-login-submit').click();
  await expect(page.locator('#login-terms-accepted')).toBeDisabled();
  await expect(page.locator('.btn-login-submit')).toBeDisabled();
  expect(registrations).toHaveLength(1);
});

test('invalid phone is not submitted and registration is responsive', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 820 });
  const registrations = await setup(page);
  await expect(page.getByText('Koşullar sürümü: server-v1')).toBeVisible();
  await fill(page, '1234567890');
  await page.locator('#login-terms-accepted').check();
  await page.locator('.btn-login-submit').click();
  expect(registrations).toHaveLength(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
