import { expect, test } from '@playwright/test';

for (const viewport of [{ width: 1440, height: 900 }, { width: 1528, height: 430 }, { width: 1780, height: 477 }]) {
  test(`API navigation aligns with the CTA at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/api-dokumantasyon');

    const nav = page.locator('.api-v2-nav');
    const cta = page.locator('.api-cta-banner');
    await cta.evaluate((element) => {
      document.documentElement.style.scrollBehavior = 'auto';
      element.scrollIntoView({ block: 'end' });
      window.scrollBy(0, element.getBoundingClientRect().bottom - 300);
    });
    await expect(nav.locator('a[href="#errors"]')).toHaveClass(/active/);
    await expect(nav).toHaveClass(/is-fixed/);

    await expect.poll(async () => {
      const [navBox, ctaBox] = await Promise.all([nav.boundingBox(), cta.boundingBox()]);
      if (!navBox || !ctaBox) return Number.POSITIVE_INFINITY;
      return Math.abs((navBox.y + navBox.height) - (ctaBox.y + ctaBox.height));
    }).toBeLessThanOrEqual(1);
  });
}
