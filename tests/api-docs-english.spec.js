import { expect, test } from '@playwright/test';

test('English API documentation has no untranslated interface copy', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('konusmatik_language', 'en'));
  await page.goto('/api-dokumantasyon');
  const text = await page.locator('.api-v2-page').evaluate((element) => {
    const clone = element.cloneNode(true);
    clone.querySelectorAll('pre, code, .api-console').forEach((node) => node.remove());
    return clone.innerText;
  });
  expect(text).toContain('Konuşmatik Developer API');
  expect(text).toContain('Server-side VAD (no client-side VAD required)');
  expect(text).toContain('Enterprise');
  expect(text).not.toContain('Developer API V2');
  expect(text).not.toMatch(/veya 16 kHz|Sunucu Taraflı|gerekmez|Standart \(|Kurumsal \(|Ses Sentezi|ASR \(Deşifre\)|eşzamanlı|açık iş|istek \/ dk/);
});
