import { test, expect } from '@playwright/test';

test('legal navigation uses accessible cards, glowing focus and real links', async ({ page }) => {
  await page.goto('/kvkk-aydinlatma-metni/');
  await expect(page.locator('.legal-hold-badge')).toHaveCount(0);
  await expect(page.locator('.legal-eyebrow, .legal-review-note')).toHaveCount(0);
  await expect(page.locator('.legal-header')).toContainText('hukuki inceleme sonrasında yayımlanacaktır');
  await expect(page.locator('.legal-toc a')).toHaveCount(6);
  await expect(page.locator('.legal-related-card')).toHaveCount(3);
  await expect(page.locator('.legal-related-card canvas')).toHaveCount(0);
  await page.locator('.legal-toc a').nth(1).focus();
  const style = await page.locator('.legal-toc a').nth(1).evaluate((element) => ({ decoration: getComputedStyle(element).textDecorationLine, shadow: getComputedStyle(element).textShadow }));
  expect(style.decoration).toBe('none');
  expect(style.shadow).not.toBe('none');
  await page.locator('.legal-toc a').nth(1).click();
  await expect(page).toHaveURL(/#bolum-2$/);
  await expect(page.locator('#bolum-2')).toBeInViewport();
  await expect(page.locator('.legal-related').getByRole('link', { name: /Gizlilik Politikası/ })).toHaveAttribute('href', '/gizlilik-politikasi/');
  await expect(page.locator('.legal-related').getByRole('link', { name: /Kullanım Koşulları/ })).toHaveAttribute('href', '/kullanim-kosullari/');
});

test('legal cards fit dark and light layouts with reduced motion', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const theme of ['dark', 'light']) {
    await page.addInitScript((value) => localStorage.setItem('konusmatik-theme', value), theme);
    for (const width of [320, 375, 768, 1280]) {
      await page.setViewportSize({ width, height: 820 });
      await page.goto('/kvkk-aydinlatma-metni/');
      if (await page.locator('.cookie-banner').count()) await page.getByRole('button', { name: 'İsteğe Bağlıları Reddet' }).click();
      await expect(page.locator('.site-loader')).toBeHidden({ timeout: 15000 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${theme} ${width}`).toBeTruthy();
      await expect(page.locator('.legal-hold-badge')).toHaveCount(0);
      const titleBox = await page.locator('.legal-header h1').boundingBox();
      const introBox = await page.locator('.legal-header > p').boundingBox();
      expect(introBox.y, `${theme} ${width} header spacing`).toBeGreaterThan(titleBox.y);
      await expect(page.locator('.legal-related-card').first()).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath(`legal-specular-${theme}-${width}.png`), fullPage: true });
    }
  }
});

test('specular light renders cleanly with motion enabled', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 820 });
  await page.addInitScript(() => localStorage.setItem('konusmatik-theme', 'dark'));
  await page.goto('/kvkk-aydinlatma-metni/');
  await page.getByRole('button', { name: 'İsteğe Bağlıları Reddet' }).click();
  await expect(page.locator('.site-loader')).toBeHidden({ timeout: 15000 });
  await page.locator('.legal-related-card').first().scrollIntoViewIfNeeded();
  await page.locator('.legal-related-card').first().hover();
  await page.waitForTimeout(300);
  await page.screenshot({ path: testInfo.outputPath('legal-specular-motion-dark.png') });
});
