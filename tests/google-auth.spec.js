import { test, expect } from '@playwright/test';

const configuredUrl = 'http://127.0.0.1:5174/giris';
const mockSdk = `
  window.__gisCalls = [];
  window.google = { accounts: { id: {
    initialize(config) { window.__gisCalls.push('initialize'); window.__gisCallback = config.callback; window.__gisConfig = config; },
    renderButton(host, options) {
      window.__gisCalls.push('renderButton'); window.__gisOptions = options;
      const button = document.createElement('button');
      button.type = 'button'; button.textContent = 'Google test button';
      button.onclick = () => window.__gisCallback({ credential: 'test-only-credential' });
      host.appendChild(button);
    },
  } } };
`;

async function setup(page, { sdkFailure = false, exchange } = {}) {
  await page.route('**/api/v1/**', async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === '/api/v1/auth/me') return route.fulfill({ status: 401, contentType: 'application/json', body: '{}' });
    if (pathname === '/api/v1/test-google-auth') return exchange(route);
    if (pathname === '/api/v1/test-google-onboarding') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: { id: 1, full_name: 'New Google User' } }) });
    return route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
  });
  await page.route('https://accounts.google.com/gsi/client', (route) => sdkFailure
    ? route.abort('failed')
    : route.fulfill({ status: 200, contentType: 'application/javascript', body: mockSdk }));
}

test('configured GIS renders the official SDK path and passes credential to the adapter', async ({ page }) => {
  let body;
  await setup(page, { exchange: (route) => {
    body = JSON.parse(route.request().postData() || '{}');
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: { id: 1, full_name: 'Test User' } }) });
  } });
  await page.goto(configuredUrl);
  await expect(page.getByRole('button', { name: 'Google test button' })).toBeVisible();
  expect(await page.evaluate(() => window.__gisCalls)).toEqual(['initialize', 'renderButton']);
  expect(await page.evaluate(() => window.__gisConfig.ux_mode)).toBe('popup');
  expect(await page.evaluate(() => window.__gisOptions.text)).toBe('continue_with');
  await page.getByRole('button', { name: 'Google test button' }).click();
  await expect.poll(() => body?.credential).toBe('test-only-credential');
  await expect(page.locator('.nav-user-name').first()).toContainText('Test User');
});

test('Google backend failure does not create an authenticated session', async ({ page }) => {
  await setup(page, { exchange: (route) => route.fulfill({ status: 503, contentType: 'application/json', body: '{"code":"SESSION_UNAVAILABLE"}' }) });
  await page.goto(configuredUrl);
  await page.getByRole('button', { name: 'Google test button' }).click();
  await expect(page.locator('.login-google-error')).toBeVisible();
  await expect(page.locator('.nav-user-name')).toHaveCount(0);
  await expect(page).toHaveURL(/\/giris$/);
});

test('first Google signup shows required terms and optional marketing only after backend response', async ({ page }) => {
  await setup(page, { exchange: (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"state":"needs_legal_acceptance"}' }) });
  await page.goto(configuredUrl);
  await expect(page.locator('.google-onboarding')).toHaveCount(0);
  await page.getByRole('button', { name: 'Google test button' }).click();
  await expect(page.locator('.google-onboarding')).toBeVisible();
  await expect(page.locator('.google-terms-version')).toContainText('test-terms-v1');
  const checks = page.locator('.google-onboarding input[type="checkbox"]');
  await expect(checks.nth(1)).not.toBeChecked();
  await expect(page.getByRole('button', { name: 'Kaydı tamamla' })).toBeDisabled();
  await checks.first().check();
  await page.getByRole('button', { name: 'Kaydı tamamla' }).click();
  await expect(page.locator('.nav-user-name').first()).toContainText('New Google User');
});

test('account linking is explicit and Google SDK errors are accessible', async ({ page }) => {
  await setup(page, { exchange: (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"state":"account_link_required"}' }) });
  await page.goto(configuredUrl);
  await page.getByRole('button', { name: 'Google test button' }).click();
  await expect(page.locator('.google-account-link')).toBeVisible();
  await expect(page.locator('.nav-user-name')).toHaveCount(0);
  await page.unroute('https://accounts.google.com/gsi/client');
  await page.route('https://accounts.google.com/gsi/client', (route) => route.abort('failed'));
  await page.reload();
  await expect(page.locator('.google-sign-in [role="alert"]')).toBeVisible();
});

test('configured email consent fields preserve separate terms and marketing choices', async ({ page }) => {
  let payload;
  await page.route('**/api/v1/**', (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === '/api/v1/auth/register') {
      payload = JSON.parse(route.request().postData() || '{}');
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    }
    return route.fulfill({ status: 401, contentType: 'application/json', body: '{}' });
  });
  await page.route('https://accounts.google.com/gsi/client', (route) => route.fulfill({ status: 200, contentType: 'application/javascript', body: mockSdk }));
  await page.goto(configuredUrl);
  await page.getByRole('button', { name: 'Kayit Ol' }).first().click();
  await expect(page.getByText('Koşullar sürümü: test-terms-v1')).toBeVisible();
  await page.locator('input[autocomplete="name"]').fill('Test User');
  await page.getByPlaceholder('5xxxxxxxxx').fill('5551234567');
  await page.getByPlaceholder('ornek@konusmatik.com').fill('test@example.com');
  await page.locator('input[autocomplete="new-password"]').first().fill('safe-pass-123');
  await page.locator('input[autocomplete="new-password"]').last().fill('safe-pass-123');
  const checks = page.locator('.login-consent input');
  await checks.first().check();
  await expect(checks.nth(1)).not.toBeChecked();
  await page.locator('.btn-login-submit').click();
  await expect.poll(() => payload?.email).toBe('test@example.com');
  expect(payload).toMatchObject({ terms_accepted: true, terms_version: 'test-terms-v1', marketing_consent: false });
});
