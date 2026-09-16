import { expect, test } from '@playwright/test';

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

for (const viewport of viewports) {
  test(`API docs visual smoke ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/api-dokumantasyon');

    await expect(page.locator('#quick-start')).toBeVisible();
    await expect(page.locator('#tts-api')).toBeVisible();
    await expect(page.locator('.api-copy-icon-btn').first()).toBeVisible();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);

    const codeBlocks = page.locator('.api-console pre');
    await expect(codeBlocks.first()).toBeVisible();
    expect(await codeBlocks.count()).toBeGreaterThan(4);
  });
}

test('Streaming TTS public contract is documented and linked', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/api-dokumantasyon');

  const navLink = page.locator('.api-v2-nav a[href="#streaming-tts"]');
  await navLink.click();

  await expect(page).toHaveURL(/#streaming-tts$/);
  await expect(navLink).toHaveClass(/active/);

  const section = page.locator('#streaming-tts');
  await expect(section).toContainText('konusmatik-streaming-tts-v2');
  await expect(section).toContainText('response_format="pcm"');
  await expect(section).toContainText('AsyncOpenAI');
  await expect(section).toContainText('lap.SAMPLE_RATE = 48000');
  await expect(section).toContainText('LocalAudioPlayer().play(response)');
  await expect(section).toContainText('X-Audio-Format: pcm_s16le');
  await expect(section).toContainText('Chunk boyutları sabit değildir');
});
