import { expect, test } from '@playwright/test';

const json = (data) => ({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify(data),
});

async function mockUser(page, user = null) {
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/v1/auth/me') {
      return user ? route.fulfill(json(user)) : route.fulfill({ status: 401, contentType: 'application/json', body: '{}' });
    }
    return route.fulfill(json({}));
  });
}

async function expectNoHorizontalOverflow(page) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
}

test('desktop navigation remains visible without the menu toggle', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await mockUser(page);
  await page.goto('/');

  await expect(page.getByRole('button', { name: 'Menüyü aç' })).toBeHidden();
  await expect(page.locator('#primary-navigation')).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test('compact navigation opens, navigates, and closes cleanly', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await mockUser(page);
  await page.goto('/');

  const toggle = page.getByRole('button', { name: 'Menüyü aç' });
  await expect(toggle).toBeVisible();
  await expect(page.locator('#primary-navigation')).toBeHidden();
  await toggle.click();
  await expect(page.locator('#primary-navigation')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Fiyatlar' })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.getByRole('button', { name: 'Fiyatlar' }).click();
  await expect(page).toHaveURL(/\/fiyatlar$/);
  await expect(page.locator('#primary-navigation')).toBeHidden();
});

test('mobile navigation contains long account names without overflow', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 });
  await mockUser(page, {
    id: 'user-1',
    role: 'user',
    email: 'uzun-kullanici-adi@konusmatik.com',
    full_name: 'Oldukça Uzun Bir Kullanıcı Adı Soyadı',
  });
  await page.goto('/');

  await page.getByRole('button', { name: 'Menüyü aç' }).click();
  await expect(page.getByRole('button', { name: 'Profil' })).toBeVisible();
  await expect(page.locator('.nav-user-button')).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
