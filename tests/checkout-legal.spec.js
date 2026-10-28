import { expect, test } from '@playwright/test';

const selectedPlan = {
  planId: 'asr-30m', productName: '30 Dakika Deşifre', type: 'asr',
  audience: 'individual', amount: '30', unit: 'Dakika', price: 39, priceWithVat: 46.8,
};

async function prepareCheckout(page, paymentRequests) {
  await page.addInitScript((plan) => {
    sessionStorage.setItem('konusmatik_checkout_plan', JSON.stringify(plan));
  }, selectedPlan);
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/v1/payments/paytr/token') {
      paymentRequests.push(JSON.parse(route.request().postData() || '{}'));
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ iframe_token: 'test-token' }) });
    }
    const body = path === '/api/v1/auth/me'
      ? { id: 'checkout-user', email: 'user@example.test', full_name: 'Test User', phone: '5340000000', role: 'user' }
      : { ok: true };
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
}

test('checkout separates KVKK information from required Terms acceptance', async ({ page }) => {
  const paymentRequests = [];
  await prepareCheckout(page, paymentRequests);
  await page.goto('/checkout');

  const agreements = page.locator('.checkout-agreements');
  await expect(agreements.locator('input[type="checkbox"]')).toHaveCount(1);
  await expect(agreements.getByRole('link', { name: 'KVKK Aydınlatma Metni' })).toHaveAttribute('href', '/kvkk-aydinlatma-metni/');
  await expect(agreements.getByRole('link', { name: 'Gizlilik Politikası' })).toHaveAttribute('href', '/gizlilik-politikasi/');
  await expect(agreements.getByRole('link', { name: 'Kullanım Koşulları' })).toHaveAttribute('href', '/kullanim-kosullari/');
  await expect(agreements).not.toContainText('Açık Rıza Beyanı');
  await expect(agreements).not.toContainText('Mesafeli Satış Sözleşmesi ve Ön Bilgilendirme Formu kutucuğu');
  await expect(agreements).not.toContainText('pazarlama');
  await expect(agreements.locator('input[type="checkbox"]')).not.toBeChecked();

  await page.getByLabel('T.C. Kimlik No').fill('12345678901');
  await page.getByLabel('Ad Soyad').fill('Test User');
  await page.getByLabel('Fatura E-postası').fill('user@example.test');
  await page.getByLabel('Telefon').fill('5340000000');
  await page.getByLabel('Adres').fill('Test adresi 123');
  await page.getByRole('button', { name: 'Ödeme yükümlülüğü doğuran sipariş ver' }).click();
  expect(paymentRequests).toHaveLength(0);
  await agreements.locator('input[type="checkbox"]').check();
  await page.getByRole('button', { name: 'Ödeme yükümlülüğü doğuran sipariş ver' }).click();
  await expect.poll(() => paymentRequests.length).toBe(1);
  expect(paymentRequests[0]).toMatchObject({ plan_id: 'asr-30m', invoice_type: 'individual', billing_email: 'user@example.test' });
  expect(paymentRequests[0]).not.toHaveProperty('kvkk_consent');
});

test('checkout legal links and payment state remain usable in both themes and languages at 375px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await prepareCheckout(page, []);
  await page.goto('/checkout');
  for (const [language, theme] of [['tr', 'dark'], ['en', 'light']]) {
    await page.evaluate(([nextLanguage, nextTheme]) => {
      localStorage.setItem('konusmatik_language', nextLanguage);
      localStorage.setItem('konusmatik-theme', nextTheme);
    }, [language, theme]);
    await page.reload();
    await expect(page.locator('.checkout-page')).toBeVisible();
    await expect(page.locator('.checkout-agreements a')).toHaveCount(3);
    await expect(page.locator('.checkout-pay-btn')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(376);
  }
  await expect(page.locator('.checkout-agreements')).toContainText('KVKK Notice');
});
