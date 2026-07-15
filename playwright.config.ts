import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173'
const useSystemChrome = process.env.PLAYWRIGHT_USE_SYSTEM_CHROME === '1'

export default defineConfig({
  expect: {
    timeout: 5_000,
  },
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: true,
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(useSystemChrome ? { channel: 'chrome' } : {}),
      },
    },
  ],
  reporter: process.env.CI ? 'github' : 'list',
  retries: process.env.CI ? 2 : 0,
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  timeout: 30_000,
  use: {
    baseURL,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'npm run dev:e2e',
        reuseExistingServer: !process.env.CI,
        stderr: 'pipe',
        stdout: 'ignore',
        timeout: 120_000,
        url: baseURL,
      },
  workers: process.env.CI ? 1 : 2,
})
