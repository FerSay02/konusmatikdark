import { test, expect } from '@playwright/test';

const url = 'http://127.0.0.1:5174';
const sdk = `window.google={accounts:{id:{initialize(c){window.gis=c},renderButton(host){const b=document.createElement('button');b.textContent='Google test button';b.onclick=()=>{window.credentialCount=(window.credentialCount||0)+1;window.gis.callback({credential:window.credentialCount===1?'test-token':'test-token-'+window.credentialCount})};host.append(b)}}}}`;
const json = (data, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(data) });

async function setup(page, { status = 200, initStatus = 200, loggedIn = false, password = true, linked = false, googleResponses = [], termsVersions = ['v1'], termsStatus = 200 } = {}) {
  let authenticated = loggedIn;
  let nonceCount = 0;
  let termsCount = 0;
  const calls = [];
  const user = { id: '1', email: 'test@example.com', full_name: 'Test User', phone: null, role: 'user' };
  await page.route('https://accounts.google.com/gsi/client', (route) => route.fulfill({ status: 200, contentType: 'application/javascript', body: sdk }));
  await page.route('**/api/v1/**', (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    calls.push({ path, headers: request.headers(), body: request.postData() ? request.postDataJSON() : null });
    if (path === '/api/v1/auth/me') return route.fulfill(json(authenticated ? user : {}, authenticated ? 200 : 401));
    if (path === '/api/v1/auth/refresh') return route.fulfill(json({}, 401));
    if (path === '/api/v1/auth/registration-terms') return route.fulfill(json({ terms_version: termsVersions[Math.min(termsCount++, termsVersions.length - 1)] }, termsStatus));
    if (path === '/api/v1/auth/google/nonce' || path === '/api/v1/auth/google/link/init') { nonceCount++; return route.fulfill(json({ nonce: nonceCount === 1 ? 'server-nonce' : `server-nonce-${nonceCount}` }, path.endsWith('/init') ? initStatus : 200)); }
    if (path === '/api/v1/auth/google') { const result = googleResponses.shift() || { status }; authenticated = result.status === 200; return route.fulfill(json(result.status === 200 ? { user } : result.body || {}, result.status)); }
    if (path === '/api/v1/auth/google/complete-registration') { const result = googleResponses.shift() || { status: 200 }; authenticated = result.status === 200; return route.fulfill(json(result.status === 200 ? { user } : result.body || {}, result.status)); }
    if (path === '/api/v1/auth/login') { authenticated = true; return route.fulfill(json({ user })); }
    if (path === '/api/v1/auth/google/link') { linked = status === 200; return route.fulfill(json({}, status)); }
    if (path === '/api/v1/auth/identities') return route.fulfill(json({ has_password: password, providers: linked ? [{ provider: 'google', linked: true }] : [] }));
    if (path === '/api/v1/auth/logout') { authenticated = false; return route.fulfill(json({ message: 'Logged out' })); }
    return route.fulfill(json([]));
  });
  return calls;
}

async function start(page) {
  if (new URL(page.url()).pathname === '/profile') await page.getByRole('button', { name: 'Google ile devam edin' }).click();
  await expect(page.getByRole('button', { name: 'Google test button' })).toBeVisible();
  expect(await page.evaluate(() => window.gis.nonce)).toBe('server-nonce');
}

test('login obtains nonce and exchanges credential with required header', async ({ page }) => {
  const calls = await setup(page);
  await page.goto(`${url}/giris`);
  await start(page);
  await page.getByRole('button', { name: 'Google test button' }).click();
  await expect(page.locator('.nav-user-name').first()).toContainText('Test User');
  const nonce = calls.find((call) => call.path === '/api/v1/auth/google/nonce');
  const exchange = calls.find((call) => call.path === '/api/v1/auth/google');
  expect(nonce.headers['x-requested-with']).toBe('XMLHttpRequest');
  expect(exchange.body).toEqual({ credential: 'test-token' });
  expect(exchange.headers['x-requested-with']).toBe('XMLHttpRequest');
});

test('email and password login remains available', async ({ page }) => {
  const calls = await setup(page);
  await page.goto(`${url}/giris`);
  await page.getByPlaceholder('ornek@konusmatik.com').fill('test@example.com');
  await page.locator('input[autocomplete="current-password"]').fill('safe-password');
  await page.locator('.btn-login-submit').click();
  await expect(page.locator('.nav-user-name').first()).toContainText('Test User');
  expect(calls.find((call) => call.path === '/api/v1/auth/login').body).toEqual({ email: 'test@example.com', password: 'safe-password' });
});

