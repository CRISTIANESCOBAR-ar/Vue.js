// Minimal Playwright configuration for this repo (CommonJS)
/** @type {import('@playwright/test').PlaywrightTestConfig} */
module.exports = {
  testDir: 'tests/e2e',
  timeout: 30 * 1000,
  expect: { timeout: 5000 },
  reporter: [['list']],
  projects: [{ name: 'chromium', use: { browserName: 'chromium', headless: true } }]
}
