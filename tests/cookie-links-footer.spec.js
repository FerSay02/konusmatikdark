import { test, expect } from '@playwright/test';

test('cookie policy contact cards and footer links remain actionable', async ({ page }) => {
  await page.goto('/cerez-politikasi/');
  await expect(page.locator('.cookie-policy-page .legal-hold-badge')).toHaveCount(0);
  await expect(page.locator('.cookie-policy-page .legal-header')).toContainText('hukuki onay bekleyen bir taslaktır');
  await expect(page.locator('.cookie-policy-page .legal-breadcrumb a')).toHaveAttribute('href', '/');
  await page.getByRole('button', { name: 'İsteğe Bağlıları Reddet' }).click();
  const contact = page.locator('.cookie-contact-section');
  await expect(contact.getByRole('link', { name: /Telefon/ })).toHaveAttribute('href', 'tel:+903125771715');
  await expect(contact.getByRole('link', { name: /E-posta/ })).toHaveAttribute('href', 'mailto:info@deepzeka.com');
  await expect(contact.locator('.cookie-related-links a')).toHaveCount(4);
  const privacy = contact.getByRole('link', { name: /Gizlilik Politikası/ });
  await privacy.hover();
  await expect.poll(() => privacy.evaluate((element) => getComputedStyle(element).textShadow)).not.toBe('none');
  expect(await privacy.evaluate((element) => getComputedStyle(element).textDecorationLine)).toBe('none');
  await expect(privacy).toHaveAttribute('href', '/gizlilik-politikasi/');
  const footerLink = page.locator('.footer-col ul li a').first();
  await expect(page.locator('footer.footer a[href="#"]')).toHaveCount(0);
  await expect(page.locator('footer.footer a a, footer.footer a button, footer.footer button a')).toHaveCount(0);
  await expect(page.locator('.footer-contact-icon[href^="tel:"]')).toHaveAttribute('href', 'tel:+903125771715');
  const deepzekaLink = page.locator('.footer-contact-icon[href="https://www.deepzeka.com/"]');
  await expect(deepzekaLink).toHaveAttribute('target', '_blank');
  await expect(deepzekaLink).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(page.locator('.footer-col a', { hasText: 'Local Kurulum' })).toHaveCount(0);
  await expect(page.locator('.footer-col a[href="/seslendirme"]')).toHaveCount(1);
  await footerLink.hover();
  await expect.poll(() => footerLink.evaluate((element) => getComputedStyle(element).textShadow)).not.toBe('none');
  await footerLink.focus();
  await page.keyboard.press('Tab');
  const nextFooterLink = page.locator('.footer-col ul li a').nth(1);
  await expect(nextFooterLink).toBeFocused();
  expect(await nextFooterLink.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe('none');
  await page.locator('.footer-cookie-preferences').click();
  await expect(page.getByRole('dialog', { name: 'Çerez tercihleri' })).toBeVisible();
});

test('cookie links and footer are readable at mobile and desktop widths in both themes', async ({ page }, testInfo) => {
  for (const theme of ['dark', 'light']) {
    await page.addInitScript((value) => localStorage.setItem('konusmatik-theme', value), theme);
    for (const width of [320, 375, 768, 1280]) {
      await page.setViewportSize({ width, height: 820 });
      await page.goto('/cerez-politikasi/');
      if (await page.locator('.cookie-banner').count()) await page.getByRole('button', { name: 'İsteğe Bağlıları Reddet' }).click();
      await expect(page.locator('.site-loader')).toBeHidden({ timeout: 15000 });
      await expect(page.locator('.cookie-policy-page .legal-breadcrumb')).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath(`cookie-header-${theme}-${width}.png`) });
      await expect(page.locator('.cookie-contact-section')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${theme} ${width}`).toBeTruthy();
      await page.locator('.cookie-contact-section').scrollIntoViewIfNeeded();
      await page.locator('.cookie-contact-section').screenshot({ path: testInfo.outputPath(`cookie-links-${theme}-${width}.png`) });
      if (theme === 'light') {
        const preferenceStyle = await page.locator('.footer-cookie-preferences').evaluate((element) => {
          const style = getComputedStyle(element);
          return { color: style.color, textFill: style.webkitTextFillColor, opacity: style.opacity };
        });
        expect(preferenceStyle).toEqual({ color: 'rgb(47, 33, 67)', textFill: 'rgb(47, 33, 67)', opacity: '1' });
      }
      await page.locator('footer.footer').screenshot({ path: testInfo.outputPath(`footer-${theme}-${width}.png`) });
    }
  }
});
