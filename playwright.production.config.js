import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: 'seo-production.spec.js',
  timeout: 90_000,
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:4174' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