for (const code of [401, 403, 409, 429, 503]) {
  test(`Google error ${code} does not create a session`, async ({ page }) => {
    await setup(page, { status: code });
    await page.goto(`${url}/giris`);
    await start(page);
    await page.getByRole('button', { name: 'Google test button' }).click();
    await expect(page.locator(code === 409 ? '.google-account-link' : '.login-google-error')).toBeVisible();
    await expect(page.locator('.nav-user-name')).toHaveCount(0);
  });
}

test('cancellation resets the flow', async ({ page }) => {
  await setup(page);
  await page.goto(`${url}/giris`);
  await start(page);
  await page.evaluate(() => window.gis.error_callback({ type: 'popup_closed' }));
  await expect(page.locator('.login-google-error')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Google ile devam edin' })).toBeVisible();
});

test('profile links Google with explicit password and reloads identities', async ({ page }, testInfo) => {
  const calls = await setup(page, { loggedIn: true });
  await page.goto(`${url}/profile`);
  await expect(page.getByRole('heading', { name: 'Bağlı Giriş Yöntemleri' })).toBeVisible();
  await expect(page.locator('input[name="phone"]')).toHaveValue('');
  await page.getByRole('button', { name: 'Google Hesabını Bağla' }).click();
  await page.getByLabel('Mevcut şifre').fill('secret');
  await page.getByLabel('Google hesabımı bağlamak istiyorum.').check();
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
  const cookieReject = page.getByRole('button', { name: 'İsteğe Bağlıları Reddet' });
  if (await cookieReject.isVisible()) await cookieReject.click();
  await page.locator('.linked-methods').screenshot({ path: testInfo.outputPath('linked-methods-password.png') });
  await start(page);
  expect(calls.find((call) => call.path === '/api/v1/auth/google/link/init').body).toEqual({ password: 'secret', confirm: true });
  await expect(page.getByLabel('Mevcut şifre')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Vazgeç' })).toHaveCount(1);
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
  await page.locator('.linked-methods').screenshot({ path: testInfo.outputPath('linked-methods-dark.png') });
  await page.getByRole('button', { name: 'Google test button' }).click();
  await expect(page.getByText('Google Bağlı')).toBeVisible();
  expect(calls.find((call) => call.path === '/api/v1/auth/google/link').body).toEqual({ credential: 'test-token' });
});

test('passwordless account does not offer linking', async ({ page }) => {
  await setup(page, { loggedIn: true, password: false });
  await page.goto(`${url}/profile`);
  await expect(page.getByText('Şifreli giriş bulunmuyor.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Google Hesabını Bağla' })).toHaveCount(0);
});

test('incorrect reauthentication does not exchange a credential', async ({ page }) => {
  const calls = await setup(page, { loggedIn: true, initStatus: 401 });
  await page.goto(`${url}/profile`);
  await page.getByRole('button', { name: 'Google Hesabını Bağla' }).click();
  await page.getByLabel('Mevcut şifre').fill('wrong');
  await page.getByLabel('Google hesabımı bağlamak istiyorum.').check();
  await page.getByRole('button', { name: 'Google ile devam edin' }).click();
  await expect(page.getByRole('alert')).toContainText('Şifre');
  expect(calls.some((call) => call.path === '/api/v1/auth/google/link')).toBe(false);
  await expect(page.getByLabel('Mevcut şifre')).toHaveValue('');
});

test('a second tab cannot replace an active Google challenge', async ({ context, page }) => {
  await setup(page);
  await page.goto(`${url}/giris`);
  await start(page);
  const other = await context.newPage();
  const calls = await setup(other);
  await other.goto(`${url}/giris`);
  await expect(other.locator('.login-google-error')).toContainText('Başka bir Google işlemi');
  expect(calls.some((call) => call.path === '/api/v1/auth/google/nonce')).toBe(false);
});

test('new Google registration requires explicit acceptance without another Google selection', async ({ page }, testInfo) => {
  const calls = await setup(page, { googleResponses: [{ status: 428, body: { detail: { code: 'terms_acceptance_required' } } }, { status: 200 }] });
  await page.goto(`${url}/giris`);
  await start(page);
  await page.getByRole('button', { name: 'Google test button' }).click();
  await expect(page.locator('.google-onboarding')).toBeVisible();
  await expect(page.locator('.google-terms-version')).toContainText('v1');
  await expect(page.locator('.login-form')).toBeHidden();
  await expect(page.locator('.google-onboarding-cancel')).toHaveCount(1);
  await page.screenshot({ path: testInfo.outputPath('google-consent-dark.png'), fullPage: true });
  expect(calls.find((call) => call.path === '/api/v1/auth/registration-terms')).toBeTruthy();
  await expect(page.getByRole('button', { name: 'Google test button' })).toHaveCount(0);
  await expect(page.locator('.google-onboarding a[href="/gizlilik-politikasi/"]')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Kaydı tamamla' })).toBeDisabled();
  await page.locator('.google-onboarding input[type=checkbox]').check();
  await expect(page.getByRole('button', { name: 'Kaydı tamamla' })).toBeEnabled();
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
  await page.setViewportSize({ width: 500, height: 900 });
  await page.screenshot({ path: testInfo.outputPath('google-consent-dark-checked.png'), fullPage: true });
  await page.getByRole('button', { name: 'Kaydı tamamla' }).click();
  await expect(page.locator('.nav-user-name').first()).toContainText('Test User');
  const requests = calls.filter((call) => call.path === '/api/v1/auth/google');
  expect(requests[0].body).toEqual({ credential: 'test-token' });
  expect(requests).toHaveLength(1);
  expect(calls.filter((call) => call.path === '/api/v1/auth/google/nonce')).toHaveLength(1);
  expect(calls.find((call) => call.path === '/api/v1/auth/google/complete-registration').body).toEqual({ terms_accepted: true, terms_version: 'v1' });
});

test('version mismatch reloads terms and requires fresh acceptance', async ({ page }) => {
  const calls = await setup(page, { termsVersions: ['v1', 'v2'], googleResponses: [
    { status: 428, body: { detail: { code: 'terms_acceptance_required' } } },
    { status: 409, body: { detail: { code: 'terms_version_mismatch' } } },
    { status: 200 },
  ] });
  await page.goto(`${url}/giris`);
  await start(page);
  await page.getByRole('button', { name: 'Google test button' }).click();
  await page.locator('.google-onboarding input').check();
  await page.getByRole('button', { name: 'Kaydı tamamla' }).click();
  await expect(page.locator('.google-terms-version')).toContainText('v2');
  await expect(page.locator('.google-onboarding input')).not.toBeChecked();
  await expect(page.getByText('Koşullar güncellendi.', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Google test button' })).toHaveCount(0);
  await page.locator('.google-onboarding input').check();
  await expect(page.getByRole('button', { name: 'Kaydı tamamla' })).toBeEnabled();
  await page.getByRole('button', { name: 'Kaydı tamamla' }).click();
  await expect(page.locator('.nav-user-name').first()).toContainText('Test User');
  expect(calls.filter((call) => call.path === '/api/v1/auth/google/complete-registration').at(-1).body).toEqual({ terms_accepted: true, terms_version: 'v2' });
});

test('terms service failure blocks registration and can be cancelled', async ({ page }) => {
  const calls = await setup(page, { termsStatus: 503, googleResponses: [{ status: 428, body: { detail: { code: 'terms_acceptance_required' } } }] });
  await page.goto(`${url}/giris`);
  await start(page);
  await page.getByRole('button', { name: 'Google test button' }).click();
  await expect(page.getByRole('alert')).toContainText('Güncel koşullar alınamadı');
  await expect(page.locator('.google-onboarding')).toHaveCount(0);
  await page.getByRole('button', { name: 'Vazgeç' }).click();
  await expect(page.getByRole('button', { name: 'Google test button' })).toBeVisible();
  expect(calls.filter((call) => call.path === '/api/v1/auth/google/nonce')).toHaveLength(2);
});

test('expired pending registration asks for a new Google sign-in', async ({ page }) => {
  await setup(page, { googleResponses: [
    { status: 428, body: { detail: { code: 'terms_acceptance_required' } } },
    { status: 401, body: { detail: { code: 'google_registration_expired' } } },
  ] });
  await page.goto(`${url}/giris`);
  await start(page);
  await page.getByRole('button', { name: 'Google test button' }).click();
  await page.locator('.google-onboarding input').check();
  await page.getByRole('button', { name: 'Kaydı tamamla' }).click();
  await expect(page.locator('.login-google-error')).toContainText('süresi doldu');
  await expect(page.getByRole('button', { name: 'Google test button' })).toBeVisible();
});
