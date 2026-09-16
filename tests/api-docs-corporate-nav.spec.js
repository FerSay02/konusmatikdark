import { expect, test } from '@playwright/test';

test('corporate TTS menu item becomes active in its section', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/api-dokumantasyon');

  const link = page.locator('.api-v2-nav a[href="#corporate-tts"]');
  await link.click();

  await expect(page).toHaveURL(/#corporate-tts$/);
  await expect(link).toHaveClass(/active/);

  await page.goto('/api-dokumantasyon');
  await page.locator('#corporate-tts').evaluate((element) => {
    window.scrollBy(0, element.getBoundingClientRect().top - 380);
  });
  await page.waitForTimeout(100);
  await expect(link).toHaveClass(/active/);

  await page.setViewportSize({ width: 1471, height: 593 });
  await page.locator('#corporate-tts').evaluate((element) => {
    window.scrollBy(0, element.getBoundingClientRect().top - 39);
  });
  await page.waitForTimeout(100);
  await expect(link).toHaveClass(/active/);
  await expect(page.locator('.api-v2-nav a[href="#corporate-asr"]')).not.toHaveClass(/active/);
});

test('corporate ASR menu item is active while the ASR content is visible', async ({ page }) => {
  await page.setViewportSize({ width: 1426, height: 729 });
  await page.goto('/api-dokumantasyon');

  await page.locator('#corporate-api').evaluate((element) => {
    window.scrollBy(0, element.getBoundingClientRect().top - 47);
  });
  await page.waitForTimeout(100);

  await expect(page.locator('.api-v2-nav a[href="#corporate-asr"]')).toHaveClass(/active/);
  await expect(page.locator('.api-v2-nav a[href="#corporate-api"]')).not.toHaveClass(/active/);
});
